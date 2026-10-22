import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GraduationCap, Clock, Users, Star, Lock, Play, BookOpen, ArrowRight, Zap } from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/lib/portal-auth";
import { partnerSchema, supabase, BRAND_ID } from "@/lib/supabase";

export const Route = createFileRoute("/portal/academy")({ component: PortalAcademy });

function PortalAcademy() {
  const navigate = useNavigate();
  const { user, loading, access } = usePortalAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => { if (!loading && !user) navigate({ to: "/portal/login" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: courseData } = await partnerSchema().from("courses")
        .select("*, course_lessons(id, is_free_preview, duration_minutes)").eq("brand_id", BRAND_ID).eq("status", "published").order("display_order");
      setCourses(courseData || []);
      if (access.learning) {
        const { data: enrolData } = await partnerSchema().from("course_enrollments").select("course_id").eq("user_id", user.id);
        setEnrollments((enrolData || []).map((e: any) => e.course_id));
      }
      setFetching(false);
    })();
  }, [user, access]);

  const handleEnroll = async (courseId: string) => {
    if (!access.learning || !user) return;
    setEnrolling(courseId);
    try {
      await supabase.schema("partner").rpc("enroll_course", { p_course_id: courseId, p_type: "subscription" });
      setEnrollments(prev => [...prev, courseId]);
    } catch (e) { console.warn(e); }
    setEnrolling(null);
  };

  if (loading || !user) return null;

  const trackColors: Record<string, string> = { level_1: "#2dd4bf", level_2: "#fbbf24", level_3: "#f472b6", business_track: "#a5b4fc", creative_track: "#fb923c", digital_systems: "#34d399" };
  const tracks = ["all", "level_1", "level_2", "level_3", "business_track", "creative_track"];
  const filtered = filter === "all" ? courses : courses.filter(c => c.track_level === filter);

  if (!access.learning) return (
    <PortalLayout>
      <div className="portal-locked">
        <div className="portal-locked-icon"><Lock size={36} color="#475569" /></div>
        <div className="portal-locked-title">Academy Access Required</div>
        <p className="portal-locked-sub">The E&L Academy is included with Growth Community, Care Plus, and Enterprise System packages. Upgrade to unlock all courses.</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a href="https://eandl.digital/packages" target="_blank" rel="noreferrer" className="portal-btn portal-btn--amber"><Zap size={16} /> Upgrade plan</a>
          <a href="https://eandl.digital/contact" target="_blank" rel="noreferrer" className="portal-btn portal-btn--ghost">Contact us</a>
        </div>
      </div>
    </PortalLayout>
  );

  return (
    <PortalLayout>
      <div className="portal-page-header">
        <h1 className="portal-page-title">E&amp;L Academy</h1>
        <p className="portal-page-sub">Master digital tools, AI workflows, and conversion strategies designed for South African businesses.</p>
      </div>

      {/* Track filter */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {tracks.map(t => (
          <button key={t} className={`portal-btn portal-btn--sm ${filter === t ? "portal-btn--primary" : "portal-btn--ghost"}`}
            style={{ fontSize: "0.72rem", padding: "0.35rem 0.875rem" }}
            onClick={() => setFilter(t)}>
            {t === "all" ? "All courses" : t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {fetching ? (
        <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Loading courses…</div>
      ) : filtered.length === 0 ? (
        <div className="portal-card" style={{ textAlign: "center", padding: "3rem" }}>
          <BookOpen size={48} style={{ margin: "0 auto 1rem", opacity: 0.15 }} />
          <div style={{ fontWeight: 700, color: "#e2e8f0" }}>No courses in this track yet</div>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>We're adding new courses regularly. Check back soon!</p>
        </div>
      ) : (
        <div className="portal-course-grid">
          {filtered.map(course => {
            const enrolled = enrollments.includes(course.id);
            const trackColor = trackColors[course.track_level] || "#2dd4bf";
            const totalLessons = course.course_lessons?.length || 0;
            const totalMins = course.course_lessons?.reduce((s: number, l: any) => s + (l.duration_minutes || 0), 0) || 0;
            return (
              <div key={course.id} className="portal-course-card">
                <div className="portal-course-thumb" style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(13,148,136,0.1) 100%)` }}>
                  <GraduationCap size={56} className="portal-course-thumb-icon" color={trackColor} />
                  <div className="portal-course-badge">
                    <span className="portal-badge" style={{ background: `${trackColor}18`, color: trackColor, borderColor: `${trackColor}30` }}>{course.badge || course.track_level?.replace("_", " ")}</span>
                  </div>
                  {enrolled && (
                    <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem" }}>
                      <span className="portal-badge portal-badge--active">Enrolled</span>
                    </div>
                  )}
                </div>
                <div className="portal-course-body">
                  <div className="portal-course-title">{course.title}</div>
                  {course.subtitle && <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.2rem", lineHeight: 1.4 }}>{course.subtitle}</div>}
                  <div className="portal-course-meta" style={{ marginTop: "0.625rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> {Math.round(totalMins / 60 * 10) / 10 || course.estimated_hours || 2}h</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><BookOpen size={11} /> {totalLessons} lessons</span>
                    {(course.enrolled_count || 0) > 0 && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Users size={11} /> {course.enrolled_count}</span>}
                    {(course.average_rating || 5) > 0 && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={11} color="#fbbf24" /> {course.average_rating || "5.0"}</span>}
                  </div>
                  <div style={{ marginTop: "0.875rem" }}>
                    {enrolled ? (
                      <Link to="/portal/my-learning" className="portal-btn portal-btn--primary portal-btn--sm" style={{ width: "100%", justifyContent: "center" }}>
                        <Play size={13} /> Continue learning
                      </Link>
                    ) : (
                      <button className="portal-btn portal-btn--amber portal-btn--sm" style={{ width: "100%", justifyContent: "center" }}
                        disabled={!!enrolling} onClick={() => handleEnroll(course.id)}>
                        {enrolling === course.id ? "Enrolling…" : <><Zap size={13} /> Enroll now</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PortalLayout>
  );
}
