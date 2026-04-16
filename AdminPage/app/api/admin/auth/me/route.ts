import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  const backendUrl = process.env.BACKEND_URL
  const backendBase = backendUrl?.replace(/\/+$/, "")

  if (!token || !backendBase) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const backendRes = await fetch(`${backendBase}/admin-api/auth/me/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!backendRes.ok) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const data = await backendRes.json()
    return NextResponse.json({
      authenticated: true,
      admin: data.admin ?? null,
    })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
