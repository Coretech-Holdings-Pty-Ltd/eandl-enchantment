/**
 * Portal Login & Registration Suite
 * Completely isolated from public site navigation & footer
 * Production Domain: eandl.digital/portal/login
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Zap,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  FolderKanban,
  Mail,
  Lock,
  User,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  Activity,
  Layers,
  Shield,
  CreditCard
} from "lucide-react";
import { usePortalAuth } from "@/lib/portal-auth";
import { ThemeToggle } from "@/lib/theme";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/login")({
  component: PortalLoginPage,
});

type Tab = "login" | "register";

function PortalLoginPage() {
  const navigate = useNavigate();
  const { login, register, user, loading } = usePortalAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/portal/dashboard" });
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const { error: err } = await login(email, password);
      if (err) {
        setError(
          err.includes("Email not confirmed")
            ? "Please verify your email address to access your client portal."
            : err.includes("Invalid login credentials")
            ? "Invalid email or password. Please verify your credentials."
            : err
        );
      } else {
        navigate({ to: "/portal/dashboard" });
      }
    } catch {
      setError("An unexpected connection error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);

    if (!fullName.trim()) {
      setError("Please provide your full contact name.");
      setBusy(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setBusy(false);
      return;
    }

    try {
      const displayName = companyName.trim()
        ? `${fullName} (${companyName.trim()})`
        : fullName;

      const { error: err } = await register(email, password, displayName);
      if (err) {
        setError(
          err.includes("already registered")
            ? "An account with this email already exists. Please sign in."
            : err
        );
      } else {
        setSuccess("Partner client account created! Please check your email to confirm, then sign in.");
        setTab("login");
      }
    } catch {
      setError("Failed to create client account. Please contact support.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-300 font-sans">
        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono tracking-wider uppercase text-slate-400">
          Loading Client Portal...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans selection:bg-teal-500 selection:text-white flex flex-col justify-between relative overflow-x-hidden transition-colors duration-200">
      
      {/* Background Ambient Glows & Grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 border-b border-border bg-card/85 backdrop-blur-xl shrink-0 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-teal-600 to-amber-500 p-0.5 shadow-md shadow-teal-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-card rounded-[10px] flex items-center justify-center transition-colors">
                <Zap size={20} className="text-teal-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-foreground flex items-center gap-2">
                E&L Digital
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  Client Hub
                </span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">eandl.digital/portal</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium bg-secondary/70 border border-border text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CoreTech Engine:</span>
              <span className="font-mono text-xs font-semibold text-foreground">Online</span>
            </div>

            <ThemeToggle className="h-9 w-9 rounded-full border border-border bg-secondary/80 hover:bg-secondary" />

            <a
              href="https://eandl.digital"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all shadow-xs"
            >
              <span>Main Site</span>
              <ExternalLink size={12} className="text-teal-400" />
            </a>

            <a
              href="https://admin.eandl.digital"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-950/40 hover:bg-teal-900/50 text-teal-300 border border-teal-500/30 transition-all shadow-xs"
            >
              <span>Admin Desk</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Left Column: Visual Showcase & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 lg:space-y-8">
            <div className="space-y-3 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-teal-500/20 via-emerald-500/15 to-amber-500/10 text-teal-300 border border-teal-500/30">
                <Sparkles size={13} className="text-teal-400 animate-spin-slow" />
                <span>Client & Partner Workspace • 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
                Your Unified Digital{" "}
                <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-amber-300 bg-clip-text text-transparent">
                  Command Center
                </span>
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Direct client visibility into live development sprints, DebiCheck billing retainers, Gemini-powered AI onboarding, and accredited learning academies.
              </p>
            </div>

            {/* Interactive Feature Bento Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              
              {/* Card 1: Live Project Velocity */}
              <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-teal-500/40 space-y-2.5 hover:border-teal-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                      <FolderKanban size={16} />
                    </div>
                    <span className="text-xs font-bold text-foreground">Project Workspaces</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                    SPRINT 4
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                    <span>Deliverable Progress</span>
                    <span className="text-teal-400 font-bold">85% Complete</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full w-[85%]" />
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-snug">
                  Track staging releases, review milestone approvals, and submit change requests seamlessly.
                </p>
              </div>

              {/* Card 2: DebiCheck & Care Retainers */}
              <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-teal-500/40 space-y-2.5 hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <CreditCard size={16} />
                    </div>
                    <span className="text-xs font-bold text-foreground">DebiCheck Retainers</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    PROTECTED
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                    <span>Monthly Quota Active</span>
                    <span className="text-amber-400 font-bold">18h Remaining</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full w-[70%]" />
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-snug">
                  Automated debit order status, quota hours, and zero friction invoicing.
                </p>
              </div>

              {/* Card 3: E&L Digital Academy */}
              <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-teal-500/40 space-y-2.5 hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <GraduationCap size={16} />
                    </div>
                    <span className="text-xs font-bold text-foreground">Learning Academy</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                    ACCREDITED
                  </span>
                </div>

                <p className="text-[11px] text-foreground font-semibold line-clamp-1">
                  Applied Generative AI &amp; Autonomous Agents
                </p>

                <p className="text-[11px] text-muted-foreground leading-snug">
                  Hands-on digital curriculum, video lessons, and verifiable completion certificates.
                </p>
              </div>

              {/* Card 4: Gemini AI Intake Engine */}
              <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-teal-500/40 space-y-2.5 hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Sparkles size={16} />
                    </div>
                    <span className="text-xs font-bold text-foreground">Gemini AI Intake</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    SMART AGENT
                  </span>
                </div>

                <p className="text-[11px] text-foreground font-semibold line-clamp-1">
                  Dynamic Project Questionnaires
                </p>

                <p className="text-[11px] text-muted-foreground leading-snug">
                  Conversational scoping that aligns business goals and technical stacks in minutes.
                </p>
              </div>
            </div>

            {/* Enterprise Trust Strip */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-8 border-t border-border text-muted-foreground text-xs">
              <div className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck size={14} className="text-teal-400" />
                <span>Supabase Row-Level Security</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Shield size={14} className="text-amber-400" />
                <span>South African POPIA &amp; Bank Compliant</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Activity size={14} className="text-emerald-400" />
                <span>99.9% Uptime Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-End Authentication Card */}
          <div className="lg:col-span-5 w-full">
            <div className="relative bg-card backdrop-blur-2xl text-foreground rounded-3xl p-6 sm:p-8 shadow-2xl border border-border space-y-5">
              
              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold tracking-wider text-teal-400 uppercase flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    Verified Client Access
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-muted-foreground border border-border font-mono">
                    SECURED
                  </span>
                </div>

                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  {tab === "login" ? "Welcome to Your Portal" : "Create Client Account"}
                </h2>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tab === "login"
                    ? "Sign in with your verified credentials to track projects, manage care quotas, and access courses."
                    : "Register your business profile to access your dedicated project workspace and learning academy."}
                </p>
              </div>

              {/* Learning Hub Student Quick Link */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-teal-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-200">Learning Hub Student?</div>
                    <div className="text-[11px] text-slate-400">Complete AI onboarding, pick your plan, and start learning.</div>
                  </div>
                </div>
                <Link
                  to="/portal/learning-onboarding"
                  className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-[11px] shrink-0 flex items-center gap-1 shadow-md transition-all cursor-pointer"
                >
                  <span>Student Plans</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-secondary rounded-2xl text-xs font-bold text-muted-foreground border border-border">
                <button
                  type="button"
                  onClick={() => { setTab("login"); setError(""); setSuccess(""); }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    tab === "login"
                      ? "bg-teal-600 text-white shadow-md shadow-teal-950/50"
                      : "hover:text-foreground"
                  }`}
                >
                  Sign In to Portal
                </button>
                <button
                  type="button"
                  onClick={() => { setTab("register"); setError(""); setSuccess(""); }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    tab === "register"
                      ? "bg-teal-600 text-white shadow-md shadow-teal-950/50"
                      : "hover:text-foreground"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                  <div className="leading-snug font-medium">{error}</div>
                </div>
              )}

              {/* Success Alert */}
              {success && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                  <div className="leading-snug font-medium">{success}</div>
                </div>
              )}

              {/* Authentication Form */}
              {tab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      Business or Contact Email *
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        placeholder="you@company.co.za"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-300">Password *</label>
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="text-[10px] text-teal-400 hover:text-teal-300 cursor-pointer flex items-center gap-1"
                      >
                        {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                        <span>{showPass ? "Hide" : "Show"}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 text-teal-600 focus:ring-teal-500/20"
                      />
                      <span className="text-[11px]">Remember this session</span>
                    </label>

                    <a
                      href="mailto:hello@eandl.digital?subject=Password%20Reset%20Request"
                      className="text-[11px] text-teal-400 hover:underline"
                    >
                      Need help signing in?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 rounded-full font-bold bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white shadow-lg shadow-teal-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>{busy ? "Authenticating via Supabase..." : "Sign In to Client Portal"}</span>
                    <ArrowRight size={15} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-foreground mb-1">Full Name *</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sipho Mthembu"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1">Company / Business Name</label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="e.g. Apex Health Holdings"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1">Business Email Address *</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        placeholder="contact@business.co.za"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-300">Password (Min. 8 characters) *</label>
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="text-[10px] text-teal-400 hover:text-teal-300 cursor-pointer flex items-center gap-1"
                      >
                        {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                        <span>{showPass ? "Hide" : "Show"}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        minLength={8}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 rounded-full font-bold bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white shadow-lg shadow-teal-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>{busy ? "Registering Client Account..." : "Create Account & Launch Portal"}</span>
                    <ArrowRight size={15} />
                  </button>
                </form>
              )}

              {/* Portal Features Inclusion Strip */}
              <div className="pt-2 border-t border-border space-y-2">
                <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground text-center">
                  Included with your verified client access
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-teal-950/60 border border-teal-500/30 text-teal-300">
                    <FolderKanban size={11} /> Project Tracking
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-950/60 border border-amber-500/30 text-amber-300">
                    <GraduationCap size={11} /> Academy Access
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                    <ShieldCheck size={11} /> DebiCheck Portal
                  </span>
                </div>
              </div>

              {/* Direct Support & Escalation */}
              <div className="pt-1 text-center text-xs text-muted-foreground space-y-1">
                <div className="text-[11px]">
                  Need priority assistance or onboarding help?
                </div>
                <div className="flex items-center justify-center gap-3 text-[11px] font-medium">
                  <a href="mailto:hello@eandl.digital" className="text-teal-400 hover:underline">
                    hello@eandl.digital
                  </a>
                  <span>•</span>
                  <a
                    href="https://wa.me/27710000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline"
                  >
                    WhatsApp Support
                  </a>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/90 py-5 text-center text-xs text-muted-foreground shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">E&L Digital Holdings (Pty) Ltd</span>
            <span>•</span>
            <span>Client Workspace Architecture</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a href="https://eandl.digital" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">
              Public Platform
            </a>
            <span>•</span>
            <a href="https://admin.eandl.digital" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">
              Admin Gateway
            </a>
            <span>•</span>
            <span className="font-mono text-slate-400">eandl.digital/portal</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
