import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Check, ArrowRight, ArrowLeft, Send, ShieldCheck,
  Building, User, Mail, Phone, Rocket, MessageSquare, CheckCircle2,
  Clock, DollarSign, ExternalLink, HelpCircle, Layers, Zap,
  UploadCloud, File, Image as ImageIcon, X, Lock, Eye, EyeOff,
  FileText, Briefcase, MapPin, Award, TrendingUp, AlertCircle, Plus
} from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/site-content";
import { partnerSchema, coreSchema, BRAND_ID } from "@/lib/supabase";
import { usePortalAuth } from "@/lib/portal-auth";
import {
  askGeminiArchitect,
  synthesizeScopeWithGemini,
  evaluateScopingProgress,
  type ChatMessage,
  type ScopingResult,
  type ScopingProgress
} from "@/lib/gemini";

export const Route = createFileRoute("/onboarding")({
  head: () =>
    pageHead(
      "AI Customer Onboarding & Project Scoping",
      "Create your E&L account and chat with our Gemini-powered AI Solutions Architect to get an instant scope analysis and tailored package recommendation.",
    ),
  component: OnboardingPage,
});

interface UploadedAsset {
  id: string;
  name: string;
  size: number;
  type: string;
}

const AVAILABLE_PLANS = [
  { name: "Spark", fee: 199, desc: "1-Page Presence, Hosting & Domain (Best for single-service side gigs)" },
  { name: "Build", fee: 349, desc: "3-5 Pages, RFQ Engine, Mailbox & Google Profile", featured: true },
  { name: "Starter", fee: 500, desc: "5 Pages, SEO & 30m Updates / mo" },
  { name: "Business", fee: 1200, desc: "Up to 10 Pages, Multi-service CMS & 120m Updates" },
  { name: "Professional", fee: 2200, desc: "20 Pages, Client Portal & 300m Updates" },
  { name: "Shop Start", fee: 799, desc: "eCommerce with Paystack (100 items)" },
  { name: "Shop Growth", fee: 1299, desc: "eCommerce Store (1,000 items)" },
];

const DEFAULT_CONTRACTOR_SERVICES = [
  "Precision Painting",
  "Waterproofing",
  "Tiling & Paving",
  "Plumbing Services",
  "Crack & Wall Repairs",
  "Estate Maintenance",
];

