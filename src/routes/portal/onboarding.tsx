/**
 * Client Project Onboarding — AI-assisted or Manual step-by-step
 * Saves progress to Supabase partner.onboardings, fully resumable.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Zap, MessageSquare, ClipboardList, ArrowRight, ArrowLeft,
  CheckCircle2, Send, SkipForward, Building2, Globe, Palette,
  Target, FileText, UploadCloud, Sparkles, RefreshCw, Lock
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { partnerSchema, BRAND_ID } from "@/lib/supabase";
import { askGeminiArchitect, synthesizeScopeWithGemini, type ChatMessage } from "@/lib/gemini";

export const Route = createFileRoute("/portal/onboarding")({
  component: PortalOnboarding,
});

type Mode = "choose" | "ai" | "manual";
type ManualStep = 1 | 2 | 3 | 4 | 5;

const MANUAL_STEPS = [
  { label: "Business", icon: <Building2 size={14} /> },
  { label: "Goals", icon: <Target size={14} /> },
  { label: "Design", icon: <Palette size={14} /> },
  { label: "Domain", icon: <Globe size={14} /> },
  { label: "Confirm", icon: <CheckCircle2 size={14} /> },
];

function PortalOnboarding() {
  const navigate = useNavigate();
  const { user, loading, access, onboarding, updateOnboarding, client } = usePortalAuth();

  const [mode, setMode] = useState<Mode>("choose");
  const [manualStep, setManualStep] = useState<ManualStep>(1);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // AI Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Manual form state
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("General Business");
  const [targetAudience, setTargetAudience] = useState("");
  const [businessGoals, setBusinessGoals] = useState("");
  const [designStyle, setDesignStyle] = useState("modern-minimal");
  const [colorPrefs, setColorPrefs] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState("");
  const [existingDomain, setExistingDomain] = useState<"yes" | "no">("no");
  const [domainName, setDomainName] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [scopingResult, setScopingResult] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/portal/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Restore from saved onboarding
  useEffect(() => {
    if (onboarding) {
      if (onboarding.mode && onboarding.mode !== "admin_bypassed") setMode(onboarding.mode as Mode);
      if (onboarding.businessName) setBusinessName(onboarding.businessName);
      if (onboarding.contactPerson) setContactPerson(onboarding.contactPerson);
      if (onboarding.industry) setIndustry(onboarding.industry);
      if (onboarding.targetAudience) setTargetAudience(onboarding.targetAudience);
      if (onboarding.businessGoals) setBusinessGoals(onboarding.businessGoals);
      if (onboarding.chatHistory) {
        try { setMessages(JSON.parse(onboarding.chatHistory)); } catch (_) {}
      }
    }
  }, [onboarding]);

  if (loading || !user) return null;

  if (!access.projects) {
    return (
      <PortalLayout>
        <div className="portal-locked">
          <div className="portal-locked-icon"><Lock size={36} color="#475569" /></div>
          <div className="portal-locked-title">Project portal not active</div>
          <p className="portal-locked-sub">Onboarding is only available with an active website, ecommerce, or app package. Contact E&amp;L to get started.</p>
          <a href="https://eandl.digital/packages" target="_blank" rel="noreferrer" className="portal-btn portal-btn--primary">
            <Zap size={16} /> View packages
          </a>
        </div>
      </PortalLayout>
    );
  }

  if (onboarding?.isCompleted || onboarding?.mode === "admin_bypassed") {
    return (
      <PortalLayout>
        <div className="portal-page-header">
          <h1 className="portal-page-title">Onboarding Complete ✅</h1>
          <p className="portal-page-sub">Your project is set up. Your E&amp;L team has everything they need to begin.</p>
        </div>
        <div className="portal-card" style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.04)" }}>
          <div className="portal-card-title"><CheckCircle2 size={18} color="#34d399" /> What happens next</div>
          <div className="portal-timeline">
            {[
              { label: "Kickoff call scheduled", sub: "Your solutions architect will reach out within 1 business day", done: true },
              { label: "Design mockup created", sub: "We'll share your first design within 3–5 business days", done: false },
              { label: "Development begins", sub: "After design approval, development takes 1–3 weeks", done: false },
              { label: "Staging review & sign-off", sub: "You review and approve before we go live", done: false },
              { label: "Launch! 🚀", sub: "Your site goes live on your domain", done: false },
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
        {onboarding.aiRecommendation && (
          <div className="portal-card" style={{ marginTop: "1.25rem" }}>
            <div className="portal-card-title"><Sparkles size={16} color="#fbbf24" /> AI Scope Summary</div>
            <p style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.7 }}>{onboarding.aiRecommendation}</p>
            {selectedPackage && <div style={{ marginTop: "0.75rem" }}><span className="portal-badge portal-badge--done">{selectedPackage}</span></div>}
          </div>
        )}
      </PortalLayout>
    );
  }

  // ── Mode chooser ──────────────────────────────────────────────────────
  if (mode === "choose") {
    return (
      <PortalLayout>
        <div className="portal-page-header">
          <h1 className="portal-page-title">Project Onboarding</h1>
          <p className="portal-page-sub">Tell us about your business so we can build exactly what you need.</p>
        </div>
        {onboarding && !onboarding.isCompleted && (
          <div className="portal-card" style={{ marginBottom: "1.5rem", borderColor: "rgba(13,148,136,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <RefreshCw size={16} color="#2dd4bf" />
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0" }}>Resume where you left off</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Progress saved · Step {onboarding.currentStep} of {onboarding.totalSteps}</div>
              </div>
              <button className="portal-btn portal-btn--primary portal-btn--sm" style={{ marginLeft: "auto" }}
                onClick={() => setMode((onboarding.mode as Mode) || "ai")}>
                Resume <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
        <div className="portal-card-row" style={{ gap: "1.25rem" }}>
          {/* AI Option */}
          <div className="portal-card" style={{ cursor: "pointer", borderColor: "rgba(13,148,136,0.25)", transition: "all 0.2s" }}
            onClick={() => {
              setMode("ai");
              updateOnboarding({ mode: "ai", currentStep: 1 });
              const biz = businessName || client?.name || "";
              const person = contactPerson || user.email?.split("@")[0] || "";
              setMessages([{ role: "model", text: `Hello${person ? " " + person : ""}! I'm your E&L AI Solutions Architect. I'm here to scope your perfect digital build. To start: tell me about your business — what do you do, and who are your main customers?` }]);
            }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #0d9488, #134e4a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles size={22} color="#2dd4bf" />
              </div>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f8fafc", marginBottom: "0.375rem" }}>AI-Assisted Onboarding</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.6 }}>Chat with our Gemini AI architect. It asks smart, targeted questions to scope your project, recommend the right package, and build your brief — takes about 5 minutes.</div>
                <div style={{ marginTop: "0.875rem", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  <span className="portal-chip portal-chip--projects">Smart questions</span>
                  <span className="portal-chip portal-chip--projects">Auto package rec</span>
                  <span className="portal-chip portal-chip--projects">~5 min</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
              <span className="portal-btn portal-btn--primary portal-btn--sm">Start AI chat <ArrowRight size={13} /></span>
            </div>
          </div>

          {/* Manual Option */}
          <div className="portal-card" style={{ cursor: "pointer", borderColor: "rgba(99,102,241,0.2)", transition: "all 0.2s" }}
            onClick={() => { setMode("manual"); updateOnboarding({ mode: "manual", currentStep: 1 }); }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #312e81, #1e1b4b)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ClipboardList size={22} color="#a5b4fc" />
              </div>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f8fafc", marginBottom: "0.375rem" }}>Step-by-Step Form</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.6 }}>Prefer to fill in a structured form at your own pace? Our 5-step questionnaire collects everything we need — complete now or save and return later.</div>
                <div style={{ marginTop: "0.875rem", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  <span className="portal-chip portal-chip--none">At your pace</span>
                  <span className="portal-chip portal-chip--none">Save & resume</span>
                  <span className="portal-chip portal-chip--none">No AI required</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
              <span className="portal-btn portal-btn--ghost portal-btn--sm">Start form <ArrowRight size={13} /></span>
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
        const reply = await askGeminiArchitect(updated, msg.trim(), {
          businessName: businessName || client?.name || "",
          contactPerson: contactPerson || user.email?.split("@")[0] || "",
          industry
        });
        setMessages([...updated, { role: "model", text: reply }]);
      } catch {
        setMessages([...updated, { role: "model", text: "Thanks for sharing that. Could you tell me more about your target customers and the main action you want visitors to take on your site?" }]);
      }
      setIsTyping(false);
    };

    const handleSynthesise = async () => {
      setBusy(true);
      try {
        const result = await synthesizeScopeWithGemini(messages, {
          businessName: businessName || client?.name || "",
          contactPerson: contactPerson || user.email?.split("@")[0] || ""
        });
        setScopingResult(result);
        setSelectedPackage(result.recommendedPackage);
        // Save to DB
        await updateOnboarding({
          isCompleted: true,
          status: "completed",
          currentStep: 5,
          aiRecommendation: result.scopeSummary,
          aiReadinessScore: result.leadScore,
          chatHistory: JSON.stringify(messages),
          selectedPackageCode: result.recommendedPackage,
          businessGoals: result.projectTitle
        });
        setMode("choose"); // trigger completed view via onboarding state
      } catch (err) {
        console.warn("Synthesis error:", err);
      }
      setBusy(false);
    };

    const quickReplies = messages.length <= 2 ? [
      "I need a website for my business",
      "I want an online store",
      "I need a booking system",
      "I want to modernise my existing site",
    ] : messages.length <= 4 ? [
      "My budget is around R500–R900/month",
      "I need it within 2–3 weeks",
      "I already have a domain name",
      "I don't have a domain yet",
    ] : [];

    return (
      <PortalLayout>
        <div className="portal-page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="portal-page-title" style={{ marginBottom: 0 }}>AI Project Scoping</h1>
            <span className="portal-domain-pill"><Sparkles size={10} /> Gemini AI</span>
          </div>
          <p className="portal-page-sub">Chat with your E&L AI architect — it will scope your project and recommend the right package.</p>
        </div>

        <div className="portal-card" style={{ marginBottom: "1.25rem" }}>
          <div className="portal-chat-wrap">
            <div className="portal-chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`portal-chat-msg portal-chat-msg--${msg.role === "model" ? "ai" : "user"}`}>
                  <div className={`portal-chat-avatar portal-chat-avatar--${msg.role === "model" ? "ai" : "user"}`}>
                    {msg.role === "model" ? <Zap size={13} /> : user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className={`portal-chat-bubble portal-chat-bubble--${msg.role === "model" ? "ai" : "user"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="portal-chat-msg portal-chat-msg--ai">
                  <div className="portal-chat-avatar portal-chat-avatar--ai"><Zap size={13} /></div>
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
                  <button key={r} className="portal-btn portal-btn--ghost portal-btn--sm" style={{ fontSize: "0.72rem" }} onClick={() => handleSend(r)}>
                    {r}
                  </button>
                ))}
              </div>
            )}

            <div className="portal-chat-input-row">
              <input
                className="portal-input" placeholder="Type your message…"
                value={inputMsg} onChange={e => setInputMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={isTyping}
              />
              <button className="portal-btn portal-btn--primary" disabled={!inputMsg.trim() || isTyping} onClick={() => handleSend()}>
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {messages.length >= 4 && (
            <button className="portal-btn portal-btn--primary" disabled={busy} onClick={handleSynthesise}>
              {busy ? <><RefreshCw size={15} className="animate-spin" /> Analysing…</> : <><Sparkles size={15} /> Get my project scope</>}
            </button>
          )}
          <button className="portal-btn portal-btn--ghost" onClick={() => setMode("choose")}>
            <SkipForward size={14} /> Switch to manual form
          </button>
          <button className="portal-btn portal-btn--ghost" style={{ marginLeft: "auto" }} onClick={() => {
            updateOnboarding({ chatHistory: JSON.stringify(messages), mode: "ai" });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}>
            {saved ? <><CheckCircle2 size={14} /> Saved!</> : "Save progress"}
          </button>
        </div>
      </PortalLayout>
    );
  }

  // ── Manual Step Form ──────────────────────────────────────────────────
  const saveManual = async () => {
    setBusy(true);
    await updateOnboarding({
      currentStep: manualStep,
      businessName, industry, targetAudience, businessGoals,
      designStyle, colorPreferences: colorPrefs, competitorUrls,
      existingDomain, mode: "manual"
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setBusy(false);
  };

  const finishManual = async () => {
    setBusy(true);
    await updateOnboarding({
      isCompleted: true, status: "completed", currentStep: 5,
      businessName, industry, targetAudience, businessGoals,
      designStyle, colorPreferences: colorPrefs, competitorUrls,
      existingDomain, selectedPackageCode: selectedPackage, mode: "manual",
      aiRecommendation: `Manual onboarding: ${businessGoals || businessName}. Package: ${selectedPackage || "TBD"}.`
    });
    setBusy(false);
  };

  return (
    <PortalLayout>
      <div className="portal-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h1 className="portal-page-title" style={{ marginBottom: 0 }}>Project Onboarding</h1>
          <button className="portal-btn portal-btn--ghost portal-btn--sm" onClick={() => setMode("choose")}>
            <MessageSquare size={13} /> Try AI instead
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
                <label className="portal-label">Business / Company Name *</label>
                <input className="portal-input" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="My Business PTY Ltd" />
              </div>
              <div className="portal-form-group">
                <label className="portal-label">Your Name *</label>
                <input className="portal-input" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Jane Smith" />
              </div>
            </div>
            <div className="portal-form-row">
              <div className="portal-form-group">
                <label className="portal-label">Phone Number</label>
                <input className="portal-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 71 000 0000" type="tel" />
              </div>
              <div className="portal-form-group">
                <label className="portal-label">Industry</label>
                <select className="portal-input portal-select" value={industry} onChange={e => setIndustry(e.target.value)}>
                  {["General Business","Healthcare / Medical","Legal / Attorneys","Finance / Accounting","Real Estate","Retail / Fashion","Hospitality / Restaurant","Construction / Property","Education / Training","Technology / IT","Beauty / Wellness","Automotive","NGO / Non-Profit","Other"].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Goals */}
        {manualStep === 2 && (
          <div>
            <div className="portal-card-title"><Target size={16} /> Goals & Target Audience</div>
            <div className="portal-form-group">
              <label className="portal-label">Who are your target customers?</label>
              <input className="portal-input" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="e.g. Young professionals in Johannesburg aged 25–40 looking for premium services" />
            </div>
            <div className="portal-form-group">
              <label className="portal-label">What is the primary goal of your website?</label>
              <textarea className="portal-input portal-textarea" value={businessGoals} onChange={e => setBusinessGoals(e.target.value)} placeholder="e.g. Generate leads for our consulting services, allow clients to book appointments online, and showcase our portfolio of completed projects..." />
            </div>
            <div className="portal-form-group">
              <label className="portal-label">Preferred Package (optional)</label>
              <select className="portal-input portal-select" value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)}>
                <option value="">— Let E&L recommend —</option>
                {["Spark (R199/mo)","Build (R349/mo)","Starter (R549/mo)","Business (R899/mo)","Elite (R1,499/mo)","Shop Start (R799/mo)","Shop Growth (R1,299/mo)"].map(p => <option key={p}>{p}</option>)}
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
                  <button key={s.id} type="button"
                    onClick={() => setDesignStyle(s.id)}
                    style={{ padding: "0.75rem", borderRadius: 10, border: `1.5px solid ${designStyle === s.id ? "#0d9488" : "rgba(255,255,255,0.08)"}`, background: designStyle === s.id ? "rgba(13,148,136,0.1)" : "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                    <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{s.emoji}</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: designStyle === s.id ? "#2dd4bf" : "#94a3b8" }}>{s.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="portal-form-group">
              <label className="portal-label">Brand Colours (optional)</label>
              <input className="portal-input" value={colorPrefs} onChange={e => setColorPrefs(e.target.value)} placeholder="e.g. Navy blue and gold — our logo uses #1B2A4A and #C4972A" />
            </div>
            <div className="portal-form-group">
              <label className="portal-label">Competitor or Inspiration Websites (optional)</label>
              <input className="portal-input" value={competitorUrls} onChange={e => setCompetitorUrls(e.target.value)} placeholder="e.g. www.competitor.co.za, www.inspiration-site.com" />
            </div>
          </div>
        )}

        {/* Step 4: Domain */}
        {manualStep === 4 && (
          <div>
            <div className="portal-card-title"><Globe size={16} /> Domain & Hosting</div>
            <div className="portal-form-group">
              <label className="portal-label">Do you already have a domain name?</label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {(["yes", "no"] as const).map(v => (
                  <button key={v} type="button" onClick={() => setExistingDomain(v)}
                    style={{ flex: 1, padding: "0.875rem", borderRadius: 10, border: `1.5px solid ${existingDomain === v ? "#0d9488" : "rgba(255,255,255,0.08)"}`, background: existingDomain === v ? "rgba(13,148,136,0.1)" : "rgba(255,255,255,0.03)", cursor: "pointer", color: existingDomain === v ? "#2dd4bf" : "#94a3b8", fontWeight: 700, transition: "all 0.15s", fontSize: "0.85rem", textTransform: "capitalize" }}>
                    {v === "yes" ? "Yes, I have one" : "No, I need one"}
                  </button>
                ))}
              </div>
            </div>
            {existingDomain === "yes" && (
              <div className="portal-form-group">
                <label className="portal-label">Your domain name</label>
                <input className="portal-input" value={domainName} onChange={e => setDomainName(e.target.value)} placeholder="www.yourbusiness.co.za" />
              </div>
            )}
            {existingDomain === "no" && (
              <div style={{ padding: "1rem", borderRadius: 10, background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)", fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.6 }}>
                💡 E&L includes domain registration in your setup. We'll recommend and register an available .co.za or .com domain for your business.
              </div>
            )}
            <div className="portal-form-group" style={{ marginTop: "1rem" }}>
              <label className="portal-label">Upload company profile or brand guide (optional)</label>
              <div style={{ border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: "1.5rem", textAlign: "center", color: "#475569", fontSize: "0.8rem" }}>
                <UploadCloud size={24} style={{ margin: "0 auto 0.5rem", display: "block", opacity: 0.5 }} />
                <div>Drag & drop PDF, DOCX, or images</div>
                <div style={{ fontSize: "0.7rem", marginTop: "0.25rem" }}>Max 10MB · Documents help us understand your brand</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {manualStep === 5 && (
          <div>
            <div className="portal-card-title"><FileText size={16} /> Review & Submit</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                ["Business", businessName || "—"],
                ["Industry", industry],
                ["Target audience", targetAudience || "—"],
                ["Goals", businessGoals || "—"],
                ["Design style", designStyle.replace("-", " ")],
                ["Brand colours", colorPrefs || "—"],
                ["Domain", existingDomain === "yes" ? domainName || "Provided" : "E&L will register"],
                ["Selected package", selectedPackage || "E&L will recommend"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", gap: "1rem", padding: "0.625rem 0.875rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", minWidth: 120, fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: "0.82rem", color: "#e2e8f0", flex: 1 }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.25rem", padding: "0.875rem 1rem", borderRadius: 10, background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)", fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6 }}>
              ✅ After submitting, your E&L solutions architect will review this brief and contact you within 1 business day to schedule a kickoff call.
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
            {saved ? <><CheckCircle2 size={13} /> Saved</> : "Save progress"}
          </button>
          <div style={{ marginLeft: "auto" }}>
            {manualStep < 5 ? (
              <button className="portal-btn portal-btn--primary" onClick={async () => { await saveManual(); setManualStep(s => (s + 1) as ManualStep); }}>
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button className="portal-btn portal-btn--amber" disabled={busy || !businessName} onClick={finishManual}>
                {busy ? "Submitting…" : <><Zap size={14} /> Submit onboarding</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
