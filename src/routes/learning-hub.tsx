import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Bot,
  Sparkles,
  BookOpen,
  Rocket,
  Award,
  Users,
  Video,
  MapPin,
  MessageSquare,
  Check,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  Share2,
  Download,
  GraduationCap,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout, ContactCTA } from "@/components/site-layout";
import { learningHub, companyContact, pageHead } from "@/lib/site-content";

export const Route = createFileRoute("/learning-hub")({
  head: () =>
    pageHead(
      "Learning Hub · Empowering Africa to Build & Use AI",
      "The E & L Learning Hub is an accessible, practical education platform teaching South Africans how to understand, create, and use AI. Explore our 3-level curriculum and free AI starter course.",
    ),
  component: LearningHubPage,
});

function LearningHubPage() {
  const { title, tagline, slogan, about, audiences, levels, delivery, pricingTiers, freeCourse } =
    learningHub;

  const [selectedLevel, setSelectedLevel] = useState(0);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showSimOutput, setShowSimOutput] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [readLessons, setReadLessons] = useState<Set<string>>(new Set());
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [quizPool, setQuizPool] = useState(() =>
    [...freeCourse.quiz].sort(() => Math.random() - 0.5),
  );
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [flyerOpen, setFlyerOpen] = useState(false);


  const activeLevel = levels[selectedLevel] ?? levels[0]!;
  const activePrompt =
    freeCourse.samplePrompts[selectedPromptIndex] ?? freeCourse.samplePrompts[0]!;

  // Lock scroll when lesson modal is open
  useEffect(() => {
    if (openLesson) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [openLesson]);

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2200);
  };

  const handleQuizSelect = (questionIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const score = quizPool.reduce((acc, q, i) => (quizAnswers[i] === q.correctIndex ? acc + 1 : acc), 0);

  return (
    <SiteLayout>
      <div className="inner-page">
        {/* HERO SECTION */}
        <div className="site-width inner-intro">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="new-label">
              <Sparkles size={13} className="text-accent-foreground" />E & L LEARNING HUB
            </span>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-[11px] font-bold text-accent-foreground tracking-wide">
              🤖🇿🇦 FROM AFRICA, FOR AFRICA
            </span>
          </div>

          <h1 className="learning-hero-title">
            Empowering Africa to <br />
            <span className="text-accent-foreground">Build and Use AI.</span>
          </h1>

          <div className="learning-slogan-pill">
            <span className="font-bold">Our Slogan:</span>
            <em>“{slogan}”</em>
          </div>

          <p className="mt-5 text-base sm:text-lg leading-relaxed max-w-3xl text-muted-foreground">
            {about.lead}
          </p>

          <p className="font-semibold text-foreground text-sm sm:text-base mt-2">
            ✨ {about.philosophy}
          </p>

          <div className="flex flex-wrap gap-3 sm:gap-4 mt-8 items-center">
            <Button asChild variant="brand" className="pill-button-large">
              <a href="#free-course">
                Try Free AI Starter Course <ArrowRight size={16} />
              </a>
            </Button>
            <Button asChild variant="glass" className="pill-button-large">
              <a
                href={`${companyContact.whatsappLink}?text=${encodeURIComponent(
                  "Hi E & L Holdings! I'm interested in joining the Learning Hub AI WhatsApp community and masterclasses.",
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageSquare size={16} className="text-emerald-500" />
                Join WhatsApp Group
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="pill-button"
              onClick={() => setFlyerOpen(!flyerOpen)}
            >
              <Share2 size={14} />
              {flyerOpen ? "Close WhatsApp Flyer" : "View WhatsApp Flyer"}
            </Button>
          </div>

          {/* Quick Stats Grid */}
          <div className="stat-grid mt-10">
            {about.stats.map((st) => (
              <div key={st.label}>
                <strong>{st.value}</strong>
                <span>{st.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* OPTIONAL WHATSAPP FLYER POPUP / EMBED */}
        {flyerOpen && (
          <section className="section bg-secondary/50 border-b border-border">
            <div className="site-width max-w-2xl">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇿🇦🤖</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground">
                        E & L Holdings Learning Hub
                      </h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        WhatsApp Official Flyer
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setFlyerOpen(false)}
                  >
                    Close
                  </Button>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="rounded-2xl bg-secondary p-4 border border-border/80">
                    <h3 className="font-extrabold text-lg text-foreground mb-1">
                      *E & L Holdings Learning Hub*
                    </h3>
                    <p className="italic text-accent-foreground font-semibold">
                      *Tagline:* _Empowering Africa to Build and Use AI_ 🤖🇿🇦
                    </p>
                  </div>

                  <div>
                    <strong className="block text-foreground mb-1">*1. About The Product*</strong>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      The E & L Learning Hub is an accessible, practical education platform designed
                      to teach South Africans and Africans how to UNDERSTAND, CREATE, and USE
                      Artificial Intelligence to grow businesses, careers, and communities.
                      <br />
                      <span className="font-medium text-foreground">
                        We don't just teach theory - we teach how to make AI work for you.
                      </span>
                    </p>
                  </div>

                  <div>
                    <strong className="block text-foreground mb-1">*2. Who Is It For?*</strong>
                    <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                      <li>Small Business Owners & Entrepreneurs</li>
                      <li>Matriculants, Students & Graduates</li>
                      <li>Working Professionals who want to future-proof their skills</li>
                      <li>Creatives, Marketers, and Content Creators</li>
                    </ul>
                  </div>

                  <div>
                    <strong className="block text-foreground mb-1">
                      *3. What You Will Learn (3 Levels)*
                    </strong>
                    <div className="grid gap-2 mt-1">
                      <div className="p-2.5 rounded-lg bg-secondary/80 border border-border text-xs">
                        <span className="font-bold text-foreground">
                          *Level 1: AI Literacy - How to USE AI*
                        </span>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          ChatGPT, Gemini, Canva AI, CV writing, business plans, ethics & safety.
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-secondary/80 border border-border text-xs">
                        <span className="font-bold text-foreground">
                          *Level 2: AI Builder - How to CREATE AI*
                        </span>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          No-code chatbots, AI voiceovers & videos, WhatsApp automation bots, apps.
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-secondary/80 border border-border text-xs">
                        <span className="font-bold text-foreground">
                          *Level 3: AI Business - How to MAKE MONEY with AI*
                        </span>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          Starting an AI agency, selling services to businesses, NFS Case Study.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <strong className="block text-foreground mb-1">
                      *4. How It Will Be Delivered:*
                    </strong>
                    <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                      <li>Online Masterclasses (Live on Zoom / Google Meet)</li>
                      <li>Physical Workshops (Midrand & around SA)</li>
                      <li>WhatsApp Learning Group + Certificates</li>
                      <li>
                        Affordable monthly subscription: R199 - R499 (Free starter tier available!)
                      </li>
                    </ul>
                  </div>

                  <div className="border-t border-border pt-3">
                    <blockquote className="border-l-2 border-accent pl-3 text-xs italic text-accent-foreground font-semibold">
                      "From Africa, For Africa. Don't just consume AI, create it."
                    </blockquote>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      WhatsApp Line:{" "}
                      <strong className="text-foreground">{companyContact.whatsapp}</strong> ·
                      Landline:{" "}
                      <strong className="text-foreground">{companyContact.landline}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Button asChild variant="brand" className="pill-button text-xs">
                    <a
                      href={`${companyContact.whatsappLink}?text=${encodeURIComponent(
                        "Hi E & L! I saw the Learning Hub flyer and would like to join the WhatsApp group.",
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Share / Chat on WhatsApp <ArrowUpRight size={13} />
                    </a>
                  </Button>
                  <Button
                    variant="glass"
                    className="pill-button text-xs"
                    onClick={() => {
                      const text = `*E & L Holdings Learning Hub*\n*Tagline:* _Empowering Africa to Build and Use AI_ 🤖🇿🇦\n\n"From Africa, For Africa. Don't just consume AI, create it."\n\n• Level 1: AI Literacy (How to USE AI)\n• Level 2: AI Builder (How to CREATE AI)\n• Level 3: AI Business (How to MAKE MONEY with AI)\n\nWhatsApp: ${companyContact.whatsapp}\nWebsite: https://eandl.digital/learning-hub`;
                      navigator.clipboard.writeText(text);
                      alert(
                        "Flyer text copied to clipboard! You can paste it directly to WhatsApp.",
                      );
                    }}
                  >
                    <Copy size={13} /> Copy Flyer Text
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. WHO IS IT FOR? */}
        <section className="section">
          <div className="site-width">
            <div className="section-heading">
              <div>
                <div className="eyebrow">Tailored For Real African Ambition</div>
                <h2>
                  Who is the <br />
                  <span>Learning Hub for?</span>
                </h2>
              </div>
              <p className="section-intro">
                Whether you run an enterprise, a township grocery, a freelance creative studio, or
                are preparing for your first job, AI gives you an unfair advantage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {audiences.map((aud) => (
                <article
                  key={aud.title}
                  className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/60"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-accent-foreground">
                        <aud.icon size={22} strokeWidth={1.75} />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                        {aud.role}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-foreground mb-2 leading-snug">
                      {aud.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {aud.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/70 space-y-1.5">
                    {aud.takeaways.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2 text-[11px] text-muted-foreground"
                      >
                        <CheckCircle2
                          size={13}
                          className="text-accent-foreground mt-0.5 shrink-0"
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 3. WHAT YOU WILL LEARN (3 PROGRESSIVE LEVELS) */}
        <section className="section mint-band">
          <div className="site-width">
            <div className="section-heading">
              <div>
                <div className="eyebrow">A Structured 3-Level Roadmap</div>
                <h2>
                  What you will learn. <br />
                  <span>From First Prompt to Profitable AI.</span>
                </h2>
              </div>
              <p className="section-intro">
                Move progressively from understanding tools, to building automated bots, to
                packaging services that generate revenue.
              </p>
            </div>

            {/* Level Selector Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
              {levels.map((lvl, idx) => (
                <button
                  key={lvl.number}
                  type="button"
                  onClick={() => setSelectedLevel(idx)}
                  className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
                    selectedLevel === idx
                      ? "border-accent bg-card shadow-md ring-2 ring-accent/20"
                      : "border-border bg-card/60 hover:bg-card hover:border-accent/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-accent-foreground">
                      Level {lvl.number}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {lvl.badge}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-foreground">{lvl.title}</h3>
                  <p className="text-xs font-semibold text-accent-foreground mt-0.5">
                    {lvl.subtitle}
                  </p>
                </button>
              ))}
            </div>

            {/* Selected Level Deep Dive */}
            <div className="rounded-3xl border border-border bg-card p-7 sm:p-10 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <span className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-accent-foreground">
                    {(() => {
                      const Icon = activeLevel.icon;
                      return <Icon size={28} />;
                    })()}
                  </span>
                  <div>
                    <div className="eyebrow">Level {activeLevel.number} Curriculum</div>
                    <h3 className="font-extrabold text-2xl text-foreground">
                      {activeLevel.title} —{" "}
                      <span className="text-accent-foreground">
                        {activeLevel.subtitle}
                      </span>
                    </h3>
                  </div>
                </div>
                <div className="rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-muted-foreground self-start md:self-auto">
                  {activeLevel.badge}
                </div>
              </div>

              <p className="my-5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
                {activeLevel.description}
              </p>

              {/* Modules List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                {activeLevel.modules.map((mod, i) => (
                  <div
                    key={mod.name}
                    className="p-5 rounded-2xl border border-border bg-secondary/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-accent/20 text-accent-foreground text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-foreground">
                          {mod.name}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                        {mod.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Outcome Banner */}
              <div className="rounded-2xl bg-accent/10 border border-accent/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <Award size={22} className="text-accent-foreground shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-accent-foreground">
                      Milestone Outcome
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      {activeLevel.outcome}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="brand"
                  className="pill-button self-start sm:self-auto shrink-0"
                >
                  <a
                    href={`${companyContact.whatsappLink}?text=${encodeURIComponent(
                      `Hi E & L! I would like to enrol or find out more about ${activeLevel.title}.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Enquire on WhatsApp <ArrowUpRight size={13} />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FREE ONLINE COURSE EXPERIENCE */}
        <section className="section" id="free-course">
          <div className="site-width">
            <div className="section-heading">
              <div>
                <span className="new-label mb-2">
                  <Sparkles size={12} className="text-accent-foreground" />
                  100% FREE STARTER TRACK
                </span>
                <h2>
                  Free AI Kickstart Course. <br />
                  <span>Read. Practice. Earn your certificate.</span>
                </h2>
              </div>
              <p className="section-intro">
                Click any lesson to open the full read — with a real African case study, expert
                deep-dive, and pro tips. Complete all 4 lessons, then tackle the 4-question
                scenario-based assessment. Earn your downloadable certificate instantly.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="course-progress-bar-wrap">
              <div className="course-progress-meta">
                <span className="text-xs font-bold text-foreground">
                  {readLessons.size} / {freeCourse.lessons.length} lessons read
                </span>
                <span className="text-xs text-muted-foreground">
                  {readLessons.size === freeCourse.lessons.length
                    ? "✅ All done! Take the quiz below."
                    : "Read all lessons to unlock the quiz"}
                </span>
              </div>
              <div className="course-progress-track">
                <div
                  className="course-progress-fill"
                  style={{
                    width: `${(readLessons.size / freeCourse.lessons.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Lesson Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              {freeCourse.lessons.map((lesson, idx) => {
                const isRead = readLessons.has(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setOpenLesson(lesson.id)}
                    className={`lesson-card text-left ${isRead ? "lesson-card-read" : ""}`}
                    aria-label={`Open ${lesson.title}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-xs font-bold ${isRead ? "text-emerald-500" : "text-accent-foreground"}`}
                        >
                          {isRead ? "✓ Completed" : `Module 0${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold bg-secondary px-2.5 py-0.5 rounded-full text-muted-foreground">
                            {lesson.readTime}
                          </span>
                          <span className="text-[10px] font-bold text-accent-foreground bg-accent/15 px-2 py-0.5 rounded-full">
                            {lesson.badge}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-base sm:text-lg text-foreground mb-2 text-left">
                        {lesson.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 text-left">
                        {lesson.summary}
                      </p>
                    </div>

                    <div className="lesson-card-footer">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-foreground block mb-1">
                        Key Takeaway
                      </span>
                      <p className="text-xs italic text-foreground font-medium text-left">
                        "{lesson.keyTakeaway}"
                      </p>
                      <div className="lesson-read-cta">
                        <BookOpen size={14} />
                        <span>{isRead ? "Read again" : "Click to read full lesson →"}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Lesson Modal */}
            {openLesson !== null && (() => {
              const lesson = freeCourse.lessons.find((l) => l.id === openLesson);
              if (!lesson) return null;
              const lessonIdx = freeCourse.lessons.findIndex((l) => l.id === openLesson);
              const nextLesson = freeCourse.lessons[lessonIdx + 1];
              return (
                <div className="lesson-modal-overlay" onClick={() => setOpenLesson(null)}>
                  <div
                    className="lesson-modal"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label={lesson.title}
                  >
                    {/* Modal Header */}
                    <div className="lesson-modal-header">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-accent-foreground bg-accent/15 px-2.5 py-0.5 rounded-full">
                            {lesson.badge}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{lesson.readTime}</span>
                        </div>
                        <h3 className="font-extrabold text-xl sm:text-2xl text-foreground leading-tight">
                          {lesson.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        className="lesson-modal-close"
                        onClick={() => setOpenLesson(null)}
                        aria-label="Close lesson"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Summary intro */}
                    <div className="lesson-modal-body">
                      <div className="lesson-section-block lesson-intro-block">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {lesson.summary}
                        </p>
                      </div>

                      {/* Deep Dive */}
                      {"deepDive" in lesson && lesson.deepDive && (
                        <>
                          <h4 className="lesson-section-heading">
                            <BookOpen size={16} className="text-accent-foreground" />
                            {lesson.deepDive.heading}
                          </h4>
                          <div className="space-y-3 mb-5">
                            {lesson.deepDive.paragraphs.map((p, i) => (
                              <p key={i} className="text-sm text-foreground leading-relaxed">
                                {p}
                              </p>
                            ))}
                          </div>

                          {/* Case Study */}
                          <div className="lesson-case-study">
                            <div className="lesson-case-study-label">
                              <Award size={14} className="text-accent-foreground" />
                              {lesson.deepDive.caseStudyTitle}
                            </div>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                              {lesson.deepDive.caseStudyText}
                            </p>
                          </div>

                          {/* Pro Tips */}
                          <div className="lesson-pro-tips">
                            <div className="lesson-pro-tips-title">
                              <ShieldCheck size={14} className="text-emerald-500" />
                              Pro Tips from E &amp; L Mentors
                            </div>
                            {lesson.deepDive.proTips.map((tip, i) => (
                              <div key={i} className="lesson-pro-tip-row">
                                <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-xs text-foreground">{tip}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Key Takeaway banner */}
                      <div className="lesson-takeaway-banner">
                        <span className="lesson-takeaway-label">Key Takeaway</span>
                        <p className="text-sm font-semibold text-foreground italic">
                          "{lesson.keyTakeaway}"
                        </p>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="lesson-modal-footer">
                      <Button
                        type="button"
                        variant="brand"
                        className="pill-button"
                        onClick={() => {
                          setReadLessons((prev) => new Set([...prev, lesson.id]));
                          if (nextLesson) {
                            setOpenLesson(nextLesson.id);
                          } else {
                            setOpenLesson(null);
                          }
                        }}
                      >
                        {nextLesson ? (
                          <>Mark read &amp; go to next lesson <ArrowRight size={14} /></>
                        ) : (
                          <>Mark read &amp; take the quiz <Award size={14} /></>
                        )}
                      </Button>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                        onClick={() => setOpenLesson(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* INTERACTIVE PROMPT PLAYGROUND */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-9 shadow-md mb-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-border">
                <div>
                  <div className="eyebrow">Interactive Prompt Lab</div>
                  <h3 className="font-extrabold text-xl text-foreground">
                    Try A Real South African Business Prompt — See the AI Output
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a scenario, read the structured C.R.I.S.P. prompt, then see a sample AI
                    output. Copy it and paste into ChatGPT or Gemini.
                  </p>
                </div>
                <span className="rounded-full bg-accent/15 text-accent-foreground px-3 py-1 text-xs font-bold self-start md:self-auto whitespace-nowrap">
                  Copy &amp; Paste into ChatGPT or Gemini
                </span>
              </div>

              {/* Scenario selector */}
              <div className="flex flex-wrap gap-2 my-5">
                {freeCourse.samplePrompts.map((p, idx) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => { setSelectedPromptIndex(idx); setShowSimOutput(false); }}
                    className={`pill-button text-xs font-semibold cursor-pointer border transition-colors ${
                      selectedPromptIndex === idx
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Prompt box */}
              <div className="rounded-2xl border border-border bg-secondary/60 p-5 sm:p-6 relative mb-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground bg-accent/20 px-2.5 py-0.5 rounded-full">
                      {activePrompt.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Context: {activePrompt.context}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    className="pill-button h-8 text-xs font-medium shrink-0"
                    onClick={() => handleCopyPrompt(activePrompt.prompt)}
                  >
                    {copiedPrompt ? (
                      <><Check size={13} className="text-emerald-500" /> Copied!</>
                    ) : (
                      <><Copy size={13} /> Copy Prompt</>
                    )}
                  </Button>
                </div>
                <div className="font-mono text-xs sm:text-sm text-foreground bg-card p-4 rounded-xl border border-border leading-relaxed whitespace-pre-wrap select-all">
                  {activePrompt.prompt}
                </div>
              </div>

              {/* Simulated AI Output Toggle */}
              {"simulatedOutput" in activePrompt && activePrompt.simulatedOutput && (
                <div>
                  {!showSimOutput ? (
                    <button
                      type="button"
                      onClick={() => setShowSimOutput(true)}
                      className="flex items-center gap-2 text-xs font-semibold text-accent-foreground hover:underline"
                    >
                      <Bot size={14} /> Show simulated AI response →
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Bot size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Simulated AI Response
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap font-mono">
                        {activePrompt.simulatedOutput}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSimOutput(false)}
                        className="mt-3 text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Hide response
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SCENARIO-BASED QUIZ */}
            <div className="rounded-3xl border border-border bg-secondary/30 p-6 sm:p-9 shadow-md mb-10">
              <div className="pb-5 border-b border-border">
                <div className="eyebrow">Practitioner Assessment</div>
                <h3 className="font-extrabold text-xl text-foreground">
                  4 Real-World Case Study Questions
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Each question is based on what you just read. Select the best answer for each
                  real African business scenario.
                </p>
              </div>

              {readLessons.size < freeCourse.lessons.length && (
                <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-5 flex items-start gap-3">
                  <span className="text-amber-500 text-lg shrink-0">📖</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Read all {freeCourse.lessons.length} lessons first to unlock the quiz
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {freeCourse.lessons.length - readLessons.size} lesson
                      {freeCourse.lessons.length - readLessons.size !== 1 ? "s" : ""} remaining.
                      Click each lesson card above to read it.
                    </p>
                  </div>
                </div>
              )}

              {readLessons.size === freeCourse.lessons.length && (
                <>
                  <div className="space-y-7 my-6">
                    {quizPool.map((q, qIndex) => (
                      <div key={q.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                        {/* Scenario */}
                        <div className="quiz-scenario-block">
                          <div className="quiz-scenario-label">
                            <Award size={13} className="text-accent-foreground" />
                            {q.scenarioTitle}
                          </div>
                          <p className="text-xs text-foreground leading-relaxed italic">
                            {q.scenarioText}
                          </p>
                        </div>

                        <p className="font-bold text-sm text-foreground mb-3 mt-4">
                          Question {qIndex + 1}: {q.question}
                        </p>

                        <div className="space-y-2">
                          {q.options.map((opt, optIndex) => {
                            const isSelected = quizAnswers[qIndex] === optIndex;
                            const isCorrect = q.correctIndex === optIndex;
                            let btnStyle =
                              "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary";
                            if (isSelected && !quizSubmitted) {
                              btnStyle =
                                "border-accent bg-accent/15 text-accent-foreground font-semibold";
                            }
                            if (quizSubmitted) {
                              if (isCorrect) {
                                btnStyle =
                                  "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold";
                              } else if (isSelected && !isCorrect) {
                                btnStyle =
                                  "border-destructive bg-destructive/15 text-destructive font-semibold";
                              }
                            }
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleQuizSelect(qIndex, optIndex)}
                                disabled={quizSubmitted}
                                className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-colors flex items-center justify-between cursor-pointer ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && isCorrect && (
                                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className="mt-4 pt-3 border-t border-border space-y-2">
                            <p className="text-xs text-muted-foreground">
                              <strong className="text-foreground">Explanation: </strong>
                              {q.explanation}
                            </p>
                            <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent-foreground px-3 py-1 rounded-full text-[11px] font-bold">
                              <Award size={11} /> Competency: {q.competencyEarned}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
                    {!quizSubmitted ? (
                      <Button
                        type="button"
                        variant="brand"
                        className="pill-button"
                        disabled={Object.keys(quizAnswers).length < quizPool.length}
                        onClick={() => setQuizSubmitted(true)}
                      >
                        Submit Answers &amp; View Score <ArrowRight size={14} />
                      </Button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="text-sm font-bold text-foreground">
                          Your Score:{" "}
                          <span className="text-accent-foreground font-extrabold text-base">
                            {score} / {quizPool.length}
                          </span>{" "}
                          {score === quizPool.length
                            ? "🎉 Perfect score — you are ready to build!"
                            : score >= quizPool.length / 2
                            ? "👍 Great effort! Review the explanations above."
                            : "🔄 Keep reading — review the lessons and try again."}
                        </div>
                        <Button
                          type="button"
                          variant="glass"
                          size="sm"
                          className="pill-button text-xs"
                          onClick={() => {
                            setQuizSubmitted(false);
                            setQuizAnswers({});
                            setReadLessons(new Set());
                            setQuizPool(
                              [...freeCourse.quiz].sort(() => Math.random() - 0.5),
                            );
                          }}
                        >
                          Restart full course
                        </Button>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Need help? Chat with mentors on WhatsApp:{" "}
                      <a
                        href={companyContact.whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-accent-foreground hover:underline"
                      >
                        {companyContact.whatsapp}
                      </a>
                    </div>
                  </div>

                  {/* CERTIFICATE */}
                  {quizSubmitted && score >= Math.ceil(quizPool.length / 2) && (
                    <div className="mt-8 rounded-2xl border-2 border-accent/50 bg-card overflow-hidden">
                      {/* Certificate Section Header */}
                      <div className="bg-accent/10 border-b border-accent/20 px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-full bg-accent/20 text-accent-foreground flex items-center justify-center">
                            <GraduationCap size={20} />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-accent-foreground uppercase tracking-wider">
                              Certificate of Completion Unlocked
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Enter your name &amp; download your free credential
                            </p>
                          </div>
                        </div>
                        <span className="text-2xl">🎓</span>
                      </div>

                      <div className="p-6">
                        {/* Name input */}
                        <div className="max-w-sm mb-6">
                          <label
                            htmlFor="cert-name"
                            className="block text-xs font-semibold text-foreground mb-1.5"
                          >
                            Your Full Name (for the certificate)
                          </label>
                          <input
                            id="cert-name"
                            type="text"
                            placeholder="e.g. Sipho Dlamini"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="w-full py-2.5 px-4 rounded-xl border border-border bg-secondary text-sm font-semibold text-foreground focus:outline-none focus:border-accent transition-colors"
                          />
                        </div>

                        {/* Certificate Preview */}
                        <div
                          id="el-certificate"
                          className="cert-paper"
                        >
                          {/* Decorative border pattern */}
                          <div className="cert-border-pattern" />

                          <div className="cert-body">
                            {/* Logo row */}
                            <div className="cert-logo-row">
                              <div className="cert-logo-mark">E&amp;L</div>
                              <div>
                                <div className="cert-org-name">E and L Holdings (Pty) Ltd</div>
                                <div className="cert-org-sub">Learning Hub · Midrand, South Africa</div>
                              </div>
                            </div>

                            <div className="cert-divider" />

                            <div className="cert-issued-text">This certificate is proudly awarded to</div>

                            <div className="cert-recipient">
                              {studentName.trim() || "Your Full Name"}
                            </div>

                            <p className="cert-body-text">
                              in recognition of successfully completing the{" "}
                              <strong>Free AI Kickstart Practitioner Track</strong>, demonstrating
                              working knowledge of Generative AI fundamentals, the C.R.I.S.P. prompt
                              architecture, African AI tool deployment, WhatsApp automation, and POPIA
                              compliance principles.
                            </p>

                            <div className="cert-competencies">
                              {freeCourse.quiz.map((q) => (
                                <span key={q.id} className="cert-competency-chip">
                                  ✓ {"competencyEarned" in q ? q.competencyEarned : ""}
                                </span>
                              ))}
                            </div>

                            <div className="cert-divider" />

                            <div className="cert-footer-row">
                              <div className="cert-sig-block">
                                <div className="cert-sig-line" />
                                <div className="cert-sig-label">Director · E and L Holdings</div>
                              </div>
                              <div className="cert-meta-block">
                                <div className="cert-code">
                                  Credential Code: EL-AI-KS-{new Date().getFullYear()}
                                </div>
                                <div className="cert-date">
                                  Issued: {new Date().toLocaleDateString("en-ZA", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Download + Upsell */}
                        <div className="flex flex-wrap gap-3 mt-6 items-center">
                          <Button
                            type="button"
                            variant="brand"
                            className="pill-button"
                            disabled={!studentName.trim()}
                            onClick={() => window.print()}
                          >
                            <Download size={14} /> Download Certificate (PDF)
                          </Button>
                          <a
                            href={`${companyContact.whatsappLink}?text=${encodeURIComponent(
                              `Hi E & L! I just completed the Free AI Kickstart Course. I'd like to find out more about enrolling in the full Learning Hub.`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="pill-button inline-flex items-center gap-2 h-[43px] px-5 text-sm font-semibold rounded-full border border-border bg-secondary text-foreground hover:border-accent transition-colors"
                          >
                            <MessageSquare size={14} className="text-emerald-500" />
                            Enrol in full masterclasses
                          </a>
                        </div>

                        <p className="text-xs text-muted-foreground mt-3">
                          💡 Want a <strong>verifiable LinkedIn credential</strong> and full
                          curriculum access? Join the{" "}
                          <strong>Active Learner (R199/month)</strong> or{" "}
                          <strong>Pro Builder (R499/month)</strong> subscription below.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>


        {/* 5. HOW IT WILL BE DELIVERED */}
        <section className="section mint-band">
          <div className="site-width">
            <div className="section-heading">
              <div>
                <div className="eyebrow">Real Human Connection</div>
                <h2>
                  How it will be <br />
                  <span>delivered to you.</span>
                </h2>
              </div>
              <p className="section-intro">
                Education is only powerful if you can apply it. We combine live online coaching,
                in-person Midrand sessions, and everyday WhatsApp support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {delivery.map((del) => (
                <div
                  key={del.title}
                  className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-accent-foreground">
                        <del.icon size={24} />
                      </span>
                      <span className="text-[10px] font-bold text-accent-foreground bg-accent/15 px-2.5 py-0.5 rounded-full">
                        {del.tag}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-foreground mb-2">{del.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{del.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. TRANSPARENT PRICING & SUBSCRIPTION TIERS */}
        <section className="section" id="pricing">
          <div className="site-width">
            <div className="section-heading">
              <div>
                <div className="eyebrow">Accessible African Pricing</div>
                <h2>
                  Start Free. <br />
                  <span>Upgrade as you grow.</span>
                </h2>
              </div>
              <p className="section-intro">
                High-quality education shouldn't cost tens of thousands of Rands. We keep
                subscriptions ultra-accessible so every South African can participate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingTiers.map((tier) => (
                <article
                  key={tier.name}
                  className={`package-card ${tier.featured ? "featured relative shadow-xl" : ""}`}
                >
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent text-primary-foreground px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      {tier.badge}
                    </div>
                  )}

                  <div className="eyebrow">{tier.name}</div>
                  <h3 className="text-2xl font-extrabold text-foreground mt-2">{tier.name}</h3>
                  <div className="price">
                    {tier.price} <small>{tier.period}</small>
                  </div>
                  <p className="small-note mb-4">{tier.description}</p>

                  <ul className="flex-1 my-4 space-y-2.5 border-t border-border pt-4">
                    {tier.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <Check size={14} className="text-accent-foreground shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    variant={tier.featured ? "brand" : "glass"}
                    className="pill-button w-full mt-auto"
                  >
                    {tier.ctaType === "free" ? (
                      <a href="#free-course">
                        {tier.ctaText} <ArrowRight size={14} />
                      </a>
                    ) : (
                      <Link to="/contact" search={{ service: `Learning Hub · ${tier.name}` }}>
                        {tier.ctaText} <ArrowUpRight size={14} />
                      </Link>
                    )}
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 7. WHATSAPP & LANDLINE CALL TO ACTION */}
        <section className="section bg-secondary/60 border-t border-border">
          <div className="site-width text-center max-w-3xl">
            <div className="eyebrow justify-center">Direct Connection</div>
            <h2 className="editorial-title">
              Have Questions? <br />
              <span>Talk to our consultants.</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mt-3 mb-8">
              Whether you need group corporate training for your staff or want to attend our next
              physical workshop in Midrand, our team is ready to assist.
            </p>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <Button asChild variant="brand" className="pill-button-large">
                <a
                  href={`${companyContact.whatsappLink}?text=${encodeURIComponent(
                    "Hello! I want to enquire about the E & L Holdings Learning Hub.",
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageSquare size={16} />
                  WhatsApp {companyContact.whatsapp}
                </a>
              </Button>
              <Button asChild variant="glass" className="pill-button-large">
                <a href={`tel:${companyContact.landlineTel}`}>
                  Call Landline: {companyContact.landline}
                </a>
              </Button>
              <Button asChild variant="glass" className="pill-button-large">
                <Link to="/contact" search={{ service: "Learning Hub · AI Courses" }}>
                  Send Email Enquiry <ArrowUpRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="section">
          <div className="site-width max-w-3xl">
            <div className="eyebrow">Good to know</div>
            <h2 className="editorial-title mb-6">Frequently asked questions.</h2>

            <div className="space-y-4">
              {[
                {
                  q: "Do I need any programming or coding background to join?",
                  a: "Not at all. Level 1 (AI Literacy) and Level 2 (AI Builder) focus on no-code tools like ChatGPT, Gemini, Canva, and visual bot builders. You do not need to write a single line of code.",
                },
                {
                  q: "How does the free online course work?",
                  a: "You can start immediately right here on this page at no cost! Read through the lessons, practice with the interactive prompts, test your knowledge, and join our public WhatsApp community.",
                },
                {
                  q: "Where do the physical workshops take place?",
                  a: "Physical hands-on workshops are hosted at our training venues in Midrand, Gauteng, with touring sessions scheduled across Cape Town, Durban, and other major centres.",
                },
                {
                  q: "What is the NFS Case Study in Level 3?",
                  a: "It is a real-world enterprise case study from our partners at NFS Insure Consultants, demonstrating how AI workflows, document parsing, and automated lead handling are deployed in commercial finance and insurance.",
                },
                {
                  q: "Can I pay via EFT or debit order?",
                  a: "Yes, we accept instant EFT, monthly authenticated debit orders, and credit cards for all Learning Hub subscriptions.",
                },
              ].map((faq, idx) => (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-border bg-card p-5 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-foreground cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {activeFaq === idx ? (
                      <ChevronUp size={18} className="text-accent-foreground shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {activeFaq === idx && (
                    <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pt-3 border-t border-border">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <ContactCTA />
    </SiteLayout>
  );
}
