"use client"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function LoginContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/admin/dashboard")
  }, [isAuthenticated, isLoading, router])

  if (isLoading || isAuthenticated) return null
  return <LoginForm />
}

export default function LoginPage() {
  return <AuthProvider><LoginContent /></AuthProvider>
}
