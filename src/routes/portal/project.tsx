/**
 * Portal Project Page — track website build progress, staging demo review,
 * live launch approvals, domain cutover, and milestone acceptance.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  FolderKanban, CheckCircle2, Clock, Rocket, Globe, ExternalLink,
  Lock, RefreshCw, MessageSquare, Check, Sparkles, AlertCircle,
  Laptop, ShieldCheck, ArrowRight, Radio, Send
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { techSchema, BRAND_ID } from "@/lib/supabase";

export const Route = createFileRoute("/portal/project")({ component: PortalProject });

interface Milestone {
  id: string;
  title: string;
  status: string;
  completed_at?: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  staging_url?: string;
  production_url?: string;
  milestones: Milestone[];
  demo_approved?: boolean;
  demo_approved_at?: string;
  domain_option?: "new_domain" | "existing_domain";
  existing_domain_name?: string;
  domain_host_registrar?: string;
  rawNotes?: any;
}

function PortalProject() {
  const navigate = useNavigate();
  const { user, loading, access, client } = usePortalAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [fetching, setFetching] = useState(true);

  // Approval form state
  const [selectedDomainOption, setSelectedDomainOption] = useState<"new_domain" | "existing_domain">("new_domain");
  const [existingDomainInput, setExistingDomainInput] = useState("");
  const [domainHostInput, setDomainHostInput] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/portal/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !access.projects) { setFetching(false); return; }
    (async () => {
      try {
        let query = techSchema()
          .from("projects")
          .select("*, milestones(id, title, status, completed_at)")
          .order("created_at", { ascending: false });

        if (client?.companyId) {
          query = query.or(`company_id.eq.${client.companyId},client_email.eq.${user.email || ""}`);
        } else if (user.email) {
          query = query.eq("client_email", user.email);
        }

        const { data, error } = await query.limit(1).maybeSingle();
        if (data && !error) {
          let notesMeta: any = {};
          if (data.notes) {
            try {
              notesMeta = typeof data.notes === "object" ? data.notes : JSON.parse(data.notes);
            } catch (_) {}
          }

          const isApproved = Boolean(notesMeta.demo_approved);
          const domainOpt = notesMeta.domain_option || (data.domain_name ? "existing_domain" : "new_domain");
          const exDomain = data.domain_name || notesMeta.existing_domain_name || "";
          const regHost = data.hosting_provider || notesMeta.domain_host_registrar || "";

          setProject({
            id: data.id,
            name: data.name || data.project_name || "Your Website Project",
            status: data.status || "in_progress",
            progress: data.completion_pct ?? data.completion_percentage ?? 25,
            staging_url: data.staging_url || data.preview_url,
            production_url: data.live_url || data.delivery_url,
            milestones: (data.milestones || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)),
            demo_approved: isApproved,
            demo_approved_at: notesMeta.demo_approved_at,
            domain_option: domainOpt,
            existing_domain_name: exDomain,
            domain_host_registrar: regHost,
            rawNotes: notesMeta
          });

          setSelectedDomainOption(domainOpt);
          if (exDomain) setExistingDomainInput(exDomain);
          if (regHost) setDomainHostInput(regHost);
        }
      } catch (e) {
        console.warn("Project fetch error:", e);
      }
      setFetching(false);
    })();
  }, [user, access, client]);

  const handleApproveStaging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setIsApproving(true);

    try {
      const newMeta = {
        ...(project.rawNotes || {}),
        demo_approved: true,
        demo_approved_at: new Date().toISOString(),
        domain_option: selectedDomainOption,
        existing_domain_name: selectedDomainOption === "existing_domain" ? existingDomainInput.trim() : undefined,
        domain_host_registrar: selectedDomainOption === "existing_domain" ? domainHostInput.trim() : undefined,
      };

      const updatePayload: any = {
        notes: JSON.stringify(newMeta),
        status: "review"
      };

      if (selectedDomainOption === "existing_domain") {
        if (existingDomainInput.trim()) updatePayload.domain_name = existingDomainInput.trim();
        if (domainHostInput.trim()) updatePayload.hosting_provider = domainHostInput.trim();
      }

      await techSchema()
        .from("projects")
        .update(updatePayload)
        .eq("id", project.id);

      setProject(prev => prev ? {
        ...prev,
        demo_approved: true,
        demo_approved_at: newMeta.demo_approved_at,
        domain_option: selectedDomainOption,
        existing_domain_name: existingDomainInput.trim(),
        domain_host_registrar: domainHostInput.trim(),
        rawNotes: newMeta
      } : null);

      setApprovalSuccess(true);
    } catch (err) {
      console.error("Failed to approve staging demo:", err);
    } finally {
      setIsApproving(false);
    }
  };

  if (loading || !user) {
    return <PortalLayout>{null}</PortalLayout>;
  }

  if (!access.projects) return (
    <PortalLayout>
      <div className="portal-locked">
        <div className="portal-locked-icon"><Lock size={36} color="#475569" /></div>
        <div className="portal-locked-title">Project Portal Locked</div>
        <p className="portal-locked-sub">An active website or ecommerce subscription is required to access project tracking.</p>
        <a href="https://eandl.digital/packages" target="_blank" rel="noreferrer" className="portal-btn portal-btn--primary">View packages</a>
      </div>
    </PortalLayout>
  );

  const stages = [
    { key: "discovery", label: "Discovery", desc: "Requirements & brief" },
    { key: "design", label: "Design", desc: "Mockups & architecture" },
    { key: "development", label: "Development", desc: "Staging build" },
    { key: "review", label: "Staging QA", desc: "Client preview & approval" },
    { key: "launch", label: "Launch", desc: "Production & DNS cutover" },
  ];

  const currentStageIdx = project
    ? (project.demo_approved ? 3 : stages.findIndex(s => project.status?.toLowerCase().includes(s.key)))
    : 0;

  return (
    <PortalLayout>
      <div className="portal-page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="portal-page-title">Project Delivery Hub</h1>
            <p className="portal-page-sub">{project?.name || "Your E&L website project"}</p>
          </div>
          {project?.staging_url && (
            <a
              href={project.staging_url}
              target="_blank"
              rel="noreferrer"
              className="portal-btn portal-btn--primary portal-btn--sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Laptop size={14} /> Open Staging Demo ↗
            </a>
          )}
        </div>
      </div>

      {fetching ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.85rem", padding: "2rem 0" }}>
          <RefreshCw size={16} className="animate-spin" /> Loading project details…
        </div>
      ) : !project ? (
        <div className="space-y-5">
          {/* Hero holding card */}
          <div className="portal-card" style={{ textAlign: "center", padding: "2.5rem 1.5rem", borderColor: "rgba(13,148,136,0.3)", background: "linear-gradient(135deg, rgba(13,148,136,0.07) 0%, rgba(15,23,42,0.6) 100%)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", animation: "pulse 2.5s ease-in-out infinite", position: "relative" }}>
              <FolderKanban size={32} color="#2dd4bf" />
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#f8fafc", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>Project Setup in Progress</h2>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", maxWidth: 440, margin: "0 auto 1.75rem", lineHeight: 1.75 }}>
              Your Solutions Architect is reviewing your onboarding brief. Your dedicated staging preview link will be published right here in your portal as soon as initial scaffolding completes.
            </p>

            {/* 4-stage mini pipeline */}
            <div style={{ display: "flex", justifyContent: "center", maxWidth: 480, margin: "0 auto 2rem" }}>
              {[
                { label: "Brief\nReceived", done: true },
                { label: "Architect\nReview", active: true },
                { label: "Staging\nSetup", pending: true },
                { label: "Build\nKickoff", pending: true },
              ].map((stage, i, arr) => (
                <div key={i} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                  {i > 0 && <div style={{ position: "absolute", left: 0, top: 13, right: "50%", height: 2, background: stage.done ? "#0d9488" : "rgba(255,255,255,0.08)", zIndex: 0 }} />}
                  {i < arr.length - 1 && <div style={{ position: "absolute", left: "50%", top: 13, right: 0, height: 2, background: stage.done ? "#0d9488" : "rgba(255,255,255,0.08)", zIndex: 0 }} />}
                  <div style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto 0.5rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, background: stage.done ? "#0d9488" : stage.active ? "rgba(13,148,136,0.18)" : "rgba(255,255,255,0.04)", border: stage.active ? "2px solid #2dd4bf" : stage.done ? "none" : "1px solid rgba(255,255,255,0.1)", color: stage.done ? "white" : stage.active ? "#2dd4bf" : "#475569", zIndex: 1, position: "relative", boxShadow: stage.active ? "0 0 12px rgba(45,212,191,0.4)" : "none" }}>
                    {stage.done ? "✓" : stage.active ? "●" : "○"}
                  </div>
                  <div style={{ fontSize: "0.58rem", fontWeight: 700, color: stage.done ? "#0d9488" : stage.active ? "#2dd4bf" : "#475569", letterSpacing: "0.03em", whiteSpace: "pre-line", lineHeight: 1.3 }}>{stage.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/portal/onboarding" className="portal-btn portal-btn--ghost portal-btn--sm">View Onboarding Brief</a>
              <a href={`https://wa.me/27732890453?text=Hi%20E%26L%20Digital%2C%20I%20want%20to%20check%20on%20my%20project%20setup%20status`} target="_blank" rel="noreferrer" className="portal-btn portal-btn--primary portal-btn--sm">
                <MessageSquare size={13} /> WhatsApp Solutions Desk
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Progress Tracker Card */}
          <div className="portal-card" style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div className="portal-card-title" style={{ margin: 0 }}><Rocket size={16} /> Engineering Sprint Progress</div>
              <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#2dd4bf" }}>{project.progress}% Complete</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ flex: 1 }}>
                <div className="portal-progress-track" style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 999 }}>
                  <div className="portal-progress-fill portal-progress-fill--teal" style={{ width: `${project.progress}%`, height: "100%", borderRadius: 999, transition: "width 0.6s ease" }} />
                </div>
              </div>
            </div>

            {/* Stage pipeline */}
            <div style={{ display: "flex", gap: 0 }}>
              {stages.map((stage, i) => {
                const done = i < currentStageIdx || (stage.key === "review" && project.demo_approved);
                const active = i === currentStageIdx && !project.demo_approved;
                return (
                  <div key={stage.key} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                    {i > 0 && <div style={{ position: "absolute", left: 0, top: 12, right: "50%", height: 2, background: done ? "#0d9488" : "rgba(255,255,255,0.07)" }} />}
                    {i < stages.length - 1 && <div style={{ position: "absolute", left: "50%", top: 12, right: 0, height: 2, background: done ? "#0d9488" : "rgba(255,255,255,0.07)" }} />}
                    <div style={{ width: 26, height: 26, borderRadius: "50%", margin: "0 auto 0.375rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, background: done ? "#0d9488" : active ? "rgba(13,148,136,0.2)" : "rgba(255,255,255,0.04)", border: active ? "2px solid #0d9488" : done ? "none" : "1px solid rgba(255,255,255,0.1)", color: done ? "white" : active ? "#2dd4bf" : "#475569", zIndex: 1, position: "relative" }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: active ? "#2dd4bf" : done ? "#0d9488" : "#475569", letterSpacing: "0.02em" }}>{stage.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Staging Demo & Live Production Approval Center */}
          {project.staging_url && (
            <div
              className="portal-card"
              style={{
                marginBottom: "1.25rem",
                border: project.demo_approved ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(45,212,191,0.35)",
                background: project.demo_approved
                  ? "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(15,23,42,0.6) 100%)"
                  : "linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(15,23,42,0.6) 100%)",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Staging Banner Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "3px 10px", borderRadius: 999, background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.3)", fontSize: "0.72rem", fontWeight: 800, color: "#2dd4bf", marginBottom: "0.5rem" }}>
                    <Laptop size={12} /> Staging Sandbox Live &amp; Interactive
                  </div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#f8fafc", margin: 0 }}>
                    Your Staging Website is Hosted &amp; Ready for Review!
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "0.35rem 0 0 0", maxWidth: 520 }}>
                    Explore your full staging site in the preview environment below. Test your pages, navigation, contact funnels, and mobile responsiveness.
                  </p>
                </div>

                <a
                  href={project.staging_url}
                  target="_blank"
                  rel="noreferrer"
                  className="portal-btn portal-btn--primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", fontSize: "0.82rem" }}
                >
                  <ExternalLink size={14} /> Open Staging Demo Site ↗
                </a>
              </div>

              {/* Demo URL Bar */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 1rem", borderRadius: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>PREVIEW LINK:</span>
                <a href={project.staging_url} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "#2dd4bf", fontFamily: "monospace", textDecoration: "underline", wordBreak: "break-all" }}>
                  {project.staging_url}
                </a>
                <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <ShieldCheck size={12} color="#10b981" /> SSL Protected Sandbox
                </span>
              </div>

              {/* Approval Section */}
              {!project.demo_approved ? (
                <div style={{ padding: "1.25rem", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Sparkles size={16} color="#fbbf24" />
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 900, color: "#f8fafc", margin: 0 }}>
                      Approve Staging Demo &amp; Authorize Live Domain Launch
                    </h4>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0 0 1rem 0", lineHeight: 1.6 }}>
                    Once you're satisfied with your staging build, select how you'd like your domain handled below and approve the build. Our DevOps engineers will immediately begin live DNS propagation and SSL setup.
                  </p>

                  <form onSubmit={handleApproveStaging} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {/* Domain Selection Radios */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
                      <label style={{
                        padding: "0.85rem 1rem",
                        borderRadius: 12,
                        border: selectedDomainOption === "new_domain" ? "1.5px solid #2dd4bf" : "1px solid rgba(255,255,255,0.08)",
                        background: selectedDomainOption === "new_domain" ? "rgba(13,148,136,0.12)" : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.6rem"
                      }}>
                        <input
                          type="radio"
                          name="portalDomainOption"
                          value="new_domain"
                          checked={selectedDomainOption === "new_domain"}
                          onChange={() => setSelectedDomainOption("new_domain")}
                          style={{ marginTop: "2px", accentColor: "#2dd4bf" }}
                        />
                        <div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#f8fafc" }}>Register Brand New Domain</div>
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
                            Included with your plan. E&amp;L Digital registers and configures your official domain name for you.
                          </div>
                        </div>
                      </label>

                      <label style={{
                        padding: "0.85rem 1rem",
                        borderRadius: 12,
                        border: selectedDomainOption === "existing_domain" ? "1.5px solid #2dd4bf" : "1px solid rgba(255,255,255,0.08)",
                        background: selectedDomainOption === "existing_domain" ? "rgba(13,148,136,0.12)" : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.6rem"
                      }}>
                        <input
                          type="radio"
                          name="portalDomainOption"
                          value="existing_domain"
                          checked={selectedDomainOption === "existing_domain"}
                          onChange={() => setSelectedDomainOption("existing_domain")}
                          style={{ marginTop: "2px", accentColor: "#2dd4bf" }}
                        />
                        <div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#f8fafc" }}>I Already Own an Existing Domain</div>
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
                            You already have a domain registered (e.g. Afrihost, Domains.co.za, GoDaddy).
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Existing Domain Inputs */}
                    {selectedDomainOption === "existing_domain" && (
                      <div style={{ padding: "0.85rem", borderRadius: 12, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>
                              Your Domain Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. mycompany.co.za"
                              value={existingDomainInput}
                              onChange={e => setExistingDomainInput(e.target.value)}
                              className="portal-input"
                              style={{ width: "100%", fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>
                              Where is it registered or hosted? *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Afrihost, Domains.co.za, GoDaddy, Hetzner"
                              value={domainHostInput}
                              onChange={e => setDomainHostInput(e.target.value)}
                              className="portal-input"
                              style={{ width: "100%", fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
                            />
                          </div>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.5, background: "rgba(13,148,136,0.06)", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(13,148,136,0.2)" }}>
                          💬 <strong>Zero technical headache:</strong> E&amp;L Admins will email you simple DNS delegation records or assist you directly. No server technical knowledge required.
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                      <button
                        type="submit"
                        disabled={isApproving}
                        className="portal-btn portal-btn--primary"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.65rem 1.4rem", fontSize: "0.84rem", background: "linear-gradient(135deg, #0d9488 0%, #10b981 100%)", borderColor: "transparent", color: "#ffffff", fontWeight: 900 }}
                      >
                        <Check size={15} />
                        {isApproving ? "Submitting Approval…" : "✓ Approve Demo & Authorize Live Launch"}
                      </button>

                      <a
                        href="/portal/change-requests"
                        className="portal-btn portal-btn--ghost"
                        style={{ fontSize: "0.78rem" }}
                      >
                        Need Minor Tweaks First? Submit Revisions →
                      </a>
                    </div>
                  </form>
                </div>
              ) : (
                /* Approved Celebration Banner */
                <div style={{ padding: "1.25rem", borderRadius: 16, background: "rgba(16,185,129,0.08)", border: "1.5px solid rgba(16,185,129,0.3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <CheckCircle2 size={18} color="#34d399" />
                    <h4 style={{ fontSize: "1rem", fontWeight: 900, color: "#34d399", margin: 0 }}>
                      🎉 Staging Demo Approved for Live Launch!
                    </h4>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#e2e8f0", margin: "0 0 0.85rem 0", lineHeight: 1.6 }}>
                    Thank you! You officially approved this build{project.demo_approved_at ? ` on ${new Date(project.demo_approved_at).toLocaleDateString()}` : ""}. Our DevOps engineering cluster has received authorization and is currently configuring DNS delegation, SSL provisioning, and live deployment.
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.75rem", color: "#94a3b8", background: "rgba(0,0,0,0.25)", padding: "0.6rem 1rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <span style={{ color: "#64748b", fontWeight: 700 }}>DOMAIN MODE: </span>
                      <strong style={{ color: "#f8fafc" }}>
                        {project.domain_option === "existing_domain" ? "Existing Domain" : "New Domain (E&L Handled)"}
                      </strong>
                    </div>
                    {project.existing_domain_name && (
                      <div>
                        <span style={{ color: "#64748b", fontWeight: 700 }}>DOMAIN: </span>
                        <strong style={{ color: "#2dd4bf", fontFamily: "monospace" }}>{project.existing_domain_name}</strong>
                      </div>
                    )}
                    {project.domain_host_registrar && (
                      <div>
                        <span style={{ color: "#64748b", fontWeight: 700 }}>HOST / REGISTRAR: </span>
                        <strong style={{ color: "#f8fafc" }}>{project.domain_host_registrar}</strong>
                      </div>
                    )}
                    <div style={{ marginLeft: "auto", color: "#34d399", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Check size={12} /> DevOps Handover Queued
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cards Row: Milestones & Quick Links */}
          <div className="portal-card-row" style={{ gap: "1.25rem" }}>
            {/* Milestones */}
            <div className="portal-card" style={{ flex: 1.2 }}>
              <div className="portal-card-title"><CheckCircle2 size={16} /> Sprint Milestones</div>
              {project.milestones.length === 0 ? (
                <div style={{ padding: "1.5rem 0", textAlign: "center", color: "#64748b", fontSize: "0.8rem" }}>
                  <Clock size={20} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                  <div>Milestone progress gates are managed by your engineering lead.</div>
                </div>
              ) : (
                <div className="portal-timeline">
                  {project.milestones.map((m, i) => {
                    const done = m.status === "completed";
                    const active = m.status === "in_progress";
                    return (
                      <div key={m.id} className="portal-timeline-item">
                        <div className="portal-timeline-dot-wrap">
                          <div className={`portal-timeline-dot portal-timeline-dot--${done ? "done" : active ? "active" : "pending"}`}>
                            {done ? "✓" : active ? "▶" : i + 1}
                          </div>
                          {i < project.milestones.length - 1 && <div className="portal-timeline-line" />}
                        </div>
                        <div className="portal-timeline-body">
                          <div className="portal-timeline-title">{m.title}</div>
                          <div className="portal-timeline-sub">
                            {done && m.completed_at ? `Completed ${new Date(m.completed_at).toLocaleDateString("en-ZA")}` : active ? "In progress" : "Upcoming"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Links & Live Site */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
              {project.production_url && (
                <div className="portal-card" style={{ borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.04)" }}>
                  <div className="portal-card-title" style={{ color: "#34d399" }}><Rocket size={16} color="#34d399" /> Production Site Live 🎉</div>
                  <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0.35rem 0 0.85rem 0" }}>
                    Your official production platform is active on your public domain.
                  </p>
                  <a href={project.production_url} target="_blank" rel="noreferrer" className="portal-btn portal-btn--primary portal-btn--sm" style={{ width: "100%", justifyContent: "center" }}>
                    <Globe size={13} /> Visit Live Production Site ↗
                  </a>
                </div>
              )}

              <div className="portal-card">
                <div className="portal-card-title"><MessageSquare size={16} /> Need Changes?</div>
                <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.875rem", lineHeight: 1.5 }}>
                  Submit requests directly to our team. Updates are tracked against your monthly care plan quota.
                </p>
                <a href="/portal/change-requests" className="portal-btn portal-btn--ghost portal-btn--sm" style={{ width: "100%", justifyContent: "center" }}>
                  Submit Change Request →
                </a>
              </div>

              <div className="portal-card" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="portal-card-title" style={{ fontSize: "0.82rem" }}><ShieldCheck size={15} color="#2dd4bf" /> Support &amp; Delivery Desk</div>
                <p style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                  Have questions about DNS, domains, or timeline? Our team is available on WhatsApp or email.
                </p>
                <a
                  href={`https://wa.me/27732890453?text=Hi%20E%26L%20Digital%2C%20I%20have%20a%20question%20regarding%20my%20website%20project%20${encodeURIComponent(project.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="portal-btn portal-btn--ghost portal-btn--sm"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Chat with Solutions Desk ↗
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </PortalLayout>
  );
}
