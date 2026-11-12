/**
 * Client Project Onboarding — Clean, Friendly & Non-Intimidating Business Setup
 * Designed specifically for non-tech-savvy business owners & contractors (e.g. Painting, Tiling, Maintenance).
 * Progressive disclosure, friendly one-tap chip selectors, smart AI profile generator,
 * an attractive executive order spec sheet, and a live review assistant chatbot.
 * All data seamlessly syncs to Supabase partner.onboardings for CoreTech & E&L Admins.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Zap, ArrowRight, ArrowLeft, CheckCircle2, Building2,
  Globe, Target, FileText, UploadCloud, Sparkles, RefreshCw,
  Check, X, File, Image as ImageIcon, Shield, ExternalLink,
  Layers, Layout, Plus, Trash2, Award, ChevronDown, ChevronUp,
  Phone, Mail, MapPin, Send, MessageSquare, Bot
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { partnerSchema, BRAND_ID } from "@/lib/supabase";
import {
  enhanceFormFieldWithAI,
  synthesizeScopeWithGemini,
  suggestPlatformPagesWithGemini,
  askGeminiArchitect,
  type ChatMessage
} from "@/lib/gemini";

export const Route = createFileRoute("/portal/onboarding")({
  validateSearch: (s: Record<string, unknown>): { plan?: string } => ({
    plan: typeof s["plan"] === "string" ? s["plan"] : undefined,
  }),
  component: PortalOnboarding,
});

type ManualStep = 1 | 2 | 3 | 4 | 5 | 6;

interface UploadedAsset {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

interface SitePage {
  id: string;
  title: string;
  purpose: string;
  sections?: string[];
}

const AVAILABLE_PACKAGES = [
  {
    name: "Spark",
    fee: 199,
    tagline: "Simple & Fast Online Launch",
    pages: "1 Clean Landing Page",
    care: "Hosting, Security & WhatsApp Button",
    badge: "Budget Friendly",
    idealFor: "Best for simple side-gigs or single trades",
    benefits: [
      "Fast 1-Page website with your contact info",
      "Direct WhatsApp chat button for new leads",
      "Fast .co.za domain & secure SSL certificate",
      "No technical knowledge required",
    ],
  },
  {
    name: "Build",
    fee: 349,
    tagline: "Professional Contractor Package",
    pages: "Up to 5 Pages (Home, Services, Gallery, Quotes)",
    care: "Domain, 1 Business Mailbox & Updates",
    featured: true,
    badge: "⭐ Recommended for Contractors",
    idealFor: "Best for multi-trade companies wanting commercial quotes",
    benefits: [
      "Up to 5 tailored pages for your business",
      "Instant Quote Request Form (RFQ) for clients",
      "Before & After photo gallery for your projects",
      "Professional business email (e.g. info@yourbusiness.co.za)",
      "Google Business Profile setup so locals find you",
    ],
  },
  {
    name: "Business",
    fee: 1200,
    tagline: "Complete Company Suite",
    pages: "Up to 10 Pages",
    care: "120 min monthly developer updates & CMS",
    badge: "Best for Established Teams",
    idealFor: "Companies with multiple teams, tenders & commercial contracts",
    benefits: [
      "Up to 10 pages for separate trade divisions",
      "Dedicated sub-pages for corporate tenders",
      "Priority same-day update support",
      "Client testimonial and case study manager",
    ],
  },
];

const POPULAR_SERVICES = [
  { name: "Painting & Decorating", icon: "🎨" },
  { name: "Waterproofing & Sealing", icon: "💧" },
  { name: "Tiling & Paving", icon: "🧱" },
  { name: "Plumbing Repairs", icon: "🔧" },
  { name: "Crack & Wall Repairs", icon: "🔨" },
  { name: "Estate Maintenance", icon: "🏡" },
  { name: "Turnkey Renovations", icon: "🏗️" },
  { name: "Roofing & Gutters", icon: "🏠" },
  { name: "Electrical & Solar", icon: "⚡" },
  { name: "Carpentry & Ceilings", icon: "🪚" },
];

const POPULAR_AREAS = [
  "Gauteng",
  "Pretoria",
  "Centurion",
  "Sandton",
  "Bryanston",
  "Johannesburg North",
  "East Rand",
  "West Rand",
  "Midrand",
  "Cape Town",
  "Durban",
  "Nationwide",
];

const POPULAR_CLIENTS = [
  { label: "Private Homeowners", desc: "Houses, townhouses, private apartments" },
  { label: "Residential Estates & Complexes", desc: "Body Corporates, HOAs, estate managers" },
  { label: "Commercial Buildings & Offices", desc: "Retail spaces, warehouses, corporate offices" },
  { label: "Letting & Property Agencies", desc: "Rental maintenance and inspection repairs" },
];

const STEPS_NAV = [
  { step: 1, label: "Your Business" },
  { step: 2, label: "Services" },
  { step: 3, label: "Clients & Areas" },
  { step: 4, label: "Website Pages" },
  { step: 5, label: "Choose Plan" },
  { step: 6, label: "Review & Launch" },
];

function PortalOnboarding() {
  const navigate = useNavigate();
  const { plan: queryPlan } = Route.useSearch();
  const { user, loading, onboarding, updateOnboarding, client, refreshClient, access, setToast } = usePortalAuth();

  const [manualStep, setManualStep] = useState<ManualStep>(1);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState<string | null>(null);

  // ── Step 1: Business Identity ─────────────────────────────────────
  const [businessName, setBusinessName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [tagline, setTagline] = useState("");
  const [aboutUs, setAboutUs] = useState("");
  const [showOptionalCompanyDetails, setShowOptionalCompanyDetails] = useState(false);

  // ── Step 2: Services Offered ──────────────────────────────────────
  const [coreServices, setCoreServices] = useState<string[]>([
    "Painting & Decorating",
    "Waterproofing & Sealing",
    "Tiling & Paving",
    "Plumbing Repairs",
  ]);
  const [customServiceInput, setCustomServiceInput] = useState("");

  // ── Step 3: Operating Areas & Clients ─────────────────────────────
  const [operatingAreas, setOperatingAreas] = useState<string[]>(["Gauteng", "Sandton", "Pretoria"]);
  const [customAreaInput, setCustomAreaInput] = useState("");
  const [targetMarkets, setTargetMarkets] = useState<string[]>([
    "Private Homeowners",
    "Residential Estates & Complexes",
  ]);

  // ── Step 4: Website Pages & Features ──────────────────────────────
  const [sitePages, setSitePages] = useState<SitePage[]>([
    { id: "p1", title: "Home Page", purpose: "Welcoming header, quick quote button, trust badges" },
    { id: "p2", title: "Services Page", purpose: "Clear breakdown of all trades you offer" },
    { id: "p3", title: "Projects & Photos", purpose: "Before & after photos of your work" },
    { id: "p4", title: "Get a Free Quote", purpose: "Simple quote request form with WhatsApp chat" },
    { id: "p5", title: "About Us", purpose: "Your company story, CIPC registration, and director credentials" },
  ]);
  const [customPageTitle, setCustomPageTitle] = useState("");

  // ── Step 5: Chosen Plan ───────────────────────────────────────────
  const [selectedPackage, setSelectedPackage] = useState(queryPlan || "Build");

  // ── Step 6: Review, Spec Sheet & Review Chatbot ───────────────────
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [scopeVerified, setScopeVerified] = useState(false);
  const [aiExecutiveSummary, setAiExecutiveSummary] = useState<string>("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Friendly Review Chatbot
  const [reviewChat, setReviewChat] = useState<Array<{ sender: "ai" | "user"; message: string }>>([
    {
      sender: "ai",
      message: "👋 Hi! I'm your project assistant. Everything look good on your spec sheet above? If you want to change anything (e.g. 'Add Waterproofing' or 'Change plan to Spark'), just tell me here!",
    },
  ]);
  const [reviewChatMessage, setReviewChatMessage] = useState("");
  const [isReviewChatReplying, setIsReviewChatReplying] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/portal/login" });
  }, [user, loading, navigate]);

  // Auto-fill initial details from auth
  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
    if (client?.name && !directorName) {
      const clean = client.name.replace(/\(.*\)/, "").trim();
      setDirectorName(clean);
      if (!businessName) setBusinessName(clean);
    }
    if (client?.phone && !phone) setPhone(client.phone);
  }, [user, client]);

  // Restore saved onboarding session
  useEffect(() => {
    if (onboarding) {
      if (onboarding.businessName) setBusinessName(onboarding.businessName);
      if (onboarding.contactPerson) setDirectorName(onboarding.contactPerson);
      if (onboarding.phone) setPhone(onboarding.phone);
      if (onboarding.selectedPackageCode) setSelectedPackage(onboarding.selectedPackageCode);
      if (onboarding.currentStep) setManualStep(Math.min(onboarding.currentStep, 6) as ManualStep);
      if (onboarding.businessGoals && !aboutUs) setAboutUs(onboarding.businessGoals);
    }
  }, [onboarding]);

  // Auto-generate AI Executive Brief when reaching step 6
  useEffect(() => {
    if (manualStep === 6 && !aiExecutiveSummary && !isSynthesizing) {
      generateExecutiveSummary();
    }
  }, [manualStep]);

  const generateExecutiveSummary = async () => {
    setIsSynthesizing(true);
    try {
      const summary = await synthesizeScopeWithGemini(
        [
          { role: "user", text: `Generate a 2-3 sentence friendly executive summary for ${businessName || "Client Business"} in ${operatingAreas.join(", ")} offering ${coreServices.join(", ")}. Plan: ${selectedPackage}.` },
        ],
        { businessName: businessName || "Client Business", contactPerson: directorName || "Director" }
      );
      if (summary?.scopeSummary) {
        setAiExecutiveSummary(summary.scopeSummary);
      } else {
        setAiExecutiveSummary(`Official website and digital presence for ${businessName || "your business"}, covering ${coreServices.length} core services across ${operatingAreas.join(", ")}. Includes automated quote requests and South African DebiCheck subscription.`);
      }
    } catch (_) {
      setAiExecutiveSummary(`Official digital presence for ${businessName || "your business"} covering ${coreServices.slice(0, 4).join(", ")} across ${operatingAreas.slice(0, 3).join(", ")}. Includes an automated quote request engine, Google profile visibility, and secure hosting.`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // AI Profile Generator for About Us
  const handleAutoGenerateProfile = async () => {
    if (!businessName) {
      if (setToast) setToast("Please enter your business name first so AI can write your profile.");
      return;
    }
    setIsAiGenerating("profile");
    try {
      const prompt = `Write a short, professional, 2-paragraph South African company profile for a contractor business named "${businessName}". Services offered: ${coreServices.join(", ")}. Operating in: ${operatingAreas.join(", ")}. Make it sound trustworthy, registered, experienced, and customer-focused.`;
      const res = await askGeminiArchitect([], prompt, { businessName, contactPerson: directorName, industry: "Contractor" });
      if (res) {
        setAboutUs(res);
        if (!tagline) setTagline("Quality Workmanship & Reliable Service You Can Trust");
        if (setToast) setToast("✨ AI drafted your company profile!");
      }
    } catch (_) {
      setAboutUs(`${businessName} is a dedicated South African property services company specializing in ${coreServices.slice(0, 3).join(", ")}. We pride ourselves on reliable workmanship, punctual project completion, and transparent quotations across ${operatingAreas.join(", ")}.`);
    } finally {
      setIsAiGenerating(null);
    }
  };

  // Progress computation
  const progressPercent = useMemo(() => {
    return Math.round((manualStep / 6) * 100);
  }, [manualStep]);

  // Asset Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      if (file.size > 15 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Please upload files under 15MB.`);
        return;
      }
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
  const handleSaveAndSync = async (nextStep?: ManualStep) => {
    setBusy(true);
    try {
      const dossierPayload = {
        companyProfile: {
          businessName,
          regNumber,
          directorName,
          phone,
          email,
          registeredAddress,
          tagline,
          aboutUs,
          coreServices,
          operatingAreas,
          targetMarkets,
          workingApproach: [
            "1. Client consultation & requirements intake",
            "2. On-site technical inspection & measurement",
            "3. Clear line-item quotation",
            "4. Preparation, safety & work execution",
            "5. Quality check and client sign-off",
          ],
        },
        plannedPages: sitePages,
        selectedPackage,
        scopeVerified,
        uploadedAssets,
      };

      await updateOnboarding({
        currentStep: nextStep || manualStep,
        businessName,
        contactPerson: directorName,
        phone,
        industry: "Construction & Contracting",
        targetAudience: targetMarkets.join(", "),
        businessGoals: `${tagline ? `[${tagline}] ` : ""}${aboutUs}`,
        selectedPackageCode: selectedPackage,
        mode: "manual",
        chatHistory: { dossier: dossierPayload } as any,
      });

      // Direct write to partner.onboardings
      if (onboarding?.id) {
        try {
          await partnerSchema()
            .from("onboardings")
            .update({
              business_name: businessName,
              client_name: directorName,
              client_phone: phone,
              selected_package_code: selectedPackage,
              business_goals: `${tagline ? `[${tagline}] ` : ""}${aboutUs}\n\n[SERVICES]: ${coreServices.join(", ")}`,
              target_audience: targetMarkets.join(", "),
              current_step: nextStep || manualStep,
              chat_history: { dossier: dossierPayload },
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
      if (setToast) setToast("Please check the verification box confirming your scope before submitting.");
      return;
    }
    setBusy(true);
    try {
      const summaryText = `Executive Order Spec Sheet for ${businessName}.
Services: ${coreServices.join(", ")}.
Areas: ${operatingAreas.join(", ")}.
Pages: ${sitePages.map(p => p.title).join(", ")}.
Plan: ${selectedPackage}. Verified by: ${directorName || email}.`;

      const dossierPayload = {
        companyProfile: {
          businessName,
          regNumber,
          directorName,
          phone,
          email,
          registeredAddress,
          tagline,
          aboutUs,
          coreServices,
          operatingAreas,
          targetMarkets,
        },
        plannedPages: sitePages,
        selectedPackage,
        scopeVerified: true,
        submittedAt: new Date().toISOString(),
        uploadedAssets,
      };

      await updateOnboarding({
        isCompleted: true,
        status: "completed",
        currentStep: 6,
        businessName,
        contactPerson: directorName,
        phone,
        industry: "Contractor & SME",
        targetAudience: targetMarkets.join(", "),
        businessGoals: `${tagline ? `[${tagline}] ` : ""}${aboutUs}`,
        selectedPackageCode: selectedPackage,
        mode: "manual",
        aiRecommendation: summaryText,
        chatHistory: { dossier: dossierPayload } as any,
      });

      // Update client row to pending_approval so admin can convert
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
      if (setToast) setToast("🎉 Your onboarding spec sheet has been submitted!");
    } finally {
      setBusy(false);
    }
  };

  // Review Chatbot: Quick Modification Handler
  const handleSendReviewAdjustment = (textToSend?: string) => {
    const text = (textToSend || reviewChatMessage).trim();
    if (!text || isReviewChatReplying) return;

    setReviewChat(prev => [...prev, { sender: "user", message: text }]);
    setReviewChatMessage("");
    setIsReviewChatReplying(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = "";

      // Service detection
      if (lower.includes("paint") || lower.includes("waterproof") || lower.includes("tile") || lower.includes("plumb") || lower.includes("solar") || lower.includes("roof") || lower.includes("electr") || lower.includes("paving")) {
        const found = POPULAR_SERVICES.find(s => lower.includes(s.name.toLowerCase().split(" ")[0]));
        const toAdd = found ? found.name : text.replace(/add|service|please/gi, "").trim();
        if (toAdd && !coreServices.includes(toAdd)) {
          setCoreServices(prev => [...prev, toAdd]);
          reply = `Done! I added "${toAdd}" to your services list. Your spec sheet has been updated.`;
        } else {
          reply = `I see "${toAdd}" is already in your services list!`;
        }
      }
      // Plan detection
      else if (lower.includes("spark") || lower.includes("build") || lower.includes("business")) {
        const found = AVAILABLE_PACKAGES.find(p => lower.includes(p.name.toLowerCase()));
        if (found) {
          setSelectedPackage(found.name);
          reply = `Switched your plan to ${found.name} (R${found.fee}/month).`;
        }
      }
      // Page detection
      else if (lower.includes("page") && (lower.includes("add") || lower.includes("create"))) {
        const pageName = text.replace(/add|create|page|please/gi, "").trim() || "FAQs";
        const clean = pageName.charAt(0).toUpperCase() + pageName.slice(1);
        setSitePages(prev => [...prev, { id: "p_" + Date.now(), title: clean, purpose: "Dedicated info for clients" }]);
        reply = `Added "${clean}" to your planned website pages!`;
      } else {
        reply = "I've noted that! You can also click 'Back' to adjust any details directly, or tell me if you'd like to change your plan or services.";
      }

      setReviewChat(prev => [...prev, { sender: "ai", message: reply }]);
      setIsReviewChatReplying(false);
      if (setToast) setToast("✅ Spec sheet updated!");
    }, 600);
  };

  // ── Completed State View ─────────────────────────────────────────
  if (onboarding?.isCompleted || onboarding?.mode === "admin_bypassed") {
    const planName = onboarding.selectedPackageCode || selectedPackage || "Build";
    const biz = businessName || onboarding.businessName || "Your Business";
    const hasMandate = !!client?.mandateDocUrl;
    const isAuth = client?.mandateStatus === "authorized";

    return (
      <PortalLayout>
        <div style={{
          background: "linear-gradient(135deg, rgba(13,148,136,0.18) 0%, rgba(15,23,42,0.7) 100%)",
          border: "1px solid rgba(45,212,191,0.25)",
          borderRadius: 16,
          padding: "2.5rem 1.5rem",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "2.75rem", marginBottom: "0.5rem" }}>🎉</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#f8fafc", margin: "0 0 0.5rem" }}>
            Onboarding Spec Sheet Received!
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#94a3b8", margin: "0 0 1rem" }}>
            We have captured everything we need for <strong style={{ color: "#e2e8f0" }}>{biz}</strong>.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 1rem", borderRadius: 999, background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.4)", fontSize: "0.82rem", fontWeight: 800, color: "#2dd4bf" }}>
            <Zap size={13} /> Selected Plan: {planName}
          </div>
        </div>

        <div className="portal-card" style={{ marginBottom: "1.25rem" }}>
          <div className="portal-card-title"><CheckCircle2 size={16} color="#34d399" /> What Happens Next?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem", fontSize: "0.85rem", color: "#cbd5e1" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(52,211,153,0.15)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, shrink: 0 }}>✓</div>
              <div><strong>1. CoreTech &amp; E&amp;L Review:</strong> Our solutions team is reviewing your services, logo, and page blueprint.</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: hasMandate ? "rgba(52,211,153,0.15)" : "rgba(245,158,11,0.15)", color: hasMandate ? "#34d399" : "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, shrink: 0 }}>
                {hasMandate ? "✓" : "2"}
              </div>
              <div>
                <strong>2. Authorize Debit Mandate:</strong> Once approved, sign your standard month-to-month debit order mandate with your SA ID upload.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: isAuth ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)", color: isAuth ? "#34d399" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, shrink: 0 }}>
                {isAuth ? "✓" : "3"}
              </div>
              <div><strong>3. Launch Build:</strong> We design your site, set up your mailbox, and hand over your staging site in 1 to 2 weeks!</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/portal/dashboard" className="portal-btn portal-btn--primary">
            Go to Portal Dashboard <ArrowRight size={14} />
          </Link>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      {/* ── Page Header: Simple, Friendly & Reassuring ── */}
      <div className="portal-page-header" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h1 className="portal-page-title" style={{ marginBottom: "0.25rem" }}>Project Setup &amp; Onboarding</h1>
            <p className="portal-page-sub">
              Step {manualStep} of 6 &bull; {STEPS_NAV[manualStep - 1]?.label}
            </p>
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#2dd4bf", fontFamily: "monospace" }}>
            {progressPercent}% Complete
          </div>
        </div>

        {/* Friendly progress bar */}
        <div className="portal-progress-track" style={{ height: 6, marginTop: "0.5rem" }}>
          <div
            className="portal-progress-fill portal-progress-fill--teal"
            style={{ width: `${progressPercent}%`, transition: "width 0.3s ease" }}
          />
        </div>
      </div>

      {/* ── Friendly Steps Tracker ── */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.25rem" }}>
        {STEPS_NAV.map((s) => {
          const isDone = manualStep > s.step;
          const isCurrent = manualStep === s.step;
          return (
            <div
              key={s.step}
              onClick={() => {
                if (s.step < manualStep) setManualStep(s.step as ManualStep);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.75rem",
                borderRadius: 999,
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: s.step < manualStep ? "pointer" : "default",
                background: isCurrent ? "rgba(13,148,136,0.2)" : isDone ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isCurrent ? "#2dd4bf" : isDone ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.06)"}`,
                color: isCurrent ? "#2dd4bf" : isDone ? "#34d399" : "#64748b",
                whiteSpace: "nowrap",
              }}
            >
              <span>{isDone ? "✓" : s.step}</span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* ── Main Step Content Container ── */}
      <div className="portal-card" style={{ padding: "1.5rem" }}>

        {/* ══════════════════════════════════════════════════════════════
            STEP 1: YOUR BUSINESS (Simple, Essential Info)
            ══════════════════════════════════════════════════════════════ */}
        {manualStep === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 0.25rem" }}>
                Tell us about your business
              </h2>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
                Just the basics so we know what name to put on your new website.
              </p>
            </div>

            <div className="portal-form-row">
              <div className="portal-form-group">
                <label className="portal-label">Business / Company Name *</label>
                <input
                  className="portal-input"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. First Class Fixers"
                  autoFocus
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-label">Your Full Name (Director or Owner) *</label>
                <input
                  className="portal-input"
                  value={directorName}
                  onChange={e => setDirectorName(e.target.value)}
                  placeholder="e.g. Emmanuel Rabotsi"
                />
              </div>
            </div>

            <div className="portal-form-row">
              <div className="portal-form-group">
                <label className="portal-label">Phone or WhatsApp Number *</label>
                <input
                  className="portal-input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 071 234 5678"
                  type="tel"
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-label">Business Email Address</label>
                <input
                  className="portal-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. info@yourbusiness.co.za"
                  type="email"
                />
              </div>
            </div>

            {/* Quick About Us with AI Helper */}
            <div className="portal-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label className="portal-label" style={{ marginBottom: 0 }}>
                  Short Description of What You Do
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerateProfile}
                  disabled={isAiGenerating === "profile"}
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
                  <Sparkles size={12} className={isAiGenerating === "profile" ? "animate-spin" : ""} />
                  {isAiGenerating === "profile" ? "Writing for you..." : "✨ Write this for me"}
                </button>
              </div>
              <textarea
                className="portal-input portal-textarea"
                rows={3}
                value={aboutUs}
                onChange={e => setAboutUs(e.target.value)}
                placeholder="e.g. We are a registered property maintenance team providing quality painting, waterproofing, tiling, and repairs for homes and complexes across Gauteng."
              />
            </div>

            {/* Optional / Advanced Details Dropdown */}
            <div>
              <button
                type="button"
                onClick={() => setShowOptionalCompanyDetails(!showOptionalCompanyDetails)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#38bdf8",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: 0,
                }}
              >
                {showOptionalCompanyDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showOptionalCompanyDetails ? "Hide extra company details" : "+ Add CIPC number or physical address (Optional)"}
              </button>

              {showOptionalCompanyDetails && (
                <div style={{ marginTop: "0.75rem", padding: "1rem", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div className="portal-form-row">
                    <div className="portal-form-group">
                      <label className="portal-label">CIPC Registration Number</label>
                      <input
                        className="portal-input"
                        value={regNumber}
                        onChange={e => setRegNumber(e.target.value)}
                        placeholder="e.g. 2024/123456/07"
                      />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Slogan or Tagline</label>
                      <input
                        className="portal-input"
                        value={tagline}
                        onChange={e => setTagline(e.target.value)}
                        placeholder="e.g. Quality Workmanship You Can Count On"
                      />
                    </div>
                  </div>

                  <div className="portal-form-group">
                    <label className="portal-label">Registered Physical Address</label>
                    <input
                      className="portal-input"
                      value={registeredAddress}
                      onChange={e => setRegisteredAddress(e.target.value)}
                      placeholder="e.g. 34 Sloane Street, Bryanston, Sandton, 2191"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STEP 2: SERVICES OFFERED (Tap-to-Select Chips)
            ══════════════════════════════════════════════════════════════ */}
        {manualStep === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 0.25rem" }}>
                What services do you provide?
              </h2>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
                Tap the services you want displayed on your website. You can also type your own below.
              </p>
            </div>

            {/* Popular Service Chips */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.6rem" }}>
              {POPULAR_SERVICES.map(s => {
                const isSelected = coreServices.includes(s.name);
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setCoreServices(coreServices.filter(item => item !== s.name));
                      } else {
                        setCoreServices([...coreServices, s.name]);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 1rem",
                      borderRadius: 12,
                      border: `1.5px solid ${isSelected ? "#2dd4bf" : "rgba(255,255,255,0.08)"}`,
                      background: isSelected ? "rgba(13,148,136,0.15)" : "rgba(255,255,255,0.02)",
                      color: isSelected ? "#f8fafc" : "#94a3b8",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>{s.icon}</span>
                    <span style={{ flex: 1 }}>{s.name}</span>
                    {isSelected && <Check size={14} color="#2dd4bf" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Services Added */}
            {coreServices.filter(s => !POPULAR_SERVICES.some(p => p.name === s)).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.25rem" }}>
                {coreServices.filter(s => !POPULAR_SERVICES.some(p => p.name === s)).map(custom => (
                  <span
                    key={custom}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.3rem 0.65rem",
                      borderRadius: 999,
                      background: "rgba(45,212,191,0.15)",
                      border: "1px solid rgba(45,212,191,0.3)",
                      color: "#2dd4bf",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {custom}
                    <button
                      type="button"
                      onClick={() => setCoreServices(coreServices.filter(item => item !== custom))}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Custom Service Input */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="portal-input"
                value={customServiceInput}
                onChange={e => setCustomServiceInput(e.target.value)}
                placeholder="Don't see your service? Type it here and click Add"
                onKeyDown={e => {
                  if (e.key === "Enter" && customServiceInput.trim()) {
                    e.preventDefault();
                    setCoreServices([...coreServices, customServiceInput.trim()]);
                    setCustomServiceInput("");
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customServiceInput.trim()) {
                    setCoreServices([...coreServices, customServiceInput.trim()]);
                    setCustomServiceInput("");
                  }
                }}
                className="portal-btn portal-btn--ghost portal-btn--sm"
              >
                <Plus size={13} /> Add
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STEP 3: CLIENTS & OPERATING AREAS
            ══════════════════════════════════════════════════════════════ */}
        {manualStep === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 0.25rem" }}>
                Where do you work, and who are your clients?
              </h2>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
                Select the areas you cover and the types of clients you want to get quotes from.
              </p>
            </div>

            {/* Target Clients Checkbox Cards */}
            <div>
              <label className="portal-label" style={{ marginBottom: "0.5rem" }}>Who do you want to attract?</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.6rem" }}>
                {POPULAR_CLIENTS.map(c => {
                  const isChecked = targetMarkets.includes(c.label);
                  return (
                    <div
                      key={c.label}
                      onClick={() => {
                        if (isChecked) {
                          setTargetMarkets(targetMarkets.filter(t => t !== c.label));
                        } else {
                          setTargetMarkets([...targetMarkets, c.label]);
                        }
                      }}
                      style={{
                        padding: "0.875rem",
                        borderRadius: 12,
                        border: `1.5px solid ${isChecked ? "#2dd4bf" : "rgba(255,255,255,0.08)"}`,
                        background: isChecked ? "rgba(13,148,136,0.12)" : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: isChecked ? "#2dd4bf" : "#f8fafc" }}>
                          {c.label}
                        </div>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4,
                          border: `1.5px solid ${isChecked ? "#2dd4bf" : "#64748b"}`,
                          background: isChecked ? "#2dd4bf" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {isChecked && <Check size={11} color="#0a0f1d" />}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                        {c.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operating Areas Pills */}
            <div style={{ marginTop: "0.5rem" }}>
              <label className="portal-label" style={{ marginBottom: "0.5rem" }}>Operating Suburbs &amp; Regions</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
                {POPULAR_AREAS.map(a => {
                  const isSelected = operatingAreas.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setOperatingAreas(operatingAreas.filter(area => area !== a));
                        } else {
                          setOperatingAreas([...operatingAreas, a]);
                        }
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

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className="portal-input"
                  value={customAreaInput}
                  onChange={e => setCustomAreaInput(e.target.value)}
                  placeholder="Add another area (e.g. Fourways, Roodepoort)"
                  onKeyDown={e => {
                    if (e.key === "Enter" && customAreaInput.trim()) {
                      e.preventDefault();
                      setOperatingAreas([...operatingAreas, customAreaInput.trim()]);
                      setCustomAreaInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAreaInput.trim()) {
                      setOperatingAreas([...operatingAreas, customAreaInput.trim()]);
                      setCustomAreaInput("");
                    }
                  }}
                  className="portal-btn portal-btn--ghost portal-btn--sm"
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STEP 4: WEBSITE PAGES (Pre-built, Non-Intimidating)
            ══════════════════════════════════════════════════════════════ */}
        {manualStep === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 0.25rem" }}>
                What pages do you want on your website?
              </h2>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
                We have pre-selected the 5 essential pages that work best for contractor websites. You can remove or add more.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {sitePages.map((page, idx) => (
                <div
                  key={page.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(45,212,191,0.15)", color: "#2dd4bf", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f8fafc" }}>{page.title}</div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{page.purpose}</div>
                    </div>
                  </div>

                  {sitePages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSitePages(sitePages.filter(p => p.id !== page.id))}
                      style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
                      title="Remove page"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="portal-input"
                value={customPageTitle}
                onChange={e => setCustomPageTitle(e.target.value)}
                placeholder="Want another page? (e.g. Testimonials, Pricing, FAQ)"
                onKeyDown={e => {
                  if (e.key === "Enter" && customPageTitle.trim()) {
                    e.preventDefault();
                    setSitePages([...sitePages, { id: "p_" + Date.now(), title: customPageTitle.trim(), purpose: "Helpful details for your visitors" }]);
                    setCustomPageTitle("");
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customPageTitle.trim()) {
                    setSitePages([...sitePages, { id: "p_" + Date.now(), title: customPageTitle.trim(), purpose: "Helpful details for your visitors" }]);
                    setCustomPageTitle("");
                  }
                }}
                className="portal-btn portal-btn--ghost portal-btn--sm"
              >
                <Plus size={13} /> Add Page
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STEP 5: CHOOSE YOUR PLAN (Clean, Attractive Cards)
            ══════════════════════════════════════════════════════════════ */}
        {manualStep === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 0.25rem" }}>
                Choose your monthly plan
              </h2>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
                Simple monthly billing via South African DebiCheck debit order. No long-term lock-in contracts.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              {AVAILABLE_PACKAGES.map(pkg => {
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
                      {pkg.benefits.map((b, bIdx) => (
                        <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", marginBottom: "0.35rem" }}>
                          <Check size={12} color="#2dd4bf" style={{ marginTop: 2, shrink: 0 }} />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={`portal-btn ${isSelected ? "portal-btn--primary" : "portal-btn--ghost"} portal-btn--sm`}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      {isSelected ? "✓ Selected" : "Select This Plan"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.75rem", color: "#94a3b8" }}>
              <Shield size={16} color="#34d399" />
              <span>
                <strong>Peace of mind:</strong> Hosting, domain registration, SSL certificates, and monthly updates are all included with no hidden fees.
              </span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STEP 6: ORDER SPEC SHEET & LIVE REVIEW CHATBOT
            ══════════════════════════════════════════════════════════════ */}
        {manualStep === 6 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 0.25rem" }}>
                Review Your Project Spec Sheet
              </h2>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
                Here is the complete summary of what we will build for you.
              </p>
            </div>

            {/* AI Executive Scope Box (Generated with fallback) */}
            <div style={{
              padding: "1rem 1.25rem",
              borderRadius: 14,
              background: "linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(15,23,42,0.6) 100%)",
              border: "1.5px solid rgba(45,212,191,0.35)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <Sparkles size={15} color="#2dd4bf" />
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#2dd4bf", letterSpacing: "0.5px" }}>
                  EXECUTIVE PROJECT BRIEF
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#e2e8f0", lineHeight: 1.6, margin: 0 }}>
                {aiExecutiveSummary || "Your digital platform is tailored with your trade divisions, interactive quote engine, and local Google Search optimization."}
              </p>
            </div>

            {/* ── Official Structured Order Spec Sheet ── */}
            <div style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.25)",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#f8fafc" }}>
                    {businessName || "Your Company"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                    Director: {directorName || "Signatory"} &bull; {phone}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: "rgba(45,212,191,0.15)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.3)" }}>
                    Plan: {selectedPackage}
                  </span>
                  <div style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: 800, marginTop: 4 }}>
                    R{AVAILABLE_PACKAGES.find(p => p.name.toLowerCase() === selectedPackage.toLowerCase())?.fee || 349}/mo
                  </div>
                </div>
              </div>

              {/* Service Divisions List */}
              <div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  Services Included ({coreServices.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {coreServices.map(s => (
                    <span key={s} style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: 6, background: "rgba(255,255,255,0.04)", color: "#cbd5e1" }}>
                      &bull; {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Operating Areas & Target Markets */}
              <div className="portal-form-row">
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                    Operating Areas
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>
                    {operatingAreas.join(", ")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                    Target Customers
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>
                    {targetMarkets.join(", ")}
                  </div>
                </div>
              </div>

              {/* Planned Pages */}
              <div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  Planned Website Pages
                </div>
                <div style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>
                  {sitePages.map(p => p.title).join(" &bull; ")}
                </div>
              </div>
            </div>

            {/* ── Document Upload Dropzone ── */}
            <div>
              <label className="portal-label">Upload Company Documents or Logo (Optional)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed rgba(45,212,191,0.25)",
                  borderRadius: 12,
                  padding: "1rem",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "rgba(45,212,191,0.02)",
                }}
              >
                <UploadCloud size={22} color="#2dd4bf" style={{ margin: "0 auto 0.25rem", display: "block" }} />
                <div style={{ fontSize: "0.8rem", color: "#f8fafc", fontWeight: 700 }}>
                  Click to upload your Logo, CIPC document, or profile PDF
                </div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>PNG, JPG, or PDF (up to 15MB)</div>
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
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {uploadedAssets.map(a => (
                    <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.5rem", borderRadius: 6, background: "rgba(13,148,136,0.15)", fontSize: "0.72rem", color: "#2dd4bf" }}>
                      <File size={11} /> {a.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Friendly Inline AI Assistant / Chatbot for Quick Changes ── */}
            <div style={{
              borderRadius: 14,
              border: "1px solid rgba(45,212,191,0.2)",
              background: "rgba(13,148,136,0.04)",
              padding: "1rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Bot size={16} color="#2dd4bf" />
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#f8fafc" }}>
                  Need a quick change before submitting?
                </span>
              </div>

              {/* Chat Log */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "140px", overflowY: "auto", marginBottom: "0.75rem", padding: "0.4rem", borderRadius: 8, background: "rgba(0,0,0,0.2)" }}>
                {reviewChat.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "0.75rem",
                      color: m.sender === "ai" ? "#2dd4bf" : "#f8fafc",
                      padding: "0.35rem 0.6rem",
                      borderRadius: 8,
                      background: m.sender === "ai" ? "rgba(13,148,136,0.12)" : "rgba(255,255,255,0.06)",
                      alignSelf: m.sender === "ai" ? "flex-start" : "flex-end",
                      maxWidth: "90%",
                    }}
                  >
                    {m.message}
                  </div>
                ))}
                {isReviewChatReplying && (
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontStyle: "italic" }}>
                    Updating your spec sheet...
                  </div>
                )}
              </div>

              {/* Quick Prompt Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
                {["+ Add Roofing & Gutters", "+ Add Electrical & Solar", "Switch to Build (R349/mo)", "Switch to Spark (R199/mo)"].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSendReviewAdjustment(q)}
                    style={{
                      fontSize: "0.7rem",
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

              {/* Chat Input */}
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <input
                  className="portal-input"
                  style={{ fontSize: "0.78rem", padding: "0.45rem 0.75rem" }}
                  value={reviewChatMessage}
                  onChange={e => setReviewChatMessage(e.target.value)}
                  placeholder="e.g. Add solar services, change my plan, or add a testimonials page..."
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSendReviewAdjustment();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSendReviewAdjustment()}
                  disabled={!reviewChatMessage.trim() || isReviewChatReplying}
                  className="portal-btn portal-btn--primary portal-btn--sm"
                >
                  <Send size={13} />
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
                  <strong>I confirm:</strong> I have reviewed this spec sheet and verify that these services and pages accurately describe what I want built for my business.
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ── Bottom Navigation Bar ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: "0.75rem" }}>
          {manualStep > 1 ? (
            <button
              className="portal-btn portal-btn--ghost"
              onClick={() => setManualStep(s => (s - 1) as ManualStep)}
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

            {manualStep < 6 ? (
              <button
                className="portal-btn portal-btn--primary"
                onClick={async () => {
                  const next = (manualStep + 1) as ManualStep;
                  await handleSaveAndSync(next);
                  setManualStep(next);
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
                  <><Zap size={14} /> Submit &amp; Launch My Site <ArrowRight size={14} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
