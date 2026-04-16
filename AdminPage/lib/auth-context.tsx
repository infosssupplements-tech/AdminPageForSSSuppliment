"use client"

import { createContext, useContext, useState, useEffect } from "react"

type AuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
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

      if (!res.ok) return false

      const data = await res.json()
      const token =
        (typeof data.token === "string" && data.token) ||
        (typeof data.access === "string" && data.access) ||
        (typeof data.access_token === "string" && data.access_token) ||
        ""

      if (!token) return false

      localStorage.setItem("admin_token", token)
      setIsAuthenticated(true)
      return true
    } catch {
      return false
    }
  }

  const logout = async () => {
    localStorage.removeItem("admin_token")
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
