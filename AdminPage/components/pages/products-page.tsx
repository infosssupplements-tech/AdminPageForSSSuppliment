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
import { Plus, Pencil, Trash2, Eye, Star } from "lucide-react"
import { cn } from "@/lib/utils"

const PRODUCT_CATEGORIES = [
  "Whey Protein",
  "Creatine",
  "Mass Gainer",
  "Multivitamin",
  "Pre Workout",
  "Weight Loss",
  "Recovery",
  "Intra Workout",
  "Peanut Butter & Oats",
  "Ayurvedic Products",
  "Protein Bars & Snacks",
  "Accessories",
  "Minerals & Health",
  "Beauty",
  "Fish Oil",
]

const CATEGORY_WEIGHT_OPTIONS: Record<string, string[]> = {
  "Whey Protein": ["100g", "200g", "300g","400g", "500g", "600g","700g", "800g", "900g", "1KG", "2KG", "3KG","4KG", "5KG", "6KG"],
  "Creatine": ["100g", "200g", "300g","400g", "500g", "600g","700g", "800g", "900g", "1KG", "2KG", "3KG","4KG", "5KG", "6KG"],
  "Mass Gainer": ["100g", "200g", "300g","400g", "500g", "600g","700g", "800g", "900g", "1KG", "2KG", "3KG","4KG", "5KG", "6KG"],
  "Multivitamin": ["30 Tablets", "60 Tablets", "90 Tablets", "120 Tablets"],
  "Pre Workout": ["100g", "200g", "300g","400g", "500g", "600g","700g", "800g", "900g", "1KG", "2KG", "3KG","4KG", "5KG", "6KG"],
  "Weight Loss": ["60 Capsules", "90 Capsules", "120 Capsules", "450ml"],
  "Recovery": ["100g", "200g", "300g","400g", "500g", "600g","700g", "800g", "900g", "1KG", "2KG", "3KG","4KG", "5KG", "6KG"],
  "Intra Workout": ["100g", "200g", "300g","400g", "500g", "600g","700g", "800g", "900g", "1KG", "2KG", "3KG","4KG", "5KG", "6KG"],
  "Peanut Butter & Oats": ["100g", "200g", "300g","400g", "500g", "600g","700g", "800g", "900g", "1KG", "2KG", "3KG","4KG", "5KG", "6KG"],
  "Ayurvedic Products": ["100g", "200g", "300g","400g", "500g", "600g","700g", "800g", "900g", "1KG", "2KG", "3KG","4KG", "5KG", "6KG"],
  "Protein Bars & Snacks": ["10g", "20g", "40g","50g", "60g", "100g", "200g", "300g","400g", "500g", "600g","700g", "800g", "900g", "1KG", "2KG", "3KG","4KG", "5KG", "6KG", "Box of 6", "Box of 12"],
  Accessories: ["Standard", "Small", "Medium", "Large"],
  "Minerals & Health": ["60 Tablets", "90 Tablets", "120 Tablets", "200g"],
  Beauty: ["30 Tablets", "60 Tablets", "100g", "200g"],
  "Fish Oil": ["60 Softgels", "90 Softgels", "100 Softgels", "120 Softgels"],
}

const FALLBACK_WEIGHT_OPTIONS = ["100g", "200g", "300g","400g", "500g", "600g","700g", "800g", "900g", "1KG", "2KG", "3KG","4KG", "5KG", "6KG",]

function normalizeWeightValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(",")
  }

  if (typeof value === "string") {
    return value
  }

  if (value == null) {
    return ""
  }

  return String(value)
}

function parseWeightParts(value: string): { amount: string; unit: "gm" | "kg" } {
  const normalized = value.trim()
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(kg|kgs|g|gm|grams?)?$/i)

  if (!match) {
    return { amount: normalized, unit: "gm" }
  }

  const rawUnit = (match[2] || "gm").toLowerCase()
  const unit: "gm" | "kg" = rawUnit.startsWith("k") ? "kg" : "gm"

  return {
    amount: match[1] || "",
    unit,
  }
}

