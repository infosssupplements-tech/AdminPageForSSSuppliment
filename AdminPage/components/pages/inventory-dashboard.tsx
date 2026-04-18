"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useData } from "@/lib/data-store"
import type { Product } from "@/lib/types"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Eye, Star, Package, DollarSign, AlertTriangle, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface InventoryStats {
  total_products: number
  total_value: number
  total_supplements: number
  total_sports: number
  near_expiry_products: any[]
  total_bills: number
}

interface InventoryProduct {
  _id: string
  batch_code?: string
  name: string
  flavor?: string
  distributor: string
  mfg_date?: string
  exp_date?: string
  pcs: number
  price: number
  total: number
  size?: string
}

export function InventoryDashboard() {
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [supplements, setSupplements] = useState<InventoryProduct[]>([])
  const [sports, setSports] = useState<InventoryProduct[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadInventoryData()
  }, [])

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      const [statsRes, productsRes] = await Promise.all([
        fetch('/api/admin/inventory/dashboard/'),
        fetch('/api/admin/inventory/total-products/')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.data)
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setSupplements((productsData.data.supplements || []).filter((p: InventoryProduct) => p.pcs > 0))
        setSports((productsData.data.sports || []).filter((p: InventoryProduct) => p.pcs > 0))
      }
    } catch (error) {
      console.error('Failed to load inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const supplementColumns = [
    {
      key: "batch_code",
      label: "BATCH CODE",
    },
    {
      key: "name",
      label: "NAME",
      render: (product: InventoryProduct) => product.flavor ? `${product.name} (${product.flavor})` : product.name,
    },
    {
      key: "distributor",
      label: "DISTRIBUTOR",
    },
    {
      key: "mfg_date",
      label: "MFG",
    },
    {
      key: "exp_date",
      label: "EXP",
    },
    {
      key: "pcs",
      label: "PCS",
    },
    {
      key: "price",
      label: "PRICE",
      render: (product: InventoryProduct) => `₹${product.price}`,
    },
  ]

  const sportsColumns = [
    {
      key: "name",
      label: "NAME",
    },
    {
      key: "size",
      label: "SIZE",
    },
    {
      key: "distributor",
      label: "DISTRIBUTOR",
    },
    {
      key: "pcs",
      label: "PCS",
    },
    {
      key: "price",
      label: "PRICE",
      render: (product: InventoryProduct) => `₹${product.price}`,
    },
  ]

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-8">Loading inventory data...</div>
      </div>
    )
  }

  // Dynamic calculations for dashboard stats based on active in-stock products
  const calculatedTotalValue = [...supplements, ...sports].reduce((acc, curr) => acc + ((curr.pcs || 0) * (curr.price || 0)), 0);
  
  const fiveMonthsLater = new Date();
  fiveMonthsLater.setMonth(fiveMonthsLater.getMonth() + 5);
  const nearExpiryProducts = supplements.filter(p => {
    if (!p.exp_date) return false;
    return new Date(p.exp_date) <= fiveMonthsLater;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your product inventory</p>
      </div>

      {/* Dashboard Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2"
          onClick={() => {
            // Show total products modal or navigate
            const totalProducts = (supplements.length + sports.length)
            alert(`Total Products Available: ${totalProducts}`)
          }}
        >
          <Package className="h-8 w-8" />
          <span className="text-sm font-medium">TOTAL PRODUCTS</span>
          <span className="text-lg font-bold">{supplements.length + sports.length}</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2"
        >
          <DollarSign className="h-8 w-8" />
          <span className="text-sm font-medium">INVENTRY VALUE</span>
          <span className="text-lg font-bold">₹{calculatedTotalValue.toLocaleString()}</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2"
          onClick={() => router.push('/admin/dashboard/near-expiry')}
        >
          <AlertTriangle className="h-8 w-8" />
          <span className="text-sm font-medium">NEAR EXP PRODUCTS</span>
          <span className="text-lg font-bold">{nearExpiryProducts.length}</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2"
        >
          <FileText className="h-8 w-8" />
          <span className="text-sm font-medium">BILLING HISTORY</span>
          <span className="text-lg font-bold">{stats?.total_bills || 0}</span>
        </Button>
      </div>

      {/* Supplements Products Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">SUPPLEMENTS PRODUCTS</h3>
        <DataTable
          data={supplements}
          columns={supplementColumns}
          searchKey="name"
          searchPlaceholder="Search supplements..."
        />
      </div>

      {/* Sports Products Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">SPORTS PRODUCTS</h3>
        <DataTable
          data={sports}
          columns={sportsColumns}
          searchKey="name"
          searchPlaceholder="Search sports products..."
        />
      </div>
    </div>
  )
}