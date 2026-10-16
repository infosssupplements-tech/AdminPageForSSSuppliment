"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { ClipboardList, PackageCheck, Truck, LogOut, CheckCircle2, Clock3 } from "lucide-react"

const tasks = [
  { title: "Confirm today’s dispatch queue", detail: "Review packed orders before courier pickup.", status: "Ready", icon: Truck },
  { title: "Cycle-count whey protein shelf", detail: "Verify batch count for WP-01 / Rack B.", status: "In progress", icon: PackageCheck },
  { title: "Review pending stock notes", detail: "Three notes from the inventory team need attention.", status: "Pending", icon: ClipboardList },
]

export function EmployeeWorkspace() {
  const { logout } = useAuth()
  const router = useRouter()
  const [completed, setCompleted] = useState<string[]>([])

  const signOut = async () => { await logout(); router.push("/") }

  return (
    <main className="workspace-page">
      <div className="workspace-grid" aria-hidden="true" />
      <header className="workspace-nav">
        <a href="/" className="brand-lockup workspace-brand"><span className="brand-mark"><span /><span /></span><span><strong>SS Supplement</strong><small>EMPLOYEE WORKSPACE</small></span></a>
        <div className="workspace-nav-right"><span className="role-pill">Employee access</span><button className="workspace-signout" onClick={signOut}><LogOut size={15} /> Sign out</button></div>
      </header>
      <section className="workspace-content">
        <div className="workspace-heading"><div><span className="workspace-eyebrow">TODAY / OPERATIONS FLOOR</span><h1>Make the next<br /><em>right move.</em></h1><p>Your daily workspace for stock checks, order preparation, and dispatch handoffs.</p></div><div className="shift-card"><span>SHIFT STATUS</span><strong>Active</strong><small>Warehouse · Kolkata</small></div></div>
        <div className="employee-stats"><div><span>Open tasks</span><strong>{tasks.length - completed.length}</strong></div><div><span>Dispatch window</span><strong>4:30 PM</strong></div><div><span>Stock alerts</span><strong className="alert-number">03</strong></div></div>
        <div className="employee-section-head"><div><span className="workspace-eyebrow">YOUR QUEUE / 01</span><h2>Today&apos;s work.</h2></div><span className="queue-date"><Clock3 size={15} /> Updated just now</span></div>
        <div className="task-list">{tasks.map(({ title, detail, status, icon: Icon }) => { const done = completed.includes(title); return <article className={"task-card " + (done ? "task-done" : "")} key={title}><div className="task-icon"><Icon size={21} /></div><div className="task-copy"><span>{status}</span><h3>{title}</h3><p>{detail}</p></div><button className="task-action" onClick={() => setCompleted((items) => done ? items.filter((item) => item !== title) : [...items, title])}>{done ? <><CheckCircle2 size={17} /> Completed</> : "Mark done"}</button></article> })}</div>
      </section>
    </main>
  )
}
