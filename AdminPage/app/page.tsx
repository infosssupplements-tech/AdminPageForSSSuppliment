"use client"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { HomePage } from "@/components/home-page"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function HomeContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/admin/dashboard")
      router.refresh()
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || isAuthenticated) return null
  return <HomePage />
}

export default function Home() {
  return <AuthProvider><HomeContent /></AuthProvider>
}