function buildWeightValue(amount: string, unit: "gm" | "kg"): string {
  const trimmedAmount = amount.trim()
  if (!trimmedAmount) return ""
  return `${trimmedAmount}${unit}`
}

function normalizeWeightToken(value: string): string {
  const parts = parseWeightParts(value)
  return buildWeightValue(parts.amount, parts.unit)
}

function getWeightList(value: string): string[] {
  return value
    .split(",")
    .map((item) => normalizeWeightToken(item))
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
}

function formatWeightLabel(value: string): string {
  const { amount, unit } = parseWeightParts(value)
  if (!amount) return value
  return `${amount} ${unit}`
}

function getInitialFormData(product?: Product | null) {
  return {
    name: product?.name || "",
    brand: product?.brand || "",
    category: product?.category || "",
    flavor: product?.flavor || "",
    weight: normalizeWeightValue(product?.weight),
    weights: normalizeWeightValue(product?.weights),
    price: product?.price || 0,
    originalPrice: product?.originalPrice || 0,
    discount: product?.discount || 0,
    rating: product?.rating || 0,
    reviews: product?.reviews || 0,
    description: product?.description || "",
    keyBenefits: product?.keyBenefits || "",
    nutritionalInfo: product?.nutritionalInfo || "",
    inStock: product?.inStock ?? true,
    pricingKey: product?.pricingKey || "",
    image: product?.image || "",
    image1: product?.image1 || "",
    image2: product?.image2 || "",
    image3: product?.image3 || "",
  }
}

