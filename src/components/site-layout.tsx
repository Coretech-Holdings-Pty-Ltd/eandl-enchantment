import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import {
  ArrowUpRight,
  Menu,
  X,
  LockKeyhole,
  Sparkles,
  Home,
  Building2,
  Layers,
  Rocket,
  Mail,
  ChevronRight,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/lib/theme";
import { companyContact } from "@/lib/site-content";
import logo from "@/assets/logo.png";
import guide from "@/assets/el-package-guide.pdf.asset.json";

export function Brand({ onClick }: { onClick?: () => void } = {}) {
  return (
    <Link to="/" className="brand" aria-label="E and L Holdings home" onClick={onClick}>
      <img src={logo} width={43} height={43} alt="E and L logo" className="brand-logo-img" />
      <span className="brand-name">
        E and L<span className="brand-sub">H O L D I N G S</span>
      </span>
    </Link>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Prevent background scrolling while mobile navigation sheet is open
  useEffect(() => {
    if (!menu) {
      return undefined;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menu]);

  const links = [
    {
      label: "Home",
      to: "/",
      sub: "Overview & core capabilities",
      icon: Home,
    },
    {
      label: "About us",
      to: "/about",
      sub: "Our team, vision & track record",
      icon: Building2,
    },
    {
      label: "Our solutions",
      to: "/solutions",
      sub: "Technology, infrastructure & advisory",
      icon: Layers,
    },
    {
      label: "Grow Online",
      to: "/packages",
      sub: "Fixed-scope web & digital packages",
      icon: Rocket,
    },
    {
      label: "Learning Hub",
      to: "/learning-hub",
      sub: "Practical AI courses for Africa",
      icon: Sparkles,
      badge: "AI",
    },
    {
      label: "Contact",
      to: "/contact",
      sub: "Get in touch or book a consultation",
      icon: Mail,
      desktopHidden: true,
    },
  ] as const;

  return (
    <>
      <header className="site-header">
        <div className="site-width nav-glass">
          <Brand />

          {/* Desktop Navigation — Contact is intentionally hidden; CTA button covers it */}
          <nav className="nav-links desktop-nav-links" aria-label="Main navigation">
            {links.map((item) => (
              !( "desktopHidden" in item && item.desktopHidden) && (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-link ${path === item.to ? "active" : ""} ${item.to === "/learning-hub" ? "nav-link-hub" : ""}`}
                >
                  <span>{item.label}</span>
                  {"badge" in item && item.badge && (
                    <span className="nav-pill-badge">{item.badge}</span>
                  )}
                </Link>
              )
            ))}
          </nav>

          {/* Header Action Buttons */}
          <div className="nav-actions">
            <ThemeToggle className="desktop-theme-toggle" />
            <Button asChild variant="glass" className="pill-button portal-button">
              <Link to="/client-portal">
                <LockKeyhole size={13} />
                Client portal
              </Link>
            </Button>
            <Button asChild variant="brand" className="pill-button header-cta-btn">
              <Link to="/contact">
                Let’s talk <ArrowUpRight />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="mobile-toggle"
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer & Backdrop */}
      {menu && (
        <div className="mobile-nav-portal">
          <div
            className="mobile-nav-backdrop"
            onClick={() => setMenu(false)}
            aria-hidden="true"
          />
          <div
            className="mobile-nav-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Sheet Top Bar */}
            <div className="mobile-nav-header">
              <Brand onClick={() => setMenu(false)} />
              <button
                type="button"
                className="mobile-nav-close"
                onClick={() => setMenu(false)}
                aria-label="Close navigation menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu Links */}
            <div className="mobile-nav-section-title">Navigation</div>
            <nav className="mobile-nav-list" aria-label="Mobile main navigation">
              {links.map((item) => {
                const Icon = item.icon;
                const isActive = path === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenu(false)}
                    className={`mobile-nav-item ${isActive ? "active" : ""}`}
                  >
                    <span className={`mobile-nav-icon ${isActive ? "active" : ""}`}>
                      <Icon size={18} />
                    </span>
                    <div className="mobile-nav-meta">
                      <div className="mobile-nav-label-row">
                        <span className="mobile-nav-label">{item.label}</span>
                        {"badge" in item && item.badge && (
                          <span className="nav-pill-badge">{item.badge}</span>
                        )}
                      </div>
                      <span className="mobile-nav-sub">{item.sub}</span>
                    </div>
                    <ChevronRight size={16} className="mobile-nav-chevron" />
                  </Link>
                );
              })}
            </nav>

            {/* Quick Action CTA Buttons */}
            <div className="mobile-nav-actions">
              <Button asChild variant="brand" className="pill-button w-full justify-between h-11 text-xs sm:text-sm font-semibold">
                <Link to="/contact" onClick={() => setMenu(false)}>
                  <span>Let’s talk / Consultation</span>
                  <ArrowUpRight size={15} />
                </Link>
              </Button>
              <Button asChild variant="glass" className="pill-button w-full justify-between h-11 text-xs sm:text-sm font-semibold">
                <Link to="/client-portal" onClick={() => setMenu(false)}>
                  <span className="flex items-center gap-2">
                    <LockKeyhole size={14} />
                    Client portal
                  </span>
                  <ChevronRight size={14} />
                </Link>
              </Button>
            </div>

            {/* Footer Row inside Mobile Sheet */}
            <div className="mobile-nav-footer">
              <div className="mobile-theme-row">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">Theme appearance</span>
                  <span className="text-[11px] text-muted-foreground">Light or dark presentation</span>
                </div>
                <ThemeToggle />
              </div>

              <div className="mobile-contact-chips">
                <a
                  href={companyContact.whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mobile-chip"
                >
                  <MessageCircle size={13} className="text-emerald-500 shrink-0" />
                  <span>WhatsApp: {companyContact.whatsapp}</span>
                </a>
                <a
                  href={`tel:${companyContact.landlineTel}`}
                  className="mobile-chip"
                >
                  <Phone size={13} className="text-accent-foreground shrink-0" />
                  <span>Call: {companyContact.landline}</span>
                </a>
              </div>

              <div className="mobile-nav-tagline">
                <span>Innovate. Integrate. Elevate.</span>
                <span>Proudly South African 🇿🇦</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <main>{children}</main>
      <footer className="footer">
        <div className="site-width">
          <div className="footer-top">
            <div>
              <Brand />
              <p className="footer-copy">
                Technology. Infrastructure. Investment.
                <br />
                One accountable partner for your next chapter.
              </p>
            </div>
            <div>
              <h4>Explore</h4>
              <div className="footer-links">
                <Link to="/about">About E and L</Link>
                <Link to="/solutions">Our solutions</Link>
                <Link to="/packages">Grow Online packages</Link>
                <Link
                  to="/learning-hub"
                  className="flex items-center gap-1.5 font-semibold text-accent-foreground"
                >
                  <span>Learning Hub</span>
                  <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">
                    AI
                  </span>
                </Link>
                <Link to="/client-portal">Client portal</Link>
              </div>
            </div>
            <div>
              <h4>Resources</h4>
              <div className="footer-links">
                <a href={guide.url} target="_blank" rel="noreferrer">
                  Package guide ↗
                </a>
                <Link to="/learning-hub" hash="free-course">
                  Free AI Kickstart Course
                </Link>
                <Link to="/packages" hash="faqs">
                  Frequently asked questions
                </Link>
              </div>
            </div>
            <div>
              <h4>Let’s connect</h4>
              <div className="footer-links">
                <a href={`mailto:${companyContact.email}`}>{companyContact.email}</a>
                <a href={`tel:${companyContact.landlineTel}`}>
                  {companyContact.landline} (Landline)
                </a>
                <a href={companyContact.whatsappLink} target="_blank" rel="noreferrer">
                  {companyContact.whatsapp} (WhatsApp)
                </a>
                <Link to="/contact">
                  {companyContact.address.line1}
                  <br />
                  {companyContact.address.area}
                </Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 E and L Holdings PTY (LTD). All rights reserved.</span>
            <span>Innovate. Integrate. Elevate.</span>
            <span>Proudly South African 🇿🇦</span>
          </div>
        </div>
      </footer>
    </>
  );
}

export function ContactCTA() {
  return (
    <section className="cta-section">
      <div className="eyebrow">Your next chapter starts here</div>
      <h2>
        Big ambitions.
        <br />
        The right partner.
      </h2>
      <p>
        Tell us where you want to go.
        <br />
        We’ll help you build the way forward.
      </p>
      <div className="cta-actions">
        <Button asChild variant="brand" className="pill-button-large">
          <Link to="/contact">
            Let’s build something <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
