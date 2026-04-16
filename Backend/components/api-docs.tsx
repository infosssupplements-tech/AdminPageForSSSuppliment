"use client"

import { useState } from "react"

const endpoints = [
  {
    method: "POST",
    path: "/api/signup/",
    auth: false,
    description: "Register a new user with name, email, phone, password, confirmPassword. Optionally include a referralCode to earn points for both users.",
    body: `{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "securePass123",
  "confirmPassword": "securePass123",
  "referralCode": "A1B2C3D4E5F6"   // optional
}`,
    response: `{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "points": 2,
    "referral_code": "X9Y8Z7W6V5U4",
    "total_referrals": 0,
    "date_joined": "2026-02-06T12:00:00Z"
  },
  "tokens": {
    "refresh": "eyJ...",
    "access": "eyJ..."
  }
}`,
  },
  {
    method: "POST",
    path: "/api/login/",
    auth: false,
    description: "Authenticate with phone number & password. Returns JWT tokens + user profile.",
    body: `{
  "phone": "9876543210",
  "password": "securePass123"
}`,
    response: `{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "points": 6,
    "referral_code": "X9Y8Z7W6V5U4",
    "total_referrals": 1,
    "date_joined": "2026-02-06T12:00:00Z"
  },
  "tokens": {
    "refresh": "eyJ...",
    "access": "eyJ..."
  }
}`,
  },
  {
    method: "POST",
    path: "/api/token/refresh/",
    auth: false,
    description: "Get a new access token using your refresh token.",
    body: `{
  "refresh": "eyJ..."
}`,
    response: `{
  "access": "eyJ...",
  "refresh": "eyJ..."
}`,
  },
  {
    method: "GET",
    path: "/api/profile/",
    auth: true,
    description: "Get the authenticated user's full profile including name, phone, points, referral code, and referral count.",
    body: null,
    response: `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "points": 6,
  "referral_code": "X9Y8Z7W6V5U4",
  "total_referrals": 1,
  "date_joined": "2026-02-06T12:00:00Z"
}`,
  },
  {
    method: "GET",
    path: "/api/referrals/",
    auth: true,
    description: "List all referrals made by the authenticated user with point details.",
    body: null,
    response: `[
  {
    "id": 1,
    "referrer_phone": "9876543210",
    "referrer_name": "John Doe",
    "referee_phone": "9123456789",
    "referee_name": "Jane Smith",
    "referrer_points_awarded": 4,
    "referee_points_awarded": 2,
    "created_at": "2026-02-06T14:30:00Z"
  }
]`,
  },
  {
    method: "GET",
    path: "/api/leaderboard/",
    auth: false,
    description: "Public endpoint. Returns top 50 users sorted by points (descending).",
    body: null,
    response: `[
  { "id": 1, "name": "John Doe",   "phone": "9876543210", "points": 12 },
  { "id": 3, "name": "Alice",      "phone": "9111222333", "points": 8 },
  { "id": 2, "name": "Jane Smith", "phone": "9123456789", "points": 2 }
]`,
  },
]

