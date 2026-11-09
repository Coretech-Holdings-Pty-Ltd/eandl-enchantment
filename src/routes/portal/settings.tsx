import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Settings, User, Lock, LogOut, Save, CheckCircle2, TrendingUp, ArrowUpRight, Star, Package, ChevronRight, GraduationCap, Sparkles } from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { supabase } from "@/lib/supabase";
import { UnlockLearningPassModal } from "@/components/portal/UnlockLearningPassModal";

export const Route = createFileRoute("/portal/settings")({ component: PortalSettings });

const PLANS = [
  { name: "Spark",        fee: 199,  label: "One-page professional presence",  features: ["1 Landing Page", "SSL & Automated Backups"] },
  { name: "Build",        fee: 349,  label: "A stronger business presence",     features: ["Up to 3 Pages", "Domain & 1 Mailbox"], featured: true },
  { name: "Starter",      fee: 500,  label: "Room to tell your story",          features: ["Up to 5 Pages", "30 min content updates/mo"] },
  { name: "Business",     fee: 1200, label: "Built for your next stage",        features: ["Up to 10 Pages", "120 min updates & CMS"] },
  { name: "Professional", fee: 2200, label: "For established companies",        features: ["Up to 20 Pages", "300 min updates & Portal"] },
  { name: "Shop Start",   fee: 799,  label: "eCommerce launch with Paystack",   features: ["Up to 100 Products", "60 min updates/mo"] },
  { name: "Shop Growth",  fee: 1299, label: "Growing online retail store",      features: ["Up to 1 000 Products", "120 min updates/mo"] },
];

