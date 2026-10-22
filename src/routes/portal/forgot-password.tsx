/**
 * Client Portal — Password Recovery Suite
 * Sends authenticated password reset email via Supabase Auth
 * Route: /portal/forgot-password
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/lib/theme";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/portal/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetEmail = email.trim();
    if (!targetEmail) {
      setError("Please provide your account email address.");
      return;
    }

    setBusy(true);

    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://eandl.digital";

      const redirectUrl = `${origin}/portal/reset-password`;

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: redirectUrl,
      });

      if (resetErr) {
        setError(resetErr.message || "Failed to send reset link. Please check the email entered.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("An unexpected network error occurred. Please verify your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans selection:bg-teal-500 selection:text-white flex flex-col justify-between relative overflow-x-hidden transition-colors duration-200">
      
      {/* Background Ambient Glows & Grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-20 border-b border-border bg-card/85 backdrop-blur-xl shrink-0 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src={logo} alt="E and L logo" className="w-11 h-11 object-contain rounded-xl shadow-xs" />
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-foreground flex items-center gap-2">
                E and L Holdings
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  Client Portal
                </span>
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">eandl.digital/portal</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle className="h-9 w-9 rounded-full border border-border bg-secondary/80 hover:bg-secondary" />

            <Link
              to="/portal/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all shadow-xs"
            >
              <ArrowLeft size={13} />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 lg:py-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Context Column */}
          <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              <KeyRound size={13} className="text-teal-600 dark:text-teal-400" />
              <span>Account Recovery • Self-Service</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
              Trouble accessing <br />
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-800 dark:from-teal-400 dark:via-emerald-300 dark:to-amber-300 bg-clip-text text-transparent">
                your client portal?
              </span>
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
              Enter your verified email. We will generate a one-time cryptographic recovery link to reset your credentials.
            </p>

            {/* Recovery Highlights */}
            <div className="space-y-3 pt-2 text-left max-w-md mx-auto lg:mx-0">
              <div className="p-3.5 rounded-2xl bg-card border border-border flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">60-Minute Valid Token</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Password links automatically expire after 1 hour for security.</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-border flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">End-to-End Encrypted</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Protected by Supabase Auth and South African POPIA compliance.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Reset Card */}
          <div className="lg:col-span-6 w-full">
            <div className="relative bg-card text-card-foreground rounded-3xl p-6 sm:p-9 shadow-xl border border-border space-y-6">
              
              <div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Reset Password
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  We'll send an authenticated recovery link to set a new password.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                  <div className="leading-snug font-medium">{error}</div>
                </div>
              )}

              {/* Success State */}
              {submitted ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-3">
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Recovery Link Sent!</div>
                      <div className="mt-1 leading-relaxed text-emerald-700 dark:text-emerald-200">
                        We have dispatched a secure recovery link to <strong>{email}</strong>. Please check your inbox and click the link to choose your new password.
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        Be sure to check your spam or promotional folders if you don't see it within 2 minutes.
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="w-full py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                    >
                      Didn't get the email? Try again
                    </button>
                    
                    <Link
                      to="/portal/login"
                      className="w-full py-3 rounded-full font-bold bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white shadow-md text-center text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Return to Sign In</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ) : (
                /* Email Form */
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">
                      Your Registered Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        placeholder="you@company.co.za"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-3 focus:ring-teal-500/15 dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:bg-slate-900 transition-all text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 rounded-full font-bold bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white shadow-lg shadow-teal-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>{busy ? "Sending Recovery Link via Supabase..." : "Send Password Reset Link"}</span>
                    <ArrowRight size={15} />
                  </button>

                  <div className="pt-2 text-center">
                    <Link
                      to="/portal/login"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-semibold transition-colors"
                    >
                      <ArrowLeft size={13} />
                      <span>Back to Sign In</span>
                    </Link>
                  </div>
                </form>
              )}

              {/* Security strip */}
              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Lock size={12} className="text-teal-600 dark:text-teal-400" />
                  256-bit TLS Protection
                </span>
                <a href="mailto:hello@eandl.digital" className="hover:underline text-teal-600 dark:text-teal-400">
                  Need Help?
                </a>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-card/80 dark:bg-slate-950/90 py-5 text-center text-xs text-muted-foreground shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} E and L Holdings (Pty) Ltd · Enterprise Client Portal</span>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="https://eandl.digital" className="hover:text-foreground">eandl.digital</a>
            <span>•</span>
            <a href="mailto:hello@eandl.digital" className="hover:text-foreground">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
