import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout, ContactCTA } from "@/components/site-layout";
import { services, pageHead } from "@/lib/site-content";

export const Route = createFileRoute("/solutions")({
  head: () =>
    pageHead(
      "Integrated business solutions",
      "Explore enterprise IT consulting, software delivery, hardware supply, managed security, investment and power infrastructure with E and L Holdings.",
    ),
  component: Solutions,
});

function Solutions() {
  return (
    <SiteLayout>
      <div className="inner-page">
        <div className="site-width inner-intro">
          <div className="eyebrow">Six capabilities. One accountable team.</div>
          <h1>
            Connected expertise.
            <br />
            <span className="text-accent-foreground">Built around your business.</span>
          </h1>
          <p>
            From strategic advice to implementation, supply and long-term support. Discover
            practical solutions that make a measurable difference.
          </p>
        </div>
        {services.map((s, i) => (
          <section id={s.id} className={`section ${i % 2 ? "mint-band" : ""}`} key={s.id}>
            <div className="site-width detail-grid">
              <div className="detail-block">
                <div className="eyebrow">0{i + 1} · Our solutions</div>
                <h2 className="editorial-title">{s.title}</h2>
                <p>{s.description}</p>
                <Button asChild variant="brand" className="pill-button mt-5">
                  <Link to="/contact" search={{ service: s.title }}>
                    Discuss your project <ArrowUpRight />
                  </Link>
                </Button>
              </div>
              <div className="detail-block">
                <span className="service-icon mb-6">
                  <s.icon size={25} />
                </span>
                <h2>How we can help</h2>
                <ul className="detail-list">
                  {s.features.map((f) => (
                    <li key={f}>
                      <Check size={16} />
                      {f}
                    </li>
                  ))}
                </ul>
                {s.id === "software" && (
                  <Button asChild variant="glass" className="pill-button">
                    <Link to="/packages">
                      Explore Grow Online packages <ArrowUpRight />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
      <ContactCTA />
    </SiteLayout>
  );
}
