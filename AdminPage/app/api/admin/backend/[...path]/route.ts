import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

async function forward(request: NextRequest, method: string, path: string[]) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "")

  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  if (!backendUrl) {
    return NextResponse.json({ success: false, error: "BACKEND_URL is not configured" }, { status: 500 })
  }

  const qs = request.nextUrl.search || ""
  const url = `${backendUrl}/admin-api/${path.join("/")}/${qs}`

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  }

  if (method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = request.headers.get("content-type") || "application/json"
  }

  const body = method === "GET" || method === "HEAD" ? undefined : await request.text()

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
    })

    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to connect to backend server" },
      { status: 502 }
    )
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return forward(request, "GET", path)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return forward(request, "POST", path)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return forward(request, "PUT", path)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return forward(request, "PATCH", path)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return forward(request, "DELETE", path)
}
