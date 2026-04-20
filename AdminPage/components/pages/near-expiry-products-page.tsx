"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { format } from "date-fns"

interface SupplementProduct {
  _id: string
  batch_code: string
  name: string
  flavor?: string
  distributor: string
  mfg_date: string
  exp_date: string
  pcs: number
  price: number
  total: number
}

export function NearExpiryProductsPage() {
  const [products, setProducts] = useState<SupplementProduct[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/inventory/near-expiry/')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load near expiry products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fiveMonthsLater = new Date()
  fiveMonthsLater.setMonth(fiveMonthsLater.getMonth() + 5)

  const isProductNearExpiry = (product: SupplementProduct) => {
    if (!product.exp_date) return false
    return new Date(product.exp_date) <= fiveMonthsLater
  }

  const columns = [
    {
      key: "batch_code",
      label: "BATCH CODE",
    },
    {
      key: "name",
      label: "NAME",
      render: (product: SupplementProduct) => product.flavor ? `${product.name} (${product.flavor})` : product.name,
    },
    {
      key: "distributor",
      label: "DISTRIBUTOR",
    },
    {
      key: "mfg_date",
      label: "MFG",
      render: (product: SupplementProduct) => product.mfg_date ? format(new Date(product.mfg_date), "dd/MM/yyyy") : "-",
    },
    {
      key: "exp_date",
      label: "EXP",
      render: (product: SupplementProduct) => product.exp_date ? format(new Date(product.exp_date), "dd/MM/yyyy") : "-",
    },
    {
      key: "pcs",
      label: "PCS",
    },
    {
      key: "price",
      label: "PRICE",
      render: (product: SupplementProduct) => `₹${product.price}`,
    },
    {
      key: "total",
      label: "TOTAL",
      render: (product: SupplementProduct) => `₹${(product.pcs * product.price).toLocaleString()}`,
    },
  ].map((col) => ({
    ...col,
    render: (product: SupplementProduct) => {
      const isNearExpiry = isProductNearExpiry(product)
      const value = col.render ? col.render(product) : product[col.key as keyof SupplementProduct]
      return <span className={isNearExpiry ? "text-destructive font-semibold" : ""}>{value}</span>
    },
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Near Expiry Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All products sorted by expiry date. Products expiring within 5 months are highlighted.
          </p>
        </div>
        <Button onClick={() => window.dispatchEvent(new CustomEvent('navigatePage', { detail: 'inventory-dashboard' }))} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <DataTable data={products} columns={columns} loading={loading} searchKey="name" searchPlaceholder="Search products..." />
      </div>
    </div>
  )
}