/**
 * Portal Dashboard — main client landing after login
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, FolderKanban, GraduationCap, Zap,
  ArrowRight, CheckCircle2, Clock, AlertCircle, Lock,
  TrendingUp, BookOpen, Shield, ExternalLink,
  FileText, CreditCard, Building2, CheckSquare, AlertTriangle, Loader2,
  Printer, Download
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";

export const Route = createFileRoute("/portal/dashboard")({
  component: PortalDashboard,
});

function PortalDashboard() {
  const navigate = useNavigate();
  const { user, loading, profile, client, access, onboarding, signMandate, setToast } = usePortalAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/portal/login" });
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const displayName = profile?.fullName?.split(" ")[0] || user.email?.split("@")[0] || "there";
  const onboardingPct = onboarding
    ? Math.round(((onboarding.currentStep - 1) / (onboarding.totalSteps || 5)) * 100)
    : 0;

  // Mandate signing state
  const [showMandateForm, setShowMandateForm] = useState(false);
  const [mandateBankName, setMandateBankName] = useState("");
  const [mandateAccountHolder, setMandateAccountHolder] = useState(profile?.fullName || "");
  const [mandateAccountType, setMandateAccountType] = useState<"cheque" | "savings" | "transmission">("cheque");
  const [mandateAccountNumber, setMandateAccountNumber] = useState("");
  const [mandateBranchCode, setMandateBranchCode] = useState("");
  const [mandateTermsAccepted, setMandateTermsAccepted] = useState(false);
  const [mandateSubmitting, setMandateSubmitting] = useState(false);

  const SA_BANKS: Record<string, string> = {
    "Standard Bank": "051001",
    "First National Bank (FNB)": "250655",
    "Absa Bank": "632005",
    "Nedbank": "198765",
    "Capitec Bank": "470010",
    "Discovery Bank": "679000",
    "TymeBank": "678910",
    "Investec Private": "580105",
  };

  const handleMandateBankChange = (bank: string) => {
    setMandateBankName(bank);
    if (SA_BANKS[bank]) setMandateBranchCode(SA_BANKS[bank]);
  };

  const handleSignMandate = async () => {
    if (!mandateBankName || !mandateAccountHolder || !mandateAccountNumber || !mandateBranchCode) {
      setToast("Please fill in all banking details.");
      return;
    }
    if (!mandateTermsAccepted) {
      setToast("Please accept the mandate terms to continue.");
      return;
    }
    setMandateSubmitting(true);
    const result = await signMandate({
      bankName: mandateBankName,
      accountHolder: mandateAccountHolder,
      accountType: mandateAccountType,
      accountNumber: mandateAccountNumber,
      branchCode: mandateBranchCode,
    });
    setMandateSubmitting(false);
    if (result.error) {
      setToast(`Error: ${result.error}`);
    } else {
      setToast("✅ Mandate authorized successfully! Your account is now being activated.");
      setShowMandateForm(false);
    }
  };

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
      {onboarding?.isCompleted && onboarding?.status !== "converted" && !access.projects && (
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

      {/* ── Mandate Signing Card ───────────────────────────────────────── */}
      {Boolean(client?.mandateDocUrl && client?.mandateStatus !== "authorized") && (
        <div className="portal-card" style={{ marginBottom: "1.5rem", borderColor: "rgba(239,68,68,0.45)", background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(15,23,42,0.6))" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(239,68,68,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={24} color="#f87171" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f8fafc" }}>
                  Action Required: Review, Print &amp; Sign Service Agreement Mandate
                </span>
                <span className="portal-badge" style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", borderColor: "rgba(239,68,68,0.3)", fontSize: "10px" }}>
                  Level 2 Action
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#cbd5e1", lineHeight: 1.6, margin: "0.25rem 0 0.85rem 0" }}>
                Your official service agreement and DebiCheck debit order mandate have been prepared by our operations desk. Please review or print the agreement, submit your banking account details below, and authorize the mandate to activate your retainer and sprint build.
              </p>

              {/* View / Download / Print Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <a
                  href={client.mandateDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 8, color: "#f87171", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700 }}
                >
                  <ExternalLink size={13} /> View Agreement (PDF)
                </a>
                <a
                  href={client.mandateDocUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e2e8f0", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700 }}
                >
                  <Download size={13} /> Download PDF
                </a>
                <button
                  type="button"
                  onClick={() => handlePrintAgreement(client.mandateDocUrl!)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e2e8f0", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  <Printer size={13} /> Print Agreement
                </button>
              </div>

              {/* Toggle form */}
              {!showMandateForm ? (
                <div>
                  <button
                    onClick={() => setShowMandateForm(true)}
                    className="portal-btn portal-btn--primary"
                    style={{ padding: "0.625rem 1.5rem" }}
                  >
                    <CreditCard size={15} /> Complete Banking Details & Sign Mandate
                  </button>
                </div>
              ) : (
                <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem", marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <Building2 size={16} color="#2dd4bf" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>Banking Details</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                    {/* Bank Name */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Bank Name *
                      </label>
                      <select
                        value={mandateBankName}
                        onChange={e => handleMandateBankChange(e.target.value)}
                        style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: mandateBankName ? "#f8fafc" : "#64748b", fontSize: "0.82rem" }}
                      >
                        <option value="">Select your bank</option>
                        {Object.keys(SA_BANKS).map(bank => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>

                    {/* Account Holder */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        value={mandateAccountHolder}
                        onChange={e => setMandateAccountHolder(e.target.value)}
                        placeholder="Full name as on bank account"
                        style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#f8fafc", fontSize: "0.82rem", boxSizing: "border-box" }}
                      />
                    </div>

                    {/* Account Type */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Account Type *
                      </label>
                      <select
                        value={mandateAccountType}
                        onChange={e => setMandateAccountType(e.target.value as any)}
                        style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#f8fafc", fontSize: "0.82rem" }}
                      >
                        <option value="cheque">Cheque / Current</option>
                        <option value="savings">Savings</option>
                        <option value="transmission">Transmission</option>
                      </select>
                    </div>

                    {/* Account Number */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Account Number *
                      </label>
                      <input
                        type="text"
                        value={mandateAccountNumber}
                        onChange={e => setMandateAccountNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 62819283719"
                        style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#f8fafc", fontSize: "0.82rem", fontFamily: "monospace", boxSizing: "border-box" }}
                      />
                    </div>

                    {/* Branch Code */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Branch Code *
                      </label>
                      <input
                        type="text"
                        value={mandateBranchCode}
                        onChange={e => setMandateBranchCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="Auto-filled by bank selection"
                        style={{ width: "100%", padding: "0.6rem 0.75rem", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#f8fafc", fontSize: "0.82rem", fontFamily: "monospace", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  {/* Terms */}
                  <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8 }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={mandateTermsAccepted}
                        onChange={e => setMandateTermsAccepted(e.target.checked)}
                        style={{ marginTop: "2px", accentColor: "#0d9488", width: 16, height: 16, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: "0.75rem", color: "#cbd5e1", lineHeight: 1.6 }}>
                        I authorize E&L Digital (Pty) Ltd to debit my account with the agreed monthly subscription amount via DebiCheck authenticated debit order. I confirm I have read and accept the{" "}
                        <a href={client.mandateDocUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2dd4bf" }}>
                          service agreement and mandate terms
                        </a>
                        .
                      </span>
                    </label>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                    <button
                      onClick={() => setShowMandateForm(false)}
                      style={{ flex: 1, padding: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#94a3b8", fontSize: "0.82rem", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSignMandate}
                      disabled={mandateSubmitting || !mandateTermsAccepted || !mandateBankName || !mandateAccountNumber}
                      style={{
                        flex: 2,
                        padding: "0.625rem 1.25rem",
                        background: mandateSubmitting || !mandateTermsAccepted || !mandateBankName || !mandateAccountNumber
                          ? "rgba(13,148,136,0.3)"
                          : "linear-gradient(135deg,#0d9488,#059669)",
                        border: "none",
                        borderRadius: 8,
                        color: "#ffffff",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: mandateSubmitting ? "wait" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem"
                      }}
                    >
                      {mandateSubmitting ? (
                        <>
                          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                          Authorizing…
                        </>
                      ) : (
                        <>
                          <CheckSquare size={14} />
                          Authorize & Sign Mandate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MANDATE AUTHORIZED CONFIRMATION CARD ──────────────────────────── */}
      {client?.mandateStatus === "authorized" && (
        <div className="portal-card" style={{ marginBottom: "1.5rem", borderColor: "rgba(16,185,129,0.4)", background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(15,23,42,0.5))" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CheckCircle2 size={24} color="#34d399" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f8fafc" }}>
                  Service Agreement Signed &amp; DebiCheck Mandate Authorized
                </span>
                <span className="portal-badge portal-badge--active" style={{ fontSize: "10px" }}>
                  Level 3 Verified
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.6, margin: "0.25rem 0 0.75rem 0" }}>
                Your banking account ({client.bankName || "South African Bank"} · ••••{client.accountNumber ? client.accountNumber.slice(-4) : "••••"}) and signed mandate are registered. Our operations desk is loading the DebiCheck debit order with your bank.
              </p>
              {client.mandateDocUrl && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <a
                    href={client.mandateDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.9rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e2e8f0", textDecoration: "none", fontSize: "0.75rem", fontWeight: 600 }}
                  >
                    <FileText size={13} /> View Signed SLA (PDF)
                  </a>
                  <button
                    type="button"
                    onClick={() => handlePrintAgreement(client.mandateDocUrl!)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.9rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e2e8f0", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    <Printer size={13} /> Print Agreement
                  </button>
                </div>
              )}
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
