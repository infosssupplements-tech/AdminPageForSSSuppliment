"use client"

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
import { Plus, Pencil, Trash2, Eye, Star, Package } from "lucide-react"
import { cn } from "@/lib/utils"

interface SportsProduct {
  _id: string
  name: string
  size: string
  distributor: string
  pcs: number
  price: number
  total: number
}

export function SportsProductsPage() {
  const [products, setProducts] = useState<SportsProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SportsProduct | null>(null)
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/inventory/sports/')
      if (response.ok) {
        const data = await response.json()
        const activeProducts = (data.data || []).filter((p: SportsProduct) => p.pcs > 0)
        setProducts(activeProducts)
        setTotalValue(activeProducts.reduce((acc: number, curr: SportsProduct) => acc + (curr.pcs * curr.price), 0))
      }
    } catch (error) {
      console.error('Failed to load sports products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData: any) => {
    try {
      const method = selectedProduct ? 'PUT' : 'POST'
      const url = selectedProduct
        ? `/api/admin/inventory/sports/${selectedProduct._id}/`
        : '/api/admin/inventory/sports/'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadProducts()
        setDialogOpen(false)
        setSelectedProduct(null)
      }
    } catch (error) {
      console.error('Failed to save product:', error)
    }
  }

  const handleDelete = async (product: SportsProduct) => {
    try {
      const response = await fetch(`/api/admin/inventory/sports/${product._id}/`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await loadProducts()
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const columns = [
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
      render: (product: SportsProduct) => `₹${product.price}`,
    },
    {
      key: "total",
      label: "TOTAL",
      render: (product: SportsProduct) => `₹${product.pcs * product.price}`,
    },
    {
      key: "actions",
      label: "Actions",
      render: (product: SportsProduct) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedProduct(product)
              setDialogOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Are you sure you want to delete this product?')) {
                handleDelete(product)
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sports Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage sports equipment inventory</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-xl font-bold text-foreground">₹{totalValue.toLocaleString()}</p>
          </div>
          <Button onClick={() => {
            setSelectedProduct(null)
            setDialogOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <DataTable
          data={products}
          columns={columns}
          loading={loading}
          searchKeys={["name", "distributor", "size"]}
          searchPlaceholder="Search by name, distributor, size..."
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="max-w-2xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Edit Sports Product' : 'Add Sports Product'}
            </DialogTitle>
          </DialogHeader>
          <SportsForm
            product={selectedProduct}
            onSave={handleSave}
            onCancel={() => {
              setDialogOpen(false)
              setSelectedProduct(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SportsForm({ product, onSave, onCancel }: {
  product?: SportsProduct | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    size: product?.size || '',
    distributor: product?.distributor || '',
    pcs: product?.pcs || 0,
    price: product?.price || 0,
  })

  const update = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const total = formData.pcs * formData.price
    onSave({ ...formData, total })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Product Name</Label>
          <Input
            value={formData.name}
            onChange={e => update('name', e.target.value)}
            className="bg-secondary border-border text-foreground"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Size</Label>
          <Input
            value={formData.size}
            onChange={e => update('size', e.target.value)}
            className="bg-secondary border-border text-foreground"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Distributor</Label>
        <Input
          value={formData.distributor}
          onChange={e => update('distributor', e.target.value)}
          className="bg-secondary border-border text-foreground"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">PCS</Label>
          <Input
            type="number"
            min="0"
            value={formData.pcs}
            onChange={e => update('pcs', parseInt(e.target.value) || 0)}
            className="bg-secondary border-border text-foreground"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Price</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={e => update('price', parseFloat(e.target.value) || 0)}
            className="bg-secondary border-border text-foreground"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Total</Label>
          <Input
            type="number"
            value={(formData.pcs * formData.price).toFixed(2)}
            className="bg-secondary border-border text-foreground"
            readOnly
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {product ? 'Update' : 'Add'} Product
        </Button>
      </div>
    </form>
  )
}