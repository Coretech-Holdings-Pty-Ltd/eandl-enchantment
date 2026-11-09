/**
 * Portal Auth Context - E&L Client Portal
 * Manages auth state, portal access, client session, and role boundaries.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, partnerSchema, coreSchema, BRAND_ID, getPortalAccess } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

export interface PortalClient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessType?: string;
  accountStatus: string;
  companyId?: string;
  userId?: string;
  mandateStatus?: string;    // 'pending_signature' | 'authorized' | 'active' | null
  mandateDocUrl?: string;    // public URL to the uploaded agreement PDF
  mandateId?: string;        // UUID of the mandate record
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  branchCode?: string;
  accountHolder?: string;
}

export interface PortalProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  homeBrandId?: string;
}

export interface PortalAccess {
  projects: boolean;
  learning: boolean;
  accountStatus: string;
}

export interface OnboardingRecord {
  id: string;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  mode: "manual" | "ai" | "admin_bypassed";
  status: "started" | "in_progress" | "completed" | "converted" | "abandoned";
  businessName?: string;
  industry?: string;
  aiReadinessScore?: number;
  aiRecommendation?: string;
  chatHistory?: Array<{ role: "user" | "assistant" | "system" | "model"; text: string }>;
  contactPerson?: string;
  phone?: string;
  address?: string;
  targetAudience?: string;
  businessGoals?: string;
  existingDomain?: string;
  existingDomainName?: string;
  designStyle?: string;
  colorPreferences?: string;
  competitorUrls?: string;
  selectedPackageCode?: string;
}

interface PortalAuthContextType {
  loading: boolean;
  user: User | null;
  session: Session | null;
  profile: PortalProfile | null;
  client: PortalClient | null;
  access: PortalAccess;
  onboarding: OnboardingRecord | null;
  isAdminUser: boolean;
  adminRole: string | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    email: string,
    password: string,
    fullName: string,
    extraData?: Record<string, any>
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshClient: () => Promise<void>;
  updateOnboarding: (updates: Partial<OnboardingRecord>) => Promise<void>;
  signMandate: (mandateData: {
    bankName: string;
    accountHolder: string;
    accountType: string;
    accountNumber: string;
    branchCode: string;
    branchName?: string;
    address?: string;
    mandateDocUrl?: string;
    mandateReference?: string;
    signatureDataUrl?: string;
    interval?: string;
    firstPaymentDate?: string;
    capacity?: string;
  }) => Promise<{ error?: string }>;
  toast: string | null;
  setToast: (msg: string | null) => void;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [client, setClient] = useState<PortalClient | null>(null);
  const [access, setAccess] = useState<PortalAccess>({ projects: false, learning: false, accountStatus: "active" });
  const [onboarding, setOnboarding] = useState<OnboardingRecord | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const hydrateFromSession = useCallback(async (sessionUser: User) => {
    try {
      // 1. Check administrative privileges (CoreTech staff or Brand Admin)
      try {
        const { data: myCtx } = await coreSchema().rpc("my_context");
        if (myCtx) {
          const staff = myCtx.staff_role;
          const brandMembers = myCtx.brands || [];
          const isStaff = staff === "super_admin" || staff === "admin" || staff === "operator";
          const isBrandAdmin = brandMembers.some((b: any) => b.brand_id === BRAND_ID && (b.role === "brand_admin" || b.role === "brand_staff"));
          if (isStaff || isBrandAdmin) {
            setIsAdminUser(true);
            setAdminRole(staff || "brand_admin");
          } else {
            setIsAdminUser(false);
            setAdminRole(null);
          }
        }
      } catch {
        setIsAdminUser(false);
        setAdminRole(null);
      }

      // 2. Load user profile
      const { data: prof } = await coreSchema()
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (prof) {
        setProfile({
          id: prof.id,
          email: prof.email,
          fullName: prof.full_name,
          avatarUrl: prof.avatar_url,
          phone: prof.phone,
          homeBrandId: prof.home_brand_id,
        });
      } else {
        setProfile({
          id: sessionUser.id,
          email: sessionUser.email || "",
          fullName: sessionUser.user_metadata?.full_name,
          homeBrandId: BRAND_ID,
        });
      }

      // 3. Check for learning course enrollments or metadata
      const { data: enrollments } = await partnerSchema()
        .from("course_enrollments")
        .select("id")
        .eq("user_id", sessionUser.id)
        .limit(1);

      const hasEnrollments = Array.isArray(enrollments) && enrollments.length > 0;
      const isLearningUser =
        hasEnrollments ||
        sessionUser.user_metadata?.track === "learning" ||
        sessionUser.user_metadata?.portal_access_learning === true;

      // 4. Load client + subscriptions
      let { data: clientRows } = await partnerSchema()
        .from("clients")
        .select("*, subscriptions(id, status, package_id, package_code, category, monthly_fee_cents, packages(name, category))")
        .eq("user_id", sessionUser.id)
        .eq("brand_id", BRAND_ID)
        .order("created_at", { ascending: false })
        .limit(1);

      let clientData = clientRows?.[0] || null;

      // Fallback: if client not found by user_id, look up by verified session email
      if (!clientData && sessionUser.email) {
        const { data: emailRows } = await partnerSchema()
          .from("clients")
          .select("*, subscriptions(id, status, package_id, package_code, category, monthly_fee_cents, packages(name, category))")
          .eq("email", sessionUser.email)
          .eq("brand_id", BRAND_ID)
          .order("created_at", { ascending: false })
          .limit(1);

        if (emailRows && emailRows.length > 0) {
          clientData = emailRows[0];
          // Auto-link authenticated user_id if not linked yet
          if (!clientData.user_id) {
            try {
              await partnerSchema()
                .from("clients")
                .update({ user_id: sessionUser.id })
                .eq("id", clientData.id);
            } catch (_) {}
          }
        }
      }

      if (clientData) {
        const computedAccess = getPortalAccess(clientData);
        if (isLearningUser) {
          computedAccess.learning = true;
          if (computedAccess.accountStatus === "none") computedAccess.accountStatus = "active";
        }

        setClient({
          id: clientData.id,
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          businessType: clientData.business_type,
          accountStatus: clientData.account_status,
          companyId: clientData.company_id,
          userId: clientData.user_id || sessionUser.id,
          mandateStatus: clientData.mandate_status,
          mandateDocUrl: clientData.mandate_doc_url,
          mandateId: clientData.mandate_id,
          bankName: clientData.bank_name,
          accountNumber: clientData.account_number,
          accountType: clientData.account_type,
          branchCode: clientData.branch_code,
          accountHolder: clientData.account_holder,
        });
        setAccess(computedAccess);
      } else {
        setClient(null);
        setAccess({
          projects: false,
          learning: isLearningUser,
          accountStatus: isLearningUser ? "active" : "none",
        });
      }

      // 5. Load or initialize onboarding
      let { data: ob } = await partnerSchema()
        .from("onboardings")
        .select("*")
        .eq("brand_id", BRAND_ID)
        .or(`client_email.eq.${sessionUser.email},user_id.eq.${sessionUser.id}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // If existing onboarding was created without user_id, bind it to this user
      if (ob && !ob.user_id) {
        try {
          await partnerSchema()
            .from("onboardings")
            .update({ user_id: sessionUser.id })
            .eq("id", ob.id);
          ob.user_id = sessionUser.id;
        } catch (_) {}
      }

      // If user has no onboarding record, create an initial draft
      if (!ob) {
        const defaultPlan = sessionUser.user_metadata?.selected_plan || "";
        const defaultName = sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "Client";
        const newSessionId = "ob_" + sessionUser.id.slice(0, 8) + "_" + Date.now();
        const newOb = {
          brand_id: BRAND_ID,
          session_id: newSessionId,
          user_id: sessionUser.id,
          client_name: defaultName,
          client_email: sessionUser.email || "",
          business_name: sessionUser.user_metadata?.company_name || "",
          selected_package_code: defaultPlan || null,
          current_step: defaultPlan ? 2 : 1,
          total_steps: 4,
          status: "in_progress",
        };

        try {
          const { data: createdOb } = await partnerSchema()
            .from("onboardings")
            .insert(newOb)
            .select()
            .maybeSingle();
          if (createdOb) ob = createdOb;
        } catch (e) {
          console.warn("[PortalAuth] auto-create onboarding note:", e);
        }

        // Guaranteed service-role sync fallback
        if (!ob) {
          try {
            const { data: fnRes } = await supabase.functions.invoke("send-email", {
              body: { action: "save_onboarding", brand_id: BRAND_ID, payload: newOb },
            });
            if (fnRes?.onboarding) ob = fnRes.onboarding;
          } catch (_) {}
        }
      }

      if (ob) {
        const isDone = ob.status === "completed" || ob.status === "converted";
        setOnboarding({
          id: ob.id,
          currentStep: ob.current_step || 1,
          totalSteps: ob.total_steps || 4,
          isCompleted: isDone,
          mode: "ai",
          status: ob.status || "in_progress",
          businessName: ob.business_name,
          industry: ob.industry,
          aiReadinessScore: ob.ai_readiness_score,
          aiRecommendation: ob.ai_recommendation,
          chatHistory: ob.chat_history,
          contactPerson: ob.client_name,
          phone: ob.client_phone,
          targetAudience: ob.target_audience,
          businessGoals: ob.business_goals,
          existingDomain: ob.existing_domain ? "yes" : "no",
          existingDomainName: ob.existing_domain,
          designStyle: ob.brand_tone,
          colorPreferences: ob.brand_colors,
          selectedPackageCode: ob.selected_package_code,
        });
      }
    } catch (err) {
      console.warn("[PortalAuth] hydrate error:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Hard fallback timeout: if session resolution or hydration takes > 3.5s, force loading = false
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3500);

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!isMounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        try {
          await hydrateFromSession(s.user);
        } catch (e) {
          console.warn("[PortalAuth] Initial hydrate exception:", e);
        }
      }
      if (isMounted) setLoading(false);
    }).catch((err) => {
      console.warn("[PortalAuth] getSession error:", err);
      if (isMounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!isMounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        try {
          await hydrateFromSession(s.user);
        } catch (e) {
          console.warn("[PortalAuth] onAuthStateChange hydrate error:", e);
        }
      } else {
        setProfile(null);
        setClient(null);
        setAccess({ projects: false, learning: false, accountStatus: "active" });
        setOnboarding(null);
        setIsAdminUser(false);
        setAdminRole(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [hydrateFromSession]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    extraData?: Record<string, any>
  ) => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : (import.meta.env.VITE_PORTAL_URL || "https://eandl.digital");
    const emailRedirectTo = `${origin}/auth/confirm?next=/portal/dashboard`;

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          brand_id: BRAND_ID,
          brand_name: "E&L Digital",
          kind: "client",
          portal_url: `${origin}/portal`,
          ...(extraData || {}),
        },
        emailRedirectTo,
      },
    });
    if (error) return { error: error.message };

    const selectedPlan = extraData?.selected_plan || "";
    const createdUserId = authData?.user?.id || null;
    const sessionId = "ob_" + (createdUserId ? createdUserId.slice(0, 8) : Date.now().toString().slice(-8)) + "_" + Date.now();

    const initialObPayload = {
      brand_id: BRAND_ID,
      session_id: sessionId,
      user_id: createdUserId,
      client_name: fullName,
      client_email: email,
      selected_package_code: selectedPlan || null,
      current_step: selectedPlan ? 2 : 1,
      total_steps: 4,
      status: "in_progress",
    };

    // Immediately record onboarding session via both direct query and service-role edge function
    try {
      await partnerSchema()
        .from("onboardings")
        .upsert(initialObPayload, { onConflict: "session_id" });
    } catch (dbErr) {
      console.warn("[PortalAuth] register onboarding direct notice:", dbErr);
    }

    try {
      await supabase.functions.invoke("send-email", {
        body: {
          action: "save_onboarding",
          brand_id: BRAND_ID,
          payload: initialObPayload,
        },
      });
    } catch (fnErr) {
      console.warn("[PortalAuth] register onboarding fn sync notice:", fnErr);
    }

    // Dispatch 100% white-labeled E&L Digital welcome & client account email via Edge Function
    try {
      const planNotice = selectedPlan ? `for your selected <strong>${selectedPlan}</strong> plan` : "to start your project onboarding";
      await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          subject: "Welcome to E&L Digital — Client Account Created",
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;background:#111827;color:#ffffff;padding:32px;border-radius:16px;border:1px solid #1f2937;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;padding:5px 14px;border-radius:20px;background:rgba(13,148,136,0.15);border:1px solid rgba(13,148,136,0.3);color:#2dd4bf;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
                  E&L Digital · Client Gateway
                </div>
                <h2 style="font-size:22px;font-weight:900;color:#ffffff;margin:12px 0 0 0;">Welcome, ${fullName}!</h2>
                <p style="color:#94a3b8;font-size:13px;margin:6px 0 0 0;">Your client account has been created ${planNotice}.</p>
              </div>
              <div style="background:#0c121e;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;font-size:13px;line-height:1.6;color:#cbd5e1;">
                <p style="margin:0 0 12px 0;">Sign in to your client hub to complete your project onboarding, upload your brand assets (logo, profile), or consult with our Gemini AI Solutions Architect:</p>
                <div style="text-align:center;margin:20px 0;">
                  <a href="${origin}/portal/login" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0d9488,#059669);color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;font-size:14px;">
                    Enter Client Portal &rarr;
                  </a>
                </div>
              </div>
              <p style="color:#64748b;font-size:11px;text-align:center;margin:0;">
                E&L Digital (Pty) Ltd · hello@eandl.digital · <a href="https://eandl.digital" style="color:#2dd4bf;text-decoration:none;">https://eandl.digital</a>
              </p>
            </div>
          `,
          fromName: "E&L Digital",
          fromEmail: "noreply@eandl.digital",
          brand_id: "e_and_l",
        }
      });
    } catch (mailErr) {
      console.warn("[PortalAuth] register email dispatch notice:", mailErr);
    }

    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshClient = async () => {
    if (user) await hydrateFromSession(user);
  };

  const signMandate = async (mandateData: {
    bankName: string;
    accountHolder: string;
    accountType: string;
    accountNumber: string;
    branchCode: string;
    branchName?: string;
    address?: string;
    mandateDocUrl?: string;
    mandateReference?: string;
    signatureDataUrl?: string;
    interval?: string;
    firstPaymentDate?: string;
    capacity?: string;
  }) => {
    if (!client?.id && !client?.email) return { error: "No client record found" };

    const accountLast4 = mandateData.accountNumber.slice(-4);
    const resolvedDocUrl = mandateData.mandateDocUrl || client?.mandateDocUrl || "";
    const signedTimestamp = new Date().toISOString();
    const contractRef = mandateData.mandateReference || `EL-MAN-${(client?.id || "CLIENT").slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    try {
      // 1. Update partner.clients table
      const clientUpdatePayload: Record<string, any> = {
        mandate_status: "authorized",
        bank_name: mandateData.bankName,
        account_number: mandateData.accountNumber,
        account_type: mandateData.accountType,
        branch_code: mandateData.branchCode,
        account_holder: mandateData.accountHolder,
      };
      if (resolvedDocUrl) {
        clientUpdatePayload.mandate_doc_url = resolvedDocUrl;
      }
      if (mandateData.address) {
        clientUpdatePayload.address = mandateData.address;
      }

      let clientUpdated = false;
      if (client?.id) {
        const { error: clientErr } = await partnerSchema()
          .from("clients")
          .update(clientUpdatePayload)
          .eq("id", client.id);

        if (!clientErr) clientUpdated = true;
      }

      if (!clientUpdated && client?.email) {
        const { error: emailErr } = await partnerSchema()
          .from("clients")
          .update(clientUpdatePayload)
          .eq("email", client.email);

        if (emailErr) console.warn("Email fallback update note:", emailErr);
      }

      // 2. Update partner.mandates if we have mandateId or email
      const mandatePayload: Record<string, any> = {
        brand_id: BRAND_ID,
        mandate_reference: contractRef,
        debtor_name: mandateData.accountHolder || client?.name,
        bank_name: mandateData.bankName,
        account_number: mandateData.accountNumber,
        account_last4: accountLast4,
        account_holder: mandateData.accountHolder,
        account_type: mandateData.accountType,
        branch_code: mandateData.branchCode,
        status: "authorized",
        terms_accepted: true,
        accepted_at: signedTimestamp,
        document_url: resolvedDocUrl,
        client_email: client?.email || user?.email,
      };

      try {
        if (client?.mandateId) {
          await partnerSchema()
            .from("mandates")
            .update(mandatePayload)
            .eq("id", client.mandateId);
        } else {
          await partnerSchema()
            .from("mandates")
            .upsert(mandatePayload, { onConflict: "mandate_reference" });
        }
      } catch (mErr) {
        console.warn("Mandates table update notice:", mErr);
      }

      // 3. Update subscriptions to active
      if (client?.id) {
        await partnerSchema()
          .from("subscriptions")
          .update({ status: "active", site_status: "live" })
          .eq("client_id", client.id);
      }

      // 4. Dispatch Email Confirmation to Client and Operations Desk
      try {
        const targetEmail = client?.email || user?.email;
        if (targetEmail) {
          await supabase.functions.invoke("send-email", {
            body: {
              to: targetEmail,
              subject: "✅ NFS Debit Order Mandate Authorized & Signed — E&L Digital",
              html: `
                <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;background:#0d1322;color:#ffffff;padding:32px;border-radius:16px;border:1px solid #1e293b;">
                  <div style="text-align:center;margin-bottom:24px;">
                    <div style="display:inline-block;padding:5px 14px;border-radius:20px;background:rgba(13,148,136,0.15);border:1px solid rgba(13,148,136,0.3);color:#2dd4bf;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
                      E&L Digital · DebiCheck System
                    </div>
                    <h2 style="font-size:22px;font-weight:900;color:#ffffff;margin:12px 0 0 0;">Mandate Authorized & Signed</h2>
                    <p style="color:#94a3b8;font-size:13px;margin:6px 0 0 0;">Ref: <strong style="color:#2dd4bf;">${contractRef}</strong></p>
                  </div>
                  <div style="background:#131c2e;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:20px;font-size:13px;line-height:1.6;color:#cbd5e1;">
                    <p style="margin:0 0 12px 0;">Hello <strong>${mandateData.accountHolder}</strong>,</p>
                    <p style="margin:0 0 12px 0;">Your <strong>NFS Debit Order Mandate</strong> and Service Agreement have been legally signed online and authorized. Our operations team is now loading your DebiCheck payment instruction with your bank.</p>
                    <div style="background:rgba(255,255,255,0.03);padding:14px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);margin-bottom:12px;">
                      <div><strong>Bank:</strong> ${mandateData.bankName}</div>
                      <div><strong>Account Holder:</strong> ${mandateData.accountHolder}</div>
                      <div><strong>Account (Last 4):</strong> •••• ${accountLast4}</div>
                      <div><strong>Account Type:</strong> ${mandateData.accountType.toUpperCase()}</div>
                      <div><strong>Collection Interval:</strong> Monthly</div>
                    </div>
                    ${resolvedDocUrl ? `<p style="margin:12px 0 0 0;"><a href="${resolvedDocUrl}" target="_blank" style="color:#2dd4bf;font-weight:700;text-decoration:none;">📄 View / Print Signed Mandate PDF →</a></p>` : ""}
                  </div>
                  <div style="text-align:center;font-size:11px;color:#64748b;">
                    E&L Digital Holdings (Pty) Ltd · Sandton, South Africa · hello@eandl.digital
                  </div>
                </div>
              `,
            },
          });
        }
      } catch (emailErr) {
        console.warn("Mandate confirmation email dispatch note:", emailErr);
      }

      // 5. Update local client state
      setClient(prev => prev ? {
        ...prev,
        mandateStatus: "authorized",
        mandateDocUrl: resolvedDocUrl || prev.mandateDocUrl,
        bankName: mandateData.bankName,
        accountNumber: mandateData.accountNumber,
        accountType: mandateData.accountType,
        branchCode: mandateData.branchCode,
        accountHolder: mandateData.accountHolder,
      } : null);

      // Refresh client state
      await refreshClient();
      return {};
    } catch (err: any) {
      console.error("signMandate error:", err);
      return { error: err.message || "Failed to authorize mandate" };
    }
  };

  const updateOnboarding = async (updates: Partial<OnboardingRecord>) => {
    if (!onboarding?.id) return;
    setOnboarding(prev => prev ? { ...prev, ...updates } : prev);

    const dbPayload: Record<string, any> = {};
    if (updates.currentStep !== undefined) dbPayload.current_step = updates.currentStep;
    if (updates.status !== undefined) dbPayload.status = updates.status;
    if (updates.isCompleted) dbPayload.status = "completed";
    if (updates.businessName !== undefined) dbPayload.business_name = updates.businessName;
    if (updates.industry !== undefined) dbPayload.industry = updates.industry;
    if (updates.targetAudience !== undefined) dbPayload.target_audience = updates.targetAudience;
    if (updates.businessGoals !== undefined) dbPayload.business_goals = updates.businessGoals;
    if (updates.designStyle !== undefined) dbPayload.brand_tone = updates.designStyle;
    if (updates.colorPreferences !== undefined) dbPayload.brand_colors = updates.colorPreferences;
    if (updates.existingDomainName !== undefined || updates.existingDomain !== undefined) {
      dbPayload.existing_domain = updates.existingDomainName || (updates.existingDomain === "yes" ? "Client owns domain" : null);
    }
    if (updates.selectedPackageCode !== undefined) dbPayload.selected_package_code = updates.selectedPackageCode;
    if (updates.chatHistory !== undefined) dbPayload.chat_history = updates.chatHistory;
    if (updates.aiRecommendation !== undefined) dbPayload.ai_recommendation = updates.aiRecommendation;
    if (updates.aiReadinessScore !== undefined) dbPayload.ai_readiness_score = updates.aiReadinessScore;

    // 1. Direct table update
    try {
      await partnerSchema()
        .from("onboardings")
        .update(dbPayload)
        .eq("id", onboarding.id);
    } catch (err) {
      console.warn("[Onboarding] direct update notice:", err);
    }

    // 2. Guaranteed service-role synchronization via send-email edge function
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          action: "save_onboarding",
          brand_id: BRAND_ID,
          payload: {
            ...dbPayload,
            session_id: onboarding.id,
            user_id: user?.id,
            client_name: updates.contactPerson || onboarding.contactPerson || user?.email?.split("@")[0] || "Client",
            client_email: user?.email || "",
            phone: updates.phone || onboarding.phone,
          },
        },
      });
    } catch (fnErr) {
      console.warn("[Onboarding] fn sync notice:", fnErr);
    }
  };

  return (
    <PortalAuthContext.Provider value={{
      loading, user, session, profile, client, access, onboarding,
      isAdminUser, adminRole,
      login, register, logout, refreshClient, updateOnboarding, signMandate, toast, setToast
    }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error("usePortalAuth must be used within PortalAuthProvider");
  return ctx;
}
