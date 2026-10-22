/**
 * Portal Auth Context - E&L Client Portal
 * Manages auth state, portal access, and client session.
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
}

export interface PortalProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
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
  mode: "ai" | "manual" | "admin_bypassed";
  status: string;
  businessName?: string;
  industry?: string;
  aiReadinessScore?: number;
  aiRecommendation?: string;
  chatHistory?: string;
  // manual form fields
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
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshClient: () => Promise<void>;
  updateOnboarding: (updates: Partial<OnboardingRecord>) => Promise<void>;
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
  const [access, setAccess] = useState<PortalAccess>({ projects: false, learning: false, accountStatus: "none" });
  const [onboarding, setOnboarding] = useState<OnboardingRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const hydrateFromSession = useCallback(async (sessionUser: User) => {
    try {
      // Load profile
      const { data: prof } = await coreSchema()
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (prof) {
        setProfile({ id: prof.id, email: prof.email, fullName: prof.full_name, avatarUrl: prof.avatar_url, phone: prof.phone });
      } else {
        setProfile({ id: sessionUser.id, email: sessionUser.email || "", fullName: sessionUser.user_metadata?.full_name });
      }

      // Load client + subscriptions
      const { data: clientData } = await partnerSchema()
        .from("clients")
        .select("*, subscriptions(id, status, package_id, package_code, monthly_fee_cents, packages(name, category))")
        .eq("user_id", sessionUser.id)
        .eq("brand_id", BRAND_ID)
        .maybeSingle();

      if (clientData) {
        setClient({
          id: clientData.id,
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          businessType: clientData.business_type,
          accountStatus: clientData.account_status,
          companyId: clientData.company_id,
          userId: clientData.user_id,
        });
        setAccess(getPortalAccess(clientData));
      } else {
        setClient(null);
        setAccess({ projects: false, learning: false, accountStatus: "none" });
      }

      // Load onboarding
      const { data: ob } = await partnerSchema()
        .from("onboardings")
        .select("*")
        .eq("brand_id", BRAND_ID)
        .or(`client_email.eq.${sessionUser.email},user_id.eq.${sessionUser.id}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ob) {
        setOnboarding({
          id: ob.id,
          currentStep: ob.current_step || 1,
          totalSteps: ob.total_steps || 5,
          isCompleted: ob.is_completed || false,
          mode: ob.mode || "ai",
          status: ob.status || "in_progress",
          businessName: ob.business_name,
          industry: ob.industry,
          aiReadinessScore: ob.ai_readiness_score,
          aiRecommendation: ob.ai_recommendation,
          chatHistory: ob.chat_history,
          contactPerson: ob.client_name,
          phone: ob.client_phone,
          address: ob.address,
          targetAudience: ob.target_audience,
          businessGoals: ob.business_goals,
          existingDomain: ob.has_existing_domain ? "yes" : "no",
          existingDomainName: ob.existing_domain_name,
          designStyle: ob.design_style,
          colorPreferences: ob.color_preferences,
          competitorUrls: ob.competitor_urls,
          selectedPackageCode: ob.selected_package_code,
        });
      }
    } catch (err) {
      console.warn("[PortalAuth] hydrate error:", err);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) await hydrateFromSession(s.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await hydrateFromSession(s.user);
      } else {
        setProfile(null);
        setClient(null);
        setAccess({ projects: false, learning: false, accountStatus: "none" });
        setOnboarding(null);
      }
      if (event !== "INITIAL_SESSION") setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [hydrateFromSession]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const register = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, brand_id: BRAND_ID } },
    });
    if (error) return { error: error.message };
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshClient = async () => {
    if (user) await hydrateFromSession(user);
  };

  const updateOnboarding = async (updates: Partial<OnboardingRecord>) => {
    if (!onboarding?.id) return;
    setOnboarding(prev => prev ? { ...prev, ...updates } : prev);

    const dbPayload: Record<string, any> = {};
    if (updates.currentStep !== undefined) dbPayload.current_step = updates.currentStep;
    if (updates.isCompleted !== undefined) dbPayload.is_completed = updates.isCompleted;
    if (updates.status !== undefined) dbPayload.status = updates.status;
    if (updates.businessName !== undefined) dbPayload.business_name = updates.businessName;
    if (updates.industry !== undefined) dbPayload.industry = updates.industry;
    if (updates.targetAudience !== undefined) dbPayload.target_audience = updates.targetAudience;
    if (updates.businessGoals !== undefined) dbPayload.business_goals = updates.businessGoals;
    if (updates.designStyle !== undefined) dbPayload.design_style = updates.designStyle;
    if (updates.colorPreferences !== undefined) dbPayload.color_preferences = updates.colorPreferences;
    if (updates.competitorUrls !== undefined) dbPayload.competitor_urls = updates.competitorUrls;
    if (updates.selectedPackageCode !== undefined) dbPayload.selected_package_code = updates.selectedPackageCode;
    if (updates.chatHistory !== undefined) dbPayload.chat_history = updates.chatHistory;
    if (updates.aiRecommendation !== undefined) dbPayload.ai_recommendation = updates.aiRecommendation;
    if (updates.aiReadinessScore !== undefined) dbPayload.ai_readiness_score = updates.aiReadinessScore;

    try {
      await partnerSchema()
        .from("onboardings")
        .update(dbPayload)
        .eq("id", onboarding.id);
    } catch (err) {
      console.warn("[Onboarding] update error:", err);
    }
  };

  return (
    <PortalAuthContext.Provider value={{
      loading, user, session, profile, client, access, onboarding,
      login, register, logout, refreshClient, updateOnboarding, toast, setToast
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