function PortalSettings() {
  const navigate = useNavigate();
  const { user, loading, profile, client, access, logout } = usePortalAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPass, setNewPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [showUnlockPassModal, setShowUnlockPassModal] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/portal/login" }); }, [user, loading, navigate]);
  useEffect(() => { if (profile) { setFullName(profile.fullName || ""); setPhone(profile.phone || ""); } }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await supabase.auth.updateUser({ data: { full_name: fullName } });
      setSaved("profile"); setTimeout(() => setSaved(""), 2500);
    } catch (e) { console.warn(e); }
    setBusy(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); if (newPass.length < 8) return; setBusy(true);
    try {
      await supabase.auth.updateUser({ password: newPass });
      setNewPass(""); setSaved("password"); setTimeout(() => setSaved(""), 2500);
    } catch (e) { console.warn(e); }
    setBusy(false);
  };

  if (loading || !user) {
    return <PortalLayout>{null}</PortalLayout>;
  }

  // Detect current plan by matching fee or name from client record
  const rawPlan = client?.accountStatus || "";
  const currentPlanName = PLANS.find(p =>
    rawPlan.toLowerCase().includes(p.name.toLowerCase())
  )?.name ?? null;

  const getPlanCTA = (plan: typeof PLANS[0]) => {
    const isCurrent = plan.name === currentPlanName;
    const isUpgrade = !currentPlanName || (plan.fee > (PLANS.find(p => p.name === currentPlanName)?.fee ?? 0));
    if (isCurrent) return null; // disabled
    const action = isUpgrade ? "upgrade" : "downgrade";
    const subject = encodeURIComponent(`Plan ${action.charAt(0).toUpperCase() + action.slice(1)} Request — ${plan.name}`);
    const body = encodeURIComponent(
      `Hi E&L Digital team,\n\nI'd like to ${action} my account to the ${plan.name} plan (R${plan.fee}/month).\n\nPlease assist me with an updated service agreement and mandate.\n\nMy account email: ${user?.email}`
    );
    return `mailto:hello@eandl.digital?subject=${subject}&body=${body}`;
  };

  return (
    <PortalLayout>
      <div className="portal-page-header">
        <h1 className="portal-page-title">Settings</h1>
        <p className="portal-page-sub">Manage your account, security, and subscription.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 620 }}>

        {/* Profile */}
        <div className="portal-card">
          <div className="portal-card-title"><User size={16} /> Profile</div>
          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Email</label>
              <input className="portal-input" value={user.email || ""} disabled style={{ opacity: 0.5 }} />
            </div>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Full Name</label>
              <input className="portal-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Phone</label>
              <input className="portal-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 71 000 0000" type="tel" />
            </div>
            <button type="submit" className="portal-btn portal-btn--primary" disabled={busy}>
              {saved === "profile" ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save changes</>}
            </button>
          </form>
        </div>

        {/* Plan Management */}
        {client && (
          <div className="portal-card" style={{ padding: "1.375rem" }}>
            <div className="portal-card-title" style={{ marginBottom: "0.25rem" }}>
              <Package size={16} /> Manage Plan
            </div>
            <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1.25rem", lineHeight: 1.6 }}>
              To change your plan we'll prepare an updated service agreement and DebiCheck mandate. Changes take effect from your next billing cycle.
            </p>

            {/* Current plan status row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {[
                ["Status", (client.accountStatus || "—").replace(/_/g, " ")],
                ["Projects portal", access.projects ? "Active" : "Not active"],
                ["Academy access", access.learning ? "Active" : "Not active"],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flex: "1 1 180px", padding: "0.5rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", fontSize: "0.78rem" }}>
                  <span style={{ color: "#64748b" }}>{l}</span>
                  <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Learning Pass Add-on Card */}
            <div style={{
              padding: "1rem 1.125rem",
              borderRadius: 12,
              marginBottom: "1.25rem",
              background: access.learning ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
              border: access.learning ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(245,158,11,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: access.learning ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: access.learning ? "#34d399" : "#fbbf24"
                }}>
                  <GraduationCap size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>E&amp;L Digital Learning Academy Pass</span>
                    <span style={{
                      fontSize: "9px", fontWeight: 800, textTransform: "uppercase",
                      padding: "2px 7px", borderRadius: 20,
                      background: access.learning ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)",
                      color: access.learning ? "#34d399" : "#fbbf24",
                      border: access.learning ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(245,158,11,0.4)"
                    }}>
                      {access.learning ? "Active & Unlocked" : "Available Add-on"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "2px 0 0 0" }}>
                    {access.learning
                      ? "Full access to Level 1 & Level 2 live masterclasses, templates, cohort community & certifications."
                      : "Add the Active Learner Pass (R199/mo) to unlock all live masterclasses, AI templates, and workshops."}
                  </p>
                </div>
              </div>

              {!access.learning ? (
                <button
                  type="button"
                  onClick={() => setShowUnlockPassModal(true)}
                  className="portal-btn portal-btn--amber portal-btn--sm cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0f172a", fontWeight: 800, whiteSpace: "nowrap" }}
                >
                  <Sparkles size={13} /> Add Learning Pass (R199/mo)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate({ to: "/portal/academy" })}
                  className="portal-btn portal-btn--ghost portal-btn--sm"
                  style={{ color: "#34d399", borderColor: "rgba(16,185,129,0.3)" }}
                >
                  View Academy Courses <ChevronRight size={13} />
                </button>
              )}
            </div>

            {/* Plans grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
              {PLANS.map((plan) => {
                const isCurrent = plan.name === currentPlanName;
                const ctaHref = getPlanCTA(plan);
                return (
                  <div key={plan.name} style={{
                    borderRadius: 12, padding: "1rem 1.125rem",
                    background: isCurrent ? "rgba(13,148,136,0.1)" : plan.featured ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.03)",
                    border: isCurrent ? "1px solid rgba(13,148,136,0.4)" : plan.featured ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.07)",
                    position: "relative", overflow: "hidden"
                  }}>
                    {/* Badges */}
                    {isCurrent && (
                      <div style={{ position: "absolute", top: 8, right: 8, fontSize: "0.6rem", fontWeight: 800, background: "#0d9488", color: "white", padding: "2px 7px", borderRadius: 20, letterSpacing: "0.06em" }}>CURRENT</div>
                    )}
                    {plan.featured && !isCurrent && (
                      <div style={{ position: "absolute", top: 8, right: 8, fontSize: "0.6rem", fontWeight: 800, background: "rgba(99,102,241,0.9)", color: "white", padding: "2px 7px", borderRadius: 20, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 3 }}>
                        <Star size={8} /> POPULAR
                      </div>
                    )}

                    <div style={{ marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 800, color: isCurrent ? "#2dd4bf" : "#e2e8f0" }}>{plan.name}</span>
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
                      R{plan.fee.toLocaleString()}<span style={{ fontSize: "0.68rem", fontWeight: 500, color: "#64748b" }}>/mo</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.75rem", lineHeight: 1.4 }}>{plan.label}</div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.875rem" }}>
                      {plan.features.map(f => (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.72rem", color: "#94a3b8" }}>
                          <CheckCircle2 size={11} color={isCurrent ? "#2dd4bf" : "#475569"} />
                          {f}
                        </div>
                      ))}
                    </div>

                    {isCurrent ? (
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#2dd4bf", display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={12} /> Your active plan
                      </div>
                    ) : (
                      <a href={ctaHref!} className="portal-btn portal-btn--ghost portal-btn--sm" style={{ width: "100%", justifyContent: "center", textAlign: "center", fontSize: "0.72rem" }}>
                        {plan.fee > (PLANS.find(p => p.name === currentPlanName)?.fee ?? 0)
                          ? <><TrendingUp size={12} /> Upgrade</>
                          : <><ArrowUpRight size={12} /> Switch plan</>}
                        <ChevronRight size={12} style={{ marginLeft: "auto" }} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Security */}
        <div className="portal-card">
          <div className="portal-card-title"><Lock size={16} /> Security</div>
          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">New Password (min 8 chars)</label>
              <input type="password" className="portal-input" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Enter new password" minLength={8} />
            </div>
            <button type="submit" className="portal-btn portal-btn--ghost" disabled={busy || newPass.length < 8}>
              {saved === "password" ? <><CheckCircle2 size={14} /> Password updated</> : "Update password"}
            </button>
          </form>
        </div>

        {/* Sign out */}
        <button className="portal-btn portal-btn--danger" onClick={logout} style={{ alignSelf: "flex-start" }}>
          <LogOut size={16} /> Sign out of portal
        </button>
      </div>

      {/* Unlock Learning Pass Modal */}
      <UnlockLearningPassModal
        isOpen={showUnlockPassModal}
        onClose={() => setShowUnlockPassModal(false)}
      />
    </PortalLayout>
  );
}