const DEFAULT_TARGET_MARKETS = [
  "Residential property owners",
  "Property management companies",
  "Body corporates & HOAs",
  "Residential estates",
  "Commercial property owners",
  "Rental & letting agencies",
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, register } = usePortalAuth();

  // Wizard Steps: 1 = Business Intake, 2 = AI Chat (if AI mode), 3 = Scope Review Dossier & Plan, 4 = Ready / Account
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Intake Mode: "ai" (Conversational Gemini Architect) vs "form" (Detailed Structured Intake)
  const [intakeMode, setIntakeMode] = useState<"ai" | "form">("ai");

  // Step 1: Core Company Profile
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("Construction & Engineering");

  // Detailed Company Fields (for Form Mode & Enhanced AI Dossier)
  const [regNumber, setRegNumber] = useState("");
  const [address, setAddress] = useState("");
  const [operatingAreas, setOperatingAreas] = useState("Gauteng");
  const [tagline, setTagline] = useState("");
  const [directorId, setDirectorId] = useState("");
  const [coreServices, setCoreServices] = useState<string[]>(DEFAULT_CONTRACTOR_SERVICES);
  const [newServiceInput, setNewServiceInput] = useState("");
  const [targetMarkets, setTargetMarkets] = useState<string[]>(DEFAULT_TARGET_MARKETS);
  const [workingApproach, setWorkingApproach] = useState(
    "1. Client consultation -> 2. Site inspection -> 3. Formal quotation -> 4. Planning & execution -> 5. Quality control -> 6. Handover"
  );

  // Step 2: AI Chat & Uploads
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Scope Analysis & Recommendation
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [scopingResult, setScopingResult] = useState<ScopingResult | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>("Build");
  const [isSaving, setIsSaving] = useState(false);

  // Step 4: Account creation state for guests
  const [accountPassword, setAccountPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Pre-fill if logged in
  useEffect(() => {
    if (user) {
      if (user.email && !email) setEmail(user.email);
      if (profile?.fullName && !contactPerson) setContactPerson(profile.fullName);
    }
  }, [user, profile]);

  // Dynamic scoping progress
  const scopingProgress: ScopingProgress = evaluateScopingProgress(messages, uploadedAssets.length);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  // Asset Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 20 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 20MB.`);
        return;
      }
      const asset: UploadedAsset = {
        id: "asset_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        name: file.name,
        size: file.size,
        type: file.type,
      };
      setUploadedAssets(prev => [...prev, asset]);
      setMessages(prev => [
        ...prev,
        { role: "user", text: `[Uploaded Document/Asset: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)]` }
      ]);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAsset = (id: string) => {
    setUploadedAssets(prev => prev.filter(a => a.id !== id));
  };

  const addCustomService = () => {
    if (!newServiceInput.trim()) return;
    if (!coreServices.includes(newServiceInput.trim())) {
      setCoreServices(prev => [...prev, newServiceInput.trim()]);
    }
    setNewServiceInput("");
  };

  const toggleService = (srv: string) => {
    if (coreServices.includes(srv)) {
      setCoreServices(prev => prev.filter(s => s !== srv));
    } else {
      setCoreServices(prev => [...prev, srv]);
    }
  };

  const toggleTargetMarket = (mkt: string) => {
    if (targetMarkets.includes(mkt)) {
      setTargetMarkets(prev => prev.filter(m => m !== mkt));
    } else {
      setTargetMarkets(prev => [...prev, mkt]);
    }
  };

  // Step 1 Submit: Launch AI Scoping or Synthesize Form Data
  const handleStartAiScoping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactPerson || !email) return;

    if (intakeMode === "ai") {
      if (messages.length === 0) {
        const greeting: ChatMessage = {
          role: "model",
          text: `Hello ${contactPerson}! Welcome to E&L Digital. I am your Senior AI Solutions Architect. I am ready to architect the ideal digital platform and care plan for "${businessName}". To start: what are your core service specializations, and do you target individual residential clients or commercial estate managers?`
        };
        setMessages([greeting]);
      }
      setStep(2);
    } else {
      // Form Mode: Directly build comprehensive review dossier
      await handleSynthesizeFormScope();
    }
  };

  // Generate Review Dossier directly from structured form inputs
  const handleSynthesizeFormScope = async () => {
    setIsSynthesizing(true);
    try {
      // Build synthesized scope from form fields
      const isMultiService = coreServices.length >= 3;
      const isCommercial = targetMarkets.some(m => m.toLowerCase().includes("commercial") || m.toLowerCase().includes("estate") || m.toLowerCase().includes("body corporate"));

      let recommendedPkg = "Build";
      let fee = 349;
      if (coreServices.length >= 6 || (isMultiService && isCommercial)) {
        recommendedPkg = "Build";
        fee = 349;
      }

      const dossier: ScopingResult = {
        recommendedPackage: recommendedPkg,
        monthlyFee: fee,
        leadScore: 96,
        projectTitle: `${businessName} Professional Property & Business Platform`,
        scopeSummary: `High-converting digital platform for ${businessName} tailored for ${operatingAreas}. Features dedicated service funnels for ${coreServices.slice(0, 3).join(", ")}, corporate RFQ quotation requests, and before/after workmanship showcase.`,
        keyFeatures: [
          `Multi-Page Service Funnels (${coreServices.slice(0, 4).join(", ")})`,
          "Commercial & Estate RFQ Quotation Engine",
          "Before / After Workmanship Project Gallery",
          "Direct WhatsApp Instant Inquiry & Callout Workflows",
          "Domain, SSL, Google Business Profile & Local SEO",
          "DebiCheck Retainer Care with 30m Monthly Updates"
        ],
        carePlanMinutes: 30,
        timeline: "1 to 2 Weeks",
        urgency: "Standard Priority",
        companyProfile: {
          registeredName: businessName,
          regNumber: regNumber || "2025/670159/07",
          address: address || "1268 Drieziek 4 Orange Farm, Johannesburg, Gauteng, 1841",
          operatingAreas: operatingAreas || "Gauteng",
          tagline: tagline || "Quality Workmanship. Precision. Reliability.",
          directorName: contactPerson,
          coreServices: coreServices.length > 0 ? coreServices : DEFAULT_CONTRACTOR_SERVICES,
          targetMarkets: targetMarkets.length > 0 ? targetMarkets : DEFAULT_TARGET_MARKETS,
          workingApproach: [
            "1. Client consultation & understanding of scope",
            "2. On-site inspection & technical assessment",
            "3. Preparation & submission of formal quotations",
            "4. Planning & execution of approved work",
            "5. Quality control & final inspection sign-off",
            "6. Project completion & client handover"
          ]
        },
        scopeAdoption: {
          requestedPlan: "Spark (R199/mo)",
          recommendedPlan: `${recommendedPkg} (R${fee}/mo)`,
          rationale: `With ${coreServices.length} specialized service lines targeting ${targetMarkets.length} distinct market segments (including commercial body corporates and residential estates), a 1-page Spark site cannot deliver the credibility or dedicated quotation funnels needed. Adopting the ${recommendedPkg} plan ensures your bids and tenders are taken seriously.`,
          upsellFeatures: [
            "Dedicated conversion pages for each service line",
            "Commercial RFQ quotation engine for estate managers",
            "Before / after project portfolio showcase",
            "Official business email (info@yourdomain.co.za)"
          ]
        },
        platformArchitecture: {
          suggestedPages: [
            { title: "Home", purpose: "Core identity, service highlights & verified CIPC credentials" },
            { title: "Services Breakdown", purpose: `Dedicated pages for ${coreServices.slice(0, 4).join(", ")}` },
            { title: "Commercial & Estates", purpose: "Tailored portal for Property Managers & Body Corporates" },
            { title: "Projects Gallery", purpose: "Before & after workmanship portfolio" },
            { title: "About & Compliance", purpose: "Director message, registration credentials & operating safety" },
            { title: "Request Quote / Contact", purpose: "Multi-step RFQ form with inspection scheduling" }
          ],
          integrations: ["WhatsApp Live Chat", "DebiCheck Care Plan", "Google Business Profile", "Custom Domain & SSL"]
        }
      };

      setScopingResult(dossier);
      setSelectedPackage(recommendedPkg);
      setStep(3);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Send message to Gemini AI Architect
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isAiTyping) return;

    const userMsg: ChatMessage = { role: "user", text: text.trim() };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputMessage("");
    setIsAiTyping(true);

    try {
      const replyText = await askGeminiArchitect(
        updatedHistory,
        text.trim(),
        { businessName, contactPerson, industry },
        uploadedAssets.map(a => `${a.name} (${a.type})`)
      );

      setMessages([...updatedHistory, { role: "model", text: replyText }]);
    } catch (err) {
      console.warn("AI Chat error:", err);
      setMessages([
        ...updatedHistory,
        {
          role: "model",
          text: `Thank you for sharing that, ${contactPerson}. We specialize in high-converting South African digital builds with automated DebiCheck care plans. Please make sure to upload your company profile PDF or CIPC certificate in the upload panel below so our team has your visual assets. How soon are you looking to launch?`
        }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Synthesize Scope & Recommend Plan from Chat
  const handleSynthesizeScope = async () => {
    setIsSynthesizing(true);
    try {
      const result = await synthesizeScopeWithGemini(messages, { businessName, contactPerson });
      // Merge any user-provided manual fields
      if (regNumber && result.companyProfile) result.companyProfile.regNumber = regNumber;
      if (address && result.companyProfile) result.companyProfile.address = address;
      if (operatingAreas && result.companyProfile) result.companyProfile.operatingAreas = operatingAreas;
      if (tagline && result.companyProfile) result.companyProfile.tagline = tagline;

      setScopingResult(result);
      setSelectedPackage(result.recommendedPackage);
      setStep(3);
    } catch (err) {
      console.warn("Synthesis fallback:", err);
      await handleSynthesizeFormScope();
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Step 3 Submit: Confirm Plan & Save to Supabase (partner.onboardings & core.companies)
  const handleConfirmPlan = async () => {
    if (!scopingResult) return;
    setIsSaving(true);

    try {
      const sessionId = "ob_web_" + Date.now();

      // 1. Save to partner.onboardings
      await partnerSchema()
        .from("onboardings")
        .upsert({
          brand_id: BRAND_ID,
          session_id: sessionId,
          user_id: user?.id || null,
          client_name: contactPerson,
          client_email: email,
          client_phone: phone || null,
          business_name: businessName,
          industry: industry || "General Business",
          target_audience: scopingResult.companyProfile?.targetMarkets?.join(", ") || targetMarkets.join(", "),
          business_goals: scopingResult.projectTitle,
          selected_package_code: selectedPackage,
          current_step: 4,
          total_steps: 4,
          ai_readiness_score: scopingResult.leadScore || 95,
          ai_recommendation: scopingResult.scopeSummary || `Recommended plan: ${selectedPackage} at R${scopingResult.monthlyFee}/month`,
          required_features: scopingResult.keyFeatures || [],
          chat_history: messages,
          status: user ? "completed" : "in_progress",
        }, { onConflict: "session_id" });

      // 2. Also upsert into core.companies with CIPC and enriched scope data
      try {
        const companyPayload: any = {
          brand_id: BRAND_ID,
          name: businessName,
          contact_email: email,
          phone: phone || null,
          industry: industry || "General Business",
          status: "active",
        };
        const finalReg = regNumber || scopingResult.companyProfile?.regNumber;
        if (finalReg) companyPayload.registration_number = finalReg;

        const finalAddr = address || scopingResult.companyProfile?.address;
        if (finalAddr) companyPayload.address = finalAddr;

        const finalArea = operatingAreas || scopingResult.companyProfile?.operatingAreas;
        if (finalArea) companyPayload.province = finalArea;

        companyPayload.settings = {
          slogan: tagline || scopingResult.companyProfile?.tagline,
          director_name: contactPerson,
          director_id: directorId,
          core_services: coreServices.length > 0 ? coreServices : scopingResult.companyProfile?.coreServices || [],
          target_market: targetMarkets.length > 0 ? targetMarkets : scopingResult.companyProfile?.targetMarkets || [],
          working_approach: scopingResult.companyProfile?.workingApproach || [],
          scope_adoption: scopingResult.scopeAdoption,
          dossier: {
            projectTitle: scopingResult.projectTitle,
            leadScore: scopingResult.leadScore,
            platformArchitecture: scopingResult.platformArchitecture,
          }
        };

        await coreSchema().from("companies").upsert(companyPayload, { onConflict: "contact_email" });
      } catch (compErr) {
        console.warn("Company upsert note:", compErr);
      }

      setStep(4);
    } catch (err: any) {
      console.error("Onboarding save error:", err?.message || err);
      setStep(4);
    } finally {
      setIsSaving(false);
    }
  };

  // Step 4: Register Account for Unauthenticated Guest
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!accountPassword || accountPassword.length < 8) {
      setAuthError("Password must be at least 8 characters long.");
      return;
    }

    setIsCreatingAccount(true);
    try {
      const displayName = businessName.trim()
        ? `${contactPerson} (${businessName.trim()})`
        : contactPerson;

      const { error: regErr } = await register(email, accountPassword, displayName, {
        selected_plan: selectedPackage,
        company_name: businessName,
        phone,
      });

      if (regErr) {
        setAuthError(regErr);
      } else {
        setAccountCreated(true);
      }
    } catch {
      setAuthError("Failed to initialize client account. Please try again.");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <SiteLayout>
      <div className="inner-page site-width py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Progress Stepper */}
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              <Sparkles size={13} />
              <span>AI SOLUTIONS ARCHITECT &bull; ENTERPRISE ONBOARDING</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Customer Onboarding &amp; Scope Architecture
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Configure your business profile, upload CIPC documentation and company profiles, scope your service lines with our AI Architect, and activate your Grow Online plan.
            </p>

            {/* Stepper Bar */}
            <div className="flex items-center justify-center gap-3 pt-4 text-xs font-bold">
              <div className={`flex items-center gap-2 ${step >= 1 ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-teal-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                  1
                </span>
                <span>Profile &amp; Intake</span>
              </div>
              <div className={`w-10 h-0.5 ${step >= 2 ? "bg-teal-600" : "bg-border"}`} />
              <div className={`flex items-center gap-2 ${step >= 2 ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-teal-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                  2
                </span>
                <span>{intakeMode === "ai" ? "AI Scoping" : "Review Ready"}</span>
              </div>
              <div className={`w-10 h-0.5 ${step >= 3 ? "bg-teal-600" : "bg-border"}`} />
              <div className={`flex items-center gap-2 ${step >= 3 ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? "bg-teal-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                  3
                </span>
                <span>Scope Dossier</span>
              </div>
              <div className={`w-10 h-0.5 ${step >= 4 ? "bg-teal-600" : "bg-border"}`} />
              <div className={`flex items-center gap-2 ${step >= 4 ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 4 ? "bg-teal-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                  4
                </span>
                <span>Ready</span>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
             STEP 1: ACCOUNT & BUSINESS PROFILE INTAKE (AI vs FORM MODE)
             ════════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="rounded-3xl border border-glass-border bg-card p-6 sm:p-10 shadow-xl space-y-6 animate-in fade-in duration-200">
              
              {/* Intake Mode Selector */}
              <div className="p-1.5 rounded-2xl bg-secondary/60 border border-border/60 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIntakeMode("ai")}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    intakeMode === "ai"
                      ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Sparkles size={16} />
                  <span>AI Solutions Architect (Recommended)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIntakeMode("form")}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    intakeMode === "form"
                      ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <FileText size={16} />
                  <span>Detailed Company Intake Form</span>
                </button>
              </div>

              <div className="border-b border-border/60 pb-3">
                <h2 className="text-xl font-bold text-foreground">
                  {intakeMode === "ai" ? "Step 1: Quick Business Context" : "Step 1: Comprehensive Company Registration"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {intakeMode === "ai"
                    ? "Enter your primary details, then chat with our AI Architect to explore your services and scope."
                    : "Fill in your full CIPC details, service divisions, target audience, and upload company documents directly."}
                </p>
              </div>

              <form onSubmit={handleStartAiScoping} className="space-y-5 text-xs">
                {/* Core Contact Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1">Company / Business Name *</label>
                    <div className="relative">
                      <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. First Class Fixers (Pty) Ltd"
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1">Primary Contact Person / Director *</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Emmanuel Rabotsi"
                        value={contactPerson}
                        onChange={e => setContactPerson(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1">Business Email Address *</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. zigarabotsi@gmail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1">Mobile / WhatsApp Number *</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 068 179 4935"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Industry / Sector</label>
                  <select
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="Construction & Engineering">Construction, Renovation &amp; Property Maintenance</option>
                    <option value="Healthcare / Medical Practice">Healthcare / Medical Practice / Dental</option>
                    <option value="Legal & Professional Advisory">Legal &amp; Professional Advisory</option>
                    <option value="eCommerce & Retail Products">eCommerce &amp; Retail Products</option>
                    <option value="Logistics & Transport">Logistics &amp; Transport</option>
                    <option value="Hospitality & Tourism">Hospitality &amp; Tourism</option>
                    <option value="Technology & SaaS">Technology &amp; SaaS</option>
                    <option value="General Business">General Business</option>
                  </select>
                </div>

                {/* Additional Detailed Fields in Form Mode */}
                {intakeMode === "form" && (
                  <div className="space-y-4 pt-4 border-t border-border/60 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-foreground mb-1">CIPC Company Registration Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 2025/670159/07"
                          value={regNumber}
                          onChange={e => setRegNumber(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-foreground mb-1">Director ID / Date of Birth</label>
                        <input
                          type="text"
                          placeholder="e.g. 0203185495082"
                          value={directorId}
                          onChange={e => setDirectorId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-foreground mb-1">Physical / Registered Business Address</label>
                        <div className="relative">
                          <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="e.g. 1268 Drieziek 4 Orange Farm, Johannesburg, 1841"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-foreground mb-1">Operating Areas / Province</label>
                        <input
                          type="text"
                          placeholder="e.g. Gauteng / Johannesburg"
                          value={operatingAreas}
                          onChange={e => setOperatingAreas(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-foreground mb-1">Company Slogan / Tagline</label>
                      <input
                        type="text"
                        placeholder="e.g. Quality Workmanship. Precision. Reliability."
                        value={tagline}
                        onChange={e => setTagline(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>

                    {/* Core Services Selection */}
                    <div>
                      <label className="block font-bold text-foreground mb-1">
                        Core Service Lines &amp; Capabilities ({coreServices.length} selected)
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {coreServices.map((srv, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30"
                          >
                            <span>{srv}</span>
                            <button type="button" onClick={() => toggleService(srv)} className="hover:text-red-500">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add another service (e.g. Estate Maintenance, Roof Repairs)..."
                          value={newServiceInput}
                          onChange={e => setNewServiceInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomService())}
                          className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs"
                        />
                        <Button type="button" onClick={addCustomService} variant="glass" className="pill-button text-xs py-1 px-3">
                          <Plus size={13} /> Add
                        </Button>
                      </div>
                    </div>

                    {/* Target Markets */}
                    <div>
                      <label className="block font-bold text-foreground mb-1">Target Markets &amp; Clientele</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {DEFAULT_TARGET_MARKETS.map((mkt, idx) => (
                          <label
                            key={idx}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                              targetMarkets.includes(mkt)
                                ? "border-teal-500/50 bg-teal-500/10 text-foreground font-semibold"
                                : "border-border/60 bg-background text-muted-foreground"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={targetMarkets.includes(mkt)}
                              onChange={() => toggleTargetMarket(mkt)}
                              className="rounded text-teal-600 focus:ring-teal-500"
                            />
                            <span>{mkt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Upload CIPC / Profile Documents */}
                    <div>
                      <label className="block font-bold text-foreground mb-1">
                        CIPC Registration Certificate, Company Profile or Logo
                      </label>
                      <div className="p-4 rounded-2xl border border-dashed border-border/80 bg-background/50 flex flex-col items-center justify-center text-center gap-2">
                        <UploadCloud size={24} className="text-teal-600" />
                        <div>
                          <p className="font-bold text-foreground text-xs">Upload CIPC Cor 14.3, Company Profile PDF, or Logo</p>
                          <p className="text-[11px] text-muted-foreground">PDF, PNG, SVG or Word doc up to 20MB</p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          variant="glass"
                          className="pill-button text-xs py-1.5 px-4"
                        >
                          <UploadCloud size={13} /> Select Files
                        </Button>
                      </div>

                      {uploadedAssets.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {uploadedAssets.map(asset => (
                            <div
                              key={asset.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-500/30 text-[11px] font-semibold text-foreground"
                            >
                              <File size={12} className="text-teal-600" />
                              <span>{asset.name}</span>
                              <button
                                type="button"
                                onClick={() => removeAsset(asset.id)}
                                className="hover:text-red-500 ml-1"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-between items-center border-t border-border/60">
                  {user ? (
                    <span className="text-xs text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Signed in as {user.email}
                    </span>
                  ) : (
                    <Link to="/portal/login" className="text-xs text-muted-foreground hover:text-foreground">
                      Already have an account? Sign In &rarr;
                    </Link>
                  )}
                  <Button type="submit" variant="brand" className="pill-button font-bold text-sm px-6">
                    {intakeMode === "ai" ? "Start AI Scoping Session" : "Generate Scope & Review Plan"} <ArrowRight size={15} />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
             STEP 2: INTERACTIVE AI SCOPING CHAT & ASSET UPLOAD
             ════════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="rounded-3xl border border-glass-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
              {/* Chat Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/60 gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/20">
                      <Sparkles size={18} />
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 border-2 border-card" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-foreground">E&amp;L AI Solutions Architect</div>
                    <div className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold">Gemini Intelligence &bull; Live Scoping for {businessName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSynthesizeScope}
                    disabled={isSynthesizing || messages.length < 2}
                    variant={scopingProgress.isReadyToProceed ? "brand" : "glass"}
                    className="pill-button text-xs font-bold"
                  >
                    {isSynthesizing ? "Synthesizing Scope..." : "Review Scope & Select Plan"} <ArrowRight size={13} />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/50 text-xs">
                <div className="flex justify-between items-center mb-1.5 font-bold">
                  <span className="text-foreground">Scoping Progress: {scopingProgress.summaryHint}</span>
                  <span className="text-teal-700 dark:text-teal-400 font-mono">{scopingProgress.progressPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${scopingProgress.progressPct}%` }}
                  />
                </div>
              </div>

              {/* Asset Upload Widget */}
              <div className="p-3.5 rounded-2xl border bg-teal-500/10 border-teal-500/30 text-xs">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <UploadCloud size={16} className="text-teal-600 shrink-0" />
                    <div>
                      <span className="font-bold text-foreground">CIPC Documents &amp; Brand Assets</span>
                      <p className="text-[11px] text-muted-foreground">Upload your CIPC COR 14.3, Company Profile PDF, or Logo</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="glass"
                    className="pill-button text-xs py-1 px-3 h-auto"
                  >
                    <UploadCloud size={12} /> Select Files
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*,application/pdf,.doc,.docx"
                    className="hidden"
                  />
                </div>

                {uploadedAssets.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2.5 pt-2 border-t border-border/40">
                    {uploadedAssets.map(asset => (
                      <div
                        key={asset.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-500/30 text-[11px] font-semibold text-foreground"
                      >
                        {asset.type.includes("image") ? <ImageIcon size={12} className="text-teal-600" /> : <File size={12} className="text-teal-600" />}
                        <span>{asset.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAsset(asset.id)}
                          className="hover:text-red-500 transition-colors ml-1"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Messages Log */}
              <div className="h-[360px] overflow-y-auto space-y-3.5 pr-2">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-teal-600 text-white font-medium rounded-br-none shadow-sm"
                          : "bg-secondary/70 text-foreground border border-border/60 rounded-bl-none shadow-xs"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="p-3.5 rounded-2xl bg-secondary/60 text-muted-foreground border border-border/40 text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                      <span>AI Solutions Architect is analyzing your business scope...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="pt-2 border-t border-border/50">
                <div className="text-[11px] text-muted-foreground font-semibold mb-2">Discuss your services &amp; market positioning:</div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    "We offer 6 property maintenance service lines (Painting, Waterproofing, Plumbing, Tiling, Wall Repairs, Estate Care)",
                    "We target commercial body corporates, estates and residential property owners",
                    "We need an RFQ quotation generator, project gallery, and WhatsApp booking",
                    "We have uploaded our CIPC registration and company profile"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(chip)}
                      className="px-3 py-1.5 rounded-full bg-secondary hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300 border border-border/60 transition-all text-left"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Describe your services, target clients, CIPC details or platform requirements..."
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 px-4 py-3 rounded-2xl border border-border bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isAiTyping}
                  variant="brand"
                  className="pill-button font-bold px-5"
                >
                  <Send size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
             STEP 3: KIRA-STYLE COMPREHENSIVE SCOPE REVIEW DOSSIER
             ════════════════════════════════════════════════════════════════════ */}
          {step === 3 && scopingResult && (
            <div className="rounded-3xl border border-glass-border bg-card p-6 sm:p-10 shadow-xl space-y-6 animate-in fade-in duration-200">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-3 pb-4 border-b border-border/60">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 tracking-wider uppercase mb-1">
                    <Award size={14} />
                    <span>EXECUTIVE ARCHITECTURE DOSSIER</span>
                  </div>
                  <h2 className="text-2xl font-black text-foreground">{scopingResult.projectTitle}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Prepared for <strong>{businessName}</strong> &bull; Lead Architect Scoping Review
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                    Readiness Score: {scopingResult.leadScore}/100
                  </div>
                  <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-secondary text-foreground border border-border">
                    {scopingResult.urgency}
                  </div>
                </div>
              </div>

              {/* 1. Verified Company & Compliance Identity */}
              {scopingResult.companyProfile && (
                <div className="p-4 sm:p-5 rounded-2xl bg-secondary/50 border border-border/60 space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-foreground uppercase tracking-wider text-[11px] text-teal-700 dark:text-teal-400">
                    <ShieldCheck size={14} />
                    <span>Company &amp; Compliance Identity</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-background border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Registered Entity</span>
                      <strong className="text-foreground text-xs">{scopingResult.companyProfile.registeredName || businessName}</strong>
                      {scopingResult.companyProfile.regNumber && (
                        <span className="text-[11px] text-teal-700 dark:text-teal-400 block font-mono mt-0.5">
                          Reg: {scopingResult.companyProfile.regNumber}
                        </span>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Operating Hub &amp; Address</span>
                      <span className="text-foreground text-xs font-medium block">
                        {scopingResult.companyProfile.address || address || "Gauteng, South Africa"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Brand Slogan &amp; Positioning</span>
                      <span className="text-foreground text-xs italic block">
                        "{scopingResult.companyProfile.tagline || tagline || "First-Class Workmanship. Every Time."}"
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Service Divisions Matrix */}
              {scopingResult.companyProfile?.coreServices && scopingResult.companyProfile.coreServices.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Briefcase size={13} className="text-teal-600" />
                    <span>Specialized Service Divisions ({scopingResult.companyProfile.coreServices.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {scopingResult.companyProfile.coreServices.map((srv, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-800 dark:text-teal-200 border border-teal-500/20 text-xs font-semibold"
                      >
                        ✓ {srv}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Scope Adoption Alert (Upsell Rationale) */}
              {scopingResult.scopeAdoption && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                    <TrendingUp size={15} />
                    <span>Strategic Scope Adoption Analysis</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {scopingResult.scopeAdoption.rationale}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
                      <span className="text-[10px] text-muted-foreground uppercase block font-bold">Standard 1-Page Tier</span>
                      <span className="text-foreground font-semibold">Single landing scroll (Lacks commercial trust &amp; multi-service RFQ)</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30">
                      <span className="text-[10px] text-teal-800 dark:text-teal-300 uppercase block font-bold">Recommended Architecture</span>
                      <span className="text-foreground font-bold">Dedicated service funnels + Commercial RFQ portal</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Platform Architecture & Blueprint */}
              {scopingResult.platformArchitecture?.suggestedPages && (
                <div className="space-y-2.5">
                  <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers size={13} className="text-teal-600" />
                    <span>Recommended Platform Pages ({scopingResult.platformArchitecture.suggestedPages.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    {scopingResult.platformArchitecture.suggestedPages.map((page, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-secondary/50 border border-border/60 space-y-0.5">
                        <strong className="text-foreground block">{page.title}</strong>
                        <span className="text-muted-foreground text-[11px] leading-tight block">{page.purpose}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Included Technical Deliverables */}
              <div className="space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-teal-600" />
                  <span>Verified Deliverables &amp; Infrastructure:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {scopingResult.keyFeatures.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-background border border-border/50">
                      <Check size={14} className="text-teal-600 shrink-0" />
                      <span className="font-semibold text-foreground">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Plan Choice Selector */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-foreground">Confirm Your Grow Online Subscription Plan:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {AVAILABLE_PLANS.map(plan => {
                    const isSelected = selectedPackage.toLowerCase() === plan.name.toLowerCase();
                    const isRecommended = scopingResult.recommendedPackage.toLowerCase() === plan.name.toLowerCase();
                    return (
                      <button
                        key={plan.name}
                        type="button"
                        onClick={() => setSelectedPackage(plan.name)}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                          isSelected
                            ? "border-teal-500 bg-teal-500/15 ring-2 ring-teal-500/20 shadow-md"
                            : "border-border bg-background hover:bg-secondary/40"
                        }`}
                      >
                        {isRecommended && (
                          <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-teal-600 text-white shadow">
                            RECOMMENDED
                          </span>
                        )}
                        <div className="font-bold text-foreground text-sm">{plan.name}</div>
                        <div className="font-mono font-extrabold text-teal-700 dark:text-teal-300 mt-0.5">R{plan.fee}/mo</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{plan.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-border/60">
                <Button
                  onClick={() => setStep(intakeMode === "ai" ? 2 : 1)}
                  variant="glass"
                  className="pill-button text-xs font-semibold"
                >
                  <ArrowLeft size={14} /> Back
                </Button>

                <Button
                  onClick={handleConfirmPlan}
                  disabled={isSaving}
                  variant="brand"
                  className="pill-button text-sm font-bold px-8"
                >
                  {isSaving ? "Activating Brief..." : "Confirm Plan & Continue"} <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
             STEP 4: CONFIRMED & ACCOUNT CONTINUITY
             ════════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="rounded-3xl border border-glass-border bg-card p-8 sm:p-12 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={36} />
              </div>

              <div className="text-center">
                <span className="text-xs font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-widest">
                  ONBOARDING BRIEF SAVED
                </span>
                <h2 className="text-3xl font-black text-foreground mt-1">Welcome to E&amp;L Digital!</h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-2">
                  Your project scope for <strong>{businessName}</strong> under the <strong>{selectedPackage}</strong> plan has been received.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-secondary/50 border border-border/60 max-w-md mx-auto text-xs text-left space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Client Company:</span>
                  <span className="font-bold text-foreground">{businessName}</span>
                </div>
                {regNumber && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>CIPC Registration:</span>
                    <span className="font-bold font-mono text-foreground">{regNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Selected Package:</span>
                  <span className="font-bold text-teal-700 dark:text-teal-300">{selectedPackage}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Contact Email:</span>
                  <span className="font-bold text-foreground">{email}</span>
                </div>
                {operatingAreas && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Region:</span>
                    <span className="font-bold text-foreground">{operatingAreas}</span>
                  </div>
                )}
              </div>

              {/* If user is ALREADY logged in: instant link to portal */}
              {user ? (
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate({ to: "/portal/dashboard" })}
                    variant="brand"
                    className="pill-button font-bold text-sm px-8 py-3"
                  >
                    Enter Client Portal <ArrowRight size={15} />
                  </Button>
                </div>
              ) : (
                /* Unauthenticated Guest: Set password to activate client portal */
                <div className="max-w-md mx-auto space-y-4 pt-4 border-t border-border/60">
                  {accountCreated ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        Account created successfully! Check your email to verify your address, then enter your client dashboard.
                      </p>
                      <Button
                        onClick={() => navigate({ to: "/portal/dashboard" })}
                        variant="brand"
                        className="pill-button text-xs font-bold"
                      >
                        Go to Client Portal <ArrowRight size={14} />
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateAccount} className="space-y-3 text-left">
                      <div className="text-center pb-2">
                        <div className="font-bold text-sm text-foreground">Activate Your Client Portal</div>
                        <p className="text-[11px] text-muted-foreground">Set a secure password to track your build, review milestones, and manage care updates.</p>
                      </div>

                      {authError && (
                        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs text-center font-medium">
                          {authError}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">Account Email</label>
                        <input
                          type="email"
                          disabled
                          value={email}
                          className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/50 text-muted-foreground text-xs font-mono cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">Create Password (min. 8 characters) *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="••••••••"
                            value={accountPassword}
                            onChange={e => setAccountPassword(e.target.value)}
                            className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isCreatingAccount}
                        variant="brand"
                        className="w-full pill-button font-bold text-xs py-2.5 mt-2"
                      >
                        {isCreatingAccount ? "Activating Portal..." : "Activate Account & Enter Portal"} <Rocket size={14} />
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </SiteLayout>
  );
}
