import { Link, useRouterState } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { ArrowUpRight, Menu, X, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import logo from '@/assets/el-logo.png.asset.json'
import profile from '@/assets/el-company-profile.pdf.asset.json'
import guide from '@/assets/el-package-guide.pdf.asset.json'

export function Brand() {
 return <Link to="/" className="brand" aria-label="E and L Holdings home"><img src={logo.url} width={43} height={43} alt="E and L logo" /><span className="brand-name">E and L<span className="brand-sub">H O L D I N G S</span></span></Link>
}

export function SiteLayout({ children }: { children: ReactNode }) {
 const [menu, setMenu] = useState(false)
 const path = useRouterState({ select: (s) => s.location.pathname })
 const links = [{ label: 'Home', to: '/' }, { label: 'About us', to: '/about' }, { label: 'Our solutions', to: '/solutions' }, { label: 'Grow Online', to: '/packages' }, { label: 'Contact', to: '/contact' }] as const
 return <>
  <header className="site-header"><div className="site-width nav-glass"><Brand />
   <nav className={`nav-links ${menu ? 'mobile-open' : ''}`} aria-label="Main navigation">{links.map(item => <Link key={item.to} to={item.to} onClick={() => setMenu(false)} className={`nav-link ${path === item.to ? 'active' : ''}`}>{item.label}</Link>)}{menu && <Link to="/client-portal" className="nav-link" onClick={() => setMenu(false)}>Client portal</Link>}</nav>
   <div className="nav-actions"><Button asChild variant="glass" className="pill-button portal-button"><Link to="/client-portal"><LockKeyhole size={13} />Client portal</Link></Button><Button asChild variant="brand" className="pill-button"><Link to="/contact">Let’s talk <ArrowUpRight /></Link></Button><Button variant="ghost" size="icon" className="mobile-toggle" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</Button></div>
  </div></header>
  <main>{children}</main>
  <footer className="footer"><div className="site-width"><div className="footer-top"><div><Brand /><p className="footer-copy">Technology. Infrastructure. Investment.<br />One accountable partner for your next chapter.</p></div><div><h4>Explore</h4><div className="footer-links"><Link to="/about">About E and L</Link><Link to="/solutions">Our solutions</Link><Link to="/packages">Grow Online packages</Link><Link to="/client-portal">Client portal</Link></div></div><div><h4>Resources</h4><div className="footer-links"><a href={profile.url} target="_blank" rel="noreferrer">Company profile ↗</a><a href={guide.url} target="_blank" rel="noreferrer">Package guide ↗</a><Link to="/packages" hash="faqs">Frequently asked questions</Link></div></div><div><h4>Let’s connect</h4><div className="footer-links"><a href="mailto:info@eandl.digital">info@eandl.digital</a><a href="tel:+27790284802">079 028 4802</a><Link to="/contact">Randpark Ridge, Johannesburg<br />South Africa</Link></div></div></div><div className="footer-bottom"><span>© 2026 E and L Holdings PTY (LTD). All rights reserved.</span><span>Innovate. Integrate. Elevate.</span><span>Proudly South African</span></div></div></footer>
 </>
}

export function ContactCTA() {
 return <section className="cta-section"><div className="eyebrow">Your next chapter starts here</div><h2>Big ambitions.<br />The right partner.</h2><p>Tell us where you want to go.<br />We’ll help you build the way forward.</p><div className="cta-actions"><Button asChild variant="brand" className="pill-button-large"><Link to="/contact">Let’s build something <ArrowUpRight /></Link></Button><Button asChild variant="glass" className="pill-button-large"><a href={profile.url} target="_blank" rel="noreferrer">Our company profile <ArrowUpRight /></a></Button></div></section>
}