import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowRight,
  Globe2,
  ShieldCheck,
  Users,
  RefreshCw,
  LockKeyhole,
  Sparkles,
  Bot,
  BookOpen,
  Rocket,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { services, learningHub } from "@/lib/site-content";

export function ServiceOverview() {
  return (
    <section className="section" id="solutions">
      <div className="site-width">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Connected expertise. Real impact.</div>
            <h2>
              Everything you need.
              <br />
              <span>One partner to make it happen.</span>
            </h2>
          </div>
          <p className="section-intro">
            From the technology you use to the infrastructure you rely on and the capital to grow.
            We connect the dots.
          </p>
        </div>
        <div className="service-grid">
          {services.map((s, i) => (
            <Link to="/solutions" hash={s.id} key={s.id} className="service-card">
              <div className="service-top">
                <span className="service-icon">
                  <s.icon size={23} strokeWidth={1.5} />
                </span>
                <span className="service-number">0{i + 1}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.short}</p>
              <span className="service-more">
                Explore solution <ArrowUpRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LearningHubFeatureSection() {
  return (
    <section className="section bg-secondary/50 border-y border-border">
      <div className="site-width">
        <div className="section-heading">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="new-label">
                <Sparkles size={12} className="text-accent-foreground" />
                NEW EDUCATION INITIATIVE
              </span>
              <span className="text-[10px] font-bold text-accent-foreground bg-accent/15 px-2 py-0.5 rounded-full">
                🤖🇿🇦 AI FOR AFRICA
              </span>
            </div>
            <h2>
              E & L Learning Hub.
              <br />
              <span>Empowering Africa to Build and Use AI.</span>
            </h2>
          </div>
          <div>
            <blockquote className="text-xs sm:text-sm italic font-semibold text-accent-foreground border-l-2 border-accent pl-3 my-2">
              "{learningHub.slogan}"
            </blockquote>
            <p className="section-intro">
              We don't just teach theory - we teach how to make AI work for your career and
              business. From free starter modules to live masterclasses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between hover:border-accent/60 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-accent-foreground">
                  <BookOpen size={20} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  Level 01
                </span>
              </div>
              <h3 className="font-extrabold text-base text-foreground mb-1">
                AI Literacy (How to USE AI)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Master ChatGPT, Gemini, and Canva AI. Supercharge CVs, business proposals, and daily
                workplace productivity.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border text-[11px] font-semibold text-accent-foreground">
              Save 10+ hours per week
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between hover:border-accent/60 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-accent-foreground">
                  <Bot size={20} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  Level 02
                </span>
              </div>
              <h3 className="font-extrabold text-base text-foreground mb-1">
                AI Builder (How to CREATE AI)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Build no-code WhatsApp bots, lead generation automations, voiceovers, and AI-powered
                web applications.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border text-[11px] font-semibold text-accent-foreground">
              Zero coding required
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between hover:border-accent/60 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-accent-foreground">
                  <Rocket size={20} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  Level 03
                </span>
              </div>
              <h3 className="font-extrabold text-base text-foreground mb-1">
                AI Business (MAKE MONEY with AI)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Launch an AI agency, sell retainers to businesses, and study our proprietary NFS
                Insurance & Finance AI workflow.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border text-[11px] font-semibold text-accent-foreground">
              Commercial retainers & blueprints
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border">
          <div>
            <div className="flex items-center gap-2">
              <Award size={18} className="text-accent-foreground" />
              <strong className="text-sm text-foreground">
                Start with our Free AI Starter Track
              </strong>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Interactive 15-minute lessons, prompt sandbox, quiz badge, and WhatsApp community
              access.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button asChild variant="brand" className="pill-button">
              <Link to="/learning-hub">
                Explore Learning Hub <ArrowUpRight size={14} />
              </Link>
            </Button>
            <Button asChild variant="glass" className="pill-button">
              <Link to="/learning-hub" hash="free-course">
                Try Free Course <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function GrowthSection() {
  const features = [
    {
      icon: Globe2,
      title: "Your business, online",
      text: "A professional website that feels like you.",
    },
    {
      icon: ShieldCheck,
      title: "Always looked after",
      text: "Secure hosting, backups and technical care.",
    },
    { icon: Users, title: "Grow together", text: "A community of ambitious businesses." },
    {
      icon: RefreshCw,
      title: "Ready for what’s next",
      text: "Flexible packages that grow with you.",
    },
  ];
  return (
    <section className="section mint-band">
      <div className="site-width">
        <div className="growth-layout">
          <div className="growth-copy">
            <span className="new-label">
              <Sparkles size={12} />
              NEW AT E AND L
            </span>
            <h2 className="editorial-title">
              Small beginnings.
              <br />
              <span>Extraordinary possibilities.</span>
            </h2>
            <p>
              Introducing Grow Online. Professional websites, hosting and ongoing care in one
              monthly package. Built for small businesses with big plans.
            </p>
            <div className="growth-price">
              <span>From</span>
              <strong>R199</strong>
              <span>/ month</span>
            </div>
            <div className="small-note">36-month term · Excl. VAT · R0 upfront</div>
          </div>
          <div>
            <div className="growth-list">
              {features.map((f) => (
                <div className="growth-feature" key={f.title}>
                  <f.icon size={23} strokeWidth={1.5} />
                  <div>
                    <strong>{f.title}</strong>
                    <p>{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="brand" className="pill-button-large">
              <Link to="/packages">
                Find your package <ArrowUpRight />
              </Link>
            </Button>
            <p className="small-note mt-4">
              Designed and developed by CoreTech. Supported by E and L.
            </p>
          </div>
        </div>
        <div className="process-strip">
          {[
            { title: "Discover", text: "We listen, understand and find the right fit." },
            { title: "Design & build", text: "Your vision, brought to life by our engineers." },
            { title: "Launch & host", text: "Go live with secure, dependable hosting." },
            { title: "Maintain & grow", text: "Ongoing care. A community. New possibilities." },
          ].map((s, i) => (
            <div key={s.title}>
              <span className="process-number">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProjectSection() {
  return (
    <section className="section">
      <div className="site-width">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Ideas into impact</div>
            <h2>
              Not just possibilities.
              <br />
              <span>Progress in motion.</span>
            </h2>
          </div>
          <Button asChild variant="glass" className="pill-button">
            <Link to="/about" hash="experience">
              Meet our experience <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <div className="project-grid">
          <article className="project-card">
            <div className="project-visual dark">
              <span className="project-category">Enterprise systems</span>
              <span className="project-monogram">
                WesBank<span className="text-accent">.</span>
              </span>
            </div>
            <div className="project-detail">
              <h3>Supporting systems that move business</h3>
              <p>
                RT46 Fleet application support. An enterprise engagement spanning 2022 to July 2026.
              </p>
            </div>
          </article>
          <article className="project-card">
            <div className="project-visual">
              <span className="project-category">Health technology · In development</span>
              <span className="project-monogram text-accent-foreground">
                NFS Health <span className="font-normal">+</span>
              </span>
            </div>
            <div className="project-detail">
              <h3>A more connected healthcare experience</h3>
              <p>
                A subscription medical member portal, designed around accessible, dependable service
                delivery.
              </p>
            </div>
          </article>
          <article className="project-card">
            <div className="project-visual dark">
              <span className="project-category">AI product · In development</span>
              <span className="project-monogram">
                Lihle<span className="text-accent">Speaks</span>
              </span>
            </div>
            <div className="project-detail">
              <h3>Intelligent conversations. Human impact.</h3>
              <p>
                An AI-enabled agentic chatbot focused on scalable, responsive digital engagement.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function PortalBand() {
  return (
    <section className="portal-band">
      <div className="site-width portal-inner">
        <div className="portal-info">
          <span className="service-icon">
            <LockKeyhole size={22} strokeWidth={1.5} />
          </span>
          <div>
            <h3>Already part of the E and L family?</h3>
            <p>Your next step is closer than you think. Connect with your client team.</p>
          </div>
        </div>
        <Button asChild variant="glass" className="pill-button">
          <Link to="/client-portal">
            Client access <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