const setupSteps = [
  {
    step: 1,
    title: "Clone & install dependencies",
    code: `# Clone the project
cd your-project-folder

# Create a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt`,
  },
  {
    step: 2,
    title: "Run database migrations",
    code: `python manage.py makemigrations
python manage.py migrate`,
  },
  {
    step: 3,
    title: "Create a superuser (for Django Admin)",
    code: `python manage.py createsuperuser
# You will be asked for: phone, email, username, password`,
  },
  {
    step: 4,
    title: "Start the development server",
    code: `python manage.py runserver
# API is now live at http://127.0.0.1:8000/api/`,
  },
]

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-600 text-emerald-50",
    POST: "bg-blue-600 text-blue-50",
    PUT: "bg-amber-600 text-amber-50",
    DELETE: "bg-red-600 text-red-50",
  }
  return (
    <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${colors[method] || "bg-muted text-muted-foreground"}`}>
      {method}
    </span>
  )
}

function EndpointCard({ ep }: { ep: (typeof endpoints)[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <MethodBadge method={ep.method} />
        <code className="text-sm font-mono text-foreground font-semibold">{ep.path}</code>
        {ep.auth && (
          <span className="ml-auto rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
            Auth Required
          </span>
        )}
        <svg
          className={`ml-auto h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{ep.description}</p>
          {ep.body && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Request Body</h4>
              <pre className="rounded-md bg-muted p-4 text-xs font-mono text-foreground overflow-x-auto">{ep.body}</pre>
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Response</h4>
            <pre className="rounded-md bg-muted p-4 text-xs font-mono text-foreground overflow-x-auto">{ep.response}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

export function ApiDocs() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <svg className="h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Django Referral Backend</h1>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            A complete REST API with JWT authentication (phone + password login), referral/share coin system, and points tracking.
            Built with Django + Django REST Framework. Ready for your React frontend.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-12">
        {/* Referral Logic */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">How the Referral System Works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "1. Share Your Code", desc: "Each user gets a unique 12-character referral code upon signup." },
              { title: "2. Friend Signs Up", desc: "New user includes the referralCode in the signup request body." },
              { title: "3. Points Awarded", desc: "Referrer earns 4 points, new user earns 2 points. Instant." },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Setup */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Setup Instructions</h2>
          <div className="space-y-4">
            {setupSteps.map((s) => (
              <div key={s.step} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {s.step}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                </div>
                <pre className="rounded-md bg-muted p-4 text-xs font-mono text-foreground overflow-x-auto">{s.code}</pre>
              </div>
            ))}
          </div>
        </section>

        {/* API Endpoints */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">API Endpoints</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Base URL: <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">http://127.0.0.1:8000</code>
            &nbsp; | &nbsp; Auth header: <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{"Authorization: Bearer <access_token>"}</code>
          </p>
          <div className="space-y-3">
            {endpoints.map((ep) => (
              <EndpointCard key={ep.path + ep.method} ep={ep} />
            ))}
          </div>
        </section>

        {/* React Integration */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">React Frontend Integration</h2>
          <div className="rounded-lg border border-border bg-card p-5">
            <pre className="rounded-md bg-muted p-4 text-xs font-mono text-foreground overflow-x-auto">{`// Example: Signup with referral code
const handleSignup = async (signupData) => {
  const res = await fetch("http://127.0.0.1:8000/api/signup/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: signupData.name,
      email: signupData.email,
      phone: signupData.phone,
      password: signupData.password,
      confirmPassword: signupData.confirmPassword,
      referralCode: signupData.referralCode || "",
    }),
  });
  const json = await res.json();
  // Store tokens: json.tokens.access, json.tokens.refresh
  localStorage.setItem("access", json.tokens.access);
  localStorage.setItem("refresh", json.tokens.refresh);
  return json.user;
};

// Example: Login with phone + password
const handleLogin = async (phone, password) => {
  const res = await fetch("http://127.0.0.1:8000/api/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  const json = await res.json();
  localStorage.setItem("access", json.tokens.access);
  localStorage.setItem("refresh", json.tokens.refresh);
  return json.user;
};

// Example: Fetch profile (authenticated)
const getProfile = async () => {
  const res = await fetch("http://127.0.0.1:8000/api/profile/", {
    headers: {
      Authorization: \`Bearer \${localStorage.getItem("access")}\`,
    },
  });
  return res.json();
};`}</pre>
          </div>
        </section>

        {/* File Structure */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Project File Structure</h2>
          <div className="rounded-lg border border-border bg-card p-5">
            <pre className="rounded-md bg-muted p-4 text-xs font-mono text-foreground overflow-x-auto">{`project/
  manage.py
  requirements.txt
  db.sqlite3              # created after migrate
  backend/
    __init__.py
    settings.py           # Django config, JWT, CORS, referral points
    urls.py               # Root URL routing
    wsgi.py
  accounts/
    __init__.py
    apps.py
    models.py             # User (phone, email, points, referral_code) & Referral
    serializers.py        # Signup, Login, Profile, Referral serializers
    views.py              # API views (signup, login, profile, etc.)
    urls.py               # /api/* routes
    backends.py           # Phone-based authentication backend
    admin.py              # Django Admin config`}</pre>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Django Referral Backend &mdash; Built with Django 4.2, Django REST Framework, and SimpleJWT
          </p>
        </div>
      </footer>
    </div>
  )
}
