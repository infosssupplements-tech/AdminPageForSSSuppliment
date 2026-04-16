import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const backendUrl = process.env.BACKEND_URL
    const backendBase = backendUrl?.replace(/\/+$/, "")

    if (!backendBase) {
      return NextResponse.json(
        { success: false, error: "BACKEND_URL is not configured" },
        { status: 500 }
      )
    }

    const backendRes = await fetch(`${backendBase}/admin-api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })

    const raw = await backendRes.text()
    let data: Record<string, unknown> = {}
    try {
      data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    } catch {
      data = { detail: raw || "Invalid response from backend login endpoint" }
    }

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status })
    }

    const token =
      (typeof data.token === "string" && data.token) ||
      (typeof data.access === "string" && data.access) ||
      (typeof data.access_token === "string" && data.access_token) ||
      ""

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Login succeeded but token was missing in backend response",
          backend_response: data,
        },
        { status: 502 }
      )
    }

    const res = NextResponse.json(data)
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return res
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    )
  }
}
