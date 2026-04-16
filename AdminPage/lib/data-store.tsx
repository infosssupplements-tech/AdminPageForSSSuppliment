"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { User, Referral, Order, Product } from "./types"

interface DataContextType {
  users: User[]
  referrals: Referral[]
  orders: Order[]
  products: Product[]
  isLoading: boolean
  reloadAll: () => Promise<void>
  addUser: (user: User) => Promise<void>
  updateUser: (id: string, user: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  addReferral: (referral: Referral) => Promise<void>
  updateReferral: (id: string, referral: Partial<Referral>) => Promise<void>
  deleteReferral: (id: string) => Promise<void>
  addOrder: (order: Order) => Promise<void>
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  addProduct: (product: Product) => Promise<void>
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
}

const DataContext = createContext<DataContextType | null>(null)

type ApiResponse<T> = {
  success?: boolean
  data?: T
  error?: string | { detail?: string }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("admin_token")

  let additionalHeaders: Record<string, string> = {};
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      additionalHeaders = Object.fromEntries(init.headers.entries());
    } else if (typeof init.headers === 'object' && !Array.isArray(init.headers)) {
      additionalHeaders = init.headers as Record<string, string>;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...additionalHeaders,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`/api/admin/${path}`, {
    ...init,
    cache: "no-store",
    headers,
  })

  const body = (await res.json()) as ApiResponse<T>
  if (!res.ok) {
    const detail =
      typeof body.error === "string"
        ? body.error
        : body.error?.detail || "Request failed"
    throw new Error(detail)
  }

  return (body.data as T) ?? (body as T)
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadUsers = useCallback(async () => {
    const data = await apiRequest<User[]>("users/?page_size=500")
    setUsers(Array.isArray(data) ? data : [])
  }, [])

  const loadReferrals = useCallback(async () => {
    const data = await apiRequest<Referral[]>("referrals/?page_size=500")
    setReferrals(Array.isArray(data) ? data : [])
  }, [])

  const loadOrders = useCallback(async () => {
    const data = await apiRequest<Order[]>("orders/?page_size=500")
    setOrders(Array.isArray(data) ? data : [])
  }, [])

  const loadProducts = useCallback(async () => {
    const data = await apiRequest<Product[]>("products/?page_size=500")
    setProducts(Array.isArray(data) ? data : [])
  }, [])

  const reloadAll = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([loadUsers(), loadReferrals(), loadOrders(), loadProducts()])
    } catch (error) {
      console.error("Failed to load admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [loadUsers, loadReferrals, loadOrders, loadProducts])

  useEffect(() => {
    void reloadAll()
  }, [reloadAll])

  const addUser = useCallback(async (user: User) => {
    const created = await apiRequest<User>("users/", {
      method: "POST",
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        phone: user.phone,
        points: user.points,
        referral_code: user.referral_code,
        password: user.password || "default123",
      }),
    })
    setUsers(prev => [created, ...prev])
  }, [])

  const updateUser = useCallback(async (id: string, data: Partial<User>) => {
    const updated = await apiRequest<User>(`users/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    setUsers(prev => prev.map(u => (u._id === id ? updated : u)))
  }, [])

  const deleteUser = useCallback(async (id: string) => {
    await apiRequest<{ success: boolean }>(`users/${id}/`, { method: "DELETE" })
    setUsers(prev => prev.filter(u => u._id !== id))
  }, [])

  const addReferral = useCallback(async (referral: Referral) => {
    const created = await apiRequest<Referral>("referrals/", {
      method: "POST",
      body: JSON.stringify({
        referrer_id: referral.referrer_id,
        referred_user: referral.referred_user,
        referrer_points: referral.referrer_points,
        referee_points: referral.referee_points,
        status: referral.status,
      }),
    })
    setReferrals(prev => [created, ...prev])
  }, [])

  const updateReferral = useCallback(async (id: string, data: Partial<Referral>) => {
    const updated = await apiRequest<Referral>(`referrals/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    setReferrals(prev => prev.map(r => (r._id === id ? updated : r)))
  }, [])

  const deleteReferral = useCallback(async (id: string) => {
    await apiRequest<{ success: boolean }>(`referrals/${id}/`, { method: "DELETE" })
    setReferrals(prev => prev.filter(r => r._id !== id))
  }, [])

  const addOrder = useCallback(async (order: Order) => {
    const created = await apiRequest<Order>("orders/", {
      method: "POST",
      body: JSON.stringify(order),
    })
    setOrders(prev => [created, ...prev])
  }, [])

  const updateOrder = useCallback(async (id: string, data: Partial<Order>) => {
    const isStatusOnly = Object.keys(data).length === 1 && data.status
    const updated = isStatusOnly
      ? await apiRequest<Order>(`orders/${id}/status/`, {
          method: "PATCH",
          body: JSON.stringify({ status: data.status }),
        })
      : await apiRequest<Order>(`orders/${id}/`, {
          method: "PUT",
          body: JSON.stringify(data),
        })

    setOrders(prev => prev.map(o => (o._id === id ? updated : o)))
  }, [])

  const deleteOrder = useCallback(async (id: string) => {
    await apiRequest<{ success: boolean }>(`orders/${id}/`, { method: "DELETE" })
    setOrders(prev => prev.filter(o => o._id !== id))
  }, [])

  const addProduct = useCallback(async (product: Product) => {
    const created = await apiRequest<Product>("products/", {
      method: "POST",
      body: JSON.stringify({
        ...product,
        id: product.id || `product_${Date.now()}`,
      }),
    })
    setProducts(prev => [created, ...prev])
  }, [])

  const updateProduct = useCallback(async (id: string, data: Partial<Product>) => {
    const updated = await apiRequest<Product>(`products/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    setProducts(prev =>
      prev.map(p => ((p._id && p._id === id) || p.id === id ? updated : p))
    )
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    await apiRequest<{ success: boolean }>(`products/${id}/`, { method: "DELETE" })
    setProducts(prev => prev.filter(p => (p._id ? p._id !== id : p.id !== id)))
  }, [])

  return (
    <DataContext.Provider
      value={{
        users,
        referrals,
        orders,
        products,
        isLoading,
        reloadAll,
        addUser,
        updateUser,
        deleteUser,
        addReferral,
        updateReferral,
        deleteReferral,
        addOrder,
        updateOrder,
        deleteOrder,
        addProduct,
        updateProduct,
        deleteProduct,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
