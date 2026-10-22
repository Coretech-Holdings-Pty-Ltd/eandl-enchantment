/**
 * Portal Project Page — track website build progress, milestones
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FolderKanban, CheckCircle2, Clock, Rocket, Globe, ExternalLink, Lock, RefreshCw, MessageSquare } from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { techSchema, BRAND_ID } from "@/lib/supabase";

export const Route = createFileRoute("/portal/project")({ component: PortalProject });

interface Milestone { id: string; title: string; status: string; completed_at?: string; }
interface Project { id: string; name: string; status: string; progress: number; staging_url?: string; production_url?: string; milestones: Milestone[]; }

function PortalProject() {
  const navigate = useNavigate();
  const { user, loading, access, client } = usePortalAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { if (!loading && !user) navigate({ to: "/portal/login" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !access.projects) { setFetching(false); return; }
    (async () => {
      try {
        const { data } = await techSchema()
          .from("projects")
          .select("*, milestones(id, title, status, completed_at)")
          .eq("brand_id", BRAND_ID)
          .or(`company_id.eq.${client?.companyId ?? "00000000-0000-0000-0000-000000000000"}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) {
          setProject({
            id: data.id, name: data.name || data.project_name || "Your Website Project",
            status: data.status || "in_progress",
            progress: data.completion_percentage || 0,
            staging_url: data.preview_url, production_url: data.delivery_url,
            milestones: (data.milestones || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          });
        }
      } catch (e) { console.warn("Project fetch:", e); }
      setFetching(false);
    })();
  }, [user, access, client]);

  if (loading || !user) return null;

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

  const stageColors: Record<string, string> = { discovery: "#a5b4fc", design: "#fbbf24", development: "#2dd4bf", review: "#fb923c", launch: "#34d399" };

  const stages = [
    { key: "discovery", label: "Discovery", desc: "Requirements & brief" },
    { key: "design", label: "Design", desc: "Mockups & approval" },
    { key: "development", label: "Development", desc: "Build & integrate" },
    { key: "review", label: "Review", desc: "Staging & feedback" },
    { key: "launch", label: "Launch", desc: "Go live!" },
  ];

  const currentStageIdx = project ? stages.findIndex(s => project.status?.includes(s.key)) : 0;

  return (
    <PortalLayout>
      <div className="portal-page-header">
        <h1 className="portal-page-title">My Project</h1>
        <p className="portal-page-sub">{project?.name || "Your E&L website project"}</p>
      </div>

      {fetching ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.85rem", padding: "2rem 0" }}>
          <RefreshCw size={16} className="animate-spin" /> Loading project details…
        </div>
      ) : !project ? (
        <div className="portal-card" style={{ textAlign: "center", padding: "3rem" }}>
          <FolderKanban size={48} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.5rem" }}>Project setup in progress</div>
          <p style={{ fontSize: "0.82rem", color: "#64748b", maxWidth: 360, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
            Your project hasn't been created in our system yet. Complete onboarding first, then your solutions architect will set up your project within 1 business day.
          </p>
          <a href="/portal/onboarding" className="portal-btn portal-btn--primary portal-btn--sm">Complete onboarding →</a>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="portal-card" style={{ marginBottom: "1.25rem" }}>
            <div className="portal-card-title"><Rocket size={16} /> Build Progress</div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ flex: 1 }}>
                <div className="portal-progress-track" style={{ height: 12 }}>
                  <div className="portal-progress-fill portal-progress-fill--teal" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2dd4bf", minWidth: 44, textAlign: "right" }}>{project.progress}%</div>
            </div>
            {/* Stage pipeline */}
            <div style={{ display: "flex", gap: 0 }}>
              {stages.map((stage, i) => {
                const done = i < currentStageIdx;
                const active = i === currentStageIdx;
                return (
                  <div key={stage.key} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                    {i > 0 && <div style={{ position: "absolute", left: 0, top: 12, right: "50%", height: 2, background: done ? "#0d9488" : "rgba(255,255,255,0.07)" }} />}
                    {i < stages.length - 1 && <div style={{ position: "absolute", left: "50%", top: 12, right: 0, height: 2, background: done ? "#0d9488" : "rgba(255,255,255,0.07)" }} />}
                    <div style={{ width: 26, height: 26, borderRadius: "50%", margin: "0 auto 0.375rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, background: done ? "#0d9488" : active ? "rgba(13,148,136,0.2)" : "rgba(255,255,255,0.04)", border: active ? "2px solid #0d9488" : done ? "none" : "1px solid rgba(255,255,255,0.1)", color: done ? "white" : active ? "#2dd4bf" : "#475569", zIndex: 1, position: "relative" }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: active ? "#2dd4bf" : done ? "#0d9488" : "#475569", letterSpacing: "0.04em" }}>{stage.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="portal-card-row" style={{ gap: "1.25rem" }}>
            {/* Milestones */}
            <div className="portal-card">
              <div className="portal-card-title"><CheckCircle2 size={16} /> Milestones</div>
              {project.milestones.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#475569" }}>Milestones will appear once your project is set up.</p>
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

            {/* Links & actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {project.staging_url && (
                <div className="portal-card">
                  <div className="portal-card-title"><Globe size={16} /> Staging Preview</div>
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.875rem" }}>Review your site in progress on our staging environment.</p>
                  <a href={project.staging_url} target="_blank" rel="noreferrer" className="portal-btn portal-btn--ghost portal-btn--sm">
                    <ExternalLink size={13} /> View staging site
                  </a>
                </div>
              )}
              {project.production_url && (
                <div className="portal-card" style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.03)" }}>
                  <div className="portal-card-title" style={{ color: "#34d399" }}><Rocket size={16} color="#34d399" /> Live Site 🎉</div>
                  <a href={project.production_url} target="_blank" rel="noreferrer" className="portal-btn portal-btn--primary portal-btn--sm" style={{ marginTop: "0.5rem" }}>
                    <Globe size={13} /> Visit live site
                  </a>
                </div>
              )}
              <div className="portal-card">
                <div className="portal-card-title"><MessageSquare size={16} /> Need Changes?</div>
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.875rem" }}>Submit a change request and we'll include it in your next care update.</p>
                <a href="/portal/change-requests" className="portal-btn portal-btn--ghost portal-btn--sm">Submit request →</a>
              </div>
            </div>
          </div>
        </>
      )}
    </PortalLayout>
  );
}
