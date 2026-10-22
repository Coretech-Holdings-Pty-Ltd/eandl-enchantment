/**
 * Portal Login & Register Page
 * Completely separate from the public site — no nav/footer
 * Domain: portal.eandl.digital (or /portal/login)
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Zap, Eye, EyeOff, ArrowRight, ShieldCheck, GraduationCap, FolderKanban, Mail, Lock, User, ExternalLink } from "lucide-react";
import { usePortalAuth } from "@/lib/portal-auth";

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
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/portal/dashboard" });
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setBusy(true);
    const { error: err } = await login(email, password);
    if (err) {
      setError(err.includes("Email not confirmed")
        ? "Please check your email and confirm your account before logging in."
        : err.includes("Invalid login credentials")
        ? "Invalid email or password. Please try again."
        : err);
    } else {
      navigate({ to: "/portal/dashboard" });
    }
    setBusy(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setBusy(true);
    if (!fullName.trim()) { setError("Please enter your full name."); setBusy(false); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); setBusy(false); return; }
    const { error: err } = await register(email, password, fullName);
    if (err) {
      setError(err.includes("already registered") ? "This email is already registered. Please log in." : err);
    } else {
      setSuccess("Account created! Check your email to confirm, then log in.");
      setTab("login");
    }
    setBusy(false);
  };

  if (loading) {
    return (
      <div className="portal-auth-page">
        <div className="portal-auth-bg" />
        <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="portal-auth-page">
      <div className="portal-auth-bg" />
      <div className="portal-auth-card">
        {/* Logo */}
        <div className="portal-auth-logo">
          <div className="portal-auth-logo-icon">
            <Zap size={22} color="white" />
          </div>
          <div>
            <div className="portal-auth-logo-name">E&amp;L Portal</div>
            <div className="portal-auth-logo-sub">eandl.digital</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="portal-auth-tabs">
          <button
            className={`portal-auth-tab ${tab === "login" ? "portal-auth-tab--active" : ""}`}
            onClick={() => { setTab("login"); setError(""); setSuccess(""); }}
          >
            Sign In
          </button>
          <button
            className={`portal-auth-tab ${tab === "register" ? "portal-auth-tab--active" : ""}`}
            onClick={() => { setTab("register"); setError(""); setSuccess(""); }}
          >
            Create Account
          </button>
        </div>

        {tab === "login" ? (
          <>
            <h1 className="portal-auth-title">Welcome back</h1>
            <p className="portal-auth-sub">Sign in to your E&amp;L client hub to manage projects, track your website, and access the academy.</p>
          </>
        ) : (
          <>
            <h1 className="portal-auth-title">Create your account</h1>
            <p className="portal-auth-sub">Get instant access to your project portal and learning academy. No credit card required to sign up.</p>
          </>
        )}

        {error && <div className="portal-auth-error">{error}</div>}
        {success && <div className="portal-auth-success">{success}</div>}

        {tab === "login" ? (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Email address</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                <input
                  type="email" className="portal-input" placeholder="you@company.co.za"
                  value={email} onChange={e => setEmail(e.target.value)}
                  required style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </div>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                <input
                  type={showPass ? "text" : "password"} className="portal-input"
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="portal-btn portal-btn--primary" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
              {busy ? "Signing in..." : <><span>Sign in</span><ArrowRight size={16} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Full name</label>
              <div style={{ position: "relative" }}>
                <User size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                <input
                  type="text" className="portal-input" placeholder="Your full name"
                  value={fullName} onChange={e => setFullName(e.target.value)}
                  required style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </div>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Email address</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                <input
                  type="email" className="portal-input" placeholder="you@company.co.za"
                  value={email} onChange={e => setEmail(e.target.value)}
                  required style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </div>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                <input
                  type={showPass ? "text" : "password"} className="portal-input"
                  placeholder="Min. 8 characters" value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={8}
                  style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="portal-btn portal-btn--primary" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
              {busy ? "Creating account..." : <><span>Create account</span><ArrowRight size={16} /></>}
            </button>
          </form>
        )}

        {/* Feature pills */}
        <div className="portal-auth-divider"><span>Your portal includes</span></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <span className="portal-chip portal-chip--projects"><FolderKanban size={11} /> Project tracking</span>
          <span className="portal-chip portal-chip--learning"><GraduationCap size={11} /> Academy access</span>
          <span className="portal-chip portal-chip--projects"><ShieldCheck size={11} /> DebiCheck portal</span>
        </div>

        <div className="portal-auth-footer">
          <a href="https://eandl.digital" className="portal-auth-link" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <ExternalLink size={12} /> eandl.digital
          </a>
          {" · "}
          <a href="mailto:hello@eandl.digital" className="portal-auth-link">hello@eandl.digital</a>
        </div>
      </div>
    </div>
  );
}
