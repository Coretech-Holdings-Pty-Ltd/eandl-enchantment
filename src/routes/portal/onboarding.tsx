/**
 * Client Project Onboarding — Interactive, Gamified & Visual Experience
 * Built with interactive sliders, visual card decks, live aesthetic toggles,
 * AI auto-crafting, and zero rigid boilerplate.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Zap, ArrowRight, ArrowLeft, CheckCircle2, Building2,
  Globe, Target, FileText, UploadCloud, Sparkles, RefreshCw,
  Check, X, File, Image as ImageIcon, Shield, ExternalLink,
  Layers, Layout, Plus, Trash2, Award, ChevronDown, ChevronUp,
  Phone, Mail, MapPin, Send, MessageSquare, Bot, Sliders,
  Gauge, Palette, Flame, Sparkle, Laptop, Smartphone, Eye
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { partnerSchema, BRAND_ID } from "@/lib/supabase";
import {
  enhanceFormFieldWithAI,
  synthesizeScopeWithGemini,
  askGeminiArchitect
} from "@/lib/gemini";

export const Route = createFileRoute("/portal/onboarding")({
  validateSearch: (s: Record<string, unknown>): { plan?: string } => ({
    plan: typeof s["plan"] === "string" ? s["plan"] : undefined,
  }),
  component: PortalOnboarding,
});

type StepNumber = 1 | 2 | 3 | 4 | 5;

interface UploadedAsset {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

const BRAND_STYLES = [
  { id: "modern-teal", name: "Modern Contractor", colors: ["#0d9488", "#0f172a", "#f8fafc"], vibe: "High-trust & crisp" },
  { id: "bold-amber", name: "Industrial & Safety", colors: ["#f59e0b", "#18181b", "#ffffff"], vibe: "Heavy-duty & prominent" },
  { id: "clean-slate", name: "Corporate Clean", colors: ["#3b82f6", "#0f172a", "#f1f5f9"], vibe: "Sleek & institutional" },
  { id: "luxury-gold", name: "Luxury Renovations", colors: ["#eab308", "#1c1917", "#fafaf9"], vibe: "High-end residential" },
];

const TRADE_SERVICES = [
  { id: "painting", label: "Painting & Coating", icon: "🎨", popular: true },
  { id: "waterproofing", label: "Waterproofing", icon: "💧", popular: true },
  { id: "tiling", label: "Tiling & Paving", icon: "🧱", popular: true },
  { id: "plumbing", label: "Plumbing Repairs", icon: "🔧", popular: true },
  { id: "repairs", label: "Crack & Wall Repairs", icon: "🔨", popular: true },
  { id: "estate", label: "Estate Upkeep", icon: "🏡", popular: true },
  { id: "roofing", label: "Roofing & Gutters", icon: "🏠", popular: false },
  { id: "electrical", label: "Electrical & Solar", icon: "⚡", popular: false },
  { id: "renovations", label: "Turnkey Renovations", icon: "🏗️", popular: false },
  { id: "carpentry", label: "Carpentry & Ceilings", icon: "🪚", popular: false },
];

const CLIENT_TYPES = [
  { id: "homeowners", label: "Homeowners", icon: "🏡", desc: "Private houses & townhouses" },
  { id: "estates", label: "Body Corporates & Estates", icon: "🏢", desc: "HOAs, complexes & property managers" },
  { id: "commercial", label: "Offices & Retail", icon: "🏬", desc: "Commercial & industrial facilities" },
  { id: "agencies", label: "Letting Agencies", icon: "📋", desc: "Rental maintenance & tenant inspections" },
];

const PACKAGES = [
  {
    name: "Spark",
    fee: 199,
    tagline: "High-Impact 1-Pager",
    pages: "Single-Page Fast Launch",
    idealFor: "Side-gigs or focused solo trades",
    features: ["1 Clean Landing Page", "Direct WhatsApp Chat Button", "High-speed .co.za Domain & SSL", "Instant Launch"],
  },
  {
    name: "Build",
    fee: 349,
    tagline: "Commercial Contractor Suite",
    pages: "Up to 5 Dedicated Pages",
    featured: true,
    badge: "⭐ Recommended for Contractors",
    idealFor: "Multi-trade companies tendering for estates & complexes",
    features: ["Up to 5 Custom Pages", "Online RFQ Quote Engine", "Before & After Workmanship Gallery", "Professional Business Email (@yourbusiness)", "Google Profile Local SEO Setup"],
  },
  {
    name: "Business",
    fee: 1200,
    tagline: "Multi-Division Enterprise",
    pages: "Up to 10 Tailored Pages",
    badge: "Full Team Scale",
    idealFor: "Established teams with corporate tenders",
    features: ["Up to 10 Trade Pages", "Corporate Tender Showcase", "Priority Same-Day Update Turnaround", "Dedicated Account Manager"],
  },
];

const STEPS = [
  { num: 1, title: "Identity & Vibe", icon: <Building2 size={14} /> },
  { num: 2, title: "Services & Scale", icon: <Layers size={14} /> },
  { num: 3, title: "Clients & Launch", icon: <Target size={14} /> },
  { num: 4, title: "Choose Plan", icon: <Zap size={14} /> },
  { num: 5, title: "Review & Launch", icon: <CheckCircle2 size={14} /> },
];

function PortalOnboarding() {
  const navigate = useNavigate();
  const { plan: queryPlan } = Route.useSearch();
  const { user, loading, onboarding, updateOnboarding, client, refreshClient, access, setToast } = usePortalAuth();

  const [step, setStep] = useState<StepNumber>(1);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // ── Step 1: Identity & Vibe ───────────────────────────────────────
  const [businessName, setBusinessName] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("modern-teal");
  const [aboutUs, setAboutUs] = useState("");
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [regNumber, setRegNumber] = useState("");
  const [address, setAddress] = useState("");

  // ── Step 2: Services & Scale Slider ───────────────────────────────
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "Painting & Coating",
    "Waterproofing",
    "Tiling & Paving",
  ]);
  const [customService, setCustomService] = useState("");
  // Scale slider: 1 = Solo/Specialist, 2 = Growing Team (3-8), 3 = Commercial Crew (10+)
  const [teamScale, setTeamScale] = useState<number>(2);

  // ── Step 3: Clients & Launch Urgency Slider ───────────────────────
  const [selectedClients, setSelectedClients] = useState<string[]>([
    "Homeowners",
    "Body Corporates & Estates",
  ]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([
    "Gauteng",
    "Sandton & Pretoria",
  ]);
  const [regionInput, setRegionInput] = useState("");
  // Urgency slider: 1 = Rapid (< 7 days), 2 = Standard (2 weeks), 3 = Flexible (1 month)
  const [urgencyIndex, setUrgencyIndex] = useState<number>(2);

  // ── Step 4: Plan ──────────────────────────────────────────────────
  const [selectedPackage, setSelectedPackage] = useState(queryPlan || "Build");

  // ── Step 5: Live Spec Sheet, Mockup Preview & Review Chatbot ─────
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [scopeVerified, setScopeVerified] = useState(false);
  const [aiExecutiveSummary, setAiExecutiveSummary] = useState<string>("");
  const [activeReviewTab, setActiveReviewTab] = useState<"preview" | "scope" | "plan">("preview");
  const [mockupDevice, setMockupDevice] = useState<"mobile" | "desktop">("desktop");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Embedded Review Chatbot
  const [reviewChat, setReviewChat] = useState<Array<{ sender: "ai" | "user"; message: string }>>([
    {
      sender: "ai",
      message: "👋 Hi! I'm your interactive scope assistant. Everything look good on your website preview above? If you want to change anything (e.g. 'Add Waterproofing' or 'Change plan to Spark'), just tell me here!",
    },
  ]);
  const [reviewInput, setReviewInput] = useState("");
  const [isBotReplying, setIsBotReplying] = useState(false);

  // Compute selected style details
  const activeStyleConfig = useMemo(() => {
    return BRAND_STYLES.find(s => s.id === selectedStyle) || BRAND_STYLES[0] || { id: "modern-teal", name: "Modern Contractor", colors: ["#0d9488", "#0f172a", "#f8fafc"], vibe: "High-trust & crisp" };
  }, [selectedStyle]);

  const primaryThemeColor = activeStyleConfig?.colors?.[0] || "#0d9488";
  const themeName = activeStyleConfig?.name || "Modern Contractor";

  // Compute full deliverables breakdown
  const plannedPagesList = useMemo(() => {
    const isSpark = selectedPackage.toLowerCase() === "spark";
    if (isSpark) {
      return [
        { title: "Home & Landing Showcase", purpose: "Hero header, direct WhatsApp quote trigger, trust badges, service overview, and contact info" },
      ];
    }
    return [
      { title: "Home", purpose: "Executive hero banner, core capabilities grid, client testimonials, and instant RFQ quote trigger" },
      { title: "Services & Trade Capabilities", purpose: `Dedicated breakdown of ${selectedServices.slice(0, 4).join(", ")} with technical specifications` },
      { title: "Workmanship & Before/After Gallery", purpose: "High-resolution photo portfolio showcasing completed projects and quality transformations" },
      { title: "Online RFQ Quote Engine", purpose: "Interactive multi-step quotation form with property type and scope calculators" },
      { title: "About Us & Verified Credentials", purpose: "Company background, director profile, CIPC registration, and 12-month workmanship warranty" },
      { title: "Contact & Operating Areas", purpose: `Direct phone, WhatsApp live chat, physical address, and service coverage across ${selectedRegions.join(", ")}` },
    ];
  }, [selectedPackage, selectedServices, selectedRegions]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/portal/login" });
  }, [user, loading, navigate]);

  // Sync initial user details
  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
    if (client?.name && !directorName) {
      const clean = client.name.replace(/\(.*\)/, "").trim();
      setDirectorName(clean);
      if (!businessName) setBusinessName(clean);
    }
    if (client?.phone && !phone) setPhone(client.phone);
  }, [user, client]);

  // Restore onboarding state
  useEffect(() => {
    if (onboarding) {
      if (onboarding.businessName) setBusinessName(onboarding.businessName);
      if (onboarding.contactPerson) setDirectorName(onboarding.contactPerson);
      if (onboarding.phone) setPhone(onboarding.phone);
      if (onboarding.selectedPackageCode) setSelectedPackage(onboarding.selectedPackageCode);
      if (onboarding.businessGoals && !aboutUs) setAboutUs(onboarding.businessGoals);
    }
  }, [onboarding]);

  // Generate Executive Brief on Step 5
  useEffect(() => {
    if (step === 5 && !aiExecutiveSummary) {
      generateAiBrief();
    }
  }, [step]);

  const generateAiBrief = async () => {
    try {
      const summary = await synthesizeScopeWithGemini(
        [
          { role: "user", text: `Generate a comprehensive executive project brief for ${businessName || "Client"} offering ${selectedServices.join(", ")} in ${selectedRegions.join(", ")}. Plan: ${selectedPackage}. Client segments: ${selectedClients.join(", ")}.` },
        ],
        { businessName: businessName || "Client Business", contactPerson: directorName || "Director" }
      );
      setAiExecutiveSummary(summary?.scopeSummary || `Tailored South African contractor platform for ${businessName || "your business"}. Features a conversion-optimized ${selectedPackage} architecture showcasing ${selectedServices.length} trade divisions, interactive quote funnels, and verified trust credentials across ${selectedRegions.join(", ")}.`);
    } catch (_) {
      setAiExecutiveSummary(`Tailored South African contractor platform for ${businessName || "your business"}. Features a conversion-optimized ${selectedPackage} architecture showcasing ${selectedServices.length} trade divisions (${selectedServices.slice(0, 3).join(", ")}), interactive quote funnels, and verified trust credentials across ${selectedRegions.join(", ")}.`);
    }
  };

  // AI Profile Generator
  const handleAiCraftProfile = async () => {
    if (!businessName.trim()) {
      if (setToast) setToast("Please enter your business name first so AI can craft your profile.");
      return;
    }
    setIsAiGenerating(true);
    try {
      const prompt = `Write a clean, high-trust 2-paragraph company bio for a South African contractor named "${businessName}". Services: ${selectedServices.join(", ")}. Coverage: ${selectedRegions.join(", ")}. Make it sound dependable, prompt, and experienced.`;
      const result = await askGeminiArchitect([], prompt, { businessName, contactPerson: directorName, industry: "Contractor" });
      if (result) {
        setAboutUs(result);
        if (setToast) setToast("✨ AI drafted your professional company bio!");
      }
    } catch (_) {
      setAboutUs(`${businessName} is a premier South African contracting team specializing in ${selectedServices.slice(0, 3).join(", ")}. We pride ourselves on precision, guaranteed workmanship, and fast turnaround across ${selectedRegions.join(", ")}.`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Asset Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedAssets(prev => [
          ...prev,
          {
            id: "doc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 5),
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: typeof reader.result === "string" ? reader.result : undefined,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Save progress helper
  const handleSaveAndSync = async (nextStep?: StepNumber) => {
    setBusy(true);
    try {
      const dossier = {
        companyProfile: {
          businessName,
          directorName,
          phone,
          email,
          regNumber,
          address,
          aboutUs,
          selectedStyle,
          coreServices: selectedServices,
          teamScale: teamScale === 1 ? "Solo Specialist" : teamScale === 2 ? "Growing Team (3-8)" : "Commercial Crew (10+)",
          operatingAreas: selectedRegions,
          targetMarkets: selectedClients,
          urgency: urgencyIndex === 1 ? "Rapid (< 7 Days)" : urgencyIndex === 2 ? "Standard (2 Weeks)" : "Flexible",
        },
        selectedPackage,
        scopeVerified,
        uploadedAssets,
      };

      await updateOnboarding({
        currentStep: nextStep || step,
        businessName,
        contactPerson: directorName,
        phone,
        industry: "Construction & Services",
        targetAudience: selectedClients.join(", "),
        businessGoals: aboutUs || `Services: ${selectedServices.join(", ")}`,
        selectedPackageCode: selectedPackage,
        mode: "manual",
        chatHistory: { dossier } as any,
      });

      if (onboarding?.id) {
        try {
          await partnerSchema()
            .from("onboardings")
            .update({
              business_name: businessName,
              client_name: directorName,
              client_phone: phone,
              selected_package_code: selectedPackage,
              business_goals: aboutUs || `Services: ${selectedServices.join(", ")}`,
              target_audience: selectedClients.join(", "),
              current_step: nextStep || step,
              chat_history: { dossier },
            })
            .eq("id", onboarding.id);
        } catch (_) {}
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (!scopeVerified) {
      if (setToast) setToast("Please check the verification box to sign off on your scope.");
      return;
    }
    setBusy(true);
    try {
      const dossier = {
        companyProfile: {
          businessName,
          directorName,
          phone,
          email,
          regNumber,
          address,
          aboutUs,
          selectedStyle,
          coreServices: selectedServices,
          teamScale: teamScale === 1 ? "Solo Specialist" : teamScale === 2 ? "Growing Team (3-8)" : "Commercial Crew (10+)",
          operatingAreas: selectedRegions,
          targetMarkets: selectedClients,
        },
        selectedPackage,
        scopeVerified: true,
        submittedAt: new Date().toISOString(),
        uploadedAssets,
      };

      await updateOnboarding({
        isCompleted: true,
        status: "completed",
        currentStep: 5,
        businessName,
        contactPerson: directorName,
        phone,
        industry: "Contracting & Maintenance",
        targetAudience: selectedClients.join(", "),
        businessGoals: aboutUs,
        selectedPackageCode: selectedPackage,
        mode: "manual",
        aiRecommendation: aiExecutiveSummary || `Contractor spec sheet for ${businessName}. Services: ${selectedServices.join(", ")}. Plan: ${selectedPackage}.`,
        chatHistory: { dossier } as any,
      });

      // Update client row in partner.clients
      try {
        await partnerSchema()
          .from("clients")
          .upsert({
            brand_id: BRAND_ID,
            user_id: user?.id,
            name: directorName || businessName || "Client",
            email: email || user?.email || "",
            phone: phone || null,
            account_status: "pending_approval",
            business_type: "contractor",
          }, { onConflict: "brand_id,email" });
      } catch (_) {}

      await refreshClient();
      if (setToast) setToast("🎉 Project blueprint submitted successfully!");
    } finally {
      setBusy(false);
    }
  };

  // Quick Review Chatbot adjustments
  const handleBotSubmit = (textToSend?: string) => {
    const text = (textToSend || reviewInput).trim();
    if (!text || isBotReplying) return;

    setReviewChat(prev => [...prev, { sender: "user", message: text }]);
    setReviewInput("");
    setIsBotReplying(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = "";

      if (lower.includes("paint") || lower.includes("waterproof") || lower.includes("tile") || lower.includes("plumb") || lower.includes("solar") || lower.includes("roof") || lower.includes("paving")) {
        const found = TRADE_SERVICES.find(s => lower.includes(s.label.toLowerCase().split(" ")[0] || ""));
        const toAdd = found ? found.label : text.replace(/add|service|please/gi, "").trim();
        if (toAdd && !selectedServices.includes(toAdd)) {
          setSelectedServices(prev => [...prev, toAdd]);
          reply = `Done! Added "${toAdd}" to your services list.`;
        } else {
          reply = `"${toAdd}" is already in your services list!`;
        }
      } else if (lower.includes("spark") || lower.includes("build") || lower.includes("business")) {
        const found = PACKAGES.find(p => lower.includes(p.name.toLowerCase()));
        if (found) {
          setSelectedPackage(found.name);
          reply = `Switched your plan to ${found.name} (R${found.fee}/mo).`;
        }
      } else {
        reply = "I've noted this request. You can also adjust sliders or options on previous steps anytime!";
      }

      setReviewChat(prev => [...prev, { sender: "ai", message: reply }]);
      setIsBotReplying(false);
      if (setToast) setToast("✅ Spec sheet updated live!");
    }, 450);
  };

  // ── Completed View ───────────────────────────────────────────────
  if (onboarding?.isCompleted || onboarding?.mode === "admin_bypassed") {
    const planName = onboarding.selectedPackageCode || selectedPackage || "Build";
    const biz = businessName || onboarding.businessName || "Your Company";
    const hasMandate = !!client?.mandateDocUrl;

    return (
      <PortalLayout>
        <div style={{
          background: "linear-gradient(135deg, rgba(13,148,136,0.18) 0%, rgba(15,23,42,0.8) 100%)",
          border: "1px solid rgba(45,212,191,0.3)",
          borderRadius: 20,
          padding: "2.5rem 1.5rem",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🚀</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#f8fafc", margin: "0 0 0.5rem" }}>
            Blueprint Submitted!
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#94a3b8", margin: "0 0 1rem" }}>
            Everything has been captured for <strong style={{ color: "#e2e8f0" }}>{biz}</strong>.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 1.25rem", borderRadius: 999, background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.4)", fontSize: "0.82rem", fontWeight: 800, color: "#2dd4bf" }}>
            <Zap size={13} /> Selected Tier: {planName}
          </div>
        </div>

        <div className="portal-card" style={{ marginBottom: "1.25rem" }}>
          <div className="portal-card-title"><CheckCircle2 size={16} color="#34d399" /> What Happens Next?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginTop: "1rem", fontSize: "0.85rem", color: "#cbd5e1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(52,211,153,0.15)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>✓</div>
              <div><strong>1. CoreTech &amp; E&amp;L Review:</strong> Design team aligns on your colors, logo, and trade lines.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: hasMandate ? "rgba(52,211,153,0.15)" : "rgba(245,158,11,0.15)", color: hasMandate ? "#34d399" : "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                {hasMandate ? "✓" : "2"}
              </div>
              <div><strong>2. Sign Debit Order Mandate:</strong> Upload your SA ID / Passport and authorize your monthly care plan.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.05)", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>3</div>
              <div><strong>3. Launch:</strong> We design your site, setup your email, and go live!</div>
            </div>
          </div>
        </div>

        <Link to="/portal/dashboard" className="portal-btn portal-btn--primary">
          Go to Dashboard <ArrowRight size={14} />
        </Link>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      {/* ── Interactive Gamified Onboarding Header ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        {/* Top Progress & Motivational Milestone Banner */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1rem",
          background: "linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(15,23,42,0.6) 100%)",
          border: "1px solid rgba(45,212,191,0.25)",
          borderRadius: 16,
          padding: "1rem 1.25rem",
          boxShadow: "0 8px 24px -6px rgba(0,0,0,0.4)"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "3px 10px",
                borderRadius: 999,
                background: step === 5 ? "rgba(16,185,129,0.25)" : "rgba(45,212,191,0.2)",
                border: step === 5 ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(45,212,191,0.4)",
                color: step === 5 ? "#34d399" : "#2dd4bf",
                fontSize: "0.72rem",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.08em"
              }}>
                {step === 5 ? "🎉 Final Launch Step" : `⚡ Step ${step} of 5`}
              </span>
              <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600 }}>
                {step === 1 && "Off to a flying start! Setup your core brand identity"}
                {step === 2 && "Building momentum! Pick your services & operational scale"}
                {step === 3 && "Halfway milestone reached! Lock your target clients & coverage"}
                {step === 4 && "Almost there! Select your tailored growth package"}
                {step === 5 && "You made it! Review your live website wireframe & blueprint"}
              </span>
            </div>
            <h1 className="portal-page-title" style={{ fontSize: "1.35rem", marginBottom: 0, fontWeight: 900 }}>
              {STEPS[step - 1]?.title}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                Progress
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900, color: step === 5 ? "#34d399" : "#2dd4bf", fontFamily: "monospace", lineHeight: 1 }}>
                {Math.round((step / 5) * 100)}%
              </div>
            </div>

            {/* Quick Progress Ring or Mini-Counter */}
            <div style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: `conic-gradient(#2dd4bf ${(step / 5) * 360}deg, rgba(255,255,255,0.08) 0deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4
            }}>
              <div style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 900,
                color: "#f8fafc"
              }}>
                {step}/5
              </div>
            </div>
          </div>
        </div>

        {/* Interactive 5-Step Stepper Cards (Clickable & Responsive) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "0.5rem",
          marginBottom: "0.75rem"
        }}>
          {STEPS.map((s) => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            const canJump = s.num < step;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (canJump) setStep(s.num as StepNumber);
                }}
                disabled={!canJump && !isCurrent}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 0.75rem",
                  borderRadius: 12,
                  background: isCurrent
                    ? "linear-gradient(135deg, rgba(45,212,191,0.2) 0%, rgba(13,148,136,0.1) 100%)"
                    : isDone
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(255,255,255,0.03)",
                  border: isCurrent
                    ? "1px solid #2dd4bf"
                    : isDone
                      ? "1px solid rgba(16,185,129,0.3)"
                      : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isCurrent ? "0 0 16px rgba(45,212,191,0.25)" : "none",
                  cursor: canJump ? "pointer" : "default",
                  textAlign: "left",
                  transition: "all 0.25s ease",
                  outline: "none"
                }}
              >
                {/* Step Circle with Checkmark or Number */}
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isDone
                    ? "#10b981"
                    : isCurrent
                      ? "#2dd4bf"
                      : "rgba(255,255,255,0.08)",
                  color: isDone || isCurrent ? "#0f172a" : "#64748b",
                  fontWeight: 900,
                  fontSize: "0.75rem",
                  flexShrink: 0
                }}>
                  {isDone ? <Check size={14} strokeWidth={3} /> : s.num}
                </div>

                {/* Step Text Info */}
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <div style={{
                    fontSize: "0.72rem",
                    fontWeight: isCurrent ? 800 : 700,
                    color: isCurrent ? "#f8fafc" : isDone ? "#cbd5e1" : "#64748b",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {s.title}
                  </div>
                  <div style={{
                    fontSize: "0.62rem",
                    color: isCurrent ? "#2dd4bf" : isDone ? "#34d399" : "#475569",
                    fontWeight: 600
                  }}>
                    {isCurrent ? "In Progress" : isDone ? "Completed ✓" : "Upcoming"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Connecting Progress Bar */}
        <div style={{
          height: 4,
          borderRadius: 999,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
          position: "relative"
        }}>
          <div style={{
            height: "100%",
            width: `${(step / 5) * 100}%`,
            background: "linear-gradient(90deg, #0d9488 0%, #2dd4bf 50%, #34d399 100%)",
            borderRadius: 999,
            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 0 8px rgba(45,212,191,0.6)"
          }} />
        </div>
      </div>

      {/* ── Main Interactive Card ── */}
      <div className="portal-card" style={{ padding: "1.5rem" }}>

        {/* ══════════════════════════════════════════════════════════════
            STEP 1: IDENTITY & VIBE (Visual & Expressive)
            ══════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Quick Core Inputs */}
            <div className="portal-form-row">
              <div className="portal-form-group">
                <label className="portal-label">Business / Company Name *</label>
                <input
                  className="portal-input"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Property Fixers"
                  autoFocus
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-label">Your Full Name (Owner / Director) *</label>
                <input
                  className="portal-input"
                  value={directorName}
                  onChange={e => setDirectorName(e.target.value)}
                  placeholder="e.g. Solulele Kwani"
                />
              </div>
            </div>

            <div className="portal-form-row">
              <div className="portal-form-group">
                <label className="portal-label">Mobile or WhatsApp Number *</label>
                <input
                  className="portal-input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 071 000 0000"
                  type="tel"
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-label">Business Email</label>
                <input
                  className="portal-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="info@yourcompany.co.za"
                  type="email"
                />
              </div>
            </div>

            {/* Visual Brand Style Deck */}
            <div>
              <label className="portal-label" style={{ marginBottom: "0.5rem" }}>
                Choose Your Preferred Website Look &amp; Color Theme
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.6rem" }}>
                {BRAND_STYLES.map(style => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      style={{
                        padding: "0.875rem",
                        borderRadius: 14,
                        border: `1.5px solid ${isSelected ? "#2dd4bf" : "rgba(255,255,255,0.08)"}`,
                        background: isSelected ? "rgba(13,148,136,0.12)" : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.5rem" }}>
                        {style.colors.map((c, i) => (
                          <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: "1px solid rgba(255,255,255,0.2)" }} />
                        ))}
                      </div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: isSelected ? "#2dd4bf" : "#f8fafc" }}>
                        {style.name}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 2 }}>
                        {style.vibe}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Auto-Bio Generator */}
            <div className="portal-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label className="portal-label" style={{ marginBottom: 0 }}>Company Overview</label>
                <button
                  type="button"
                  onClick={handleAiCraftProfile}
                  disabled={isAiGenerating}
                  style={{
                    background: "rgba(13,148,136,0.15)",
                    border: "1px solid rgba(13,148,136,0.3)",
                    color: "#2dd4bf",
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <Sparkles size={11} className={isAiGenerating ? "animate-spin" : ""} />
                  {isAiGenerating ? "Writing..." : "✨ AI Auto-Draft Bio"}
                </button>
              </div>
              <textarea
                className="portal-input portal-textarea"
                rows={3}
                value={aboutUs}
                onChange={e => setAboutUs(e.target.value)}
                placeholder="Click 'AI Auto-Draft Bio' or write a short 2-sentence note about what you do..."
              />
            </div>

            {/* Expandable Optional Legal Details */}
            <div>
              <button
                type="button"
                onClick={() => setShowCompanyDetails(!showCompanyDetails)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#38bdf8",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: 0,
                }}
              >
                {showCompanyDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showCompanyDetails ? "Hide extra details" : "+ Add CIPC registration or physical address (Optional)"}
              </button>

              {showCompanyDetails && (
                <div style={{ marginTop: "0.75rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <input
                    className="portal-input"
                    value={regNumber}
                    onChange={e => setRegNumber(e.target.value)}
                    placeholder="CIPC Reg No (e.g. 2024/123456/07)"
                  />
                  <input
                    className="portal-input"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Physical address / Suburb"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STEP 2: SERVICES & SCALE SLIDER (Zero Textwalls)
            ══════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Visual Trade Matrix */}
            <div>
              <label className="portal-label" style={{ marginBottom: "0.5rem" }}>
                Tap the services you provide:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.5rem" }}>
                {TRADE_SERVICES.map(t => {
                  const isSelected = selectedServices.includes(t.label);
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedServices(
                          isSelected
                            ? selectedServices.filter(s => s !== t.label)
                            : [...selectedServices, t.label]
                        );
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.7rem 0.875rem",
                        borderRadius: 12,
                        border: `1.5px solid ${isSelected ? "#2dd4bf" : "rgba(255,255,255,0.08)"}`,
                        background: isSelected ? "rgba(13,148,136,0.15)" : "rgba(255,255,255,0.02)",
                        color: isSelected ? "#f8fafc" : "#94a3b8",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: "1.1rem" }}>{t.icon}</span>
                      <span style={{ flex: 1 }}>{t.label}</span>
                      {isSelected && <Check size={14} color="#2dd4bf" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Service Adder */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="portal-input"
                value={customService}
                onChange={e => setCustomService(e.target.value)}
                placeholder="Other trade? Type here and press Enter"
                onKeyDown={e => {
                  if (e.key === "Enter" && customService.trim()) {
                    e.preventDefault();
                    setSelectedServices([...selectedServices, customService.trim()]);
                    setCustomService("");
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customService.trim()) {
                    setSelectedServices([...selectedServices, customService.trim()]);
                    setCustomService("");
                  }
                }}
                className="portal-btn portal-btn--ghost portal-btn--sm"
              >
                <Plus size={13} /> Add
              </button>
            </div>

            {/* Interactive Team Scale Slider */}
            <div style={{
              padding: "1.25rem",
              borderRadius: 16,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f8fafc" }}>
                    What is your business scale?
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                    Helps us tailor your website authority and RFQ capacity
                  </div>
                </div>
                <span style={{
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "rgba(45,212,191,0.15)",
                  color: "#2dd4bf",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                }}>
                  {teamScale === 1 ? "Solo Specialist (1-2)" : teamScale === 2 ? "Growing Team (3-10)" : "Commercial Contractor (15+)"}
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={teamScale}
                onChange={e => setTeamScale(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "#2dd4bf", cursor: "pointer" }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#64748b", marginTop: "0.35rem" }}>
                <span>Solo / Hands-on</span>
                <span>Established Team</span>
                <span>Commercial Scale</span>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STEP 3: CLIENTS & LAUNCH TIMELINE SLIDER
            ══════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Visual Client Types */}
            <div>
              <label className="portal-label" style={{ marginBottom: "0.5rem" }}>
                Who are your primary clients?
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.6rem" }}>
                {CLIENT_TYPES.map(c => {
                  const isSelected = selectedClients.includes(c.label);
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedClients(
                          isSelected
                            ? selectedClients.filter(item => item !== c.label)
                            : [...selectedClients, c.label]
                        );
                      }}
                      style={{
                        padding: "0.875rem",
                        borderRadius: 14,
                        border: `1.5px solid ${isSelected ? "#2dd4bf" : "rgba(255,255,255,0.08)"}`,
                        background: isSelected ? "rgba(13,148,136,0.12)" : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "1.2rem" }}>{c.icon}</span>
                        {isSelected && <Check size={14} color="#2dd4bf" />}
                      </div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: isSelected ? "#2dd4bf" : "#f8fafc", marginTop: "0.35rem" }}>
                        {c.label}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                        {c.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operating Areas Pills */}
            <div>
              <label className="portal-label" style={{ marginBottom: "0.4rem" }}>
                Where do you operate?
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
                {["Gauteng", "Sandton", "Pretoria", "Centurion", "Johannesburg North", "East Rand", "West Rand", "Nationwide"].map(a => {
                  const isSelected = selectedRegions.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setSelectedRegions(
                          isSelected ? selectedRegions.filter(r => r !== a) : [...selectedRegions, a]
                        );
                      }}
                      style={{
                        padding: "0.35rem 0.75rem",
                        borderRadius: 999,
                        border: `1px solid ${isSelected ? "#2dd4bf" : "rgba(255,255,255,0.08)"}`,
                        background: isSelected ? "rgba(13,148,136,0.2)" : "rgba(255,255,255,0.02)",
                        color: isSelected ? "#2dd4bf" : "#94a3b8",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      📍 {a} {isSelected && "✓"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Launch Urgency Slider */}
            <div style={{
              padding: "1.25rem",
              borderRadius: 16,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f8fafc" }}>
                    How soon do you need to be live?
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                    Standard delivery is 1 to 2 weeks
                  </div>
                </div>
                <span style={{
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: urgencyIndex === 1 ? "rgba(245,158,11,0.15)" : "rgba(45,212,191,0.15)",
                  color: urgencyIndex === 1 ? "#fbbf24" : "#2dd4bf",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                }}>
                  {urgencyIndex === 1 ? "⚡ Rapid (< 7 Days)" : urgencyIndex === 2 ? "Standard (2 Weeks)" : "Flexible (1 Month)"}
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={urgencyIndex}
                onChange={e => setUrgencyIndex(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: urgencyIndex === 1 ? "#fbbf24" : "#2dd4bf", cursor: "pointer" }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#64748b", marginTop: "0.35rem" }}>
                <span>Urgent</span>
                <span>Standard</span>
                <span>No Rush</span>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STEP 4: CHOOSE PLAN (Visual Cards)
            ══════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 0.25rem" }}>
                Select Your Care Tier
              </h2>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
                Includes SSD hosting, business domain, SSL security, and DebiCheck debit order.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
              {PACKAGES.map(pkg => {
                const isSelected = selectedPackage.toLowerCase() === pkg.name.toLowerCase();
                return (
                  <div
                    key={pkg.name}
                    onClick={() => setSelectedPackage(pkg.name)}
                    style={{
                      padding: "1.25rem",
                      borderRadius: 16,
                      border: `2px solid ${isSelected ? "#2dd4bf" : "rgba(255,255,255,0.08)"}`,
                      background: isSelected ? "rgba(13,148,136,0.15)" : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      position: "relative",
                      transition: "all 0.2s",
                      boxShadow: isSelected ? "0 0 25px rgba(45,212,191,0.2)" : "none",
                    }}
                  >
                    {pkg.featured && (
                      <span style={{ position: "absolute", top: -10, right: 14, padding: "2px 10px", borderRadius: 999, background: "#0d9488", color: "#ffffff", fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>
                        Most Popular
                      </span>
                    )}

                    <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#f8fafc" }}>{pkg.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "2px 0 8px" }}>{pkg.tagline}</div>

                    <div style={{ fontSize: "1.6rem", fontWeight: 900, color: isSelected ? "#2dd4bf" : "#f8fafc", fontFamily: "monospace", margin: "0.5rem 0" }}>
                      R{pkg.fee}
                      <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#94a3b8" }}> / month</span>
                    </div>

                    <div style={{ fontSize: "0.72rem", color: "#cbd5e1", lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem", marginBottom: "1rem" }}>
                      {pkg.features.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", marginBottom: "0.3rem" }}>
                          <Check size={12} color="#2dd4bf" style={{ marginTop: 2, flexShrink: 0 }} />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={`portal-btn ${isSelected ? "portal-btn--primary" : "portal-btn--ghost"} portal-btn--sm`}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      {isSelected ? "✓ Selected" : "Select Plan"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STEP 5: SPEC SHEET, INTERACTIVE MOCKUP & REVIEW CHATBOT
            ══════════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Celebratory Animated Header Banner */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(13,148,136,0.18) 0%, rgba(16,185,129,0.12) 50%, rgba(15,23,42,0.8) 100%)",
              border: "1.5px solid rgba(45,212,191,0.4)",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "3px 10px", borderRadius: 999, background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399", fontSize: "0.72rem", fontWeight: 800, marginBottom: "0.35rem" }}>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>🎉 100% READY TO LAUNCH</span>
                  </div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#f8fafc", margin: "0 0 0.25rem", letterSpacing: "-0.01em" }}>
                    Review Your Digital Scope &amp; Website Preview
                  </h2>
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
                    Here is the complete blueprint of your pages, features, and branding for <strong style={{ color: "#2dd4bf" }}>{businessName || "your business"}</strong>.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={generateAiBrief}
                    disabled={isAiGenerating}
                    className="portal-btn portal-btn--ghost portal-btn--sm"
                    style={{ fontSize: "0.72rem", borderColor: "rgba(45,212,191,0.3)", color: "#2dd4bf" }}
                  >
                    <Sparkles size={12} className={isAiGenerating ? "animate-spin" : ""} />
                    {isAiGenerating ? "Synthesizing..." : "✨ AI Re-Synthesize"}
                  </button>
                </div>
              </div>

              {/* AI Executive Scope Statement */}
              <div style={{
                marginTop: "0.875rem",
                padding: "0.75rem 1rem",
                borderRadius: 10,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontSize: "0.82rem",
                color: "#e2e8f0",
                lineHeight: 1.6,
              }}>
                <strong style={{ color: "#2dd4bf" }}>Executive Brief: </strong>
                {aiExecutiveSummary || `Tailored digital contractor platform for ${businessName || "your business"}. Showcases ${selectedServices.length} trade divisions across ${selectedRegions.join(", ")} with instant quote funnels and Google search presence.`}
              </div>
            </div>

            {/* ── Interactive View Tabs: Preview vs Scope vs Dossier ── */}
            <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem", overflowX: "auto" }}>
              {[
                { id: "preview", label: "🌐 Live Website Mockup", icon: <Eye size={13} /> },
                { id: "scope", label: "📑 Full Scope & Pages (" + plannedPagesList.length + ")", icon: <Layout size={13} /> },
                { id: "plan", label: "💼 Company Dossier & Plan", icon: <FileText size={13} /> },
              ].map(tab => {
                const isActive = activeReviewTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveReviewTab(tab.id as any)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.5rem 1rem",
                      borderRadius: 10,
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      border: `1.5px solid ${isActive ? "#2dd4bf" : "rgba(255,255,255,0.06)"}`,
                      background: isActive ? "rgba(13,148,136,0.2)" : "rgba(255,255,255,0.02)",
                      color: isActive ? "#2dd4bf" : "#94a3b8",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ── TAB 1: LIVE INTERACTIVE WEBSITE MOCKUP PREVIEW ── */}
            {activeReviewTab === "preview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {/* Device Selector */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Sparkle size={13} color="#2dd4bf" />
                    <span>Interactive Preview of your staging site built on <strong>{themeName}</strong> theme:</span>
                  </div>

                  <div style={{ display: "flex", gap: "0.25rem", background: "rgba(255,255,255,0.04)", padding: "2px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <button
                      type="button"
                      onClick={() => setMockupDevice("desktop")}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.3rem", padding: "3px 8px", borderRadius: 6,
                        background: mockupDevice === "desktop" ? "rgba(45,212,191,0.2)" : "transparent",
                        color: mockupDevice === "desktop" ? "#2dd4bf" : "#64748b",
                        fontSize: "0.7rem", fontWeight: 700, border: "none", cursor: "pointer"
                      }}
                    >
                      <Laptop size={12} /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setMockupDevice("mobile")}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.3rem", padding: "3px 8px", borderRadius: 6,
                        background: mockupDevice === "mobile" ? "rgba(45,212,191,0.2)" : "transparent",
                        color: mockupDevice === "mobile" ? "#2dd4bf" : "#64748b",
                        fontSize: "0.7rem", fontWeight: 700, border: "none", cursor: "pointer"
                      }}
                    >
                      <Smartphone size={12} /> Mobile
                    </button>
                  </div>
                </div>

                {/* Mockup Frame Container */}
                <div style={{
                  maxWidth: mockupDevice === "mobile" ? "380px" : "100%",
                  margin: "0 auto",
                  width: "100%",
                  borderRadius: 16,
                  border: "2px solid rgba(45,212,191,0.3)",
                  boxShadow: "0 20px 40px -10px rgba(0,0,0,0.8), 0 0 25px rgba(13,148,136,0.15)",
                  overflow: "hidden",
                  background: "#090d16",
                  transition: "all 0.3s ease",
                }}>
                  {/* Browser Bar */}
                  <div style={{ padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f43f5e" }} />
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24" }} />
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }} />
                    </div>
                    <div style={{ flex: 1, padding: "2px 10px", borderRadius: 999, background: "rgba(0,0,0,0.4)", fontSize: "10px", color: "#64748b", textAlign: "center", fontFamily: "monospace" }}>
                      🔒 https://www.{(businessName || "yourcompany").toLowerCase().replace(/[^a-z0-9]/g, "")}.co.za
                    </div>
                  </div>

                  {/* Mockup Header Navigation */}
                  <div style={{ padding: "0.75rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: primaryThemeColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: "12px" }}>
                        {(businessName || "A")[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#f8fafc" }}>
                        {businessName || "Apex Contractor"}
                      </span>
                    </div>

                    {mockupDevice === "desktop" && (
                      <div style={{ display: "flex", gap: "0.875rem", fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>
                        <span style={{ color: "#2dd4bf" }}>Home</span>
                        <span>Services</span>
                        <span>Gallery</span>
                        <span>About</span>
                        <span>Contact</span>
                      </div>
                    )}

                    <span style={{ padding: "3px 8px", borderRadius: 6, background: primaryThemeColor, color: "#ffffff", fontSize: "10px", fontWeight: 800 }}>
                      RFQ Quote
                    </span>
                  </div>

                  {/* Mockup Hero Section */}
                  <div style={{
                    padding: mockupDevice === "mobile" ? "1.5rem 1rem" : "2.25rem 1.5rem",
                    textAlign: "center",
                    background: `radial-gradient(ellipse at top, ${primaryThemeColor}22 0%, transparent 70%)`,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.06)", fontSize: "10px", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                      📍 Serving {selectedRegions.slice(0, 2).join(" & ")} &bull; Free Site Quotes
                    </div>
                    <h3 style={{ fontSize: mockupDevice === "mobile" ? "1.1rem" : "1.4rem", fontWeight: 900, color: "#f8fafc", margin: "0 0 0.5rem", lineHeight: 1.2 }}>
                      {businessName || "Your Contracting Firm"}
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", maxWidth: "420px", margin: "0 auto 1rem", lineHeight: 1.5 }}>
                      {aboutUs || "Reliable, precision-driven contracting and property maintenance delivered on-time across residential estates and commercial buildings."}
                    </p>

                    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ padding: "6px 14px", borderRadius: 8, background: primaryThemeColor, color: "#ffffff", fontSize: "11px", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        💬 WhatsApp Us Now
                      </span>
                      <span style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.08)", color: "#f8fafc", fontSize: "11px", fontWeight: 700 }}>
                        📋 Request Quote
                      </span>
                    </div>
                  </div>

                  {/* Mockup Service Badges */}
                  <div style={{ padding: "1rem 1.25rem", background: "rgba(0,0,0,0.2)" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", marginBottom: "0.5rem", letterSpacing: "0.5px" }}>
                      Specialized Trade Divisions
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: mockupDevice === "mobile" ? "1fr 1fr" : "repeat(3, 1fr)", gap: "0.5rem" }}>
                      {selectedServices.slice(0, 6).map((service, idx) => (
                        <div key={idx} style={{ padding: "0.5rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.72rem", color: "#e2e8f0", fontWeight: 600 }}>
                          &bull; {service}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trust Footer */}
                  <div style={{ padding: "0.75rem 1.25rem", background: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "#64748b" }}>
                    <span>Verified CIPC Compliant</span>
                    <span>12-Month Workmanship Guarantee</span>
                    <span>DebiCheck Secured</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: FULL SCOPE & PLANNED PAGES ARCHITECTURE ── */}
            {activeReviewTab === "scope" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f8fafc", marginBottom: "0.25rem" }}>
                    Included Website Pages ({plannedPagesList.length} Dedicated Sections)
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    Here is what our development engine is scaffolding for your build:
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
                  {plannedPagesList.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "0.875rem",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(45,212,191,0.15)", color: "#2dd4bf", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>
                          {i + 1}
                        </div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f8fafc" }}>
                          {p.title}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.73rem", color: "#94a3b8", lineHeight: 1.5 }}>
                        {p.purpose}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Digital Superpowers / Included Features */}
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f8fafc", marginBottom: "0.5rem" }}>
                    Standard Features &amp; Integrations Included
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem" }}>
                    {[
                      { icon: "💬", title: "WhatsApp Direct Chat", desc: "Instant click-to-chat button connected to your phone" },
                      { icon: "📋", title: "Line-Item RFQ Quote Engine", desc: "Multi-step quotation form for property owners" },
                      { icon: "🖼️", title: "Workmanship Photo Gallery", desc: "Before & after project showcase with high-res zoom" },
                      { icon: "📍", title: "Google Local Search SEO", desc: "Indexed for local suburb searches (Sandton, Pretoria, etc.)" },
                      { icon: "📧", title: "Custom Business Mailbox", desc: `info@${(businessName || "yourcompany").toLowerCase().replace(/[^a-z0-9]/g, "")}.co.za` },
                      { icon: "🛡️", title: "SSL Security & Cloud Backups", desc: "Bank-grade encryption and daily automated site backups" },
                    ].map((f, idx) => (
                      <div key={idx} style={{ padding: "0.75rem", borderRadius: 10, background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>{f.icon}</span>
                        <div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#f8fafc" }}>{f.title}</div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 2 }}>{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: COMPANY DOSSIER & LEGAL SPEC SHEET ── */}
            {activeReviewTab === "plan" && (
              <div style={{
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.25)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
                fontSize: "0.8rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>
                  <div>
                    <div style={{ fontWeight: 900, color: "#f8fafc", fontSize: "0.95rem" }}>{businessName || "Your Company"}</div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{directorName} &bull; {phone} &bull; {email}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: "#2dd4bf", fontWeight: 800 }}>{selectedPackage} Tier</span>
                    <div style={{ fontSize: "0.72rem", color: "#38bdf8", fontWeight: 700 }}>
                      R{PACKAGES.find(p => p.name.toLowerCase() === selectedPackage.toLowerCase())?.fee || 349}/month
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <span style={{ color: "#64748b", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 800 }}>CIPC Registration: </span>
                    <span style={{ color: "#cbd5e1" }}>{regNumber || "CIPC Pending"}</span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 800 }}>Registered Address: </span>
                    <span style={{ color: "#cbd5e1" }}>{address || "Gauteng, South Africa"}</span>
                  </div>
                </div>

                <div>
                  <span style={{ color: "#64748b", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 800 }}>Services ({selectedServices.length}): </span>
                  <span style={{ color: "#cbd5e1" }}>{selectedServices.join(", ")}</span>
                </div>

                <div>
                  <span style={{ color: "#64748b", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 800 }}>Operating Regions: </span>
                  <span style={{ color: "#cbd5e1" }}>{selectedRegions.join(", ")}</span>
                </div>

                <div>
                  <span style={{ color: "#64748b", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 800 }}>Target Clients: </span>
                  <span style={{ color: "#cbd5e1" }}>{selectedClients.join(", ")}</span>
                </div>

                <div>
                  <span style={{ color: "#64748b", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 800 }}>Billing Mode: </span>
                  <span style={{ color: "#34d399", fontWeight: 700 }}>DebiCheck Debit Order &bull; Month-to-month &bull; Cancel anytime</span>
                </div>
              </div>
            )}

            {/* ── Document Upload Dropzone ── */}
            <div>
              <label className="portal-label">Upload Company Logo, Brochure, or CIPC Certificate (Optional)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed rgba(45,212,191,0.25)",
                  borderRadius: 12,
                  padding: "0.875rem",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "rgba(45,212,191,0.02)",
                  transition: "all 0.2s",
                }}
              >
                <UploadCloud size={20} color="#2dd4bf" style={{ margin: "0 auto 0.25rem", display: "block" }} />
                <div style={{ fontSize: "0.78rem", color: "#f8fafc", fontWeight: 700 }}>
                  Click to select files from your device
                </div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>PNG, JPG, or PDF (up to 15MB each)</div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,application/pdf"
                style={{ display: "none" }}
              />

              {uploadedAssets.length > 0 && (
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                  {uploadedAssets.map(a => (
                    <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.5rem", borderRadius: 6, background: "rgba(13,148,136,0.15)", fontSize: "0.7rem", color: "#2dd4bf" }}>
                      <File size={10} /> {a.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Creative Live Scope Assistant Chatbot ── */}
            <div style={{
              borderRadius: 14,
              border: "1.5px solid rgba(45,212,191,0.25)",
              background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(15,23,42,0.4) 100%)",
              padding: "1rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                <Bot size={16} color="#2dd4bf" />
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#f8fafc" }}>
                  Need a quick tweak? Ask your Live Scope Assistant
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "110px", overflowY: "auto", marginBottom: "0.5rem", padding: "0.5rem", borderRadius: 8, background: "rgba(0,0,0,0.3)" }}>
                {reviewChat.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "0.73rem",
                      color: m.sender === "ai" ? "#2dd4bf" : "#f8fafc",
                      padding: "0.35rem 0.6rem",
                      borderRadius: 6,
                      background: m.sender === "ai" ? "rgba(13,148,136,0.15)" : "rgba(255,255,255,0.06)",
                      alignSelf: m.sender === "ai" ? "flex-start" : "flex-end",
                      maxWidth: "90%",
                      lineHeight: 1.4,
                    }}
                  >
                    {m.message}
                  </div>
                ))}
              </div>

              {/* Quick Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.4rem" }}>
                {["+ Add Roofing", "+ Add Electrical", "Switch to Build (R349)", "Switch to Spark (R199)"].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleBotSubmit(q)}
                    style={{
                      fontSize: "0.68rem",
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#94a3b8",
                      cursor: "pointer",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.4rem" }}>
                <input
                  className="portal-input"
                  style={{ fontSize: "0.75rem", padding: "0.45rem 0.75rem" }}
                  value={reviewInput}
                  onChange={e => setReviewInput(e.target.value)}
                  placeholder="Tell the assistant: e.g. Add waterproofing, change to Build tier..."
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleBotSubmit();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleBotSubmit()}
                  disabled={!reviewInput.trim() || isBotReplying}
                  className="portal-btn portal-btn--primary portal-btn--sm"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>

            {/* Scope Verification Checkbox */}
            <div style={{
              padding: "0.875rem",
              borderRadius: 12,
              background: scopeVerified ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
              border: `1.5px solid ${scopeVerified ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.3)"}`,
            }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={scopeVerified}
                  onChange={e => setScopeVerified(e.target.checked)}
                  style={{ marginTop: 2, accentColor: "#10b981", width: 16, height: 16 }}
                />
                <div style={{ fontSize: "0.8rem", color: "#f8fafc", lineHeight: 1.4 }}>
                  <strong>Client Sign-off &amp; Authorization:</strong> I have reviewed this scope and authorize E&amp;L Digital to configure and launch our website.
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ── Action Nav ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {step > 1 ? (
            <button
              className="portal-btn portal-btn--ghost"
              onClick={() => setStep(s => (s - 1) as StepNumber)}
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : <div />}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="portal-btn portal-btn--ghost portal-btn--sm"
              onClick={() => handleSaveAndSync()}
              disabled={busy}
            >
              {saved ? <><CheckCircle2 size={13} color="#34d399" /> Saved</> : "Save"}
            </button>

            {step < 5 ? (
              <button
                className="portal-btn portal-btn--primary"
                onClick={async () => {
                  const next = (step + 1) as StepNumber;
                  await handleSaveAndSync(next);
                  setStep(next);
                }}
              >
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                className="portal-btn portal-btn--amber"
                disabled={busy || !businessName.trim() || !scopeVerified}
                onClick={handleFinalSubmit}
                style={{ fontWeight: 800, padding: "0.65rem 1.75rem" }}
              >
                {busy ? (
                  <><RefreshCw size={14} className="animate-spin" /> Submitting…</>
                ) : (
                  <><Zap size={14} /> Launch My Site <ArrowRight size={14} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
