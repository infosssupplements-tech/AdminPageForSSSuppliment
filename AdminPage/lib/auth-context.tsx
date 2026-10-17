"use client"

import { createContext, useContext, useState, useEffect } from "react"

type AuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<"admin" | "employee" | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/auth/me/", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        })

        setIsAuthenticated(res.ok)
      } catch {
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/admin/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) return null

      const data = (await res.json()) as { role?: string; user?: { role?: string } }
      const role = data.role ?? data.user?.role
      if (role !== "admin" && role !== "employee") return null

      setIsAuthenticated(true)
      return role
    } catch {
      return null
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/admin/auth/logout/", {
        method: "POST",
        credentials: "include",
      })
    } catch {
      // Ignore logout errors
    }
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
