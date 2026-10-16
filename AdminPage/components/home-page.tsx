"use client"

import Link from "next/link"
import { ArrowRight, Boxes, Check, ClipboardList, PackageCheck, ShieldCheck, Truck } from "lucide-react"

const capabilities = [
  { label: "CATALOG", title: "Product records that stay clear.", body: "Keep supplement details, SKUs, batches, pricing, and status in one dependable place.", icon: Boxes, tone: "dark" },
  { label: "STOCK", title: "Know what is ready to move.", body: "See stock levels across shops and warehouses before a low-inventory surprise becomes a delay.", icon: PackageCheck, tone: "light" },
  { label: "ORDERS", title: "From order to dispatch.", body: "Give every order a simple trail from confirmation through packing and delivery.", icon: ClipboardList, tone: "mint" },
]

export function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-grid" aria-hidden="true" />
        <header className="home-nav">
          <Link href="/" className="brand-lockup" aria-label="SS Supplement home">
            <span className="brand-mark"><span /><span /></span>
            <span><strong>SS Supplement</strong><small>PRODUCT CONTROL</small></span>
          </Link>
          <nav className="home-links" aria-label="Main navigation">
            <a href="#platform">Platform</a><a href="#workflow">Workflow</a><a href="#about">About</a>
          </nav>
          <Link href="/login" className="nav-login">Admin / Employee login <ArrowRight size={16} /></Link>
        </header>

        <div className="ticker" aria-hidden="true">PRODUCTS · STOCK · ORDERS · BATCHES · DISPATCH · PRODUCTS · STOCK · ORDERS · BATCHES · DISPATCH</div>
        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> SUPPLEMENT OPERATIONS / 01</p>
            <h1>Make every<br /><em>product count.</em></h1>
            <p className="hero-description">A composed workspace for SS Supplement teams to manage products, inventory, orders, and dispatch without losing the thread.</p>
            <div className="hero-actions"><Link href="/login" className="hero-cta">Enter the workspace <ArrowRight size={18} /></Link><span className="hero-note"><Check size={16} /> Built for admin and employee teams</span></div>
          </div>
          <div className="pipeline-card" id="workflow">
            <div className="window-bar"><span className="window-dots"><i /><i /><i /></span><span>SSS / OPERATIONS PIPELINE</span><b>01 / 04</b></div>
            <div className="pipeline-body"><p className="eyebrow">LIVE CONTROL / TODAY</p><h2>From product<br /><strong>to dispatch.</strong></h2><div className="pipeline-line"><span className="pipeline-step active"><i>01</i><b>Product</b><small>catalogue ready</small></span><span className="pipeline-step"><i>02</i><b>Stock</b><small>count & replenish</small></span><span className="pipeline-step"><i>03</i><b>Order</b><small>pack & confirm</small></span><span className="pipeline-step"><i>04</i><b>Dispatch</b><small>on its way</small></span></div></div>
            <div className="pipeline-footer"><span><ShieldCheck size={16} /> Role-based access</span><span>SSS / 2026</span></div>
          </div>
        </div>
      </section>

      <section className="platform-section" id="platform">
        <div className="section-intro"><p className="eyebrow">INSIDE THE WORKSPACE / 02</p><h2>A clearer way<br />to run the <em>range.</em></h2><p>Everything your team needs to keep products accurate, stock visible, and orders moving in the right direction.</p></div>
        <div className="capability-grid">{capabilities.map(({ label, title, body, icon: Icon, tone }) => <article className={`capability-card ${tone}`} key={label}><div className="card-top"><span className="card-icon"><Icon size={21} /></span><span>{label}</span></div><div><h3>{title}</h3><p>{body}</p></div><ArrowRight className="card-arrow" size={20} /></article>)}</div>
      </section>

      <section className="control-section" id="about"><div className="control-copy"><p className="eyebrow">A QUIETER CONTROL ROOM / 03</p><h2>Know what is<br /><em>moving.</em></h2><p>SS Supplement brings the everyday details into view, so your people can spend less time searching and more time keeping the business moving.</p><Link href="/login" className="outline-cta">Open the workspace <ArrowRight size={17} /></Link></div><div className="control-panel"><div className="window-bar"><span className="window-dots"><i /><i /><i /></span><span>SSS / STOCK SUMMARY</span><b>04 / 04</b></div><div className="summary-row"><span>Active products</span><strong>128</strong><small>catalogue</small></div><div className="summary-row"><span>Stock to review</span><strong>07</strong><small className="warning-text">needs attention</small></div><div className="summary-row"><span>Orders in progress</span><strong>24</strong><small>today</small></div><div className="summary-progress"><span>FULFILMENT HEALTH</span><b>92%</b><div><i /></div></div></div></section>

      <footer className="home-footer"><div className="footer-brand"><span className="brand-mark"><span /><span /></span><strong>SS Supplement</strong><p>Product control for a growing supplement business.</p></div><div className="footer-links"><div><span>WORKSPACE</span><Link href="/login">Admin / Employee login</Link><a href="#platform">Product management</a></div><div><span>OPERATIONS</span><a href="#workflow">Inventory</a><a href="#workflow">Orders & dispatch</a></div><div><span>CONTACT</span><a href="mailto:info.sssupplements@gmail.com">info.sssupplements@gmail.com</a></div></div><div className="footer-bottom"><span>© 2026 SS SUPPLEMENT</span><span>PRODUCTS · STOCK · ORDERS</span></div></footer>
    </main>
  )
}
