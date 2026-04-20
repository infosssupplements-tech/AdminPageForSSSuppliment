"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { ArrowLeft, Pencil, Trash2, Download } from "lucide-react"
import { exportOutOfStockToExcel } from "@/lib/export-excel"

interface OutOfStockProduct {
  _id: string
  type: 'Supplement' | 'Sports'
  batch_code?: string
  name: string
  flavor?: string
  size?: string
  distributor: string
  pcs: number
  price: number
}

export function OutOfStockProductsPage() {
  const [products, setProducts] = useState<OutOfStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<OutOfStockProduct | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<OutOfStockProduct | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/inventory/total-products/')
      if (response.ok) {
        const data = await response.json()
        const allSupplements = data.data.supplements || []
        const allSports = data.data.sports || []

        const oos = [
          ...allSupplements.filter((p: any) => p.pcs <= 0).map((p: any) => ({ ...p, type: 'Supplement' })),
          ...allSports.filter((p: any) => p.pcs <= 0).map((p: any) => ({ ...p, type: 'Sports' }))
        ]
        setProducts(oos)
      }
    } catch (error) {
      console.error('Failed to load out of stock products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData: any) => {
    if (!selectedProduct) return
    
    try {
      const endpoint = selectedProduct.type === 'Supplement' 
        ? `/api/admin/inventory/supplements/${selectedProduct._id}/`
        : `/api/admin/inventory/sports/${selectedProduct._id}/`

      const { type, ...originalData } = selectedProduct as any

      const payload = {
        ...originalData,
        pcs: formData.pcs,
        price: formData.price,
        total: formData.pcs * formData.price,
      }

      if (selectedProduct.type === 'Supplement') {
        payload.batch_code = formData.batch_code
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const handleDelete = async () => {
    if (!productToDelete) return
    
    try {
      const endpoint = productToDelete.type === 'Supplement' 
        ? `/api/admin/inventory/supplements/${productToDelete._id}/`
        : `/api/admin/inventory/sports/${productToDelete._id}/`

      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadProducts()
        setDeleteOpen(false)
        setProductToDelete(null)
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const columns = [
    {
      key: "type",
      label: "TYPE",
      render: (product: OutOfStockProduct) => (
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
          {product.type}
        </span>
      )
    },
    {
      key: "batch_code",
      label: "BATCH CODE",
      render: (product: OutOfStockProduct) => product.batch_code || "-",
    },
    {
      key: "name",
      label: "NAME",
      render: (product: OutOfStockProduct) => {
        const extra = product.flavor ? product.flavor : product.size
        return extra ? `${product.name} (${extra})` : product.name
      },
    },
    {
      key: "distributor",
      label: "DISTRIBUTOR",
    },
    {
      key: "pcs",
      label: "STOCK",
      render: (product: OutOfStockProduct) => (
        <span className="text-destructive font-bold">{product.pcs}</span>
      )
    },
    {
      key: "price",
      label: "PRICE",
      render: (product: OutOfStockProduct) => `₹${product.price}`,
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (product: OutOfStockProduct) => (
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
              setProductToDelete(product)
              setDeleteOpen(true)
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
          <h1 className="text-2xl font-bold text-foreground">Out of Stock Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and update stock for depleted products
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportOutOfStockToExcel(products)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => window.dispatchEvent(new CustomEvent('navigatePage', { detail: 'inventory-dashboard' }))} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <DataTable 
          data={products} 
          columns={columns} 
          loading={loading} 
          searchKeys={["name", "batch_code", "distributor", "flavor", "size"]} 
          searchPlaceholder="Search by name, batch code, distributor..." 
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Update Stock & Price</DialogTitle>
          </DialogHeader>
          <EditStockForm
            product={selectedProduct}
            onSave={handleSave}
            onCancel={() => {
              setDialogOpen(false)
              setSelectedProduct(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EditStockForm({ product, onSave, onCancel }: {
  product: OutOfStockProduct | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    batch_code: product?.batch_code || '',
    pcs: product?.pcs || 0,
    price: product?.price || 0,
  })

  useEffect(() => {
    if (product) {
      setFormData({
        batch_code: product.batch_code || '',
        pcs: product.pcs || 0,
        price: product.price || 0,
      })
    }
  }, [product])

  const update = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!product) return null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 mb-2">
        <span className="font-semibold text-foreground">{product.name}</span>
        <span className="text-sm text-muted-foreground">Distributor: {product.distributor}</span>
      </div>

      {product.type === 'Supplement' && (
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Batch Code</Label>
          <Input
            value={formData.batch_code}
            onChange={e => update('batch_code', e.target.value)}
            className="bg-secondary border-border text-foreground"
            required
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Stock (PCS)</Label>
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
        <Label className="text-foreground">Price (₹)</Label>
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

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Update Product
        </Button>
      </div>
    </form>
  )
}