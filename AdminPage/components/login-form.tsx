"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, X } from "lucide-react"

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpPreview, setShowOtpPreview] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    const role = await login(email.trim(), password)
    if (role) {
      router.push(role === "employee" ? "/employee/dashboard" : "/admin/dashboard")
      router.refresh()
    } else {
      setError("We could not verify those credentials or determine your workspace access.")
    }
    setIsLoading(false)
  }

  return (
    <main className="auth-page">
      <div className="auth-grid" aria-hidden="true" />
      <header className="auth-header">
        <div className="brand-lockup">
          <span className="brand-mark"><span /><span /></span>
          <span>
            <strong>SS Supplement</strong>
            <small>OPERATIONS / CONTROL</small>
          </span>
        </div>
        <div className="secure-badge"><ShieldCheck size={15} /> Secure workspace</div>
      </header>

      <section className="auth-card" aria-label="SS Supplement admin sign in">
        <div className="auth-story">
          <div className="story-topline"><Sparkles size={14} /> THE DAILY CONTROL ROOM</div>
          <div className="story-copy">
            <h1>Keep every<br /><em>shop in shape.</em></h1>
            <p>One calm space for products, stock, invoices, and the decisions that keep SS Supplement moving.</p>
          </div>
          <div className="story-checks">
            <span><Check size={15} /> Live inventory visibility</span>
            <span><Check size={15} /> Shop-level control</span>
            <span><Check size={15} /> Audit-ready records</span>
          </div>
          <div className="story-orbit orbit-one" />
          <div className="story-orbit orbit-two" />
        </div>

        <div className="auth-form-panel">
          <button className="close-button" type="button" aria-label="Close sign in" onClick={() => setShowOtpPreview(false)}>
            <X size={19} />
          </button>
          <div className="form-heading">
            <span className="eyebrow">WELCOME BACK</span>
            <h2>Good to see you.</h2>
            <p>Sign in to manage your supplement business.</p>
          </div>

          {showOtpPreview ? (
            <div className="otp-preview">
              <div className="otp-icon"><ShieldCheck size={22} /></div>
              <span className="eyebrow">ONE SMALL STEP</span>
              <h2>Check your inbox.</h2>
              <p>When email OTP verification is enabled on the backend, the six-digit code will be sent to your registered admin email.</p>
              <div className="otp-placeholder" aria-label="Verification code preview">0 0 0 0 0 0</div>
              <button type="button" className="primary-action" onClick={() => setShowOtpPreview(false)}>Back to sign in <ArrowRight size={17} /></button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="form-error" role="alert"><AlertCircle size={17} /> {error}</div>}
              <label htmlFor="email">Registered email</label>
              <div className="input-wrap">
                <Mail size={17} /><input id="email" type="email" placeholder="info.sssupplements@gmail.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isLoading} />
              </div>
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <LockKeyhole size={17} /><input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isLoading} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div className="form-meta"><label className="remember"><input type="checkbox" /> <span>Remember this device</span></label><button type="button" className="text-button">Forgot password?</button></div>
              <button className="primary-action" type="submit" disabled={isLoading}>{isLoading ? "Checking access…" : "Sign in to workspace"}<ArrowRight size={17} /></button>
              <button type="button" className="otp-link" onClick={() => setShowOtpPreview(true)}><ShieldCheck size={15} /> View email verification flow</button>
              </form>
            </>
          )}
          <p className="form-footer">Authorized SS Supplement personnel only.</p>
        </div>
      </section>
      <footer className="auth-footer"><span>SSS / 2026</span><span>Inventory · Billing · Dispatch</span></footer>
    </main>
  )
}
