/**
 * Client Portal — Email Verification Suite
 * Route: /portal/verify
 * Supports:
 * 1. 1-click verification link from email
 * 2. Manual 6-digit numeric OTP code input
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePortalAuth } from "@/lib/portal-auth";
import logo from "@/assets/logo.png";
import { ThemeToggle } from "@/lib/theme";

export const Route = createFileRoute("/portal/verify")({
  validateSearch: (s: Record<string, unknown>): { email?: string; next?: string } => ({
    email: typeof s["email"] === "string" ? s["email"] : undefined,
    next: typeof s["next"] === "string" ? s["next"] : undefined,
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const navigate = useNavigate();
  const { user } = usePortalAuth();
  const { email: emailParam, next } = Route.useSearch();

  const [email, setEmail] = useState(emailParam || "");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // If user is already authenticated and email is verified, redirect
  useEffect(() => {
    if (user?.email && user.email_confirmed_at) {
      navigate({ to: (next || "/portal/dashboard") as any });
    }
  }, [user, next, navigate]);

  // Cooldown timer ticker
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Listen to auth state changes (e.g. if user clicked link in another tab)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        setSuccess(true);
        setTimeout(() => {
          navigate({ to: (next || "/portal/dashboard") as any });
        }, 800);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [next, navigate]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.replace(/\s+/g, "").trim();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your account email address.");
      return;
    }

    if (!cleanCode || cleanCode.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setVerifying(true);

    try {
      // 1. Try verify with type: 'signup'
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: "signup",
      });

      if (!verifyErr && data.session) {
        setSuccess(true);
        setTimeout(() => {
          navigate({ to: (next || "/portal/dashboard") as any });
        }, 1000);
        return;
      }

      // 2. Fallback try with type: 'email' (for OTP / magic link)
      const { data: fbData, error: fbErr } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: "email",
      });

      if (!fbErr && fbData.session) {
        setSuccess(true);
        setTimeout(() => {
          navigate({ to: (next || "/portal/dashboard") as any });
        }, 1000);
        return;
      }

      setError(
        verifyErr?.message ||
        fbErr?.message ||
        "Invalid or expired verification code. Please check your code or request a new one."
      );
    } catch (err: any) {
      setError(err?.message || "An unexpected verification error occurred.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your account email address.");
      return;
    }

    setResendStatus("Sending code...");
    setError(null);

    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://eandl.digital";

      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        options: {
          emailRedirectTo: `${origin}/auth/confirm?next=/portal/dashboard`,
        },
      });

      if (resendErr) {
        setResendStatus(`Failed: ${resendErr.message}`);
      } else {
        setResendStatus(`New 6-digit code and link sent to ${cleanEmail}!`);
        setCooldown(60);
      }
    } catch {
      setResendStatus("Failed to dispatch email. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans selection:bg-teal-500 selection:text-white flex flex-col justify-between relative overflow-x-hidden transition-colors duration-200">
      
      {/* Background Ambient Glows & Grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-teal-500/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-border bg-card/85 backdrop-blur-xl shrink-0 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src={logo} alt="E&L Logo" className="w-10 h-10 object-contain rounded-xl shadow-xs" />
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-black tracking-tight text-foreground flex items-center gap-1.5">
                E and L Holdings
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  Verification
                </span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">eandl.digital/portal</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle className="h-9 w-9 rounded-full border border-border bg-secondary/80 hover:bg-secondary" />
            <Link
              to="/portal/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all shadow-xs"
            >
              <ArrowLeft size={13} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Verification Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 lg:py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-card backdrop-blur-2xl text-foreground rounded-3xl p-6 sm:p-8 shadow-2xl border border-border space-y-5">
            
            {/* Header Badge & Title */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto">
                <Mail size={22} className="animate-bounce" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-teal-500/10 text-teal-600 dark:text-teal-300 border border-teal-500/20">
                <ShieldCheck size={12} />
                <span>Verification Options</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Verify Your Account
              </h1>

              <p className="text-xs text-muted-foreground leading-relaxed">
                We sent a confirmation link and a 6-digit code to:
              </p>

              {/* Email Chip */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 border border-border text-xs font-mono font-semibold text-foreground">
                <Mail size={12} className="text-teal-500" />
                <span>{email || "your registered email"}</span>
              </div>
            </div>

            {/* Success Feedback */}
            {success && (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs text-center space-y-1.5 animate-in fade-in">
                <CheckCircle2 size={24} className="text-emerald-400 mx-auto" />
                <div className="font-bold text-sm">Account Verified Successfully!</div>
                <div className="text-[11px] text-emerald-200">Launching your client workspace now...</div>
              </div>
            )}

            {/* Error Feedback */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <div className="leading-snug font-medium">{error}</div>
              </div>
            )}

            {/* ── Option 1: 1-Click Verification Link ── */}
            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold text-[10px] flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-foreground">Option 1: Click the Email Link</span>
              </div>
              <p className="text-[11px] text-muted-foreground pl-7 leading-relaxed">
                Check your Gmail or inbox. Click the <strong>"Verify Email"</strong> button to immediately sign in without typing any code.
              </p>
            </div>

            {/* Divider with 'OR' */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-border" />
              <span className="absolute bg-card px-3 text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                OR
              </span>
            </div>

            {/* ── Option 2: Enter 6-Digit Code ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 font-bold text-[10px] flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold text-foreground">Option 2: Enter 6-Digit Code</span>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-3.5">
                {!emailParam && (
                  <div>
                    <label className="block font-bold text-foreground text-[11px] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.co.za"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground text-xs font-semibold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-foreground text-[11px] mb-1">
                    6-Digit Security Code
                  </label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      maxLength={8}
                      placeholder="123 456"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/60 border border-border text-foreground text-center font-mono text-lg font-black tracking-[0.35em] placeholder:tracking-normal placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying || success}
                  className="w-full py-3 rounded-full font-bold bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white shadow-lg shadow-teal-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  {verifying ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Validating Security Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Code &amp; Launch Portal</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Resend Code Section */}
            <div className="pt-3 border-t border-border text-center space-y-2">
              <div className="text-[11px] text-muted-foreground">
                Didn't receive the email or code?
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer transition-all"
              >
                {cooldown > 0 ? `Resend new code in ${cooldown}s` : "Resend Verification Code & Link"}
              </button>

              {resendStatus && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl mt-1">
                  {resendStatus}
                </div>
              )}
            </div>

            {/* Security note */}
            <div className="pt-1 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck size={12} className="text-teal-400" />
              <span>TLS 1.3 · Single-Use Security Token</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-card/80 py-4 text-center text-xs text-muted-foreground shrink-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>E&amp;L Digital Holdings (Pty) Ltd · Client Verification</div>
          <div className="flex items-center gap-3">
            <Link to="/portal/login" className="hover:text-foreground">Sign In</Link>
            <span>•</span>
            <a href="mailto:hello@eandl.digital" className="hover:text-foreground">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

