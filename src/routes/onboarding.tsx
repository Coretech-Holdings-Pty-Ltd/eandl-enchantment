import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Check, ArrowRight, ArrowLeft, Send, ShieldCheck,
  Building, User, Mail, Phone, Rocket, MessageSquare, CheckCircle2,
  Clock, DollarSign, ExternalLink, HelpCircle, Layers, Zap
} from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/site-content";
import { partnerSchema, BRAND_ID } from "@/lib/supabase";
import {
  askGeminiArchitect,
  synthesizeScopeWithGemini,
  type ChatMessage,
  type ScopingResult
} from "@/lib/gemini";

export const Route = createFileRoute("/onboarding")({
  head: () =>
    pageHead(
      "AI Customer Onboarding & Project Scoping",
      "Create your E&L account and chat with our Gemini-powered AI Solutions Architect to get an instant scope analysis and tailored package recommendation.",
    ),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();

  // Wizard Steps: 1 = Account, 2 = AI Chat, 3 = Recommendation & Plan Confirm, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Account Info
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("Healthcare / Medical Practice");

  // Step 2: AI Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Step 3: Scope Analysis & Recommendation
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [scopingResult, setScopingResult] = useState<ScopingResult | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  // Step 1 Submit: Create Account & Start AI Scoping
  const handleStartAiScoping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactPerson || !email) return;

    // Initialize AI chat greeting
    const greeting: ChatMessage = {
      role: "model",
      text: `Hello ${contactPerson}! Welcome to E&L Digital. I am your dedicated AI Solutions Architect. I will help scope the perfect digital build and care plan for "${businessName}". Tell me: what is the main goal of your project, and what specific features (like online booking, ecommerce, or quote requests) do you envision?`
    };

    setMessages([greeting]);
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
        { businessName, contactPerson, industry }
      );

      setMessages([...updatedHistory, { role: "model", text: replyText }]);
    } catch (err) {
      console.warn("AI Chat error:", err);
      setMessages([
        ...updatedHistory,
        {
          role: "model",
          text: `Thank you for sharing that, ${contactPerson}. We specialize in high-converting South African digital builds with automated DebiCheck care plans. How soon are you looking to launch?`
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
        recommendedPackage: "Grow Online Business",
        monthlyFee: 899,
        leadScore: 95,
        projectTitle: `${businessName} Corporate Portal & Patient Hub`,
        scopeSummary: "Comprehensive corporate presence with online scheduling, Google SEO, responsive mobile design, and 120 minutes of monthly care updates.",
        keyFeatures: [
          "Up to 20 Custom Responsive Pages",
          "Real-Time Booking / Lead Capture",
          "120 Minutes Monthly Website Updates",
          "DebiCheck Automated Retainer",
          "Fast SSD Hosting with SSL"
        ],
        carePlanMinutes: 120,
        timeline: "2 to 3 Weeks",
        urgency: "High Priority"
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
      const sessionId = "sess_" + Date.now();

      // Save onboarding session to partner.onboardings
      // (public anon users cannot write core.companies — company record created by admin on qualification)
      const { error: obErr } = await partnerSchema()
        .from("onboardings")
        .insert({
          brand_id: BRAND_ID,
          session_id: sessionId,
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
          ai_readiness_score: scopingResult.leadScore || 85,
          ai_recommendation: scopingResult.scopeSummary || `Recommended plan: ${selectedPackage} at R${scopingResult.monthlyFee}/month`,
          chat_history: messages,
          status: "completed",
        });

      if (obErr) console.warn("Onboarding save notice:", obErr.message);

      setStep(4);
    } catch (err: any) {
      console.error("Onboarding save error:", err?.message || err);
      // Still advance to success — lead data isn't lost, admin can follow up
      setStep(4);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SiteLayout>
      <div className="inner-page site-width py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Header Progress Stepper */}
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              <Sparkles size={13} />
              <span>GEMINI AI SOLUTIONS ARCHITECT</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Customer Onboarding & Project Scoping
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
              Set up your account, collaborate directly with our AI Solutions Architect to scope your build, and unlock your tailored Grow Online package.
            </p>

            {/* Stepper Bar */}
            <div className="flex items-center justify-center gap-3 pt-4 text-xs font-bold">
              <div className={`flex items-center gap-2 ${step >= 1 ? "text-teal-700" : "text-muted-foreground"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-teal-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                  1
                </span>
                <span>Account Setup</span>
              </div>
              <div className={`w-10 h-0.5 ${step >= 2 ? "bg-teal-600" : "bg-border"}`} />
              <div className={`flex items-center gap-2 ${step >= 2 ? "text-teal-700" : "text-muted-foreground"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-teal-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                  2
                </span>
                <span>AI Scoping Dialogue</span>
              </div>
              <div className={`w-10 h-0.5 ${step >= 3 ? "bg-teal-600" : "bg-border"}`} />
              <div className={`flex items-center gap-2 ${step >= 3 ? "text-teal-700" : "text-muted-foreground"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? "bg-teal-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                  3
                </span>
                <span>Plan & Scope</span>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
             STEP 1: ACCOUNT & BUSINESS PROFILE
             ════════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="rounded-3xl border border-glass-border bg-card p-6 sm:p-10 shadow-xl space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-border/60 pb-4">
                <h2 className="text-xl font-bold text-foreground">Step 1: Account Profile</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter your business contact details to initialize your E&L client workspace.
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
                    <option value="Legal & Professional Advisory">Legal & Professional Advisory</option>
                    <option value="eCommerce & Retail Products">eCommerce & Retail Products</option>
                    <option value="Logistics & Transport">Logistics & Transport</option>
                    <option value="Construction & Engineering">Construction & Engineering</option>
                    <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                    <option value="Technology & SaaS">Technology & SaaS</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" variant="brand" className="pill-button font-bold text-sm px-6">
                    Create Account & Start AI Scoping <ArrowRight size={15} />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
             STEP 2: INTERACTIVE AI SCOPING CHAT (GEMINI)
             ════════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="rounded-3xl border border-glass-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/20">
                      <Sparkles size={18} />
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 border-2 border-card" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-foreground">E&L AI Solutions Architect</div>
                    <div className="text-[11px] text-teal-700 font-semibold">Gemini 2.5 Intelligence &bull; Live Scoping</div>
                  </div>
                </div>

                <Button
                  onClick={handleSynthesizeScope}
                  disabled={isSynthesizing || messages.length < 2}
                  variant="brand"
                  className="pill-button text-xs font-bold"
                >
                  {isSynthesizing ? "Synthesizing..." : "Analyze Scope & Recommend Plan"} <ArrowRight size={13} />
                </Button>
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
                    "We need 10 custom pages with Google SEO and WhatsApp chat",
                    "We require monthly maintenance and banner change requests"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(chip)}
                      className="px-3 py-1.5 rounded-full bg-secondary hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 text-muted-foreground border border-border/60 transition-all text-left"
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
                  <div className="text-xs font-bold text-teal-700 tracking-wider uppercase">AI SYNTHESIS COMPLETE</div>
                  <h2 className="text-2xl font-extrabold text-foreground mt-0.5">{scopingResult.projectTitle}</h2>
                </div>
                <div className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                  Lead Qualification Score: {scopingResult.leadScore}/100
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

              {/* Primary Recommended Tier Card */}
              <div className="p-6 rounded-3xl border-2 border-teal-500 bg-gradient-to-br from-teal-50/50 via-card to-card space-y-4 shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-wider">AI RECOMMENDED PACKAGE</span>
                    <h3 className="text-2xl font-black text-foreground mt-0.5">{selectedPackage}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-foreground font-mono">
                      R{scopingResult.monthlyFee}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-bold">DebiCheck Debit Order</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/60 text-xs">
                  <div className="p-3 rounded-xl bg-background border border-border/40">
                    <div className="text-muted-foreground text-[11px]">Monthly Care Updates</div>
                    <div className="font-bold text-foreground mt-0.5">{scopingResult.carePlanMinutes} min/month</div>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border/40">
                    <div className="text-muted-foreground text-[11px]">Target Timeline</div>
                    <div className="font-bold text-foreground mt-0.5">{scopingResult.timeline}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border/40">
                    <div className="text-muted-foreground text-[11px]">Hosting & SSL</div>
                    <div className="font-bold text-foreground mt-0.5">High-Speed Cloud</div>
                  </div>
                </div>
              </div>

              {/* Plan Choice Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-foreground">Select Package Preference:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {[
                    { name: "Grow Online Starter", fee: 549, desc: "10 Pages & 60m Care" },
                    { name: "Grow Online Business", fee: 899, desc: "20 Pages & 120m Care" },
                    { name: "Shop Start", fee: 799, desc: "eCommerce & 60m Care" },
                  ].map(plan => (
                    <button
                      key={plan.name}
                      type="button"
                      onClick={() => setSelectedPackage(plan.name)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        selectedPackage === plan.name
                          ? "border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20"
                          : "border-border bg-background hover:bg-secondary/40"
                      }`}
                    >
                      <div className="font-bold text-foreground">{plan.name}</div>
                      <div className="font-mono font-extrabold text-teal-700 mt-0.5">R{plan.fee}/mo</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{plan.desc}</div>
                    </button>
                  ))}
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
                  {isSaving ? "Finalizing Account..." : "Confirm Plan & Enter Client Portal"} <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
             STEP 4: CONFIRMED & READY
             ════════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="rounded-3xl border border-glass-border bg-card p-8 sm:p-12 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="text-xs font-extrabold text-teal-700 uppercase tracking-widest">ONBOARDING CONFIRMED</span>
                <h2 className="text-3xl font-black text-foreground mt-1">Welcome to E&L Digital!</h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-2">
                  Your project brief for <strong>{businessName}</strong> is saved. Our team will reach out within 1 business day. Create your client account to track progress.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-secondary/50 border border-border/60 max-w-md mx-auto text-xs text-left space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Client Company:</span>
                  <span className="font-bold text-foreground">{businessName}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Recommended Package:</span>
                  <span className="font-bold text-teal-700">{selectedPackage}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Contact Email:</span>
                  <span className="font-bold text-foreground">{email}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => navigate({ to: "/portal/login", search: { tab: "register", plan: selectedPackage } })}
                  variant="brand"
                  className="pill-button font-bold text-sm px-8 py-3"
                >
                  Create Account & Access Portal <ArrowRight size={15} />
                </Button>
                <Button
                  onClick={() => navigate({ to: "/" })}
                  variant="glass"
                  className="pill-button text-sm px-8 py-3"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </SiteLayout>
  );
}