function ProductForm({ product, onSave, onCancel }: { product?: Product | null; onSave: (data: Partial<Product>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState(() => getInitialFormData(product))
  const [weightToAddAmount, setWeightToAddAmount] = useState("")
  const [weightToAddUnit, setWeightToAddUnit] = useState<"gm" | "kg">("gm")

  useEffect(() => {
    setFormData(getInitialFormData(product))
    setWeightToAddAmount("")
    setWeightToAddUnit("gm")
  }, [product])

  const update = (key: string, value: unknown) => setFormData(prev => ({ ...prev, [key]: value }))
  const weightOptions = CATEGORY_WEIGHT_OPTIONS[formData.category] || FALLBACK_WEIGHT_OPTIONS
  const primaryWeightParts = parseWeightParts(formData.weight)
  const selectedWeights = getWeightList(formData.weights)

  const addWeight = () => {
    const nextWeight = buildWeightValue(weightToAddAmount, weightToAddUnit)
    if (!nextWeight) return
    if (selectedWeights.includes(nextWeight)) return
    const next = [...selectedWeights, nextWeight]
    update("weights", next.join(","))
    if (!formData.weight) {
      update("weight", nextWeight)
    }
    setWeightToAddAmount("")
    setWeightToAddUnit("gm")
  }

  const removeWeight = (weight: string) => {
    const next = selectedWeights.filter((w) => w !== weight)
    update("weights", next.join(","))
    if (formData.weight === weight) {
      update("weight", next[0] || "")
    }
  }

  return (
    <form
      className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2"
      onSubmit={e => { e.preventDefault(); onSave(formData) }}
    >
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Product Name</Label>
        <Input value={formData.name} onChange={e => update("name", e.target.value)} className="bg-secondary border-border text-foreground" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Brand</Label>
          <Input value={formData.brand} onChange={e => update("brand", e.target.value)} className="bg-secondary border-border text-foreground" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => {
              update("category", value)
              update("weight", "")
              update("weights", "")
              setWeightToAddAmount("")
              setWeightToAddUnit("gm")
            }}
          >
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Flavor</Label>
          <Input value={formData.flavor} onChange={e => update("flavor", e.target.value)} className="bg-secondary border-border text-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Primary Weight</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              step="0.1"
              value={primaryWeightParts.amount}
              onChange={e => update("weight", buildWeightValue(e.target.value, primaryWeightParts.unit))}
              className="bg-secondary border-border text-foreground"
              placeholder="Amount"
            />
            <Select
              value={primaryWeightParts.unit}
              onValueChange={(value: "gm" | "kg") => update("weight", buildWeightValue(primaryWeightParts.amount, value))}
            >
              <SelectTrigger className="w-28 bg-secondary border-border text-foreground">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gm">gm</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label className="text-foreground">Add Available Weights</Label>
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(140px,1fr)_120px_auto] sm:items-center">
              <Input
                type="number"
                min="0"
                step="0.1"
                value={weightToAddAmount}
                onChange={e => setWeightToAddAmount(e.target.value)}
                className="min-w-0 bg-background border-border text-foreground"
                placeholder="Amount"
              />
              <Select value={weightToAddUnit} onValueChange={(value: "gm" | "kg") => setWeightToAddUnit(value)}>
                <SelectTrigger className="w-full bg-background border-border text-foreground">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gm">gm</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={addWeight} className="w-full sm:w-auto sm:min-w-28">
                Add Weight
              </Button>
            </div>
            {weightOptions.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Examples: {weightOptions.slice(0, 6).map(formatWeightLabel).join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>
      {selectedWeights.length > 0 && (
        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Available Weights
          </p>
          <div className="flex flex-wrap gap-2">
          {selectedWeights.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => removeWeight(w)}
              className="rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground hover:bg-background/80"
              title="Remove weight"
            >
              {formatWeightLabel(w)} x
            </button>
          ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Price (₹)</Label>
          <Input type="number" value={formData.price} onChange={e => update("price", parseFloat(e.target.value) || 0)} className="bg-secondary border-border text-foreground" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Original Price (₹)</Label>
          <Input type="number" value={formData.originalPrice} onChange={e => update("originalPrice", parseFloat(e.target.value) || 0)} className="bg-secondary border-border text-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Discount (%)</Label>
          <Input type="number" value={formData.discount} onChange={e => update("discount", parseFloat(e.target.value) || 0)} className="bg-secondary border-border text-foreground" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Rating</Label>
          <Input type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={e => update("rating", parseFloat(e.target.value) || 0)} className="bg-secondary border-border text-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Reviews Count</Label>
          <Input type="number" value={formData.reviews} onChange={e => update("reviews", parseInt(e.target.value) || 0)} className="bg-secondary border-border text-foreground" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Description</Label>
        <textarea
          value={formData.description}
          onChange={e => update("description", e.target.value)}
          className="min-h-[80px] rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Key Benefits</Label>
        <Input value={formData.keyBenefits} onChange={e => update("keyBenefits", e.target.value)} className="bg-secondary border-border text-foreground" placeholder="Comma separated" />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Nutritional Info</Label>
        <Input value={formData.nutritionalInfo} onChange={e => update("nutritionalInfo", e.target.value)} className="bg-secondary border-border text-foreground" />
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={formData.inStock} onCheckedChange={v => update("inStock", v)} />
        <Label className="text-foreground">In Stock</Label>
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Pricing Key</Label>
        <Input value={formData.pricingKey} onChange={e => update("pricingKey", e.target.value)} className="bg-secondary border-border text-foreground" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Image URL</Label>
          <Input value={formData.image} onChange={e => update("image", e.target.value)} className="bg-secondary border-border text-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Image 1 URL</Label>
          <Input value={formData.image1} onChange={e => update("image1", e.target.value)} className="bg-secondary border-border text-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Image 2 URL</Label>
          <Input value={formData.image2} onChange={e => update("image2", e.target.value)} className="bg-secondary border-border text-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Image 3 URL</Label>
          <Input value={formData.image3} onChange={e => update("image3", e.target.value)} className="bg-secondary border-border text-foreground" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="border-border">Cancel</Button>
        <Button type="submit" className="bg-primary text-primary-foreground">{product ? "Update" : "Add"} Product</Button>
      </div>
    </form>
  )
}

function ProductDetail({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="h-20 w-20 rounded-lg object-cover bg-secondary" />
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-foreground">{product.name}</h3>
          <p className="text-sm text-muted-foreground">{product.brand} - {product.category}</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <span className="text-sm font-medium text-foreground">{product.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">({product.reviews} reviews)</span>
          </div>
        </div>
      </div>
      {[
        { label: "ID", value: product.id },
        { label: "Flavor", value: product.flavor },
        { label: "Weight", value: product.weight },
        { label: "Available Weights", value: product.weights },
        { label: "Price", value: `₹${product.price}` },
        { label: "Original Price", value: `₹${product.originalPrice}` },
        { label: "Discount", value: `${product.discount}%` },
        { label: "In Stock", value: product.inStock ? "Yes" : "No" },
        { label: "Pricing Key", value: product.pricingKey },
        { label: "Description", value: product.description },
        { label: "Key Benefits", value: product.keyBenefits },
        { label: "Nutritional Info", value: product.nutritionalInfo },
      ].map(item => (
        <div key={item.label} className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
          <span className="text-sm text-foreground">{item.value}</span>
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={onClose} className="border-border">Close</Button>
      </div>
    </div>
  )
}

export function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSave = (data: Partial<Product>) => {
    if (selectedProduct) {
      void updateProduct(selectedProduct._id || selectedProduct.id, data).catch(console.error)
    } else {
      const newProduct: Product = {
        id: Math.random().toString(36).substring(2, 8),
        name: data.name || "",
        brand: data.brand || "",
        category: data.category || "",
        flavor: data.flavor || "",
        weight: data.weight || "",
        weights: data.weights || "",
        price: data.price || 0,
        originalPrice: data.originalPrice || 0,
        discount: data.discount || 0,
        rating: data.rating || 0,
        reviews: data.reviews || 0,
        description: data.description || "",
        keyBenefits: data.keyBenefits || "",
        nutritionalInfo: data.nutritionalInfo || "",
        inStock: data.inStock ?? true,
        pricingKey: data.pricingKey || "",
        image: data.image || "",
        image1: data.image1 || "",
        image2: data.image2 || "",
        image3: data.image3 || "",
      }
      void addProduct(newProduct).catch(console.error)
    }
    setDialogOpen(false)
    setSelectedProduct(null)
  }

  const columns = [
    {
      key: "name",
      label: "Product",
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover bg-secondary" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground line-clamp-1">{product.name}</span>
            <span className="text-xs text-muted-foreground">{product.brand}</span>
          </div>
        </div>
      ),
    },
    { key: "category", label: "Category", className: "hidden md:table-cell" },
    {
      key: "price",
      label: "Price",
      render: (product: Product) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">₹{product.price.toLocaleString()}</span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
          )}
        </div>
      ),
    },
    {
      key: "discount",
      label: "Discount",
      className: "hidden lg:table-cell",
      render: (product: Product) => product.discount > 0 ? (
        <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {product.discount}% OFF
        </span>
      ) : <span className="text-muted-foreground">-</span>,
    },
    {
      key: "rating",
      label: "Rating",
      className: "hidden lg:table-cell",
      render: (product: Product) => (
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="text-sm">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>
      ),
    },
    {
      key: "inStock",
      label: "Stock",
      render: (product: Product) => (
        <span className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-medium",
          product.inStock ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
        )}>
          {product.inStock ? "In Stock" : "Out of Stock"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (product: Product) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setDetailProduct(product); setDetailOpen(true) }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setDialogOpen(true) }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); setDeleteId(product._id || product.id); setDeleteOpen(true) }}>
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
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} total products</p>
        </div>
        <Button onClick={() => { setSelectedProduct(null); setDialogOpen(true) }} className="bg-primary text-primary-foreground gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <DataTable
        data={products}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search products..."
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setSelectedProduct(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <ProductForm product={selectedProduct} onSave={handleSave} onCancel={() => { setDialogOpen(false); setSelectedProduct(null) }} />
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {detailProduct && <ProductDetail product={detailProduct} onClose={() => setDetailOpen(false)} />}
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
              onClick={() => { if (deleteId) void deleteProduct(deleteId).catch(console.error); setDeleteOpen(false) }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
