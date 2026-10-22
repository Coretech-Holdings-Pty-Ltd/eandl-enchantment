/**
 * Client Portal — Set New Password Suite
 * Invoked when user arrives with Supabase recovery token in URL hash
 * Route: /portal/reset-password
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/lib/theme";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/portal/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if session or recovery tokens are present
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setError(null);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter identical passwords.");
      return;
    }

    setBusy(true);

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateErr) {
        setError(updateErr.message || "Failed to update password. Your recovery link may have expired.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
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
              <span>Sign In</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center">
        <div className="relative bg-card text-card-foreground rounded-3xl p-6 sm:p-9 shadow-xl border border-border space-y-6">
          
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 mb-3">
              <KeyRound size={13} />
              <span>Update Credentials</span>
            </div>
            
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Set New Password
            </h1>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Choose a strong, private password for your E&L client workspace.
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
          {success ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Password Updated!</div>
                  <div className="mt-1 leading-relaxed text-emerald-700 dark:text-emerald-200">
                    Your password has been successfully reset. You can now use your new credentials to sign in to your client platform.
                  </div>
                </div>
              </div>

              <Link
                to="/portal/login"
                className="w-full py-3 rounded-full font-bold bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white shadow-lg text-center text-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-4"
              >
                <span>Sign In with New Password</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            /* Reset Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-foreground">New Password (Min. 8 chars) *</label>
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
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
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-3 focus:ring-teal-500/15 dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:bg-slate-900 transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-3 focus:ring-teal-500/15 dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:bg-slate-900 transition-all text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-full font-bold bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white shadow-lg shadow-teal-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{busy ? "Updating via Supabase Auth..." : "Update Password & Sign In"}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* Footer security strip */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
              POPIA Encrypted
            </span>
            <Link to="/portal/login" className="hover:underline text-teal-600 dark:text-teal-400 font-medium">
              Cancel
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-card/80 dark:bg-slate-950/90 py-5 text-center text-xs text-muted-foreground shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} E and L Holdings (Pty) Ltd</span>
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
