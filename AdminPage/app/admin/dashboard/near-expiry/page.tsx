"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { DataProvider } from "@/lib/data-store"
import { NearExpiryProductsPage } from "@/components/pages/near-expiry-products-page"

function NearExpiryDashboardContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
      router.refresh()
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) return null

  return (
    <DataProvider>
      <NearExpiryProductsPage />
    </DataProvider>
  )
}

export default function NearExpiryDashboardPage() {
  return (
    <AuthProvider>
      <NearExpiryDashboardContent />
    </AuthProvider>
  )
}
