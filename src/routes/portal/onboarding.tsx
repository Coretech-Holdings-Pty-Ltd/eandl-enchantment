/**
 * Client Project Onboarding — AI-assisted or Manual step-by-step
 * Saves progress to Supabase partner.onboardings, fully resumable.
 * Supports clients with pre-selected plans or clients who need to choose a plan.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Zap, MessageSquare, ClipboardList, ArrowRight, ArrowLeft,
  CheckCircle2, Send, SkipForward, Building2, Globe, Palette,
  Target, FileText, UploadCloud, Sparkles, RefreshCw, Lock,
  Check, X, File, Image as ImageIcon, Shield, ExternalLink,
  AlertCircle
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { partnerSchema, BRAND_ID } from "@/lib/supabase";
import {
  askGeminiArchitect,
  synthesizeScopeWithGemini,
  evaluateScopingProgress,
  enhanceFormFieldWithAI,
  type ChatMessage,
  type ScopingResult,
  type ScopingProgress
} from "@/lib/gemini";

export const Route = createFileRoute("/portal/onboarding")({
  validateSearch: (s: Record<string, unknown>): { plan?: string } => ({
    plan: typeof s["plan"] === "string" ? s["plan"] : undefined,
  }),
  component: PortalOnboarding,
});

type Mode = "choose" | "ai" | "manual" | "plan_selection";
type ManualStep = 1 | 2 | 3 | 4 | 5;

interface UploadedAsset {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

const AVAILABLE_PACKAGES = [
  { name: "Spark", fee: 199, label: "One-page professional presence", pages: "1 Page", care: "SSL & Backups" },
  { name: "Build", fee: 349, label: "A stronger business presence", pages: "Up to 3 Pages", care: "Domain & 1 Mailbox", featured: true },
  { name: "Starter", fee: 500, label: "Room to tell your story", pages: "Up to 5 Pages", care: "30 min updates/mo" },
  { name: "Business", fee: 1200, label: "Built for your next stage", pages: "Up to 10 Pages", care: "120 min updates & CMS" },
  { name: "Professional", fee: 2200, label: "For established companies", pages: "Up to 20 Pages", care: "300 min updates & Portal" },
  { name: "Shop Start", fee: 799, label: "eCommerce launch with Paystack", pages: "Up to 100 Products", care: "60 min updates/mo" },
  { name: "Shop Growth", fee: 1299, label: "Growing online retail store", pages: "Up to 1,000 Products", care: "120 min updates/mo" },
];

const MANUAL_STEPS = [
  { label: "Business", icon: <Building2 size={14} /> },
  { label: "Goals", icon: <Target size={14} /> },
  { label: "Design", icon: <Palette size={14} /> },
  { label: "Domain", icon: <Globe size={14} /> },
  { label: "Confirm", icon: <CheckCircle2 size={14} /> },
];

function PortalOnboarding() {
  const navigate = useNavigate();
  const { plan: queryPlan } = Route.useSearch();
  const { user, loading, onboarding, updateOnboarding, client, refreshClient } = usePortalAuth();

  const [mode, setMode] = useState<Mode>("manual");
  const [manualStep, setManualStep] = useState<ManualStep>(1);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [enhancingField, setEnhancingField] = useState<string | null>(null);

  const handleEnhanceField = async (field: "goals" | "audience" | "businessName" | "colors") => {
    setEnhancingField(field);
    try {
      const currentVal =
        field === "goals" ? businessGoals :
        field === "audience" ? targetAudience :
        field === "businessName" ? businessName :
        colorPrefs;

      const enhanced = await enhanceFormFieldWithAI({
        field,
        currentValue: currentVal,
        businessName,
        industry,
      });

      if (enhanced) {
        if (field === "goals") setBusinessGoals(enhanced);
        else if (field === "audience") setTargetAudience(enhanced);
        else if (field === "businessName") setBusinessName(enhanced);
        else if (field === "colors") setColorPrefs(enhanced);
      }
    } finally {
      setEnhancingField(null);
    }
  };

  // AI Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form / Scoping state
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("Healthcare / Medical");
  const [targetAudience, setTargetAudience] = useState("");
  const [businessGoals, setBusinessGoals] = useState("");
  const [designStyle, setDesignStyle] = useState("modern-minimal");
  const [colorPrefs, setColorPrefs] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState("");
  const [existingDomain, setExistingDomain] = useState<"yes" | "no">("no");
  const [domainName, setDomainName] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(queryPlan || "");
  const [scopingResult, setScopingResult] = useState<ScopingResult | null>(null);

  // Progress metrics from chat
  const scopingProgress: ScopingProgress = evaluateScopingProgress(messages, uploadedAssets.length);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/portal/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Restore from saved onboarding
  useEffect(() => {
    if (onboarding) {
      if (onboarding.mode && onboarding.mode !== "admin_bypassed" && mode === "choose") {
        setMode(onboarding.mode as Mode);
      }
      if (onboarding.businessName) setBusinessName(onboarding.businessName);
      if (onboarding.contactPerson) setContactPerson(onboarding.contactPerson);
      if (onboarding.phone) setPhone(onboarding.phone);
      if (onboarding.industry) setIndustry(onboarding.industry);
      if (onboarding.targetAudience) setTargetAudience(onboarding.targetAudience);
      if (onboarding.businessGoals) setBusinessGoals(onboarding.businessGoals);
      if (onboarding.designStyle) setDesignStyle(onboarding.designStyle);
      if (onboarding.colorPreferences) setColorPrefs(onboarding.colorPreferences);
      if (onboarding.competitorUrls) setCompetitorUrls(onboarding.competitorUrls);
      if (onboarding.selectedPackageCode) setSelectedPackage(onboarding.selectedPackageCode);
      if (onboarding.existingDomain) setExistingDomain(onboarding.existingDomain as "yes" | "no");
      if (onboarding.existingDomainName) setDomainName(onboarding.existingDomainName);
      if (onboarding.currentStep && onboarding.mode === "manual") {
        setManualStep(Math.min(onboarding.currentStep, 5) as ManualStep);
      }
      if (onboarding.chatHistory) {
        if (Array.isArray(onboarding.chatHistory)) {
          setMessages(onboarding.chatHistory as ChatMessage[]);
        } else if (typeof (onboarding.chatHistory as unknown) === "string") {
          try {
            setMessages(JSON.parse(onboarding.chatHistory as unknown as string));
          } catch (_) {}
        }
      }
    }
  }, [onboarding]);

  // If query param plan is provided, sync it
  useEffect(() => {
    if (queryPlan && !selectedPackage) {
      setSelectedPackage(queryPlan);
    }
  }, [queryPlan]);

  if (loading || !user) return null;

  // ── Asset Upload Handlers ─────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 15 * 1024 * 1024) {
        alert(`File ${file.name} exceeds the 15MB size limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const newAsset: UploadedAsset = {
          id: "asset_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: typeof reader.result === "string" ? reader.result : undefined,
        };

        setUploadedAssets(prev => {
          const updated = [...prev, newAsset];
          // Notify AI Architect of uploaded asset
          const assetNotice: ChatMessage = {
            role: "user",
            text: `[Uploaded Brand Asset: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)]`,
          };
          setMessages(m => [...m, assetNotice]);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAsset = (id: string) => {
    setUploadedAssets(prev => prev.filter(a => a.id !== id));
  };

  // ── Completed State View ──────────────────────────────────────────────
  if (onboarding?.isCompleted || onboarding?.mode === "admin_bypassed") {
    return (
      <PortalLayout>
        <div className="portal-page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 className="portal-page-title" style={{ marginBottom: 0 }}>Onboarding Submitted</h1>
            <span className="portal-badge portal-badge--pending" style={{ fontSize: "11px", fontWeight: 800 }}>
              Awaiting Approval &amp; Mandate
            </span>
          </div>
          <p className="portal-page-sub">
            Your onboarding brief for <strong>{businessName || onboarding.businessName || "your business"}</strong> has been received. Your client profile is updated to <strong>Pending Approval &amp; DebiCheck Mandate</strong>.
          </p>
        </div>

        {/* Profile Status & Three Mandatory Gates */}
        <div className="portal-card" style={{ borderColor: "rgba(245,158,11,0.35)", background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(15,23,42,0.5))", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <Shield size={20} color="#fbbf24" />
            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f8fafc" }}>
              Profile Updated: What Happens Before Your Build Starts
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.6, margin: "0 0 1rem 0" }}>
            To activate your platform build and dedicated private staging server, please complete the three approval steps below:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
            <div style={{ padding: "0.875rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 800, color: "#fbbf24" }}>
                <span>1. Engineering Approval</span>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0.35rem 0 0 0", lineHeight: 1.5 }}>
                Your dedicated Solutions Architect will review your scoping brief and uploaded assets within 1 business day.
              </p>
            </div>

            <div style={{ padding: "0.875rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 800, color: "#38bdf8" }}>
                <span>2. Service Contract</span>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0.35rem 0 0 0", lineHeight: 1.5 }}>
                You will receive your official Master Services Agreement &amp; SLA via email for secure digital sign-off.
              </p>
            </div>

            <div style={{ padding: "0.875rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 800, color: "#34d399" }}>
                <span>3. DebiCheck Mandate</span>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0.35rem 0 0 0", lineHeight: 1.5 }}>
                An automated debit order mandate will be sent directly to your banking app/SMS for safe authorization.
              </p>
            </div>
          </div>
        </div>

        <div className="portal-card" style={{ borderColor: "rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.04)" }}>
          <div className="portal-card-title"><CheckCircle2 size={18} color="#34d399" /> Roadmap to Go-Live</div>
          <div className="portal-timeline">
            {[
              { label: "Kickoff review & intake", sub: "Your Solutions Architect will review your uploaded assets and reach out within 1 business day", done: true },
              { label: "Contract & DebiCheck mandate sign-off", sub: "Digital SLA agreement and bank debit order authorization", done: false },
              { label: "Design mockup created", sub: "We'll present your custom design within 3–5 business days", done: false },
              { label: "Development & Staging review", sub: "You test and approve every page on our private staging link", done: false },
              { label: "Live Launch! 🚀", sub: "Your site goes live on your custom domain with SSL and Google SEO", done: false },
            ].map((item, i) => (
              <div key={i} className="portal-timeline-item">
                <div className="portal-timeline-dot-wrap">
                  <div className={`portal-timeline-dot portal-timeline-dot--${item.done ? "done" : "pending"}`}>{item.done ? "✓" : i + 1}</div>
                  {i < 4 && <div className="portal-timeline-line" />}
                </div>
                <div className="portal-timeline-body">
                  <div className="portal-timeline-title">{item.label}</div>
                  <div className="portal-timeline-sub">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan & Scope Summary */}
        <div className="portal-card" style={{ marginTop: "1.25rem" }}>
          <div className="portal-card-title"><Sparkles size={16} color="#fbbf24" /> Project &amp; Plan Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ padding: "0.875rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Selected Plan</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#2dd4bf", marginTop: "0.25rem" }}>
                {selectedPackage || onboarding.selectedPackageCode || "Grow Online Business"}
              </div>
            </div>
            <div style={{ padding: "0.875rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Company / Brand</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f8fafc", marginTop: "0.25rem" }}>
                {businessName || onboarding.businessName || "Client"}
              </div>
            </div>
            <div style={{ padding: "0.875rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Contact</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc", marginTop: "0.25rem" }}>
                {contactPerson || onboarding.contactPerson || user.email}
              </div>
            </div>
          </div>

          {onboarding.aiRecommendation && (
            <div style={{ marginTop: "1.25rem", padding: "1rem", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.375rem" }}>Executive Scope Summary</div>
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>{onboarding.aiRecommendation}</p>
            </div>
          )}

          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/portal/dashboard" className="portal-btn portal-btn--primary portal-btn--sm">
              Go to Dashboard <ArrowRight size={13} />
            </Link>
            <a href="mailto:hello@eandl.digital" className="portal-btn portal-btn--ghost portal-btn--sm">
              Email Solutions Architect
            </a>
          </div>
        </div>
      </PortalLayout>
    );
  }

  // ── Mode Chooser ──────────────────────────────────────────────────────
  if (mode === "choose") {
    return (
      <PortalLayout>
        <div className="portal-page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 className="portal-page-title" style={{ marginBottom: 0 }}>Project Onboarding</h1>
            {selectedPackage && (
              <span className="portal-badge portal-badge--active">
                Selected Plan: {selectedPackage}
              </span>
            )}
          </div>
          <p className="portal-page-sub">
            {selectedPackage
              ? `Let's scope your ${selectedPackage} build, upload your brand assets, and tailor your deliverables.`
              : "Tell us about your business goals. Choose your plan or let our Gemini AI Architect recommend the perfect tier."}
          </p>
        </div>

        {/* Resume Previous Progress Alert */}
        {onboarding && !onboarding.isCompleted && onboarding.currentStep > 1 && (
          <div className="portal-card" style={{ marginBottom: "1.5rem", borderColor: "rgba(13,148,136,0.3)", background: "rgba(13,148,136,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <RefreshCw size={18} color="#2dd4bf" />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f8fafc" }}>
                  Resume where you left off
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Progress saved · Step {onboarding.currentStep} of {onboarding.totalSteps || 4} · {onboarding.mode === "manual" ? "Step-by-Step Form" : "AI Scoping"}
                </div>
              </div>
              <button
                className="portal-btn portal-btn--primary portal-btn--sm"
                onClick={() => setMode((onboarding.mode as Mode) || "ai")}
              >
                Resume Progress <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        <div className="portal-card-row" style={{ gap: "1.25rem" }}>
          {/* AI Option */}
          <div
            className="portal-card"
            style={{ cursor: "pointer", borderColor: "rgba(13,148,136,0.3)", transition: "all 0.2s" }}
            onClick={() => {
              setMode("ai");
              updateOnboarding({ mode: "ai", currentStep: 2 });
              const biz = businessName || client?.name || "";
              const person = contactPerson || user.email?.split("@")[0] || "";
              if (messages.length === 0) {
                setMessages([
                  {
                    role: "model",
                    text: `Hello ${person || "there"}! I am your Senior AI Solutions Architect at E&L Digital. I'm here to scope your build${selectedPackage ? ` for your "${selectedPackage}" package` : ""}. Tell me: what is the main goal of ${biz ? `"${biz}"` : "your business"}, and what key features (like booking, ecommerce, or quote forms) do you envision?`
                  }
                ]);
              }
            }}
          >
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #0d9488, #134e4a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles size={22} color="#2dd4bf" />
              </div>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f8fafc", marginBottom: "0.375rem" }}>
                  AI-Assisted Scoping (Recommended)
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6 }}>
                  Chat with our Gemini AI Solutions Architect. It asks smart questions, identifies your technical features, guides you to upload brand assets, and matches you to the best Grow Online plan.
                </div>
                <div style={{ marginTop: "0.875rem", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  <span className="portal-chip portal-chip--projects">Gemini 3.5 Intelligence</span>
                  <span className="portal-chip portal-chip--projects">Brand Asset Upload</span>
                  <span className="portal-chip portal-chip--projects">Auto Plan Match</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
              <span className="portal-btn portal-btn--primary portal-btn--sm">
                Start AI Scoping <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Manual Option */}
          <div
            className="portal-card"
            style={{ cursor: "pointer", borderColor: "rgba(99,102,241,0.25)", transition: "all 0.2s" }}
            onClick={() => {
              setMode("manual");
              updateOnboarding({ mode: "manual", currentStep: manualStep });
            }}
          >
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #312e81, #1e1b4b)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ClipboardList size={22} color="#a5b4fc" />
              </div>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f8fafc", marginBottom: "0.375rem" }}>
                  Step-by-Step Form
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6 }}>
                  Prefer a traditional structured questionnaire? Fill in your company profile, design style, domain preferences, and select your plan at your own pace.
                </div>
                <div style={{ marginTop: "0.875rem", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  <span className="portal-chip portal-chip--none">Self-paced</span>
                  <span className="portal-chip portal-chip--none">Full control</span>
                  <span className="portal-chip portal-chip--none">No AI dialogue</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
              <span className="portal-btn portal-btn--ghost portal-btn--sm">
                Start Form <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  // ── AI Chat Mode ──────────────────────────────────────────────────────
  if (mode === "ai") {
    const handleSend = async (text?: string) => {
      const msg = text || inputMsg;
      if (!msg.trim() || isTyping) return;

      const userMsg: ChatMessage = { role: "user", text: msg.trim() };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setInputMsg("");
      setIsTyping(true);

      try {
        const reply = await askGeminiArchitect(
          updated,
          msg.trim(),
          {
            businessName: businessName || client?.name || "your business",
            contactPerson: contactPerson || user.email?.split("@")[0] || "Client",
            industry
          },
          uploadedAssets.map(a => `${a.name} (${a.type})`)
        );
        const newHistory = [...updated, { role: "model" as const, text: reply }];
        setMessages(newHistory);
        updateOnboarding({ chatHistory: newHistory });
      } catch (err) {
        console.warn("AI Architect error:", err);
        const fallbackMsg: ChatMessage = {
          role: "model",
          text: `Thank you for sharing that, ${contactPerson || "there"}. We specialize in high-converting South African digital builds with automated DebiCheck care plans. Please make sure to upload your logo or company profile in the upload panel below so our designers have your visual identity. When ready, click "Review Scope & Select Plan" below to proceed!`
        };
        setMessages([...updated, fallbackMsg]);
      } finally {
        setIsTyping(false);
      }
    };

    const handleProceedToPlan = async () => {
      setBusy(true);
      try {
        const result = await synthesizeScopeWithGemini(messages, {
          businessName: businessName || client?.name || "Your Business",
          contactPerson: contactPerson || user.email?.split("@")[0] || "Client",
        });
        setScopingResult(result);
        if (!selectedPackage) setSelectedPackage(result.recommendedPackage);
        setMode("plan_selection");
      } catch (err) {
        console.warn("Synthesis fallback:", err);
        setScopingResult({
          recommendedPackage: selectedPackage || "Build",
          monthlyFee: 349,
          leadScore: 92,
          projectTitle: `${businessName || "Client"} Digital Showcase`,
          scopeSummary: "Responsive digital presence with Google SEO, WhatsApp contact, domain hosting, and monthly maintenance.",
          keyFeatures: ["Custom Responsive Pages", "Google Local SEO", "Domain & Business Mailbox", "DebiCheck Automated Retainer"],
          carePlanMinutes: 30,
          timeline: "1 to 2 Weeks",
          urgency: "Standard Priority"
        });
        setMode("plan_selection");
      } finally {
        setBusy(false);
      }
    };

    const quickReplies = messages.length <= 2 ? [
      "I need a clean corporate website for my services",
      "I want an online store with Paystack & Ozow",
      "I need real-time booking for client appointments",
      "I want to redesign my existing website",
    ] : messages.length <= 4 ? [
      "I need to launch within 2 weeks",
      "I already have a .co.za domain name",
      "I've uploaded my logo and company profile",
      "What plan do you recommend for my scope?",
    ] : [];

    return (
      <PortalLayout>
        <div className="portal-page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 className="portal-page-title" style={{ marginBottom: 0 }}>AI Solutions Architect</h1>
            <span className="portal-domain-pill">
              <Sparkles size={11} /> Gemini 3.5 Intelligence
            </span>
            {selectedPackage && (
              <span className="portal-badge portal-badge--active">
                Target Plan: {selectedPackage}
              </span>
            )}
          </div>
          <p className="portal-page-sub">
            Chat directly with your E&amp;L architect. It scopes your deliverables, asks for brand assets, and determines readiness for plan selection.
          </p>
        </div>

        {/* Dynamic Scoping Progress Bar */}
        <div className="portal-card" style={{ marginBottom: "1.25rem", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", fontSize: "0.8rem" }}>
            <span style={{ fontWeight: 700, color: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: scopingProgress.isReadyToProceed ? "#34d399" : "#38bdf8" }} />
              Stage: {scopingProgress.stage.toUpperCase()} &bull; {scopingProgress.summaryHint}
            </span>
            <span style={{ color: "#2dd4bf", fontWeight: 800, fontFamily: "monospace" }}>
              {scopingProgress.progressPct}% Ready
            </span>
          </div>
          <div className="portal-progress-track">
            <div
              className={`portal-progress-fill ${scopingProgress.isReadyToProceed ? "portal-progress-fill--teal" : "portal-progress-fill--amber"}`}
              style={{ width: `${scopingProgress.progressPct}%` }}
            />
          </div>
        </div>

        {/* Brand Asset Upload Area (Highlighted when AI requests assets) */}
        <div
          className="portal-card"
          style={{
            marginBottom: "1.25rem",
            borderColor: scopingProgress.hasRequestedUploads ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.08)",
            background: scopingProgress.hasRequestedUploads ? "rgba(13,148,136,0.06)" : "rgba(255,255,255,0.02)",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <UploadCloud size={16} color="#2dd4bf" />
                Brand Assets &amp; Documents
                {scopingProgress.hasRequestedUploads && (
                  <span className="portal-badge portal-badge--active" style={{ fontSize: "9px" }}>
                    AI Requested
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.2rem 0 0 0" }}>
                Upload your logo (PNG, SVG), company profile (PDF), or brand guide so the architect can integrate your visual identity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="portal-btn portal-btn--ghost portal-btn--sm"
              style={{ borderColor: "rgba(45,212,191,0.3)", color: "#2dd4bf" }}
            >
              <UploadCloud size={13} /> Select Files to Upload
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/*,application/pdf,.doc,.docx,.txt"
              style={{ display: "none" }}
            />
          </div>

          {/* Uploaded File Pills */}
          {uploadedAssets.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {uploadedAssets.map(asset => (
                <div
                  key={asset.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.35rem 0.65rem",
                    borderRadius: 8,
                    background: "rgba(13,148,136,0.15)",
                    border: "1px solid rgba(13,148,136,0.3)",
                    fontSize: "0.75rem",
                    color: "#e2e8f0"
                  }}
                >
                  {asset.type.includes("image") ? <ImageIcon size={13} color="#2dd4bf" /> : <File size={13} color="#2dd4bf" />}
                  <span style={{ fontWeight: 600 }}>{asset.name}</span>
                  <span style={{ color: "#64748b", fontSize: "0.7rem" }}>({(asset.size / 1024 / 1024).toFixed(1)}MB)</span>
                  <button
                    type="button"
                    onClick={() => removeAsset(asset.id)}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main AI Chat Box */}
        <div className="portal-card" style={{ marginBottom: "1.25rem" }}>
          <div className="portal-chat-wrap">
            <div className="portal-chat-messages" style={{ minHeight: "320px", maxHeight: "480px" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`portal-chat-msg portal-chat-msg--${msg.role === "model" ? "ai" : "user"}`}>
                  <div className={`portal-chat-avatar portal-chat-avatar--${msg.role === "model" ? "ai" : "user"}`}>
                    {msg.role === "model" ? <Sparkles size={13} /> : user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className={`portal-chat-bubble portal-chat-bubble--${msg.role === "model" ? "ai" : "user"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="portal-chat-msg portal-chat-msg--ai">
                  <div className="portal-chat-avatar portal-chat-avatar--ai"><Sparkles size={13} /></div>
                  <div className="portal-chat-bubble portal-chat-bubble--ai">
                    <div className="portal-chat-typing"><span /><span /><span /></div>
                  </div>
                </div>
              )}
              <div ref={chatRef} />
            </div>

            {/* Quick replies */}
            {quickReplies.length > 0 && !isTyping && (
              <div style={{ display: "flex", gap: "0.375rem", padding: "0.5rem 0.75rem", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {quickReplies.map(r => (
                  <button
                    key={r}
                    className="portal-btn portal-btn--ghost portal-btn--sm"
                    style={{ fontSize: "0.72rem" }}
                    onClick={() => handleSend(r)}
                  >
                    + {r}
                  </button>
                ))}
              </div>
            )}

            {/* Input Row */}
            <div className="portal-chat-input-row">
              <input
                className="portal-input"
                placeholder="Describe what you want your website or digital platform to do…"
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={isTyping}
              />
              <button
                className="portal-btn portal-btn--primary"
                disabled={!inputMsg.trim() || isTyping}
                onClick={() => handleSend()}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Prominent Proceed Button: Lights up when AI indicates readiness */}
          <button
            className={`portal-btn ${scopingProgress.isReadyToProceed ? "portal-btn--primary" : "portal-btn--ghost"}`}
            disabled={busy || messages.length < 2}
            onClick={handleProceedToPlan}
            style={scopingProgress.isReadyToProceed ? { boxShadow: "0 0 20px rgba(13,148,136,0.4)", fontWeight: 800 } : {}}
          >
            {busy ? (
              <><RefreshCw size={15} className="animate-spin" /> Synthesizing Scope…</>
            ) : (
              <><Sparkles size={15} /> Review Scope &amp; Select Plan (Next Step) <ArrowRight size={14} /></>
            )}
          </button>

          <button className="portal-btn portal-btn--ghost" onClick={() => setMode("choose")}>
            <SkipForward size={14} /> Switch to Form
          </button>

          <button
            className="portal-btn portal-btn--ghost"
            style={{ marginLeft: "auto" }}
            onClick={() => {
              updateOnboarding({ chatHistory: messages, mode: "ai" });
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            {saved ? <><CheckCircle2 size={14} /> Progress Saved!</> : "Save Progress"}
          </button>
        </div>
      </PortalLayout>
    );
  }

  // ── Step 3: Plan Selection & Scope Synthesis ──────────────────────────
  if (mode === "plan_selection") {
    const handleFinalizePlan = async () => {
      if (!selectedPackage) return;
      setBusy(true);

      const pkg = AVAILABLE_PACKAGES.find(p => p.name.toLowerCase() === selectedPackage.toLowerCase()) || { fee: 349 };

      try {
        await updateOnboarding({
          isCompleted: true,
          status: "completed",
          currentStep: 4,
          selectedPackageCode: selectedPackage,
          businessName: businessName || client?.name || "Client Business",
          contactPerson: contactPerson || user.email?.split("@")[0] || "Client",
          aiRecommendation: scopingResult?.scopeSummary || `Tailored plan: ${selectedPackage} at R${pkg.fee}/mo.`,
          aiReadinessScore: scopingResult?.leadScore || 92,
        });

        // Also upsert client stub in partner.clients
        // Upsert client record in partner.clients with pending_approval status
        try {
          await partnerSchema()
            .from("clients")
            .upsert({
              brand_id: BRAND_ID,
              user_id: user.id,
              name: contactPerson || businessName || user.email?.split("@")[0] || "Client",
              email: user.email || "",
              phone: phone || null,
              account_status: "pending_approval",
              business_type: industry || "sme_digital",
            }, { onConflict: "brand_id,email" });
        } catch (_) {}

        await refreshClient();
        setMode("choose"); // triggers completed state view
      } catch (err) {
        console.warn("Finalize plan error:", err);
      } finally {
        setBusy(false);
      }
    };

    return (
      <PortalLayout>
        <div className="portal-page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 className="portal-page-title" style={{ marginBottom: 0 }}>Review Scope &amp; Select Plan</h1>
            <span className="portal-domain-pill">Step 3 of 4</span>
          </div>
          <p className="portal-page-sub">
            Review your AI project analysis and choose the Grow Online subscription tier that fits your goals.
          </p>
        </div>

        {/* AI Scoping Result Card */}
        {scopingResult && (
          <div className="portal-card" style={{ marginBottom: "1.5rem", borderColor: "rgba(13,148,136,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#2dd4bf", letterSpacing: "1px", textTransform: "uppercase" }}>
                  AI PROJECT ARCHITECTURE
                </span>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f8fafc", margin: "0.25rem 0 0 0" }}>
                  {scopingResult.projectTitle}
                </h2>
              </div>
              <span className="portal-badge portal-badge--done">
                Lead Score: {scopingResult.leadScore}/100
              </span>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.6, marginTop: "0.75rem" }}>
              {scopingResult.scopeSummary}
            </p>

            <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.5rem" }}>
              {scopingResult.keyFeatures.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.8rem", color: "#e2e8f0" }}>
                  <Check size={14} color="#2dd4bf" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Selection Grid */}
        <div className="portal-card" style={{ marginBottom: "1.5rem" }}>
          <div className="portal-card-title"><Zap size={16} /> Choose Your Grow Online Plan</div>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "1.25rem" }}>
            Every subscription includes high-speed SSD hosting, SSL certificate, automated backups, and South African DebiCheck debit order billing.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.875rem" }}>
            {AVAILABLE_PACKAGES.map(pkg => {
              const isSelected = selectedPackage.toLowerCase() === pkg.name.toLowerCase();
              return (
                <div
                  key={pkg.name}
                  onClick={() => setSelectedPackage(pkg.name)}
                  style={{
                    padding: "1.25rem",
                    borderRadius: 14,
                    border: `2px solid ${isSelected ? "#0d9488" : "rgba(255,255,255,0.08)"}`,
                    background: isSelected ? "rgba(13,148,136,0.1)" : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.15s"
                  }}
                >
                  {pkg.featured && (
                    <span style={{ position: "absolute", top: -10, right: 12, padding: "2px 8px", borderRadius: 999, background: "#0d9488", color: "#ffffff", fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>
                      Most Popular
                    </span>
                  )}
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f8fafc" }}>{pkg.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>{pkg.label}</div>

                  <div style={{ fontSize: "1.4rem", fontWeight: 900, color: isSelected ? "#2dd4bf" : "#f8fafc", fontFamily: "monospace", margin: "0.75rem 0" }}>
                    R{pkg.fee}
                    <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#94a3b8" }}> / month</span>
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "#cbd5e1", lineHeight: 1.5, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.5rem" }}>
                    <div>&bull; {pkg.pages}</div>
                    <div>&bull; {pkg.care}</div>
                  </div>

                  <div style={{ marginTop: "1rem" }}>
                    <span className={`portal-btn ${isSelected ? "portal-btn--primary" : "portal-btn--ghost"} portal-btn--sm`} style={{ width: "100%", justifyContent: "center" }}>
                      {isSelected ? "✓ Selected" : "Select Plan"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button className="portal-btn portal-btn--ghost" onClick={() => setMode("ai")}>
            <ArrowLeft size={14} /> Back to Scoping Chat
          </button>

          <div style={{ marginLeft: "auto" }}>
            <button
              className="portal-btn portal-btn--amber"
              disabled={busy || !selectedPackage}
              onClick={handleFinalizePlan}
              style={{ fontWeight: 800, padding: "0.75rem 1.75rem" }}
            >
              {busy ? (
                <><RefreshCw size={15} className="animate-spin" /> Activating Build…</>
              ) : (
                <><Zap size={15} /> Confirm {selectedPackage || "Plan"} &amp; Complete Onboarding <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  // ── Manual Step Form ──────────────────────────────────────────────────
  const saveManual = async () => {
    setBusy(true);
    await updateOnboarding({
      currentStep: manualStep,
      businessName,
      contactPerson,
      phone,
      industry,
      targetAudience,
      businessGoals,
      designStyle,
      colorPreferences: colorPrefs,
      competitorUrls,
      existingDomain,
      selectedPackageCode: selectedPackage,
      mode: "manual"
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setBusy(false);
  };

  const finishManual = async () => {
    setBusy(true);
    const chosenPlan = selectedPackage || "Build";
    await updateOnboarding({
      isCompleted: true,
      status: "completed",
      currentStep: 4,
      businessName,
      contactPerson,
      phone,
      industry,
      targetAudience,
      businessGoals,
      designStyle,
      colorPreferences: colorPrefs,
      competitorUrls,
      existingDomain,
      selectedPackageCode: chosenPlan,
      mode: "manual",
      aiRecommendation: `Structured onboarding submitted for ${businessName}. Goals: ${businessGoals || "Web presence"}. Selected plan: ${chosenPlan}.`
    });

    try {
      await partnerSchema()
        .from("clients")
        .upsert({
          brand_id: BRAND_ID,
          user_id: user.id,
          name: contactPerson || businessName || user.email?.split("@")[0] || "Client",
          email: user.email || "",
          phone: phone || null,
          account_status: "pending_approval",
          business_type: industry || "sme_digital",
        }, { onConflict: "brand_id,email" });
    } catch (_) {}

    await refreshClient();
    setBusy(false);
  };

  return (
    <PortalLayout>
      <div className="portal-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <h1 className="portal-page-title" style={{ marginBottom: 0 }}>Project Onboarding</h1>
          <button className="portal-btn portal-btn--ghost portal-btn--sm" onClick={() => setMode("ai")}>
            <Sparkles size={13} /> Try AI Scoping Instead
          </button>
        </div>
        <p className="portal-page-sub">Step {manualStep} of 5 — Fill in at your own pace. Progress is auto-saved.</p>
      </div>

      {/* Step indicators */}
      <div className="portal-steps" style={{ marginBottom: "2rem" }}>
        {MANUAL_STEPS.map((s, i) => {
          const n = (i + 1) as ManualStep;
          const status = manualStep > n ? "done" : manualStep === n ? "active" : "pending";
          return (
            <div key={n} className={`portal-step portal-step--${status}`}>
              <div className={`portal-step-dot portal-step-dot--${status}`}>
                {status === "done" ? "✓" : n}
              </div>
              <div className="portal-step-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="portal-card">
        {/* Step 1: Business info */}
        {manualStep === 1 && (
          <div>
            <div className="portal-card-title"><Building2 size={16} /> Business Information</div>
            <div className="portal-form-row">
              <div className="portal-form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <label className="portal-label" style={{ marginBottom: 0 }}>Business / Company Name *</label>
                  <button
                    type="button"
                    onClick={() => handleEnhanceField("businessName")}
                    disabled={enhancingField === "businessName"}
                    style={{
                      background: "rgba(13,148,136,0.15)",
                      border: "1px solid rgba(13,148,136,0.3)",
                      color: "#2dd4bf",
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      transition: "all 0.15s"
                    }}
                  >
                    <Sparkles size={11} className={enhancingField === "businessName" ? "animate-spin" : ""} />
                    {enhancingField === "businessName" ? "Polishing..." : "AI Assist"}
                  </button>
                </div>
                <input
                  className="portal-input"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Apex Dental Care (Pty) Ltd"
                />
              </div>
              <div className="portal-form-group">
                <label className="portal-label">Your Full Name *</label>
                <input
                  className="portal-input"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
            </div>
            <div className="portal-form-row">
              <div className="portal-form-group">
                <label className="portal-label">Mobile / WhatsApp Number</label>
                <input
                  className="portal-input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+27 71 000 0000"
                  type="tel"
                />
              </div>
              <div className="portal-form-group">
                <label className="portal-label">Industry / Sector</label>
                <select
                  className="portal-input portal-select"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                >
                  {[
                    "Healthcare / Medical",
                    "Legal / Attorneys",
                    "Finance / Accounting",
                    "Real Estate / Property",
                    "eCommerce / Retail",
                    "Hospitality / Restaurant",
                    "Construction / Engineering",
                    "Education / Training",
                    "Technology / IT",
                    "Beauty / Wellness",
                    "Logistics / Transport",
                    "NGO / Non-Profit",
                    "General Business"
                  ].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Goals */}
        {manualStep === 2 && (
          <div>
            <div className="portal-card-title"><Target size={16} /> Goals &amp; Target Audience</div>
            <div className="portal-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label className="portal-label" style={{ marginBottom: 0 }}>Who are your target customers?</label>
                <button
                  type="button"
                  onClick={() => handleEnhanceField("audience")}
                  disabled={enhancingField === "audience"}
                  style={{
                    background: "rgba(13,148,136,0.15)",
                    border: "1px solid rgba(13,148,136,0.3)",
                    color: "#2dd4bf",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    transition: "all 0.15s"
                  }}
                >
                  <Sparkles size={11} className={enhancingField === "audience" ? "animate-spin" : ""} />
                  {enhancingField === "audience" ? "Articulating..." : "AI Assist"}
                </button>
              </div>
              <input
                className="portal-input"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                placeholder="e.g. Local property buyers and sellers in Cape Town looking for expert agents"
              />
            </div>
            <div className="portal-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label className="portal-label" style={{ marginBottom: 0 }}>What is the primary goal of your website?</label>
                <button
                  type="button"
                  onClick={() => handleEnhanceField("goals")}
                  disabled={enhancingField === "goals"}
                  style={{
                    background: "rgba(13,148,136,0.15)",
                    border: "1px solid rgba(13,148,136,0.3)",
                    color: "#2dd4bf",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    transition: "all 0.15s"
                  }}
                >
                  <Sparkles size={11} className={enhancingField === "goals" ? "animate-spin" : ""} />
                  {enhancingField === "goals" ? "Enhancing..." : "AI Assist"}
                </button>
              </div>
              <textarea
                className="portal-input portal-textarea"
                value={businessGoals}
                onChange={e => setBusinessGoals(e.target.value)}
                placeholder="e.g. Generate qualified leads for our advisory services, allow clients to book consultations, and showcase client case studies..."
              />
            </div>
            <div className="portal-form-group">
              <label className="portal-label">Select Preferred Package</label>
              <select
                className="portal-input portal-select"
                value={selectedPackage}
                onChange={e => setSelectedPackage(e.target.value)}
              >
                <option value="">— Select a package —</option>
                {AVAILABLE_PACKAGES.map(p => (
                  <option key={p.name} value={p.name}>
                    {p.name} (R{p.fee}/mo) — {p.pages}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Design */}
        {manualStep === 3 && (
          <div>
            <div className="portal-card-title"><Palette size={16} /> Design Preferences</div>
            <div className="portal-form-group">
              <label className="portal-label">Design Style</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.625rem" }}>
                {[
                  { id: "modern-minimal", label: "Modern & Minimal", emoji: "✨" },
                  { id: "bold-creative", label: "Bold & Creative", emoji: "🎨" },
                  { id: "corporate-clean", label: "Corporate & Clean", emoji: "🏢" },
                  { id: "warm-friendly", label: "Warm & Friendly", emoji: "🤝" },
                  { id: "luxury-premium", label: "Luxury & Premium", emoji: "💎" },
                  { id: "tech-futuristic", label: "Tech & Futuristic", emoji: "🚀" },
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDesignStyle(s.id)}
                    style={{
                      padding: "0.75rem",
                      borderRadius: 10,
                      border: `1.5px solid ${designStyle === s.id ? "#0d9488" : "rgba(255,255,255,0.08)"}`,
                      background: designStyle === s.id ? "rgba(13,148,136,0.1)" : "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s"
                    }}
                  >
                    <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{s.emoji}</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: designStyle === s.id ? "#2dd4bf" : "#94a3b8" }}>{s.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="portal-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label className="portal-label" style={{ marginBottom: 0 }}>Brand Colours (optional)</label>
                <button
                  type="button"
                  onClick={() => handleEnhanceField("colors")}
                  disabled={enhancingField === "colors"}
                  style={{
                    background: "rgba(13,148,136,0.15)",
                    border: "1px solid rgba(13,148,136,0.3)",
                    color: "#2dd4bf",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    transition: "all 0.15s"
                  }}
                >
                  <Sparkles size={11} className={enhancingField === "colors" ? "animate-spin" : ""} />
                  {enhancingField === "colors" ? "Suggesting..." : "AI Suggest Palette"}
                </button>
              </div>
              <input
                className="portal-input"
                value={colorPrefs}
                onChange={e => setColorPrefs(e.target.value)}
                placeholder="e.g. Navy blue and teal — our logo uses #0D9488 and #0F172A"
              />
            </div>
            <div className="portal-form-group">
              <label className="portal-label">Competitor or Reference Websites (optional)</label>
              <input
                className="portal-input"
                value={competitorUrls}
                onChange={e => setCompetitorUrls(e.target.value)}
                placeholder="e.g. www.competitor.co.za, www.inspiration.com"
              />
            </div>
          </div>
        )}

        {/* Step 4: Domain & Brand Asset Upload */}
        {manualStep === 4 && (
          <div>
            <div className="portal-card-title"><Globe size={16} /> Domain &amp; Brand Assets</div>
            <div className="portal-form-group">
              <label className="portal-label">Do you already have a domain name?</label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {(["yes", "no"] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setExistingDomain(v)}
                    style={{
                      flex: 1,
                      padding: "0.875rem",
                      borderRadius: 10,
                      border: `1.5px solid ${existingDomain === v ? "#0d9488" : "rgba(255,255,255,0.08)"}`,
                      background: existingDomain === v ? "rgba(13,148,136,0.1)" : "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      color: existingDomain === v ? "#2dd4bf" : "#94a3b8",
                      fontWeight: 700,
                      fontSize: "0.85rem"
                    }}
                  >
                    {v === "yes" ? "Yes, I have one" : "No, I need one"}
                  </button>
                ))}
              </div>
            </div>

            {existingDomain === "yes" && (
              <div className="portal-form-group">
                <label className="portal-label">Your domain name</label>
                <input
                  className="portal-input"
                  value={domainName}
                  onChange={e => setDomainName(e.target.value)}
                  placeholder="www.yourbusiness.co.za"
                />
              </div>
            )}

            <div className="portal-form-group" style={{ marginTop: "1.25rem" }}>
              <label className="portal-label">Upload Brand Assets (Logo, Company Profile, Brand Guide)</label>
              <div
                style={{
                  border: "2px dashed rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: "1.5rem",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.02)"
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={28} color="#2dd4bf" style={{ margin: "0 auto 0.5rem", display: "block" }} />
                <div style={{ fontSize: "0.85rem", color: "#f8fafc", fontWeight: 600 }}>Click to select files to upload</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>Supports PNG, SVG, JPG, PDF, DOCX (up to 15MB)</div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,application/pdf,.doc,.docx"
                style={{ display: "none" }}
              />

              {uploadedAssets.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                  {uploadedAssets.map(asset => (
                    <div
                      key={asset.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.35rem 0.65rem",
                        borderRadius: 8,
                        background: "rgba(13,148,136,0.15)",
                        border: "1px solid rgba(13,148,136,0.3)",
                        fontSize: "0.75rem",
                        color: "#e2e8f0"
                      }}
                    >
                      {asset.type.includes("image") ? <ImageIcon size={13} color="#2dd4bf" /> : <File size={13} color="#2dd4bf" />}
                      <span>{asset.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAsset(asset.id)}
                        style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {manualStep === 5 && (
          <div>
            <div className="portal-card-title"><FileText size={16} /> Review &amp; Submit</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                ["Business Name", businessName || "—"],
                ["Contact Person", contactPerson || "—"],
                ["Phone", phone || "—"],
                ["Industry", industry],
                ["Target Audience", targetAudience || "—"],
                ["Goals", businessGoals || "—"],
                ["Design Style", designStyle.replace("-", " ")],
                ["Brand Colours", colorPrefs || "—"],
                ["Domain", existingDomain === "yes" ? domainName || "Provided" : "E&L will register"],
                ["Selected Package", selectedPackage || "Build (R349/mo)"],
                ["Uploaded Assets", uploadedAssets.length > 0 ? uploadedAssets.map(a => a.name).join(", ") : "None uploaded"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    padding: "0.625rem 0.875rem",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)"
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "#64748b", minWidth: 130, fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: "0.82rem", color: "#e2e8f0", flex: 1 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.25rem", padding: "0.875rem 1rem", borderRadius: 10, background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)", fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6 }}>
              ✅ After submitting, your E&amp;L Solutions Architect will review this brief and reach out within 1 business day to schedule your kickoff review.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", alignItems: "center" }}>
          {manualStep > 1 && (
            <button className="portal-btn portal-btn--ghost" onClick={() => setManualStep(s => (s - 1) as ManualStep)}>
              <ArrowLeft size={14} /> Back
            </button>
          )}

          <button className="portal-btn portal-btn--ghost portal-btn--sm" onClick={saveManual} disabled={busy}>
            {saved ? <><CheckCircle2 size={13} /> Saved</> : "Save Progress"}
          </button>

          <div style={{ marginLeft: "auto" }}>
            {manualStep < 5 ? (
              <button
                className="portal-btn portal-btn--primary"
                onClick={async () => {
                  await saveManual();
                  setManualStep(s => (s + 1) as ManualStep);
                }}
              >
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                className="portal-btn portal-btn--amber"
                disabled={busy || !businessName}
                onClick={finishManual}
              >
                {busy ? "Submitting…" : <><Zap size={14} /> Submit Onboarding</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
