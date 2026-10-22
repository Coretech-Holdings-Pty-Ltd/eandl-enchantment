import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Settings, User, Lock, Bell, LogOut, Save, CheckCircle2 } from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/portal/settings")({ component: PortalSettings });

function PortalSettings() {
  const navigate = useNavigate();
  const { user, loading, profile, client, access, logout } = usePortalAuth();
  const [fullName, setFullName] = useState(""); const [phone, setPhone] = useState("");
  const [newPass, setNewPass] = useState(""); const [busy, setBusy] = useState(false); const [saved, setSaved] = useState("");

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

  if (loading || !user) return null;

  return (
    <PortalLayout>
      <div className="portal-page-header">
        <h1 className="portal-page-title">Settings</h1>
        <p className="portal-page-sub">Manage your account, security, and portal preferences.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 560 }}>
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

        {/* Plan info */}
        {client && (
          <div className="portal-card">
            <div className="portal-card-title"><Settings size={16} /> Subscription</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[["Status", client.accountStatus?.replace("_", " ") || "—"], ["Projects portal", access.projects ? "Active" : "Not active"], ["Academy access", access.learning ? "Active" : "Not active"]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", fontSize: "0.82rem" }}>
                  <span style={{ color: "#64748b" }}>{l}</span>
                  <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <a href="https://eandl.digital/contact" target="_blank" rel="noreferrer" className="portal-btn portal-btn--ghost portal-btn--sm" style={{ marginTop: "0.875rem" }}>Manage subscription →</a>
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
    </PortalLayout>
  );
}
