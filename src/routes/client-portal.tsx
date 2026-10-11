import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight, LockKeyhole, Mail } from 'lucide-react'
import { SiteLayout } from '@/components/site-layout'
import { Button } from '@/components/ui/button'
import { pageHead } from '@/lib/site-content'

export const Route = createFileRoute('/client-portal')({ head: () => pageHead('Client access', 'Existing E and L clients can contact their team to request their private client portal invitation and access details.'), component: Portal })
function Portal() {
 return <SiteLayout><div className="inner-page site-width"><div className="portal-page"><div className="service-icon"><LockKeyhole size={30} strokeWidth={1.5} /></div><div className="eyebrow">Your E and L connection</div><h1>Welcome back.<br /><span className="text-accent-foreground">Let’s get you connected.</span></h1><p>Client portal access is being introduced. Your E and L team will provide your private invitation and access details when your account is ready.</p><p>Already a client? Request your invitation or contact your account team for support.</p><div className="cta-actions"><Button asChild variant="brand" className="pill-button-large"><a href="mailto:info@eandl.digital?subject=Client%20portal%20access%20request"><Mail />Request client access</a></Button><Button asChild variant="glass" className="pill-button-large"><Link to="/contact" search={{ service:'Client portal access' }}>Contact our team <ArrowUpRight /></Link></Button></div><p className="small-note mt-8">Use the email address associated with your E and L account.</p></div></div></SiteLayout>
}