import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BookOpen, GraduationCap, Lock, Trophy, Clock, Play, CheckCircle2, ArrowRight } from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { partnerSchema, BRAND_ID } from "@/lib/supabase";

export const Route = createFileRoute("/portal/my-learning")({ component: MyLearning });

function MyLearning() {
  const navigate = useNavigate();
  const { user, loading, access } = usePortalAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { if (!loading && !user) navigate({ to: "/portal/login" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !access.learning) { setFetching(false); return; }
    (async () => {
      const { data: enrData } = await partnerSchema().from("course_enrollments").select("*, courses(title, badge, track_level, thumbnail_url, estimated_hours)").eq("user_id", user.id).order("last_accessed_at", { ascending: false });
      setEnrollments(enrData || []);
      const { data: certData } = await partnerSchema().from("course_certificates").select("*").eq("user_id", user.id).order("issued_at", { ascending: false });
      setCerts(certData || []);
      setFetching(false);
    })();
  }, [user, access]);

  if (loading || !user) return null;
  if (!access.learning) return (
    <PortalLayout>
      <div className="portal-locked">
        <div className="portal-locked-icon"><Lock size={36} color="#475569" /></div>
        <div className="portal-locked-title">Academy Access Required</div>
        <p className="portal-locked-sub">Upgrade to a plan that includes Academy access to start learning.</p>
        <a href="https://eandl.digital/packages" target="_blank" rel="noreferrer" className="portal-btn portal-btn--amber">Upgrade plan</a>
      </div>
    </PortalLayout>
  );

  const inProgress = enrollments.filter(e => e.status === "active" && e.progress_pct < 100);
  const completed = enrollments.filter(e => e.status === "completed" || e.progress_pct >= 100);

  return (
    <PortalLayout>
      <div className="portal-page-header">
        <h1 className="portal-page-title">My Learning</h1>
        <p className="portal-page-sub">{enrollments.length} enrolled · {completed.length} completed · {certs.length} certificate{certs.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Stats */}
      <div className="portal-stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="portal-stat-card">
          <div className="portal-stat-label">Enrolled</div>
          <div className="portal-stat-value">{enrollments.length}</div>
          <BookOpen size={40} className="portal-stat-icon" color="#0d9488" />
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-label">Completed</div>
          <div className="portal-stat-value">{completed.length}</div>
          <CheckCircle2 size={40} className="portal-stat-icon" color="#34d399" />
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-label">Certificates</div>
          <div className="portal-stat-value">{certs.length}</div>
          <Trophy size={40} className="portal-stat-icon" color="#f59e0b" />
        </div>
      </div>

      {fetching ? <div style={{ color: "#64748b" }}>Loading…</div> : (
        <>
          {enrollments.length === 0 ? (
            <div className="portal-card" style={{ textAlign: "center", padding: "3rem" }}>
              <GraduationCap size={56} style={{ margin: "0 auto 1rem", opacity: 0.1 }} />
              <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: "0.5rem" }}>No courses enrolled yet</div>
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1.25rem" }}>Browse the catalogue and enroll in your first course.</p>
              <Link to="/portal/academy" className="portal-btn portal-btn--amber portal-btn--sm"><GraduationCap size={13} /> Browse Academy</Link>
            </div>
          ) : (
            <>
              {inProgress.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.875rem" }}>In Progress</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {inProgress.map(e => (
                      <div key={e.id} className="portal-card" style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #0d9488, #134e4a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <GraduationCap size={22} color="#2dd4bf" />
                          </div>
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f8fafc" }}>{e.courses?.title}</div>
                            <div style={{ marginTop: "0.5rem" }}>
                              <div className="portal-progress-track">
                                <div className="portal-progress-fill portal-progress-fill--teal" style={{ width: `${e.progress_pct || 0}%` }} />
                              </div>
                              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.25rem" }}>{Math.round(e.progress_pct || 0)}% complete · {e.completed_lessons_count || 0} lessons done</div>
                            </div>
                          </div>
                          <Link to="/portal/academy" className="portal-btn portal-btn--primary portal-btn--sm">
                            <Play size={13} /> Continue <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {completed.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.875rem" }}>Completed</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {completed.map(e => (
                      <div key={e.id} className="portal-card" style={{ padding: "1rem 1.25rem", borderColor: "rgba(16,185,129,0.15)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <CheckCircle2 size={28} color="#34d399" />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f8fafc" }}>{e.courses?.title}</div>
                            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Completed · 100%</div>
                          </div>
                          {certs.find(c => c.course_id === e.course_id) && (
                            <span className="portal-badge portal-badge--active"><Trophy size={11} /> Certified</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {certs.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.875rem" }}>🏆 Certificates Earned</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                    {certs.map(cert => (
                      <div key={cert.id} className="portal-card" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(13,148,136,0.04))", borderColor: "rgba(245,158,11,0.2)" }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                          <Trophy size={28} color="#f59e0b" />
                          <div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#f8fafc" }}>{cert.course_title}</div>
                            <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "0.2rem" }}>No. {cert.certificate_no}</div>
                            <div style={{ fontSize: "0.65rem", color: "#64748b" }}>Issued {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString("en-ZA") : ""}</div>
                            {cert.pdf_url && <a href={cert.pdf_url} target="_blank" rel="noreferrer" className="portal-btn portal-btn--ghost portal-btn--sm" style={{ marginTop: "0.625rem" }}>Download PDF</a>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </PortalLayout>
  );
}
