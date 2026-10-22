import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Briefcase, Plus, Clock, CheckCircle2, AlertCircle, Lock, Send } from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { partnerSchema, BRAND_ID } from "@/lib/supabase";

export const Route = createFileRoute("/portal/change-requests")({ component: PortalChangeRequests });

function PortalChangeRequests() {
  const navigate = useNavigate();
  const { user, loading, access, client } = usePortalAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(""); const [details, setDetails] = useState(""); const [category, setCategory] = useState("Content Update"); const [urgency, setUrgency] = useState("normal"); const [minutes, setMinutes] = useState(30);
  const [busy, setBusy] = useState(false); const [fetching, setFetching] = useState(true);

  useEffect(() => { if (!loading && !user) navigate({ to: "/portal/login" }); }, [user, loading, navigate]);

  const fetchRequests = async () => {
    if (!client) { setFetching(false); return; }
    try {
      const { data } = await partnerSchema().from("change_requests").select("*").eq("brand_id", BRAND_ID).eq("company_id", client.companyId || "").order("created_at", { ascending: false });
      setRequests(data || []);
    } catch (e) { console.warn(e); }
    setFetching(false);
  };

  useEffect(() => { if (user && access.projects) fetchRequests(); else setFetching(false); }, [user, access, client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!title.trim() || !client) return;
    setBusy(true);
    try {
      await partnerSchema().from("change_requests").insert({ brand_id: BRAND_ID, company_id: client.companyId, client_id: client.id, title, details, category, urgency, minutes_requested: minutes, status: "open", ticket_number: "CR-" + Date.now().toString().slice(-6) });
      setTitle(""); setDetails(""); setMinutes(30); setShowForm(false);
      await fetchRequests();
    } catch (e) { console.warn(e); }
    setBusy(false);
  };

  if (loading || !user) return null;
  if (!access.projects) return (
    <PortalLayout>
      <div className="portal-locked">
        <div className="portal-locked-icon"><Lock size={36} color="#475569" /></div>
        <div className="portal-locked-title">Projects portal required</div>
        <p className="portal-locked-sub">Change requests are available with an active project subscription.</p>
      </div>
    </PortalLayout>
  );

  const statusColor: Record<string, string> = { open: "portal-badge--trial", in_progress: "portal-badge--pending", completed: "portal-badge--done", cancelled: "" };

  return (
    <PortalLayout>
      <div className="portal-page-header" style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <h1 className="portal-page-title">Change Requests</h1>
          <p className="portal-page-sub">Submit and track website update requests using your care plan minutes.</p>
        </div>
        <button className="portal-btn portal-btn--primary" onClick={() => setShowForm(v => !v)}>
          <Plus size={16} /> New request
        </button>
      </div>

      {showForm && (
        <div className="portal-card" style={{ marginBottom: "1.5rem", borderColor: "rgba(13,148,136,0.25)" }}>
          <div className="portal-card-title"><Send size={16} /> Submit Change Request</div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Request title *</label>
              <input className="portal-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Update homepage hero text and add new testimonial" required />
            </div>
            <div className="portal-form-row">
              <div className="portal-form-group" style={{ marginBottom: 0 }}>
                <label className="portal-label">Category</label>
                <select className="portal-input portal-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {["Content Update","Design Change","New Feature","Bug Fix","SEO Optimisation","Performance","Security","Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="portal-form-group" style={{ marginBottom: 0 }}>
                <label className="portal-label">Urgency</label>
                <select className="portal-input portal-select" value={urgency} onChange={e => setUrgency(e.target.value)}>
                  <option value="low">Low — within 2 weeks</option>
                  <option value="normal">Normal — within 1 week</option>
                  <option value="high">High — within 48 hours</option>
                </select>
              </div>
            </div>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Details & instructions</label>
              <textarea className="portal-input portal-textarea" value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe exactly what changes you need — include any copy, links, images, or specific instructions for our team..." />
            </div>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-label">Estimated minutes needed: {minutes}</label>
              <input type="range" min={15} max={240} step={15} value={minutes} onChange={e => setMinutes(+e.target.value)} style={{ width: "100%", accentColor: "#0d9488" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#475569" }}><span>15 min</span><span>4 hours</span></div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="portal-btn portal-btn--primary" disabled={busy || !title.trim()}>{busy ? "Submitting…" : "Submit request"}</button>
              <button type="button" className="portal-btn portal-btn--ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {fetching ? (
        <div style={{ color: "#64748b", fontSize: "0.85rem", padding: "1rem 0" }}>Loading…</div>
      ) : requests.length === 0 ? (
        <div className="portal-card" style={{ textAlign: "center", padding: "3rem" }}>
          <Briefcase size={48} style={{ margin: "0 auto 1rem", opacity: 0.15 }} />
          <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: "0.5rem" }}>No change requests yet</div>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1.25rem" }}>Submit your first request and our team will get it done within your care plan SLA.</p>
          <button className="portal-btn portal-btn--primary portal-btn--sm" onClick={() => setShowForm(true)}><Plus size={13} /> New request</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {requests.map(r => (
            <div key={r.id} className="portal-card" style={{ padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 700 }}>{r.ticket_number}</span>
                    <span className={`portal-badge ${statusColor[r.status] || ""}`}>{r.status?.replace("_", " ")}</span>
                    {r.urgency === "high" && <span className="portal-badge portal-badge--paused">Urgent</span>}
                  </div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f8fafc" }}>{r.title}</div>
                  {r.details && <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.25rem", lineHeight: 1.5 }}>{r.details.slice(0, 120)}{r.details.length > 120 ? "…" : ""}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.7rem", color: "#475569" }}>{r.category}</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "flex-end" }}>
                    <Clock size={11} /> {r.minutes_requested || r.minutes} min
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#475569", marginTop: "0.25rem" }}>{r.created_at ? new Date(r.created_at).toLocaleDateString("en-ZA") : ""}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
