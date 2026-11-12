/**
 * Client Project Onboarding — Comprehensive Business Intake, AI Scoping & Milestone Journey
 * Saves full structured company profile to Supabase partner.onboardings.
 * Features 6 engaging, gamified milestones with active completion counters,
 * interactive feature & page architecting, dedicated attractive plan selection,
 * and scope verification before handover.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Zap, MessageSquare, ClipboardList, ArrowRight, ArrowLeft,
  CheckCircle2, Send, SkipForward, Building2, Globe, Palette,
  Target, FileText, UploadCloud, Sparkles, RefreshCw, Lock,
  Check, X, File, Image as ImageIcon, Shield, ExternalLink,
  AlertCircle, Clock, Rocket, Plus, Trash2, Layers, Layout,
  Compass, Award, ChevronDown, ChevronUp, HelpCircle
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { partnerSchema, BRAND_ID, supabase } from "@/lib/supabase";
import {
  askGeminiArchitect,
  synthesizeScopeWithGemini,
  evaluateScopingProgress,
  enhanceFormFieldWithAI,
  suggestPlatformPagesWithGemini,
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
  sections: string[];
  isExpanded?: boolean;
}

const AVAILABLE_PACKAGES = [
  {
    name: "Spark",
    fee: 199,
    label: "One-page fast launch",
    pages: "1 Dedicated Page",
    care: "SSL, Backups & Domain",
    idealFor: "Single-service trades or landing page",
    highlights: ["Single Landing Page", "Direct WhatsApp Contact", "Fast SSD Hosting & SSL", "Standard Turnaround"],
  },
  {
    name: "Build",
    fee: 349,
    label: "Full contractor presence",
    pages: "Up to 5 Pages",
    care: "Domain & 1 Business Mailbox",
    featured: true,
    badge: "⭐ Recommended for Contractors",
    idealFor: "Multi-trade companies & commercial RFQs",
    highlights: ["Up to 5 Pages", "Interactive RFQ Quotation Engine", "Google Profile & Local SEO", "Custom Business Mailbox"],
  },
  {
    name: "Starter",
    fee: 500,
    label: "Room to tell your story",
    pages: "Up to 5 Pages",
    care: "30 min updates/mo & SEO",
    idealFor: "Growing SMEs with recurring updates",
    highlights: ["5 Custom Pages", "30 Min Developer Care / mo", "Before & After Workmanship Gallery", "Quarterly SEO Check"],
  },
  {
    name: "Business",
    fee: 1200,
    label: "Commercial enterprise tier",
    pages: "Up to 10 Pages",
    care: "120 min updates & CMS",
    badge: "Best for Multi-Trade Companies",
    idealFor: "Established companies with tenders & teams",
    highlights: ["Up to 10 Pages", "Dedicated Trade Division Sub-pages", "120 Min Care & CMS", "Priority SLA Response"],
  },
  {
    name: "Professional",
    fee: 2200,
    label: "Enterprise scale with portal",
    pages: "Up to 20 Pages",
    care: "300 min updates & Portal",
    idealFor: "Large developers & property management firms",
    highlights: ["Up to 20 Pages", "Client Extranet / Portal Access", "300 Min Priority Sprint Time", "Dedicated Account Lead"],
  },
  {
    name: "Shop Start",
    fee: 799,
    label: "eCommerce with Paystack",
    pages: "Up to 100 Products",
    care: "60 min updates/mo",
    idealFor: "Retailers selling goods or services online",
    highlights: ["Product Catalog & Cart", "Paystack & Ozow Integration", "Courier Delivery Calculators", "Inventory Management"],
  },
];

const MANUAL_STEPS = [
  { step: 1, label: "Identity & CIPC", icon: <Building2 size={13} /> },
  { step: 2, label: "Profile & Values", icon: <Target size={13} /> },
  { step: 3, label: "Services & Markets", icon: <Layers size={13} /> },
  { step: 4, label: "Pages & Features", icon: <Layout size={13} /> },
  { step: 5, label: "Plan Selection", icon: <Zap size={13} /> },
  { step: 6, label: "Scope & Sign-off", icon: <CheckCircle2 size={13} /> },
];

const DEFAULT_CONTRACTOR_SERVICES = [
  "Precision Painting",
  "Waterproofing",
  "Tiling & Paving",
  "Plumbing Services",
  "Crack & Wall Repairs",
  "Estate Maintenance",
  "Turnkey Renovations",
  "Roofing & Gutters",
];

const DEFAULT_OPERATING_AREAS = [
  "Gauteng",
  "Sandton & Bryanston",
  "Pretoria & Centurion",
  "Johannesburg North",
  "East Rand",
  "West Rand",
  "Midrand",
  "Nationwide",
];

const DEFAULT_TARGET_MARKETS = [
  "Residential property owners",
  "Property management companies",
  "Body corporates & HOAs",
  "Residential estates",
  "Commercial property owners",
  "Rental & letting agencies",
];

const FEATURE_OPTIONS = [
  { id: "rfq", label: "RFQ / Line-Item Quote Form", icon: "📋" },
  { id: "gallery", label: "Before & After Workmanship Gallery", icon: "🖼" },
  { id: "whatsapp", label: "WhatsApp Instant Chat Widget", icon: "💬" },
  { id: "google_profile", label: "Google Business Profile & Map Sync", icon: "📍" },
  { id: "mailbox", label: "Custom Business Mailbox (@domain)", icon: "📧" },
  { id: "booking", label: "Site Inspection Booking Drawer", icon: "📅" },
  { id: "testimonials", label: "Client Testimonials & Ratings", icon: "⭐" },
  { id: "portal", label: "Client Account & Document Vault", icon: "🔐" },
  { id: "paystack", label: "Paystack / DebiCheck Online Billing", icon: "💳" },
  { id: "seo", label: "Local Suburb Google SEO Tuning", icon: "🔍" },
];

function PortalOnboarding() {
  const navigate = useNavigate();
  const { plan: queryPlan } = Route.useSearch();
  const { user, loading, onboarding, updateOnboarding, client, refreshClient, access, setToast } = usePortalAuth();

  const [mode, setMode] = useState<Mode>("manual");
  const [manualStep, setManualStep] = useState<ManualStep>(1);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [enhancingField, setEnhancingField] = useState<string | null>(null);

  // ── Step 1: Identity & CIPC Legal Fields ─────────────────────────
  const [businessName, setBusinessName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [directorId, setDirectorId] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [industry, setIndustry] = useState("Construction & Engineering");
  const [existingDomain, setExistingDomain] = useState<"yes" | "no">("no");
  const [domainName, setDomainName] = useState("");

  // ── Step 2: Company Profile, Vision, Values & Methodology ────────
  const [tagline, setTagline] = useState("");
  const [aboutUs, setAboutUs] = useState("");
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");
  const [coreValues, setCoreValues] = useState<string[]>([
    "Quality",
    "Precision",
    "Reliability",
    "Integrity",
    "Customer Satisfaction",
  ]);
  const [newValueInput, setNewValueInput] = useState("");
  const [whyChooseUs, setWhyChooseUs] = useState<string[]>([
    "Certified & Qualified Artisans",
    "12-Month Workmanship Guarantee",
    "Free Site Inspections & Line-Item Quotes",
    "Fully Insured for Commercial Operations",
    "Direct Project Director Supervision",
  ]);
  const [newDifferentiatorInput, setNewDifferentiatorInput] = useState("");
  const [workingApproach, setWorkingApproach] = useState(
    "1. Client consultation & requirements intake\n2. On-site technical inspection & scope measurement\n3. Transparent line-item quotation\n4. Mobilisation, site prep & safety briefing\n5. Skilled execution with interim quality control\n6. Final handover, sign-off & 12-month warranty"
  );

  // ── Step 3: Core Service Divisions & Target Markets ──────────────
  const [coreServices, setCoreServices] = useState<string[]>(DEFAULT_CONTRACTOR_SERVICES);
  const [newServiceInput, setNewServiceInput] = useState("");
  const [operatingAreas, setOperatingAreas] = useState<string[]>(["Gauteng", "Sandton & Bryanston", "Pretoria & Centurion"]);
  const [newAreaInput, setNewAreaInput] = useState("");
  const [targetMarkets, setTargetMarkets] = useState<string[]>(DEFAULT_TARGET_MARKETS);
  const [newMarketInput, setNewMarketInput] = useState("");

  // ── Step 4: Website Pages & Features Blueprint ───────────────────
  const [sitePages, setSitePages] = useState<SitePage[]>([
    {
      id: "p_home",
      title: "Home",
      purpose: "Hero positioning, CIPC accreditation, quick quote trigger, and primary value proposition.",
      sections: [
        "Hero Banner with CIPC Registration Badge & Free Inspection CTA",
        "Primary Capabilities & Services Grid",
        "Why Choose Us & 6-Step Working Methodology Overview",
        "Before & After Workmanship Project Highlights",
        "Direct WhatsApp & Contact Drawer",
      ],
      isExpanded: true,
    },
    {
      id: "p_services",
      title: "Services & Capabilities",
      purpose: "Detailed overview of each trade division with technical specs and scope.",
      sections: [
        "Comprehensive Service Divisions Breakdown",
        "Materials & Premium Coating Specifications",
        "Methodology & Safety Standards",
        "Service-specific RFQ Trigger",
      ],
    },
    {
      id: "p_about",
      title: "About & Compliance",
      purpose: "Build trust with director leadership, CIPC registration, and company values.",
      sections: [
        "Company Mission, Vision & Core Values",
        "Director Background & Artisan Qualifications",
        "Official CIPC & Compliance Documentation Vault",
        "12-Month Workmanship Warranty Terms",
      ],
    },
    {
      id: "p_gallery",
      title: "Projects & Portfolio",
      purpose: "Showcase completed projects with before/after comparisons and estate testimonials.",
      sections: [
        "High-Resolution Project Portfolio with Filter by Trade",
        "Before & After Sliders for Painting & Waterproofing",
        "Client Testimonials & Estate Case Studies",
      ],
    },
    {
      id: "p_rfq",
      title: "Request a Quote (RFQ)",
      purpose: "High-converting multi-step RFQ form with property type and service selection.",
      sections: [
        "Interactive RFQ Form with Property Type Selector",
        "Service Selection & Project Scope Input",
        "Photo & Document Upload for Remote Damage Assessment",
        "Operating Regions & Coverage Map (Gauteng)",
      ],
    },
    {
      id: "p_contact",
      title: "Contact & Location",
      purpose: "Direct contact channels, emergency dispatch, and physical office location.",
      sections: [
        "Direct Phone & WhatsApp Click-to-Action",
        "Physical Office Address & Operating Hours",
        "Direct Contact Form",
      ],
    },
  ]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "rfq",
    "gallery",
    "whatsapp",
    "google_profile",
    "mailbox",
    "testimonials",
  ]);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPagePurpose, setNewPagePurpose] = useState("");
  const [isAiSuggestingPages, setIsAiSuggestingPages] = useState(false);

  // ── Step 5: Attractive Dedicated Plan Selection ──────────────────
  const [selectedPackage, setSelectedPackage] = useState(queryPlan || "Build");

  // ── Step 6: Brand Assets, Scope Verification & Confirmation ──────
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [scopeVerified, setScopeVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── AI Chat / Conversational Mode State ──────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [scopingResult, setScopingResult] = useState<ScopingResult | null>(null);

  // Progress metrics from chat
  const scopingProgress: ScopingProgress = evaluateScopingProgress(messages, uploadedAssets.length);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/portal/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Sync initial user details
  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
    if (client?.name && !contactPerson) setContactPerson(client.name);
    if (client?.phone && !phone) setPhone(client.phone);
    if (client?.name && !businessName && !client.name.includes("@")) {
      const cleaned = client.name.replace(/\(.*\)/, "").trim();
      setBusinessName(cleaned);
      if (!directorName) setDirectorName(cleaned);
    }
  }, [user, client]);

  // Restore previous saved onboarding session if available
  useEffect(() => {
    if (onboarding) {
      if (onboarding.businessName) setBusinessName(onboarding.businessName);
      if (onboarding.contactPerson) setContactPerson(onboarding.contactPerson);
      if (onboarding.phone) setPhone(onboarding.phone);
      if (onboarding.industry) setIndustry(onboarding.industry);
      if (onboarding.selectedPackageCode) setSelectedPackage(onboarding.selectedPackageCode);
      if (onboarding.existingDomain) setExistingDomain(onboarding.existingDomain as "yes" | "no");
      if (onboarding.existingDomainName) setDomainName(onboarding.existingDomainName);
      if (onboarding.currentStep && onboarding.mode === "manual") {
        setManualStep(Math.min(onboarding.currentStep, 6) as ManualStep);
      }
      if (onboarding.businessGoals && !aboutUs) {
        setAboutUs(onboarding.businessGoals);
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

  // ── Smart Milestone Counter: Computes completed items across journey
  const completedMilestones = useMemo(() => {
    const items = [
      { id: "name", label: "Business Name", done: !!businessName.trim() },
      { id: "cipc", label: "CIPC Number", done: !!regNumber.trim() },
      { id: "address", label: "Registered Address", done: !!registeredAddress.trim() },
      { id: "director", label: "Signatory / Director", done: !!directorName.trim() || !!contactPerson.trim() },
      { id: "about", label: "Profile & About Us", done: !!aboutUs.trim() },
      { id: "services", label: "Service Divisions", done: coreServices.length >= 2 },
      { id: "markets", label: "Target Markets", done: targetMarkets.length >= 2 },
      { id: "pages", label: "Page Blueprint", done: sitePages.length >= 3 },
      { id: "plan", label: "Package Selected", done: !!selectedPackage },
      { id: "verify", label: "Scope Verified", done: scopeVerified },
    ];
    const doneCount = items.filter(i => i.done).length;
    const pct = Math.round((doneCount / items.length) * 100);
    return { items, doneCount, total: items.length, pct };
  }, [
    businessName,
    regNumber,
    registeredAddress,
    directorName,
    contactPerson,
    aboutUs,
    coreServices,
    targetMarkets,
    sitePages,
    selectedPackage,
    scopeVerified,
  ]);

  // ── AI Recommendation Engine for Step 5 ──────────────────────────
  const planRecommendation = useMemo(() => {
    const isMultiService = coreServices.length >= 3;
    const hasCommercial = targetMarkets.some(m =>
      /commercial|body corporate|estate|developer|agency/i.test(m)
    );
    const hasManyPages = sitePages.length >= 5;

    if (isMultiService || hasCommercial || hasManyPages) {
      return {
        recommended: "Build",
        rationale: `Based on your ${coreServices.length} service divisions (${coreServices.slice(0, 3).join(", ")}) and target commercial markets (${targetMarkets.slice(0, 2).join(", ")}), the Build package (R349/mo) provides the necessary multi-page structure, custom RFQ quotation engine, and professional business mailbox needed to win commercial tenders.`,
      };
    }
    return {
      recommended: "Spark",
      rationale:
        "Based on your focused service offerings, the Spark tier (R199/mo) provides an ultra-fast one-page presence with SSL hosting and direct WhatsApp consultation.",
    };
  }, [coreServices, targetMarkets, sitePages]);

  // ── AI Assist handler for fields ─────────────────────────────────
  const handleEnhanceField = async (
    field: "aboutUs" | "vision" | "mission" | "tagline" | "businessName"
  ) => {
    setEnhancingField(field);
    try {
      const currentVal =
        field === "aboutUs" ? aboutUs :
        field === "vision" ? vision :
        field === "mission" ? mission :
        field === "tagline" ? tagline :
        businessName;

      const enhanced = await enhanceFormFieldWithAI({
        field: field === "aboutUs" ? "goals" : field === "tagline" ? "audience" : "businessName",
        currentValue: currentVal,
        businessName: businessName || "First Class Fixers",
        industry,
      });

      if (enhanced) {
        if (field === "aboutUs") setAboutUs(enhanced);
        else if (field === "vision") setVision(enhanced);
        else if (field === "mission") setMission(enhanced);
        else if (field === "tagline") setTagline(enhanced);
        else if (field === "businessName") setBusinessName(enhanced);
      }
    } finally {
      setEnhancingField(null);
    }
  };

  // ── AI Page Suggestions ──────────────────────────────────────────
  const handleAiSuggestPages = async () => {
    setIsAiSuggestingPages(true);
    try {
      const pages = await suggestPlatformPagesWithGemini({
        businessName: businessName || "Your Business",
        industry,
        services: coreServices,
        goals: aboutUs || tagline,
      });
      if (pages && pages.length > 0) {
        setSitePages(pages.map((p, i) => ({ ...p, isExpanded: i === 0 })));
        if (setToast) setToast("✨ AI generated your customized page and section blueprint!");
      }
    } finally {
      setIsAiSuggestingPages(false);
    }
  };

  // ── Asset Upload Handlers ────────────────────────────────────────
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

  // ── Save Progress to Supabase ────────────────────────────────────
  const saveManual = async (nextStep?: ManualStep) => {
    setBusy(true);
    try {
      const fullProfile = {
        cipc_registration_number: regNumber,
        registered_address: registeredAddress,
        director_name: directorName,
        director_id_number: directorId,
        tagline,
        company_overview: aboutUs,
        vision,
        mission,
        core_values: coreValues,
        why_choose_us: whyChooseUs,
        working_approach: workingApproach,
        core_services: coreServices,
        operating_areas: operatingAreas,
        target_markets: targetMarkets,
        planned_pages: sitePages,
        selected_features: selectedFeatures,
      };

      await updateOnboarding({
        currentStep: nextStep || manualStep,
        businessName,
        contactPerson: contactPerson || directorName,
        phone,
        industry,
        targetAudience: targetMarkets.join(", "),
        businessGoals: `${tagline ? `Tagline: ${tagline}. ` : ""}${aboutUs}`,
        selectedPackageCode: selectedPackage,
        existingDomain,
        existingDomainName: domainName,
        mode: "manual",
      });

      // Also persist the rich profile to partner.onboardings direct table
      if (onboarding?.id) {
        try {
          await partnerSchema()
            .from("onboardings")
            .update({
              business_name: businessName,
              client_name: contactPerson || directorName,
              client_phone: phone,
              industry,
              selected_package_code: selectedPackage,
              business_goals: `${tagline ? `[${tagline}] ` : ""}${aboutUs}\n\n[SERVICES]: ${coreServices.join(", ")}\n[AREAS]: ${operatingAreas.join(", ")}`,
              target_audience: targetMarkets.join(", "),
              current_step: nextStep || manualStep,
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

  // ── Final Onboarding Submission ──────────────────────────────────
  const finishManual = async () => {
    if (!scopeVerified) {
      if (setToast) setToast("⚠️ Please verify and sign off on your project scope before submitting.");
      return;
    }
    setBusy(true);

    const chosenPlan = selectedPackage || planRecommendation.recommended || "Build";
    const fullExecutiveSummary = `Executive Digital Brief for ${businessName || "Client"} (${regNumber || "CIPC Pending"}).
Core Divisions: ${coreServices.join(", ")}.
Operating Regions: ${operatingAreas.join(", ")}.
Planned Site Pages: ${sitePages.map(p => p.title).join(", ")}.
Selected Plan: ${chosenPlan}.
Verified by Director: ${directorName || contactPerson || user?.email}.`;

    try {
      await updateOnboarding({
        isCompleted: true,
        status: "completed",
        currentStep: 6,
        businessName,
        contactPerson: contactPerson || directorName,
        phone,
        industry,
        targetAudience: targetMarkets.join(", "),
        businessGoals: `${tagline ? `[Tagline: ${tagline}] ` : ""}${aboutUs}`,
        selectedPackageCode: chosenPlan,
        mode: "manual",
        aiRecommendation: fullExecutiveSummary,
      });

      // Upsert client record in partner.clients with pending_approval status
      try {
        await partnerSchema()
          .from("clients")
          .upsert({
            brand_id: BRAND_ID,
            user_id: user?.id,
            name: contactPerson || businessName || user?.email?.split("@")[0] || "Client",
            email: user?.email || "",
            phone: phone || null,
            account_status: "pending_approval",
            business_type: industry || "contractor_digital",
          }, { onConflict: "brand_id,email" });
      } catch (_) {}

      await refreshClient();
      if (setToast) setToast("🎉 Digital onboarding brief officially submitted!");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) {
    return <PortalLayout>{null}</PortalLayout>;
  }

  // ── Completed State View ─────────────────────────────────────────
  if (onboarding?.isCompleted || onboarding?.mode === "admin_bypassed") {
    const planName = onboarding.selectedPackageCode || selectedPackage || "Build";
    const biz = businessName || onboarding.businessName || "Your Business";
    const hasMandateDoc = !!client?.mandateDocUrl;
    const isAuthorized = client?.mandateStatus === "authorized";
    const isLive = !!access.projects;

    const journeySteps = [
      { icon: <CheckCircle2 size={18} />, label: "Brief & Scope Submitted", done: true },
      { icon: hasMandateDoc ? <CheckCircle2 size={18} /> : <Clock size={18} />, label: "Service Contract & Mandate", done: hasMandateDoc },
      { icon: isAuthorized ? <CheckCircle2 size={18} /> : <Clock size={18} />, label: "DebiCheck Authorized", done: isAuthorized },
      { icon: isLive ? <CheckCircle2 size={18} /> : <Clock size={18} />, label: "Build Activated & Staging Live", done: isLive },
    ];

    return (
      <PortalLayout>
        <div style={{
          background: "linear-gradient(135deg, rgba(13,148,136,0.18) 0%, rgba(16,185,129,0.10) 50%, rgba(15,23,42,0.6) 100%)",
          border: "1px solid rgba(45,212,191,0.25)",
          borderRadius: 16,
          padding: "2.5rem 1.5rem 2rem",
          marginBottom: "1.5rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)", width: 220, height: 120, background: "radial-gradient(ellipse, rgba(45,212,191,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ fontSize: "2.75rem", marginBottom: "0.5rem", lineHeight: 1 }}>🎉</div>
          <h1 style={{ fontSize: "clamp(1.6rem, 5vw, 2.25rem)", fontWeight: 900, color: "#f8fafc", margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
            Onboarding Blueprint Submitted!
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#94a3b8", margin: "0 0 1rem" }}>
            Complete business dossier &amp; page architecture locked in for <strong style={{ color: "#e2e8f0" }}>{biz}</strong>
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 1rem", borderRadius: 999, background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.4)", fontSize: "0.82rem", fontWeight: 800, color: "#2dd4bf" }}>
            <Zap size={13} /> Selected Plan: {planName}
          </div>
        </div>

        <div className="portal-card" style={{ marginBottom: "1.25rem" }}>
          <div className="portal-card-title"><Sparkles size={16} color="#fbbf24" /> Your Activation Journey</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            {journeySteps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: s.done ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                    border: s.done ? "1.5px solid rgba(52,211,153,0.6)" : "1px solid rgba(255,255,255,0.1)",
                    color: s.done ? "#34d399" : "#475569",
                  }}>
                    {s.icon}
                  </div>
                  {i < journeySteps.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 16, background: s.done ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.06)", margin: "3px 0" }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: i < journeySteps.length - 1 ? "0.75rem" : 0 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: s.done ? "#e2e8f0" : "#64748b" }}>{s.label}</div>
                  <div style={{ fontSize: "0.75rem", color: s.done ? "#34d399" : "#475569", marginTop: 2 }}>
                    {s.done ? "Completed ✓" : "Pending Action"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <Link to="/portal/dashboard" className="portal-btn portal-btn--primary">
            Return to Dashboard <ArrowRight size={14} />
          </Link>
          <a href="mailto:hello@eandl.digital" className="portal-btn portal-btn--ghost">
            <ExternalLink size={14} /> Contact Lead Solutions Architect
          </a>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      {/* ── Page Header with AI Scoping Mode Switcher ── */}
      <div className="portal-page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h1 className="portal-page-title" style={{ marginBottom: 0 }}>Project Onboarding</h1>
              <span className="portal-badge portal-badge--active" style={{ fontSize: "10px" }}>
                Interactive Blueprint
              </span>
            </div>
            <p className="portal-page-sub">
              Milestone {manualStep} of 6 &bull; Shape your complete business profile, service divisions, planned pages, and select your growth plan.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {mode === "manual" ? (
              <button
                className="portal-btn portal-btn--ghost portal-btn--sm"
                onClick={() => setMode("ai")}
                style={{ borderColor: "rgba(45,212,191,0.3)", color: "#2dd4bf" }}
              >
                <Sparkles size={13} /> Try Conversational AI Scoping
              </button>
            ) : (
              <button
                className="portal-btn portal-btn--ghost portal-btn--sm"
                onClick={() => setMode("manual")}
              >
                <ClipboardList size={13} /> Switch to Structured Form
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Encouraging Progress & Milestone Track (Sticky / High-Agency) ── */}
      <div
        className="portal-card"
        style={{
          marginBottom: "1.25rem",
          padding: "1rem 1.25rem",
          background: "linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(15,23,42,0.4) 100%)",
          borderColor: "rgba(45,212,191,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2dd4bf" }}>
              <Rocket size={14} />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f8fafc" }}>
                You have started and are near the finish line!
              </div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                {completedMilestones.doneCount} of {completedMilestones.total} essential business data points completed &bull; Almost ready to launch
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#2dd4bf", fontFamily: "monospace" }}>
              {completedMilestones.pct}% Complete
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="portal-progress-track" style={{ height: 6 }}>
          <div
            className="portal-progress-fill portal-progress-fill--teal"
            style={{ width: `${completedMilestones.pct}%`, transition: "width 0.4s ease" }}
          />
        </div>
      </div>

      {/* ── Interactive 6-Milestone Stepper ── */}
      <div className="portal-steps" style={{ marginBottom: "1.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {MANUAL_STEPS.map((s) => {
          const status = manualStep > s.step ? "done" : manualStep === s.step ? "active" : "pending";
          return (
            <div
              key={s.step}
              onClick={() => {
                if (s.step < manualStep) setManualStep(s.step as ManualStep);
              }}
              className={`portal-step portal-step--${status}`}
              style={{ cursor: s.step < manualStep ? "pointer" : "default", minWidth: 105 }}
            >
              <div className={`portal-step-dot portal-step-dot--${status}`}>
                {status === "done" ? "✓" : s.step}
              </div>
              <div className="portal-step-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Form Card Body ── */}
      <div className="portal-card" style={{ padding: "1.5rem" }}>

        {/* ════════════════════════════════════════════════════════════════
            STEP 1: BUSINESS IDENTITY & CIPC LEGAL COMPLIANCE
            ════════════════════════════════════════════════════════════════ */}
        {manualStep === 1 && (
          <div className="space-y-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <div className="portal-card-title" style={{ marginBottom: 2 }}>
                  <Building2 size={16} /> Business Identity &amp; Legal Compliance
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Official registration credentials for South African corporate credibility, tender compliance, and verified client trust.
                </div>
              </div>
              <span className="portal-badge portal-badge--active" style={{ fontSize: "9px" }}>
                Step 1 of 6
              </span>
            </div>

            <div className="portal-form-row">
              <div className="portal-form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <label className="portal-label" style={{ marginBottom: 0 }}>Registered Business / Company Name *</label>
                  <button
                    type="button"
                    onClick={() => handleEnhanceField("businessName")}
                    disabled={enhancingField === "businessName"}
                    style={{ background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.3)", color: "#2dd4bf", padding: "2px 8px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                  >
                    <Sparkles size={11} className={enhancingField === "businessName" ? "animate-spin" : ""} />
                    {enhancingField === "businessName" ? "Checking..." : "AI Assist"}
                  </button>
                </div>
                <input
                  className="portal-input"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. First Class Fixers (Pty) Ltd"
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-label">CIPC Registration Number</label>
                <input
                  className="portal-input"
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value)}
                  placeholder="e.g. 2024/123456/07"
                />
              </div>
            </div>

            <div className="portal-form-group">
              <label className="portal-label">Official Registered Physical Address *</label>
              <input
                className="portal-input"
                value={registeredAddress}
                onChange={e => setRegisteredAddress(e.target.value)}
                placeholder="e.g. 34 Sloane Street, Bryanston, Sandton, 2191, Gauteng"
              />
            </div>

            <div className="portal-form-row">
              <div className="portal-form-group">
                <label className="portal-label">Director / Authorized Signatory Legal Name *</label>
                <input
                  className="portal-input"
                  value={directorName}
                  onChange={e => {
                    setDirectorName(e.target.value);
                    if (!contactPerson) setContactPerson(e.target.value);
                  }}
                  placeholder="e.g. Emmanuel Rabotsi"
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-label">Signatory South African ID or Passport No.</label>
                <input
                  className="portal-input"
                  value={directorId}
                  onChange={e => setDirectorId(e.target.value)}
                  placeholder="e.g. 9101015000088"
                />
              </div>
            </div>

            <div className="portal-form-row">
              <div className="portal-form-group">
                <label className="portal-label">Direct Mobile / WhatsApp Number *</label>
                <input
                  className="portal-input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+27 71 000 0000"
                  type="tel"
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-label">Official Business Contact Email</label>
                <input
                  className="portal-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="info@yourcompany.co.za"
                  type="email"
                />
              </div>
            </div>

            <div className="portal-form-row">
              <div className="portal-form-group">
                <label className="portal-label">Industry / Sector</label>
                <select
                  className="portal-input portal-select"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                >
                  {[
                    "Construction & Engineering",
                    "Painting & Waterproofing Contracting",
                    "Facilities & Estate Maintenance",
                    "Plumbing & Sanitation",
                    "Property Development & Real Estate",
                    "Electrical & Solar Contracting",
                    "Healthcare / Medical",
                    "Legal & Corporate Advisory",
                    "Finance / Accounting",
                    "eCommerce & Retail",
                    "General Business & Services",
                  ].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>

              <div className="portal-form-group">
                <label className="portal-label">Do you already own a domain name?</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setExistingDomain("yes")}
                    className={`portal-btn ${existingDomain === "yes" ? "portal-btn--primary" : "portal-btn--ghost"} portal-btn--sm`}
                    style={{ flex: 1 }}
                  >
                    Yes, I own one
                  </button>
                  <button
                    type="button"
                    onClick={() => setExistingDomain("no")}
                    className={`portal-btn ${existingDomain === "no" ? "portal-btn--primary" : "portal-btn--ghost"} portal-btn--sm`}
                    style={{ flex: 1 }}
                  >
                    No, E&amp;L provides (.co.za)
                  </button>
                </div>
              </div>
            </div>

            {existingDomain === "yes" && (
              <div className="portal-form-group">
                <label className="portal-label">Your existing domain name</label>
                <input
                  className="portal-input"
                  value={domainName}
                  onChange={e => setDomainName(e.target.value)}
                  placeholder="www.yourcompany.co.za"
                />
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 2: PROFILE, VISION, VALUES & METHODOLOGY
            ════════════════════════════════════════════════════════════════ */}
        {manualStep === 2 && (
          <div className="space-y-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <div className="portal-card-title" style={{ marginBottom: 2 }}>
                  <Target size={16} /> Company Profile, Vision, Values &amp; Working Approach
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Articulate your brand identity, corporate ethos, and client service delivery methodology.
                </div>
              </div>
              <span className="portal-badge portal-badge--active" style={{ fontSize: "9px" }}>
                Step 2 of 6
              </span>
            </div>

            {/* Tagline */}
            <div className="portal-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label className="portal-label" style={{ marginBottom: 0 }}>Business Tagline / Slogan</label>
                <button
                  type="button"
                  onClick={() => handleEnhanceField("tagline")}
                  disabled={enhancingField === "tagline"}
                  style={{ background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.3)", color: "#2dd4bf", padding: "2px 8px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                >
                  <Sparkles size={11} className={enhancingField === "tagline" ? "animate-spin" : ""} />
                  {enhancingField === "tagline" ? "Generating..." : "AI Generate Tagline"}
                </button>
              </div>
              <input
                className="portal-input"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="e.g. Precision Property Solutions &amp; Turnkey Maintenance"
              />
            </div>

            {/* About Us */}
            <div className="portal-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label className="portal-label" style={{ marginBottom: 0 }}>Company Overview / About Us *</label>
                <button
                  type="button"
                  onClick={() => handleEnhanceField("aboutUs")}
                  disabled={enhancingField === "aboutUs"}
                  style={{ background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.3)", color: "#2dd4bf", padding: "2px 8px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                >
                  <Sparkles size={11} className={enhancingField === "aboutUs" ? "animate-spin" : ""} />
                  {enhancingField === "aboutUs" ? "Polishing..." : "✨ AI Polish Profile"}
                </button>
              </div>
              <textarea
                className="portal-input portal-textarea"
                rows={4}
                value={aboutUs}
                onChange={e => setAboutUs(e.target.value)}
                placeholder="e.g. First Class Fixers (Pty) Ltd is a registered South African property services and maintenance enterprise providing precision painting, waterproofing, tiling, and complete facility upkeep across Gauteng residential estates and commercial properties..."
              />
            </div>

            {/* Vision & Mission */}
            <div className="portal-form-row">
              <div className="portal-form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <label className="portal-label" style={{ marginBottom: 0 }}>Vision Statement</label>
                  <button
                    type="button"
                    onClick={() => handleEnhanceField("vision")}
                    disabled={enhancingField === "vision"}
                    style={{ background: "none", border: "none", color: "#2dd4bf", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    ✨ AI Assist
                  </button>
                </div>
                <textarea
                  className="portal-input portal-textarea"
                  rows={2}
                  value={vision}
                  onChange={e => setVision(e.target.value)}
                  placeholder="e.g. To be South Africa's most trusted, reliable, and precision-driven property maintenance and contracting partner."
                />
              </div>

              <div className="portal-form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <label className="portal-label" style={{ marginBottom: 0 }}>Mission Statement</label>
                  <button
                    type="button"
                    onClick={() => handleEnhanceField("mission")}
                    disabled={enhancingField === "mission"}
                    style={{ background: "none", border: "none", color: "#2dd4bf", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    ✨ AI Assist
                  </button>
                </div>
                <textarea
                  className="portal-input portal-textarea"
                  rows={2}
                  value={mission}
                  onChange={e => setMission(e.target.value)}
                  placeholder="e.g. Delivering uncompromising craftsmanship, transparent line-item quotes, and on-time project execution that protects property value."
                />
              </div>
            </div>

            {/* Core Values Multi-select / Adder */}
            <div className="portal-form-group">
              <label className="portal-label">Core Values &amp; Principles</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
                {coreValues.map((v, i) => (
                  <span
                    key={i}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.625rem", borderRadius: 999, background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.3)", fontSize: "0.75rem", color: "#2dd4bf" }}
                  >
                    <Check size={11} /> {v}
                    <button
                      type="button"
                      onClick={() => setCoreValues(coreValues.filter((_, idx) => idx !== i))}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className="portal-input"
                  value={newValueInput}
                  onChange={e => setNewValueInput(e.target.value)}
                  placeholder="Add custom value (e.g. Safety, Compliance, Transparency)"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newValueInput.trim()) {
                      e.preventDefault();
                      setCoreValues([...coreValues, newValueInput.trim()]);
                      setNewValueInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newValueInput.trim()) {
                      setCoreValues([...coreValues, newValueInput.trim()]);
                      setNewValueInput("");
                    }
                  }}
                  className="portal-btn portal-btn--ghost portal-btn--sm"
                >
                  <Plus size={13} /> Add Value
                </button>
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="portal-form-group">
              <label className="portal-label">Why Choose Us (Key Differentiators)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
                {whyChooseUs.map((diff, i) => (
                  <span
                    key={i}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.625rem", borderRadius: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", fontSize: "0.75rem", color: "#a5b4fc" }}
                  >
                    <Award size={11} /> {diff}
                    <button
                      type="button"
                      onClick={() => setWhyChooseUs(whyChooseUs.filter((_, idx) => idx !== i))}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className="portal-input"
                  value={newDifferentiatorInput}
                  onChange={e => setNewDifferentiatorInput(e.target.value)}
                  placeholder="Add key differentiator (e.g. 5-Year Paint Guarantee)"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newDifferentiatorInput.trim()) {
                      e.preventDefault();
                      setWhyChooseUs([...whyChooseUs, newDifferentiatorInput.trim()]);
                      setNewDifferentiatorInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newDifferentiatorInput.trim()) {
                      setWhyChooseUs([...whyChooseUs, newDifferentiatorInput.trim()]);
                      setNewDifferentiatorInput("");
                    }
                  }}
                  className="portal-btn portal-btn--ghost portal-btn--sm"
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>

            {/* 6-Step Working Methodology */}
            <div className="portal-form-group">
              <label className="portal-label">6-Step Client Working Methodology &amp; Delivery Process</label>
              <textarea
                className="portal-input portal-textarea font-mono"
                rows={5}
                value={workingApproach}
                onChange={e => setWorkingApproach(e.target.value)}
                placeholder="1. Consultation -> 2. Site Inspection -> 3. Formal Quote -> 4. Preparation & Safety -> 5. Quality Execution -> 6. Client Handover"
              />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 3: CORE SERVICE DIVISIONS & TARGET MARKETS
            ════════════════════════════════════════════════════════════════ */}
        {manualStep === 3 && (
          <div className="space-y-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <div className="portal-card-title" style={{ marginBottom: 2 }}>
                  <Layers size={16} /> Core Trade Divisions &amp; Target Client Markets
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Select the services you offer and the specific customer segments you want to attract.
                </div>
              </div>
              <span className="portal-badge portal-badge--active" style={{ fontSize: "9px" }}>
                Step 3 of 6
              </span>
            </div>

            {/* Core Services Chips */}
            <div className="portal-form-group">
              <label className="portal-label">Core Trade &amp; Service Divisions * ({coreServices.length} active)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {coreServices.map((service, i) => (
                  <div
                    key={i}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: 10, background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.3)", fontSize: "0.8rem", color: "#f8fafc", fontWeight: 700 }}
                  >
                    <Check size={13} color="#2dd4bf" />
                    {service}
                    <button
                      type="button"
                      onClick={() => setCoreServices(coreServices.filter((_, idx) => idx !== i))}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "0 0 0 4px" }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Service Adder */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className="portal-input"
                  value={newServiceInput}
                  onChange={e => setNewServiceInput(e.target.value)}
                  placeholder="Type new service division (e.g. Solar Installation, Epoxies, Carpentry) and press Add"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newServiceInput.trim()) {
                      e.preventDefault();
                      setCoreServices([...coreServices, newServiceInput.trim()]);
                      setNewServiceInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newServiceInput.trim()) {
                      setCoreServices([...coreServices, newServiceInput.trim()]);
                      setNewServiceInput("");
                    }
                  }}
                  className="portal-btn portal-btn--primary portal-btn--sm"
                >
                  <Plus size={13} /> Add Division
                </button>
              </div>
            </div>

            {/* Operating Areas */}
            <div className="portal-form-group">
              <label className="portal-label">Primary Operating Regions &amp; Suburbs</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
                {operatingAreas.map((area, i) => (
                  <span
                    key={i}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.625rem", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.75rem", color: "#e2e8f0" }}
                  >
                    📍 {area}
                    <button
                      type="button"
                      onClick={() => setOperatingAreas(operatingAreas.filter((_, idx) => idx !== i))}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className="portal-input"
                  value={newAreaInput}
                  onChange={e => setNewAreaInput(e.target.value)}
                  placeholder="Add suburb or region (e.g. Bryanston, Fourways, Centurion)"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newAreaInput.trim()) {
                      e.preventDefault();
                      setOperatingAreas([...operatingAreas, newAreaInput.trim()]);
                      setNewAreaInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newAreaInput.trim()) {
                      setOperatingAreas([...operatingAreas, newAreaInput.trim()]);
                      setNewAreaInput("");
                    }
                  }}
                  className="portal-btn portal-btn--ghost portal-btn--sm"
                >
                  <Plus size={13} /> Add Area
                </button>
              </div>
            </div>

            {/* Target Client Markets */}
            <div className="portal-form-group">
              <label className="portal-label">Target Client Markets &amp; Segments</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
                {targetMarkets.map((market, i) => (
                  <span
                    key={i}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.625rem", borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", fontSize: "0.75rem", color: "#fbbf24" }}
                  >
                    🎯 {market}
                    <button
                      type="button"
                      onClick={() => setTargetMarkets(targetMarkets.filter((_, idx) => idx !== i))}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className="portal-input"
                  value={newMarketInput}
                  onChange={e => setNewMarketInput(e.target.value)}
                  placeholder="Add target client type (e.g. Industrial warehouses, Schools)"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newMarketInput.trim()) {
                      e.preventDefault();
                      setTargetMarkets([...targetMarkets, newMarketInput.trim()]);
                      setNewMarketInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newMarketInput.trim()) {
                      setTargetMarkets([...targetMarkets, newMarketInput.trim()]);
                      setNewMarketInput("");
                    }
                  }}
                  className="portal-btn portal-btn--ghost portal-btn--sm"
                >
                  <Plus size={13} /> Add Market
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 4: WEBSITE PAGES & FEATURES BLUEPRINT
            ════════════════════════════════════════════════════════════════ */}
        {manualStep === 4 && (
          <div className="space-y-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <div className="portal-card-title" style={{ marginBottom: 2 }}>
                  <Layout size={16} /> Interactive Pages &amp; Features Blueprint
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Plan the exact pages and interactive functional features for your web application.
                </div>
              </div>

              <button
                type="button"
                onClick={handleAiSuggestPages}
                disabled={isAiSuggestingPages}
                className="portal-btn portal-btn--primary portal-btn--sm"
                style={{ fontSize: "0.75rem" }}
              >
                <Sparkles size={13} className={isAiSuggestingPages ? "animate-spin" : ""} />
                {isAiSuggestingPages ? "Architecting..." : "✨ AI Suggest Page Architecture"}
              </button>
            </div>

            {/* Planned Pages Interactive Cards */}
            <div className="portal-form-group">
              <label className="portal-label">Planned Website Pages ({sitePages.length} pages)</label>
              <div className="space-y-2.5" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {sitePages.map((page, idx) => (
                  <div
                    key={page.id || idx}
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.02)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.75rem 1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        background: "rgba(255,255,255,0.02)",
                      }}
                      onClick={() => {
                        setSitePages(sitePages.map((p, i) => i === idx ? { ...p, isExpanded: !p.isExpanded } : p));
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(45,212,191,0.15)", color: "#2dd4bf", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>
                          {idx + 1}
                        </div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                          {page.title}
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          ({page.sections?.length || 0} sections)
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSitePages(sitePages.filter((_, i) => i !== idx));
                          }}
                          style={{ background: "none", border: "none", color: "#64748b", hover: { color: "#f43f5e" }, cursor: "pointer", padding: "2px 6px" }}
                        >
                          <Trash2 size={13} />
                        </button>
                        {page.isExpanded ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
                      </div>
                    </div>

                    {page.isExpanded && (
                      <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.15)" }}>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
                          <strong style={{ color: "#cbd5e1" }}>Purpose:</strong> {page.purpose}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, marginBottom: "0.35rem" }}>
                          SECTIONS INCLUDED:
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                          {page.sections?.map((sec, sIdx) => (
                            <span
                              key={sIdx}
                              style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.5rem", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.7rem", color: "#cbd5e1" }}
                            >
                              &bull; {sec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Custom Page Input */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                <input
                  className="portal-input"
                  value={newPageTitle}
                  onChange={e => setNewPageTitle(e.target.value)}
                  placeholder="Page Name (e.g. Client Portal, FAQs, Case Studies)"
                  style={{ flex: 1 }}
                />
                <input
                  className="portal-input"
                  value={newPagePurpose}
                  onChange={e => setNewPagePurpose(e.target.value)}
                  placeholder="Page Purpose"
                  style={{ flex: 2 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newPageTitle.trim()) {
                      const newP: SitePage = {
                        id: "p_" + Date.now(),
                        title: newPageTitle.trim(),
                        purpose: newPagePurpose.trim() || "Provide valuable information to clients",
                        sections: ["Hero Header", "Main Content Grid", "Call to Action"],
                        isExpanded: false,
                      };
                      setSitePages([...sitePages, newP]);
                      setNewPageTitle("");
                      setNewPagePurpose("");
                    }
                  }}
                  className="portal-btn portal-btn--ghost portal-btn--sm"
                >
                  <Plus size={13} /> Add Page
                </button>
              </div>
            </div>

            {/* Smart Feature Toggles */}
            <div className="portal-form-group" style={{ marginTop: "1.25rem" }}>
              <label className="portal-label">Smart Digital Features &amp; Integrations</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.625rem" }}>
                {FEATURE_OPTIONS.map((feat) => {
                  const isChecked = selectedFeatures.includes(feat.id);
                  return (
                    <div
                      key={feat.id}
                      onClick={() => {
                        setSelectedFeatures(
                          isChecked
                            ? selectedFeatures.filter(id => id !== feat.id)
                            : [...selectedFeatures, feat.id]
                        );
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        padding: "0.625rem 0.875rem",
                        borderRadius: 10,
                        border: `1px solid ${isChecked ? "#0d9488" : "rgba(255,255,255,0.08)"}`,
                        background: isChecked ? "rgba(13,148,136,0.1)" : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: "1.1rem" }}>{feat.icon}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: isChecked ? "#2dd4bf" : "#94a3b8", flex: 1 }}>
                        {feat.label}
                      </span>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          border: `1.5px solid ${isChecked ? "#2dd4bf" : "#64748b"}`,
                          background: isChecked ? "#2dd4bf" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isChecked && <Check size={11} color="#0a0f1d" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 5: DEDICATED ATTRACTIVE PLAN SELECTION
            ════════════════════════════════════════════════════════════════ */}
        {manualStep === 5 && (
          <div className="space-y-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div>
                <div className="portal-card-title" style={{ marginBottom: 2 }}>
                  <Zap size={16} /> Choose Your Grow Online Plan
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Every package includes high-speed SSD hosting, SSL certificate, automated backups, and South African DebiCheck debit order billing.
                </div>
              </div>
              <span className="portal-badge portal-badge--active" style={{ fontSize: "9px" }}>
                Step 5 of 6
              </span>
            </div>

            {/* AI Recommendation Alert */}
            <div
              style={{
                padding: "1rem 1.25rem",
                borderRadius: 14,
                background: "linear-gradient(135deg, rgba(13,148,136,0.15) 0%, rgba(15,23,42,0.6) 100%)",
                border: "1.5px solid rgba(45,212,191,0.4)",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <Sparkles size={16} color="#2dd4bf" />
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#2dd4bf", letterSpacing: "0.5px" }}>
                  RECOMMENDED FOR YOUR PROFILE: {planRecommendation.recommended.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
                {planRecommendation.rationale}
              </p>
            </div>

            {/* Plan Selection Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
              {AVAILABLE_PACKAGES.map(pkg => {
                const isSelected = selectedPackage.toLowerCase() === pkg.name.toLowerCase();
                const isRecommended = planRecommendation.recommended.toLowerCase() === pkg.name.toLowerCase();
                return (
                  <div
                    key={pkg.name}
                    onClick={() => setSelectedPackage(pkg.name)}
                    style={{
                      padding: "1.25rem",
                      borderRadius: 14,
                      border: `2px solid ${isSelected ? "#2dd4bf" : isRecommended ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                      background: isSelected ? "rgba(13,148,136,0.15)" : isRecommended ? "rgba(13,148,136,0.05)" : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      position: "relative",
                      transition: "all 0.2s",
                      boxShadow: isSelected ? "0 0 20px rgba(45,212,191,0.2)" : "none",
                    }}
                  >
                    {pkg.featured && (
                      <span style={{ position: "absolute", top: -10, right: 12, padding: "2px 8px", borderRadius: 999, background: "#0d9488", color: "#ffffff", fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>
                        Most Popular
                      </span>
                    )}
                    {isRecommended && !pkg.featured && (
                      <span style={{ position: "absolute", top: -10, right: 12, padding: "2px 8px", borderRadius: 999, background: "#0891b2", color: "#ffffff", fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>
                        AI Match
                      </span>
                    )}

                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#f8fafc" }}>{pkg.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>{pkg.label}</div>

                    <div style={{ fontSize: "1.6rem", fontWeight: 900, color: isSelected ? "#2dd4bf" : "#f8fafc", fontFamily: "monospace", margin: "0.75rem 0" }}>
                      R{pkg.fee}
                      <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#94a3b8" }}> / month</span>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: 700, marginBottom: "0.5rem" }}>
                      {pkg.pages} &bull; {pkg.care}
                    </div>

                    <div style={{ fontSize: "0.72rem", color: "#cbd5e1", lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.5rem", marginBottom: "1rem" }}>
                      {pkg.highlights.map((h, hIdx) => (
                        <div key={hIdx} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Check size={12} color="#2dd4bf" /> {h}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={`portal-btn ${isSelected ? "portal-btn--primary" : "portal-btn--ghost"} portal-btn--sm`}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      {isSelected ? "✓ Selected Plan" : "Choose This Plan"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* DebiCheck Transparency Guarantee */}
            <div style={{ padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.75rem", color: "#94a3b8" }}>
              <Shield size={16} color="#34d399" />
              <div>
                <strong>Zero-Risk Subscription:</strong> Month-to-month DebiCheck automated billing. No long-term lock-in contracts. Full hosting, security, and developer maintenance included.
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 6: BRAND ASSETS, SCOPE VERIFICATION & FINAL SUBMIT
            ════════════════════════════════════════════════════════════════ */}
        {manualStep === 6 && (
          <div className="space-y-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <div className="portal-card-title" style={{ marginBottom: 2 }}>
                  <CheckCircle2 size={16} /> Brand Assets &amp; Scope Verification Sign-off
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Upload your CIPC certificate, company logo, review your project blueprint, and verify your scope.
                </div>
              </div>
              <span className="portal-badge portal-badge--active" style={{ fontSize: "9px" }}>
                Step 6 of 6
              </span>
            </div>

            {/* Document Upload Area */}
            <div className="portal-form-group">
              <label className="portal-label">Upload Company Documents &amp; Brand Assets</label>
              <div
                style={{
                  border: "2px dashed rgba(45,212,191,0.3)",
                  borderRadius: 12,
                  padding: "1.5rem",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "rgba(45,212,191,0.03)",
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={28} color="#2dd4bf" style={{ margin: "0 auto 0.5rem", display: "block" }} />
                <div style={{ fontSize: "0.85rem", color: "#f8fafc", fontWeight: 700 }}>
                  Click to select CIPC Cor 14.3, Company Profile PDF, or Logo
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                  Supports PDF, PNG, SVG, JPG (up to 15MB each)
                </div>
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
                        color: "#e2e8f0",
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

            {/* Scope Summary Dossier */}
            <div className="portal-form-group">
              <label className="portal-label">Executive Blueprint Summary</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  ["Registered Company", businessName || "—"],
                  ["CIPC Registration", regNumber || "CIPC Pending"],
                  ["Physical Address", registeredAddress || "—"],
                  ["Director / Signatory", directorName || contactPerson || user.email],
                  ["Mobile / WhatsApp", phone || "—"],
                  ["Selected Plan", `${selectedPackage} (R${AVAILABLE_PACKAGES.find(p => p.name.toLowerCase() === selectedPackage.toLowerCase())?.fee || 349}/mo)`],
                  ["Trade Divisions", coreServices.slice(0, 5).join(", ") + (coreServices.length > 5 ? ` +${coreServices.length - 5} more` : "")],
                  ["Planned Pages", sitePages.map(p => p.title).join(", ")],
                  ["Key Features", selectedFeatures.map(f => FEATURE_OPTIONS.find(o => o.id === f)?.label || f).slice(0, 4).join(", ")],
                  ["Uploaded Documents", uploadedAssets.length > 0 ? uploadedAssets.map(a => a.name).join(", ") : "None uploaded"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      gap: "1rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#64748b", minWidth: 140, fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: "0.82rem", color: "#e2e8f0", flex: 1, fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandatory Scope Verification Sign-off Checkbox */}
            <div
              style={{
                marginTop: "1.25rem",
                padding: "1rem",
                borderRadius: 12,
                background: scopeVerified ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
                border: `1.5px solid ${scopeVerified ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.3)"}`,
              }}
            >
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={scopeVerified}
                  onChange={e => setScopeVerified(e.target.checked)}
                  style={{ marginTop: 3, accentColor: "#10b981", width: 16, height: 16 }}
                />
                <div style={{ fontSize: "0.82rem", color: "#f8fafc", lineHeight: 1.5 }}>
                  <strong>Client Scope Verification &amp; Authorization:</strong> I have reviewed and verify this business profile, planned website pages, and service divisions as our official digital brief for E&amp;L Digital.
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ── Wizard Navigation Actions ── */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {manualStep > 1 && (
            <button
              className="portal-btn portal-btn--ghost"
              onClick={() => setManualStep(s => (s - 1) as ManualStep)}
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}

          <button
            className="portal-btn portal-btn--ghost portal-btn--sm"
            onClick={() => saveManual()}
            disabled={busy}
          >
            {saved ? <><CheckCircle2 size={13} color="#34d399" /> Saved</> : "Save Progress"}
          </button>

          <div style={{ marginLeft: "auto" }}>
            {manualStep < 6 ? (
              <button
                className="portal-btn portal-btn--primary"
                onClick={async () => {
                  const next = (manualStep + 1) as ManualStep;
                  await saveManual(next);
                  setManualStep(next);
                }}
              >
                Next Step <ArrowRight size={14} />
              </button>
            ) : (
              <button
                className="portal-btn portal-btn--amber"
                disabled={busy || !businessName.trim() || !scopeVerified}
                onClick={finishManual}
                style={{ fontWeight: 800, padding: "0.625rem 1.5rem" }}
              >
                {busy ? (
                  <><RefreshCw size={14} className="animate-spin" /> Submitting Blueprint…</>
                ) : (
                  <><Zap size={14} /> Submit Onboarding &amp; Lock In Build Date <ArrowRight size={14} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
