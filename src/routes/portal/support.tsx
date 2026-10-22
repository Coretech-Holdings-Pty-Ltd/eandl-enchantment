import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { HelpCircle, Plus, MessageSquare, Clock, CheckCircle2, Send } from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { partnerSchema, BRAND_ID } from "@/lib/supabase";

export const Route = createFileRoute("/portal/support")({ component: PortalSupport });

function PortalSupport() {
  const navigate = useNavigate();
  const { user, loading, client } = usePortalAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState(""); const [body, setBody] = useState(""); const [priority, setPriority] = useState("normal");
  const [busy, setBusy] = useState(false); const [fetching, setFetching] = useState(true);

  useEffect(() => { if (!loading && !user) navigate({ to: "/portal/login" }); }, [user, loading, navigate]);

  const fetchTickets = async () => {
    if (!user) return;
    try {
      const { data } = await partnerSchema().from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setTickets(data || []);
    } catch (e) { console.warn(e); }
    setFetching(false);
  };

  useEffect(() => { if (user) fetchTickets(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!subject.trim()) return;
    setBusy(true);
    try {
      await partnerSchema().from("support_tickets").insert({ brand_id: BRAND_ID, user_id: user?.id, company_id: client?.companyId, client_id: client?.id, subject, body, priority, status: "open", ticket_number: "TKT-" + Date.now().toString().slice(-6) });
      setSubject(""); setBody(""); setShowForm(false);
      await fetchTickets();
    } catch (e) { console.warn(e); }
    setBusy(false);
  };

  if (loading || !user) return null;
  const statusColor: Record<string, string> = { open: "portal-badge--trial", in_progress: "portal-badge--pending", resolved: "portal-badge--done", closed: "" };

  return (
    <PortalLayout>
      <div className="portal-page-header" style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <h1 className="portal-page-title">Support</h1>
          <p className="portal-page-sub">Get help from the E&L team. We respond within 4 business hours.</p>
        </div>
        <button className="portal-btn portal-btn--primary" onClick={() => setShowForm(v => !v)}><Plus size={16} /> New ticket</button>
      </div>

      {showForm && (
        <div className="portal-card" style={{ marginBottom: "1.5rem", borderColor: "rgba(13,148,136,0.25)" }}>
          <div className="portal-card-title"><Send size={16} /> Open Support Ticket</div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Subject *</label>
              <input className="portal-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of your issue or question" required />
            </div>
            <div className="portal-form-row">
              <div className="portal-form-group" style={{ marginBottom: 0 }}>
                <label className="portal-label">Priority</label>
                <select className="portal-input portal-select" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Message</label>
              <textarea className="portal-input portal-textarea" value={body} onChange={e => setBody(e.target.value)} placeholder="Describe your issue in detail. Include any error messages, URLs, or steps to reproduce…" />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="portal-btn portal-btn--primary" disabled={busy || !subject.trim()}>{busy ? "Submitting…" : "Submit ticket"}</button>
              <button type="button" className="portal-btn portal-btn--ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Quick help */}
      <div className="portal-card" style={{ marginBottom: "1.25rem", background: "rgba(13,148,136,0.04)", borderColor: "rgba(13,148,136,0.15)" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {[{ icon: "📞", label: "Call us", detail: "+27 (0) 11 000 0000", href: "tel:+27110000000" }, { icon: "💬", label: "WhatsApp", detail: "+27 71 000 0000", href: "https://wa.me/27710000000" }, { icon: "📧", label: "Email", detail: "hello@eandl.digital", href: "mailto:hello@eandl.digital" }].map(c => (
            <a key={c.label} href={c.href} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 160, padding: "0.875rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none", display: "flex", gap: "0.625rem", alignItems: "center", transition: "all 0.15s" }}>
              <span style={{ fontSize: "1.25rem" }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#e2e8f0" }}>{c.label}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{c.detail}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {fetching ? <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Loading…</div> : tickets.length === 0 ? (
        <div className="portal-card" style={{ textAlign: "center", padding: "3rem" }}>
          <HelpCircle size={48} style={{ margin: "0 auto 1rem", opacity: 0.15 }} />
          <div style={{ fontWeight: 700, color: "#e2e8f0" }}>No tickets yet</div>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>Open a ticket and our team will get back to you within 4 business hours.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {tickets.map(t => (
            <div key={t.id} className="portal-card" style={{ padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.68rem", color: "#475569", fontWeight: 700 }}>{t.ticket_number}</span>
                    <span className={`portal-badge ${statusColor[t.status] || ""}`}>{t.status?.replace("_", " ")}</span>
                    {t.priority === "urgent" && <span className="portal-badge portal-badge--paused">Urgent</span>}
                  </div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f8fafc" }}>{t.subject}</div>
                  {t.body && <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.25rem" }}>{t.body.slice(0, 100)}{t.body.length > 100 ? "…" : ""}</div>}
                </div>
                <div style={{ fontSize: "0.65rem", color: "#475569", textAlign: "right", flexShrink: 0 }}>
                  {t.created_at ? new Date(t.created_at).toLocaleDateString("en-ZA") : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
