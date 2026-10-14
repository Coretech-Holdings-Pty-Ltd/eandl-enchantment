import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDown, Layers3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout, ContactCTA } from "@/components/site-layout";
import {
  ServiceOverview,
  LearningHubFeatureSection,
  GrowthSection,
  ProjectSection,
  PortalBand,
} from "@/components/home-sections";
import { pageHead } from "@/lib/site-content";
import hero from "@/assets/architecture-hero.jpg";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Technology. Infrastructure. Investment.",
      "E and L Holdings connects technology, power infrastructure, strategic investment and the E & L Learning Hub to help South African businesses grow. Innovate. Integrate. Elevate.",
    ),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <section className="hero">
        <img
          className="hero-image"
          src={hero}
          width={1920}
          height={1088}
          alt="Sculptural navy architecture and teal glass in a bright modern space"
          fetchPriority="high"
        />
        <div className="site-width hero-content">
          <div className="eyebrow">E and L Holdings · Built for what’s next</div>
          <h1>
            Technology.
            <br />
            Infrastructure.
            <br />
            <span>Possibility.</span>
          </h1>
          <p className="hero-description">
            We bring technology, investment and infrastructure together to turn your business
            ambitions into lasting impact.
          </p>
          <div className="hero-actions">
            <Button asChild variant="brand" className="pill-button-large">
              <Link to="/solutions">
                Explore our solutions <ArrowUpRight />
              </Link>
            </Button>
            <Button asChild variant="glass" className="pill-button-large">
              <Link to="/learning-hub">
                AI Learning Hub 🤖 <ArrowUpRight />
              </Link>
            </Button>
            <Button asChild variant="glass" className="pill-button-large">
              <Link to="/contact">
                Let’s talk <ArrowUpRight />
              </Link>
            </Button>
          </div>
          <div className="hero-proof">
            <span className="proof-icon">
              <ShieldCheck size={17} />
            </span>
            <div>
              <strong>Practical expertise. Proven partnerships.</strong>
              <span>Proudly South African. Built around your business.</span>
            </div>
          </div>
          <div className="hero-note">
            <Layers3 className="hero-note-icon" size={25} strokeWidth={1.4} />
            <strong>Connected by design.</strong>
            <p>
              One partner. Integrated solutions.
              <br />
              More room to move forward.
            </p>
          </div>
        </div>
        <div className="site-width hero-bottom">
          <span>Innovate. Integrate. Elevate.</span>
          <a href="#solutions" className="flex items-center gap-2">
            Discover what’s possible <ArrowDown size={12} />
          </a>
        </div>
      </section>

      <section className="trust-band">
        <div className="site-width trust-inner">
          <span className="trust-label">
            EXPERIENCE ACROSS
            <br />
            LEADING ORGANISATIONS
          </span>
          <span className="trust-name">MultiChoice</span>
          <span className="trust-name">DVT</span>
          <span className="trust-name">Anglo American</span>
          <span className="trust-name">WesBank</span>
          <span className="trust-name">harambee</span>
        </div>
      </section>

      <ServiceOverview />
      <LearningHubFeatureSection />
      <GrowthSection />
      <ProjectSection />
      <PortalBand />
      <ContactCTA />
    </SiteLayout>
  );
}
