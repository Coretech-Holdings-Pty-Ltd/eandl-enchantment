import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Check, ArrowRight, ArrowLeft, Send, ShieldCheck,
  Building, User, Mail, Phone, Rocket, MessageSquare, CheckCircle2,
  Clock, DollarSign, ExternalLink, HelpCircle, Layers, Zap,
  UploadCloud, File, Image as ImageIcon, X, Lock, Eye, EyeOff
} from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/site-content";
import { partnerSchema, BRAND_ID } from "@/lib/supabase";
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
  { name: "Spark", fee: 199, desc: "1-Page Presence & Domain" },
  { name: "Build", fee: 349, desc: "3 Pages, Mailbox & Google Profile", featured: true },
  { name: "Starter", fee: 500, desc: "5 Pages, SEO & 30m Updates" },
  { name: "Business", fee: 1200, desc: "10 Pages, CMS & 120m Updates" },
  { name: "Professional", fee: 2200, desc: "20 Pages, Portal & 300m Updates" },
  { name: "Shop Start", fee: 799, desc: "eCommerce with Paystack (100 items)" },
  { name: "Shop Growth", fee: 1299, desc: "eCommerce Store (1,000 items)" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, register } = usePortalAuth();

  // Wizard Steps: 1 = Account, 2 = AI Chat, 3 = Recommendation & Plan Confirm, 4 = Account Creation / Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Account Info
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("Healthcare / Medical Practice");

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
      if (file.size > 15 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 15MB.`);
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
        { role: "user", text: `[Uploaded Brand Asset: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)]` }
      ]);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAsset = (id: string) => {
    setUploadedAssets(prev => prev.filter(a => a.id !== id));
  };

  // Step 1 Submit: Create Initial Session & Start AI Scoping
  const handleStartAiScoping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactPerson || !email) return;

    if (messages.length === 0) {
      const greeting: ChatMessage = {
        role: "model",
        text: `Hello ${contactPerson}! Welcome to E&L Digital. I am your dedicated AI Solutions Architect. I will help scope the perfect digital build and care plan for "${businessName}". Tell me: what is the main goal of your project, and what specific features (like online booking, ecommerce, or quote requests) do you envision?`
      };
      setMessages([greeting]);
    }
    setStep(2);
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
          text: `Thank you for sharing that, ${contactPerson}. We specialize in high-converting South African digital builds with automated DebiCheck care plans. Please make sure to upload your logo or company profile in the upload panel below so our team has your visual assets. How soon are you looking to launch?`
        }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Synthesize Scope & Recommend Plan
  const handleSynthesizeScope = async () => {
    setIsSynthesizing(true);
    try {
      const result = await synthesizeScopeWithGemini(messages, { businessName, contactPerson });
      setScopingResult(result);
      setSelectedPackage(result.recommendedPackage);
      setStep(3);
    } catch (err) {
      console.warn("Synthesis fallback:", err);
      const fallback: ScopingResult = {
        recommendedPackage: "Build",
        monthlyFee: 349,
        leadScore: 92,
        projectTitle: `${businessName} Professional Digital Build`,
        scopeSummary: "Comprehensive business presence with domain, business mailbox, Google SEO, responsive mobile design, and 30 minutes of monthly updates.",
        keyFeatures: [
          "Up to 3 Custom Responsive Pages",
          "Connect Your Own Domain & SSL",
          "1 Professional Business Mailbox",
          "Google Business Profile Setup",
          "Growth Community Access"
        ],
        carePlanMinutes: 30,
        timeline: "1 to 2 Weeks",
        urgency: "Standard Priority"
      };
      setScopingResult(fallback);
      setSelectedPackage(fallback.recommendedPackage);
      setStep(3);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Step 3 Submit: Confirm Plan & Save to Supabase
  const handleConfirmPlan = async () => {
    if (!scopingResult) return;
    setIsSaving(true);

    try {
      const sessionId = "ob_web_" + Date.now();

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
          target_audience: "Customers & Clients",
          business_goals: scopingResult.projectTitle,
          selected_package_code: selectedPackage,
          current_step: 4,
          total_steps: 4,
          ai_readiness_score: scopingResult.leadScore || 90,
          ai_recommendation: scopingResult.scopeSummary || `Recommended plan: ${selectedPackage} at R${scopingResult.monthlyFee}/month`,
          chat_history: messages,
          status: user ? "completed" : "in_progress",
        }, { onConflict: "session_id" });

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
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Header Progress Stepper */}
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              <Sparkles size={13} />
              <span>GEMINI 3.5 AI SOLUTIONS ARCHITECT</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Customer Onboarding &amp; Project Scoping
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
              Set up your profile, scope your requirements with our Gemini AI Solutions Architect, upload brand assets, and activate your Grow Online plan.
            </p>

            {/* Stepper Bar */}
            <div className="flex items-center justify-center gap-3 pt-4 text-xs font-bold">
              <div className={`flex items-center gap-2 ${step >= 1 ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-teal-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                  1
                </span>
                <span>Profile</span>
              </div>
              <div className={`w-10 h-0.5 ${step >= 2 ? "bg-teal-600" : "bg-border"}`} />
              <div className={`flex items-center gap-2 ${step >= 2 ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-teal-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                  2
                </span>
                <span>AI Scoping</span>
              </div>
              <div className={`w-10 h-0.5 ${step >= 3 ? "bg-teal-600" : "bg-border"}`} />
              <div className={`flex items-center gap-2 ${step >= 3 ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? "bg-teal-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                  3
                </span>
                <span>Plan</span>
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
             STEP 1: ACCOUNT & BUSINESS PROFILE
             ════════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="rounded-3xl border border-glass-border bg-card p-6 sm:p-10 shadow-xl space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-border/60 pb-4">
                <h2 className="text-xl font-bold text-foreground">Step 1: Business Profile</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter your business contact details to initialize your E&amp;L client workspace.
                </p>
              </div>

              <form onSubmit={handleStartAiScoping} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1">Company / Business Name *</label>
                    <div className="relative">
                      <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Dental Care (Pty) Ltd"
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1">Primary Contact Person *</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Z. Mthethwa"
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
                        placeholder="e.g. client@apexdental.co.za"
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
                        placeholder="e.g. +27 82 450 1192"
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
                    <option value="Healthcare / Medical Practice">Healthcare / Medical Practice / Dental</option>
                    <option value="Legal & Professional Advisory">Legal &amp; Professional Advisory</option>
                    <option value="eCommerce & Retail Products">eCommerce &amp; Retail Products</option>
                    <option value="Logistics & Transport">Logistics &amp; Transport</option>
                    <option value="Construction & Engineering">Construction &amp; Engineering</option>
                    <option value="Hospitality & Tourism">Hospitality &amp; Tourism</option>
                    <option value="Technology & SaaS">Technology &amp; SaaS</option>
                    <option value="General Business">General Business</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-between items-center">
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
                    Start AI Scoping <ArrowRight size={15} />
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
                    <div className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold">Gemini 3.5 Intelligence &bull; Live Scoping</div>
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
              <div
                className={`p-3.5 rounded-2xl border transition-all text-xs ${
                  scopingProgress.hasRequestedUploads
                    ? "bg-teal-500/10 border-teal-500/30"
                    : "bg-background border-border/60"
                }`}
              >
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <UploadCloud size={16} className="text-teal-600 shrink-0" />
                    <div>
                      <span className="font-bold text-foreground">Brand Assets &amp; Documents</span>
                      <p className="text-[11px] text-muted-foreground">Upload your logo (PNG/SVG) or company profile (PDF)</p>
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
                      <span>AI Solutions Architect is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="pt-2 border-t border-border/50">
                <div className="text-[11px] text-muted-foreground font-semibold mb-2">Quick Ideas to discuss:</div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    "We need patient online booking with calendar sync",
                    "We want an eCommerce shop with Paystack checkout",
                    "We have uploaded our logo and company profile",
                    "We need 5 custom pages with Google SEO and WhatsApp chat"
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
                  placeholder="Describe what you want your website or digital platform to do..."
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
             STEP 3: SCOPE ANALYSIS & RECOMMENDED PLAN
             ════════════════════════════════════════════════════════════════════ */}
          {step === 3 && scopingResult && (
            <div className="rounded-3xl border border-glass-border bg-card p-6 sm:p-10 shadow-xl space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-3 pb-4 border-b border-border/60">
                <div>
                  <div className="text-xs font-bold text-teal-700 dark:text-teal-400 tracking-wider uppercase">AI SYNTHESIS COMPLETE</div>
                  <h2 className="text-2xl font-extrabold text-foreground mt-0.5">{scopingResult.projectTitle}</h2>
                </div>
                <div className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  Lead Score: {scopingResult.leadScore}/100
                </div>
              </div>

              {/* Scope Summary Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-secondary/50 border border-border/60 space-y-2 text-xs sm:text-sm">
                <div className="font-bold text-foreground">Executive Scope Summary:</div>
                <p className="text-muted-foreground leading-relaxed">{scopingResult.scopeSummary}</p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Included Deliverables:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {scopingResult.keyFeatures.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-background border border-border/50">
                      <Check size={14} className="text-teal-600 shrink-0" />
                      <span className="font-semibold text-foreground">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plan Choice Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-foreground">Select Your Preferred Grow Online Plan:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {AVAILABLE_PLANS.map(plan => {
                    const isSelected = selectedPackage.toLowerCase() === plan.name.toLowerCase();
                    return (
                      <button
                        key={plan.name}
                        type="button"
                        onClick={() => setSelectedPackage(plan.name)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "border-teal-500 bg-teal-500/15 ring-2 ring-teal-500/20"
                            : "border-border bg-background hover:bg-secondary/40"
                        }`}
                      >
                        <div className="font-bold text-foreground">{plan.name}</div>
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
                  onClick={() => setStep(2)}
                  variant="glass"
                  className="pill-button text-xs font-semibold"
                >
                  <ArrowLeft size={14} /> Back to Scoping Chat
                </Button>

                <Button
                  onClick={handleConfirmPlan}
                  disabled={isSaving}
                  variant="brand"
                  className="pill-button text-sm font-bold px-8"
                >
                  {isSaving ? "Saving Brief..." : "Confirm Plan & Continue"} <ArrowRight size={15} />
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
                <div className="flex justify-between text-muted-foreground">
                  <span>Selected Package:</span>
                  <span className="font-bold text-teal-700 dark:text-teal-300">{selectedPackage}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Contact Email:</span>
                  <span className="font-bold text-foreground">{email}</span>
                </div>
              </div>

              {/* If user is ALREADY logged in: instant link to portal */}
              {user ? (
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate({ to: "/portal/dashboard" })}
                    variant="brand"
                    className="pill-button font-bold text-sm px-8 py-3"
                  >
                    Open Client Portal Dashboard <ArrowRight size={15} />
                  </Button>
                  <Button
                    onClick={() => navigate({ to: "/portal/onboarding" })}
                    variant="glass"
                    className="pill-button text-sm px-8 py-3"
                  >
                    View Project Onboarding
                  </Button>
                </div>
              ) : accountCreated ? (
                /* Account created successfully message */
                <div className="max-w-md mx-auto text-center space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    ✅ Account created! Check your email to verify, then sign in to access your portal.
                  </div>
                  <Button
                    onClick={() => navigate({ to: "/portal/login", search: { plan: selectedPackage } })}
                    variant="brand"
                    className="pill-button font-bold text-sm px-8 py-3"
                  >
                    Go to Portal Login <ArrowRight size={15} />
                  </Button>
                </div>
              ) : (
                /* Unauthenticated guest: Set password to complete account */
                <form onSubmit={handleCreateAccount} className="max-w-md mx-auto space-y-4 text-left">
                  <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs">
                    <span className="font-bold text-foreground block mb-1">Set Your Portal Password:</span>
                    <span className="text-muted-foreground">
                      Create a password to secure your E&amp;L client account and track your project deliverables in real time.
                    </span>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-semibold">
                      {authError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Password (min 8 characters) *</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Choose a strong password"
                        value={accountPassword}
                        onChange={e => setAccountPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isCreatingAccount}
                    variant="brand"
                    className="pill-button w-full font-bold text-sm py-3"
                  >
                    {isCreatingAccount ? "Creating Account…" : "Create Account & Enter Portal"} <ArrowRight size={15} />
                  </Button>

                  <div className="text-center text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/portal/login" search={{ plan: selectedPackage }} className="text-teal-700 dark:text-teal-400 font-bold hover:underline">
                      Sign in directly
                    </Link>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </SiteLayout>
  );
}
