/**
 * Portal Dashboard — main client landing after login
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard, FolderKanban, GraduationCap, Zap,
  ArrowRight, CheckCircle2, Clock, AlertCircle, Lock,
  TrendingUp, BookOpen, Shield, ExternalLink
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";

export const Route = createFileRoute("/portal/dashboard")({
  component: PortalDashboard,
});

function PortalDashboard() {
  const navigate = useNavigate();
  const { user, loading, profile, client, access, onboarding } = usePortalAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/portal/login" });
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const displayName = profile?.fullName?.split(" ")[0] || user.email?.split("@")[0] || "there";
  const onboardingPct = onboarding
    ? Math.round(((onboarding.currentStep - 1) / (onboarding.totalSteps || 5)) * 100)
    : 0;

  return (
    <PortalLayout>
      {/* Header */}
      <div className="portal-page-header">
        <h1 className="portal-page-title">
          Good day, {displayName} 👋
        </h1>
        <p className="portal-page-sub">
          {client
            ? `${client.name} · ${access.accountStatus.replace("_", " ")}`
            : "Welcome to your E&L client hub — let's get you set up."}
        </p>
      </div>

      {/* Active Onboarding Banner — always guides newly registered or in-progress clients */}
      {(!onboarding || !onboarding.isCompleted) && (
        <div className="portal-card" style={{ marginBottom: "1.5rem", borderColor: "rgba(13,148,136,0.35)", background: "linear-gradient(135deg, rgba(13,148,136,0.08), rgba(15,23,42,0.4))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(13,148,136,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Zap size={22} color="#2dd4bf" />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f8fafc" }}>
                  {onboarding?.selectedPackageCode
                    ? `Complete your setup for ${onboarding.selectedPackageCode}`
                    : "Complete Project Onboarding & Select Plan"}
                </span>
                <span className="portal-badge portal-badge--active" style={{ fontSize: "10px" }}>
                  {onboardingPct > 0 ? `${onboardingPct}% Complete` : "Step 1 of 4"}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "0.25rem 0 0.5rem 0" }}>
                {onboarding?.selectedPackageCode
                  ? "Chat with our Gemini AI Solutions Architect, upload your brand assets, and activate your build."
                  : "Scope your project, upload your brand assets (logo, profile), and choose your tailored Grow Online plan."}
              </p>
              <div className="portal-progress-track">
                <div className="portal-progress-fill portal-progress-fill--teal" style={{ width: `${Math.max(onboardingPct, 15)}%` }} />
              </div>
            </div>
            <Link to="/portal/onboarding" className="portal-btn portal-btn--primary" style={{ padding: "0.625rem 1.25rem" }}>
              Continue Onboarding <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {/* Completed Onboarding Banner — Informs client of approval, contract & payment mandate */}
      {onboarding?.isCompleted && !access.projects && (
        <div className="portal-card" style={{ marginBottom: "1.5rem", borderColor: "rgba(245,158,11,0.35)", background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(15,23,42,0.5))" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Clock size={22} color="#fbbf24" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f8fafc" }}>
                  Profile Status: Awaiting Approval, Service Contract &amp; Payment Mandate
                </span>
                <span className="portal-badge portal-badge--pending" style={{ fontSize: "10px" }}>
                  Operations Review
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.6, margin: "0.25rem 0 0.75rem 0" }}>
                Your project brief for <strong>{onboarding.selectedPackageCode || "your selected plan"}</strong> has been received. Our engineering desk is preparing your deliverables. Here are your 3 activation gates:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.5rem" }}>
                <div style={{ padding: "0.5rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.75rem", color: "#e2e8f0" }}>
                  <span style={{ fontWeight: 700, color: "#fbbf24" }}>1. Executive Approval:</span> Engineering review within 1 business day.
                </div>
                <div style={{ padding: "0.5rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.75rem", color: "#e2e8f0" }}>
                  <span style={{ fontWeight: 700, color: "#38bdf8" }}>2. Service Contract:</span> Master Services Agreement sent for digital sign-off.
                </div>
                <div style={{ padding: "0.5rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.75rem", color: "#e2e8f0" }}>
                  <span style={{ fontWeight: 700, color: "#34d399" }}>3. DebiCheck Mandate:</span> Bank-authenticated debit order authorization.
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <Link to="/portal/onboarding" className="portal-btn portal-btn--ghost portal-btn--sm">
                  View Onboarding Brief
                </Link>
                <a href="mailto:hello@eandl.digital" className="portal-btn portal-btn--ghost portal-btn--sm">
                  Contact Solutions Architect
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="portal-stats-grid">
        {access.projects && (
          <>
            <div className="portal-stat-card">
              <div className="portal-stat-label">Project Status</div>
              <div className="portal-stat-value" style={{ fontSize: "1.1rem", marginTop: "0.375rem" }}>
                {onboarding?.isCompleted ? "In Progress" : "Pending Setup"}
              </div>
              <div className="portal-stat-hint">Active development phase</div>
              <FolderKanban size={40} className="portal-stat-icon" color="#0d9488" />
            </div>
            <div className="portal-stat-card">
              <div className="portal-stat-label">Plan</div>
              <div className="portal-stat-value" style={{ fontSize: "0.95rem", marginTop: "0.375rem" }}>
                {onboarding?.selectedPackageCode || client?.accountStatus?.replace("_", " ") || "—"}
              </div>
              <div className="portal-stat-hint">Current subscription tier</div>
              <Shield size={40} className="portal-stat-icon" color="#0d9488" />
            </div>
          </>
        )}
        {access.learning && (
          <div className="portal-stat-card">
            <div className="portal-stat-label">Academy Access</div>
            <div className="portal-stat-value" style={{ fontSize: "1.1rem", marginTop: "0.375rem" }}>Active</div>
            <div className="portal-stat-hint">Learning hub unlocked</div>
            <GraduationCap size={40} className="portal-stat-icon" color="#f59e0b" />
          </div>
        )}
        <div className="portal-stat-card">
          <div className="portal-stat-label">Account</div>
          <div className="portal-stat-value" style={{ fontSize: "1.1rem", marginTop: "0.375rem" }}>
            {client?.accountStatus?.replace("_", " ") || "Setting up"}
          </div>
          <div className="portal-stat-hint">Account standing</div>
          <TrendingUp size={40} className="portal-stat-icon" color="#0d9488" />
        </div>
      </div>

      {/* Portal access cards */}
      <div className="portal-card-row" style={{ gap: "1.25rem" }}>

        {/* Projects Portal */}
        <div className="portal-card" style={{
          borderColor: access.projects ? "rgba(13,148,136,0.2)" : "rgba(255,255,255,0.05)",
          background: access.projects ? "rgba(13,148,136,0.04)" : "rgba(255,255,255,0.015)",
          position: "relative"
        }}>
          <div className="portal-card-title">
            <FolderKanban size={18} color={access.projects ? "#2dd4bf" : "#475569"} />
            Project Portal
            {access.projects
              ? <span className="portal-badge portal-badge--active" style={{ marginLeft: "auto" }}>Active</span>
              : <span className="portal-badge portal-badge--pending" style={{ marginLeft: "auto" }}>Locked</span>}
          </div>
          {access.projects ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6 }}>
                Track your website build, approve milestones, submit change requests, and monitor your DebiCheck status.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { label: "View project progress", to: "/portal/project", icon: <FolderKanban size={13} /> },
                  { label: onboarding?.isCompleted ? "View onboarding summary" : "Continue onboarding", to: "/portal/onboarding", icon: <Zap size={13} /> },
                  { label: "Submit change request", to: "/portal/change-requests", icon: <Clock size={13} /> },
                ].map(item => (
                  <Link key={item.to} to={item.to} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#2dd4bf", textDecoration: "none", padding: "0.5rem 0.75rem", borderRadius: 8, background: "rgba(13,148,136,0.06)", transition: "all 0.15s" }}>
                    {item.icon} {item.label} <ArrowRight size={12} style={{ marginLeft: "auto" }} />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6, marginBottom: "1rem" }}>
                Project portal access requires an active website, ecommerce, or app subscription.
              </p>
              <a href="https://eandl.digital/packages" target="_blank" rel="noreferrer" className="portal-btn portal-btn--ghost portal-btn--sm">
                <ExternalLink size={13} /> View packages
              </a>
            </div>
          )}
        </div>

        {/* Learning Portal */}
        <div className="portal-card" style={{
          borderColor: access.learning ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)",
          background: access.learning ? "rgba(245,158,11,0.03)" : "rgba(255,255,255,0.015)",
        }}>
          <div className="portal-card-title">
            <GraduationCap size={18} color={access.learning ? "#fbbf24" : "#475569"} />
            Learning Academy
            {access.learning
              ? <span className="portal-badge portal-badge--active" style={{ marginLeft: "auto", background: "rgba(251,191,36,0.1)", color: "#fbbf24", borderColor: "rgba(251,191,36,0.2)" }}>Active</span>
              : <span className="portal-badge portal-badge--pending" style={{ marginLeft: "auto" }}>Locked</span>}
          </div>
          {access.learning ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6 }}>
                Access your bundled E&L Digital Academy courses — AI tools, web strategy, conversion systems, and business automation.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { label: "Browse course catalogue", to: "/portal/academy", icon: <BookOpen size={13} /> },
                  { label: "My enrolled courses", to: "/portal/my-learning", icon: <GraduationCap size={13} /> },
                ].map(item => (
                  <Link key={item.to} to={item.to} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#fbbf24", textDecoration: "none", padding: "0.5rem 0.75rem", borderRadius: 8, background: "rgba(251,191,36,0.06)", transition: "all 0.15s" }}>
                    {item.icon} {item.label} <ArrowRight size={12} style={{ marginLeft: "auto" }} />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6, marginBottom: "1rem" }}>
                Academy access is included with Growth Community, Care Plus, and Enterprise System packages.
              </p>
              <a href="https://eandl.digital/packages" target="_blank" rel="noreferrer" className="portal-btn portal-btn--ghost portal-btn--sm">
                <Lock size={13} /> Unlock Academy
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Help footer */}
      <div style={{ marginTop: "2rem", padding: "1rem 1.25rem", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" }}>Need help?</div>
          <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.125rem" }}>Our team is available Mon–Fri, 8am–5pm SAST.</div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link to="/portal/support" className="portal-btn portal-btn--ghost portal-btn--sm">Open support ticket</Link>
          <a href="https://eandl.digital" target="_blank" rel="noreferrer" className="portal-btn portal-btn--ghost portal-btn--sm">
            <ExternalLink size={13} /> eandl.digital
          </a>
        </div>
      </div>
    </PortalLayout>
  );
}
