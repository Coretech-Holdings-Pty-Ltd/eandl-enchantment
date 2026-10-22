/**
 * Dedicated Learning Hub Onboarding & Student Enrollment Suite
 * Flow: Track Selection -> Experience & Goals -> Plan Selection -> Account Creation & Course Enrollment
 * Production Route: eandl.digital/portal/learning-onboarding
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  User,
  Building2,
  ShieldCheck,
  Zap,
  BookOpen,
  Cpu,
  Layers,
  Award,
  Check,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { usePortalAuth } from "@/lib/portal-auth";
import logo from "@/assets/logo.png";
import { ThemeToggle } from "@/lib/theme";
import { supabase, partnerSchema } from "@/lib/supabase";

export const Route = createFileRoute("/portal/learning-onboarding")({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: (search.plan as string) || "starter",
    track: (search.track as string) || "",
  }),
  component: LearningOnboardingPage,
});

interface CourseOption {
  slug: string;
  title: string;
  badge: string;
  level: string;
  duration: string;
  summary: string;
  icon: any;
  color: string;
}

const COURSES: CourseOption[] = [
  {
    slug: "applied-generative-ai-agent-workflows",
    title: "Applied Generative AI & Autonomous Agent Workflows",
    badge: "Level 2 • AI Engineering",
    level: "Intermediate",
    duration: "6.5 Hours",
    summary: "Architect production agents using Gemini 2.0 Flash, Claude 3.5, strict Zod schemas, and tool calling loops.",
    icon: Cpu,
    color: "teal",
  },
  {
    slug: "enterprise-rag-vector-databases",
    title: "Enterprise RAG & Vector Databases with PostgreSQL pgvector",
    badge: "Level 3 • Advanced Systems",
    level: "Advanced",
    duration: "7.5 Hours",
    summary: "Deploy private enterprise knowledge engines using PostgreSQL pgvector, HNSW indexing, and hybrid lexical search.",
    icon: Layers,
    color: "blue",
  },
  {
    slug: "ai-driven-business-automation",
    title: "AI-Driven Business Automation for Modern Enterprises",
    badge: "Level 1 • Foundations",
    level: "All Levels",
    duration: "4.0 Hours",
    summary: "Cut 15+ hours of manual administrative drag weekly using automated client onboarding, WhatsApp bridges, and DebiCheck.",
    icon: Zap,
    color: "amber",
  },
];

const PLANS = [
  {
    id: "starter",
    name: "Free AI Starter Track",
    price: "R0",
    period: "forever free",
    description: "Ideal for anyone taking their very first step into applied Artificial Intelligence.",
    features: [
      "Interactive AI Kickstart online lesson access",
      "Join public WhatsApp Community Group",
      "Weekly curated AI prompt & tool digest",
      "Free starter certificate of completion",
      "Direct enrollment in Learning Hub Portal"
    ],
    highlight: false,
    badge: "Free Starter"
  },
  {
    id: "monthly",
    name: "Active Learner Pass",
    price: "R199",
    period: "per month",
    description: "Full access to Level 1 & Level 2 live masterclasses, tool templates, and workshops.",
    features: [
      "All Level 1 (Literacy) & Level 2 (Builder) modules",
      "Live weekly Zoom / Meet masterclasses",
      "Private cohort WhatsApp group with instructor support",
      "Ready-made chatbot & automation templates",
      "Digital Certificate of Competency for each level",
      "Full recording archive of all live sessions"
    ],
    highlight: true,
    badge: "Most Popular"
  },
  {
    id: "executive",
    name: "Pro Builder & Business",
    price: "R499",
    period: "per month",
    description: "For entrepreneurs, agencies, and pros ready to monetize AI and scale client services.",
    features: [
      "Full 3-Level curriculum (Literacy + Builder + Business)",
      "Exclusive NFS Insurance & Finance AI Case Study",
      "AI Agency starter kit (proposals, contracts, pricing sheets)",
      "Priority seating at Midrand physical workshops",
      "Monthly 1-on-1 implementation strategy review",
      "Direct referral to E & L client network opportunities"
    ],
    highlight: false,
    badge: "Agency & Business"
  }
];

function LearningOnboardingPage() {
  const navigate = useNavigate();
  const { user, login, register, loading } = usePortalAuth();

  // Multi-step state: 1: Track -> 2: Experience & Goal -> 3: Plan -> 4: Account & Launch
  const [step, setStep] = useState(1);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>("applied-generative-ai-agent-workflows");
  const [experienceLevel, setExperienceLevel] = useState<string>("intermediate");
  const [primaryGoal, setPrimaryGoal] = useState<string>("Build Autonomous Agents");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("monthly");

  // Registration Form
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read URL query params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const planParam = params.get("plan");
      const trackParam = params.get("track");
      if (planParam && ["starter", "monthly", "executive"].includes(planParam)) {
        setSelectedPlanId(planParam);
      }
      if (trackParam && COURSES.some(c => c.slug === trackParam)) {
        setSelectedCourseSlug(trackParam);
      }
    }
  }, []);

  // If already authenticated and hitting step 4, enroll directly
  const handleDirectEnroll = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);

    try {
      // Find course by slug
      const { data: course } = await partnerSchema()
        .from("courses")
        .select("id")
        .eq("slug", selectedCourseSlug)
        .maybeSingle();

      if (course) {
        // Upsert course enrollment
        await partnerSchema()
          .from("course_enrollments")
          .upsert({
            course_id: course.id,
            user_id: user.id,
            enrollment_type: selectedPlanId === "starter" ? "free" : "subscription",
            progress_pct: 0,
            enrolled_at: new Date().toISOString()
          }, { onConflict: "course_id,user_id" });
      }

      navigate({ to: "/portal/my-learning" });
    } catch {
      navigate({ to: "/portal/my-learning" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccountCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!fullName.trim()) {
      setError("Please provide your full legal name for the course certificate.");
      setSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setSubmitting(false);
      return;
    }

    try {
      const extraMetadata = {
        track: "learning",
        portal_access_learning: true,
        selected_plan: selectedPlanId,
        selected_course_slug: selectedCourseSlug,
        experience_level: experienceLevel,
        primary_goal: primaryGoal,
        company_name: companyName.trim() || undefined
      };

      const { error: regErr } = await register(email, password, fullName, extraMetadata);
      if (regErr) {
        if (regErr.includes("already registered")) {
          // Attempt login if already registered
          const { error: logErr } = await login(email, password);
          if (logErr) {
            setError("Account already exists with this email. Please sign in via the portal login page.");
            setSubmitting(false);
            return;
          }
        } else {
          setError(regErr);
          setSubmitting(false);
          return;
        }
      }

      // Automatically enroll into selected course
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: course } = await partnerSchema()
          .from("courses")
          .select("id")
          .eq("slug", selectedCourseSlug)
          .maybeSingle();

        if (course) {
          await partnerSchema()
            .from("course_enrollments")
            .upsert({
              course_id: course.id,
              user_id: currentUser.id,
              enrollment_type: selectedPlanId === "starter" ? "free" : "subscription",
              progress_pct: 0,
              enrolled_at: new Date().toISOString()
            }, { onConflict: "course_id,user_id" });
        }
      }

      navigate({ to: "/portal/my-learning" });
    } catch {
      setError("An unexpected error occurred during enrollment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-secondary flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Preparing Learning Onboarding...
        </span>
      </div>
    );
  }

  const selectedCourse = COURSES.find(c => c.slug === selectedCourseSlug) || COURSES[0];
  const selectedPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[1];

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans selection:bg-amber-500 selection:text-foreground flex flex-col justify-between relative overflow-x-hidden transition-colors duration-200">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-teal-500/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-20 border-b border-border bg-card/85 backdrop-blur-xl shrink-0 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src={logo} alt="E and L Holdings logo" className="w-11 h-11 object-contain rounded-xl shadow-xs" />
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-foreground flex items-center gap-2">
                E and L Holdings
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  Academy Onboarding
                </span>
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">eandl.digital/learning-hub</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle className="h-9 w-9 rounded-full border border-border bg-secondary/80 hover:bg-secondary" />
            <Link
              to="/learning-hub"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span>Back to Learning Hub</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </header>

      {/* Step Progress Bar */}
      <div className="relative z-10 max-w-3xl w-full mx-auto px-4 pt-6">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
          <span className={step >= 1 ? "text-amber-400" : ""}>1. Select Track</span>
          <span className={step >= 2 ? "text-amber-400" : ""}>2. Experience</span>
          <span className={step >= 3 ? "text-amber-400" : ""}>3. Choose Plan</span>
          <span className={step >= 4 ? "text-amber-400" : ""}>4. Launch Portal</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Step Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        
        {/* STEP 1: Track Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Step 1 of 4 • Curriculum Path
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Choose Your Primary Learning Track
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select the AI discipline you want to master first. You can always switch or enroll in additional tracks later inside the client portal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {COURSES.map((course) => {
                const IconComponent = course.icon;
                const isSelected = selectedCourseSlug === course.slug;
                return (
                  <div
                    key={course.slug}
                    onClick={() => setSelectedCourseSlug(course.slug)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-card border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500"
                        : "bg-card/40 border-border hover:border-border"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <IconComponent size={18} />
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-muted-foreground border border-border">
                          {course.duration}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          {course.badge}
                        </span>
                        <h3 className="text-sm font-bold text-foreground mt-0.5 line-clamp-2">
                          {course.title}
                        </h3>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {course.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">{course.level}</span>
                      <span className={`font-bold flex items-center gap-1 ${isSelected ? "text-amber-400" : "text-muted-foreground"}`}>
                        {isSelected ? "Selected" : "Select"}
                        <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-full font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-2 text-xs shadow-md cursor-pointer"
              >
                <span>Continue: Experience & Goals</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Experience & Goals */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto w-full">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Step 2 of 4 • Skill Tailoring
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Tailor Your Learning Experience
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                We customize the hands-on code snippets, prompt templates, and exercises to match your background.
              </p>
            </div>

            <div className="space-y-4 bg-card border border-border p-6 rounded-3xl">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">
                  What is your technical experience level?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "beginner", title: "Beginner", desc: "No coding experience" },
                    { id: "intermediate", title: "Intermediate", desc: "Basic JS, HTML, or APIs" },
                    { id: "advanced", title: "Advanced", desc: "Senior Dev / Architect" },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setExperienceLevel(lvl.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        experienceLevel === lvl.id
                          ? "bg-amber-950/40 border-amber-500/80 text-foreground"
                          : "bg-secondary/60 border-border text-muted-foreground hover:border-border"
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground">{lvl.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-muted-foreground">
                  What is your primary objective with this course?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    "Build Autonomous AI Agents & Bots",
                    "Deploy Enterprise RAG & Vector Search",
                    "Automate Daily Business Operations & Billing",
                    "Master Prompt Engineering & LLM APIs",
                    "Upskill My Development Team",
                    "Earn Accredited Executive Certification"
                  ].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setPrimaryGoal(goal)}
                      className={`p-3 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer ${
                        primaryGoal === goal
                          ? "bg-amber-950/40 border-amber-500/80 text-foreground font-bold"
                          : "bg-secondary/60 border-border text-muted-foreground hover:border-border"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2 rounded-full font-bold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-full font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-2 text-xs shadow-md cursor-pointer"
              >
                <span>Continue: Select Plan</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Plan Selection */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Step 3 of 4 • Academy Membership
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Select Your Academy Membership Plan
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                All plans include access to the E&L Client Portal and hands-on laboratory lessons.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                      isSelected
                        ? "bg-card border-amber-500 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500"
                        : "bg-card/40 border-border hover:border-border"
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                        {plan.badge}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-base font-black text-foreground">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-snug">{plan.description}</p>
                      </div>

                      <div className="pt-2">
                        <span className="text-3xl font-black text-foreground">{plan.price}</span>
                        <span className="text-xs text-muted-foreground ml-1.5 font-medium">/{plan.period}</span>
                      </div>

                      <ul className="space-y-2 pt-3 border-t border-border text-xs text-muted-foreground">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] leading-tight">
                            <Check size={13} className="text-amber-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-5 mt-4">
                      <div className={`w-full py-2 rounded-xl text-center text-xs font-bold transition-all ${
                        isSelected ? "bg-amber-500 text-slate-950 shadow" : "bg-slate-800 text-muted-foreground"
                      }`}>
                        {isSelected ? "Selected Plan" : "Choose Plan"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2 rounded-full font-bold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-full font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-2 text-xs shadow-md cursor-pointer"
              >
                <span>Continue: Account Creation</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Account Creation & Launch */}
        {step === 4 && (
          <div className="max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Step 4 of 4 • Student Portal Registration
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Launch Your Learning Portal
              </h1>
              <p className="text-xs text-muted-foreground">
                Enrolling in: <strong className="text-foreground">{selectedCourse.title}</strong> ({selectedPlan.name})
              </p>
            </div>

            {/* If user is already logged in, prompt direct launch */}
            {user ? (
              <div className="bg-card border border-border rounded-3xl p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Signed in as {user.email}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your account will be instantly enrolled into <strong className="text-foreground">{selectedCourse.title}</strong> with full Academy privileges.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDirectEnroll}
                  disabled={submitting}
                  className="w-full py-3 rounded-full font-bold bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer"
                >
                  <span>{submitting ? "Enrolling & Initializing..." : "Enroll & Enter My Learning Portal"}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleAccountCreation} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-muted-foreground mb-1">
                      Full Legal Name (For Certificate) *
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sipho Mthembu"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-3 focus:ring-amber-500/15 dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-amber-400 dark:focus:bg-slate-900 transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-muted-foreground mb-1">
                      Company / Organization (Optional)
                    </label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="e.g. Apex Digital Care"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-3 focus:ring-amber-500/15 dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-amber-400 dark:focus:bg-slate-900 transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-muted-foreground mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        placeholder="you@company.co.za"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-3 focus:ring-amber-500/15 dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-amber-400 dark:focus:bg-slate-900 transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-muted-foreground mb-1">
                      Password (Min. 8 characters) *
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-3 focus:ring-amber-500/15 dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-amber-400 dark:focus:bg-slate-900 transition-all text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-full font-bold bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/40 mt-3"
                  >
                    <span>{submitting ? "Enrolling & Launching Portal..." : "Complete Enrollment & Launch Portal"}</span>
                    <ArrowRight size={15} />
                  </button>
                </form>

                <div className="pt-2 text-center text-[11px] text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/portal/login" search={{ track: "learning" }} className="text-amber-400 hover:underline font-bold">
                    Sign in to Academy
                  </Link>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2 rounded-full font-bold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Change Plan</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-secondary/90 py-5 text-center text-xs text-muted-foreground shrink-0">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-muted-foreground">E&L Digital Academy</span>
            <span>•</span>
            <span>Accredited AI &amp; Cloud Engineering</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/learning-hub" className="hover:text-muted-foreground">
              Learning Hub
            </Link>
            <span>•</span>
            <Link to="/portal/login" search={{ track: "learning" }} className="hover:text-muted-foreground">
              Student Sign In
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
