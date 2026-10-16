"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { EmployeeWorkspace } from "@/components/employee-workspace"

function EmployeePageContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  useEffect(() => { if (!isLoading && !isAuthenticated) router.push("/login") }, [isAuthenticated, isLoading, router])
  if (isLoading || !isAuthenticated) return null
  return <EmployeeWorkspace />
}

export default function EmployeePage() { return <AuthProvider><EmployeePageContent /></AuthProvider> }
