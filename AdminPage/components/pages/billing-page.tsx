"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Minus, Trash2, Receipt, Download, Printer, History, X } from "lucide-react"

interface AllProduct {
  _id: string
  name: string
  price: number
  pcs: number
  type: 'supplement' | 'sports'
  batch_code?: string
  size?: string
  distributor?: string
}

interface BillItem {
  product_id: string
  product_type: 'supplement' | 'sports'
  name: string
  quantity: number
  price: number
  total: number
}

interface Bill {
  _id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  items: BillItem[]
  total_amount: number
  created_at: string
}

export function BillingPage() {
  const [allProducts, setAllProducts] = useState<AllProduct[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
  })
  const [showBillingHistory, setShowBillingHistory] = useState(false)
  const [generatedBill, setGeneratedBill] = useState<Bill | null>(null)
  const [errors, setErrors] = useState<{name?: string, phone?: string, general?: string}>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [supplementsRes, sportsRes, billsRes] = await Promise.all([
        fetch('/api/admin/inventory/supplements/'),
        fetch('/api/admin/inventory/sports/'),
        fetch('/api/admin/inventory/bills/'),
      ])

      const combinedProducts: AllProduct[] = []

      if (supplementsRes.ok) {
        const data = await supplementsRes.json()
        const supplements = (data.data || []).map((p: any) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          pcs: p.pcs,
          type: 'supplement' as const,
          batch_code: p.batch_code,
          distributor: p.distributor,
        }))
        combinedProducts.push(...supplements)
      }
      
      if (sportsRes.ok) {
        const data = await sportsRes.json()
        const sports = (data.data || []).map((p: any) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          pcs: p.pcs,
          type: 'sports' as const,
          size: p.size,
          distributor: p.distributor,
        }))
        combinedProducts.push(...sports)
      }

      setAllProducts(combinedProducts)

      if (billsRes.ok) {
        const data = await billsRes.json()
        setBills(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addProductToBill = (product: AllProduct) => {
    const existingItem = billItems.find(item =>
      item.product_id === product._id && item.product_type === product.type
    )

    if (existingItem) {
      if (existingItem.quantity >= product.pcs) {
        alert('Cannot add more than available stock')
        return
      }
      setBillItems(prev => prev.map(item =>
        item.product_id === product._id && item.product_type === product.type
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ))
    } else {
      const newItem: BillItem = {
        product_id: product._id,
        product_type: product.type,
        name: product.name,
        quantity: 1,
        price: product.price,
        total: product.price,
      }
      setBillItems(prev => [...prev, newItem])
    }
    // Clear general error if items are added
    if (errors.general) setErrors(prev => ({ ...prev, general: undefined }))
  }

  const updateQuantity = (productId: string, productType: 'supplement' | 'sports', quantity: number) => {
    if (quantity <= 0) {
      setBillItems(prev => prev.filter(item =>
        !(item.product_id === productId && item.product_type === productType)
      ))
      return
    }

    const product = allProducts.find(p => p._id === productId && p.type === productType)
    if (product && quantity > product.pcs) {
      alert('Cannot exceed available stock')
      return
    }

    setBillItems(prev => prev.map(item =>
      item.product_id === productId && item.product_type === productType
        ? { ...item, quantity, total: quantity * item.price }
        : item
    ))
  }

  const removeItem = (productId: string, productType: 'supplement' | 'sports') => {
    setBillItems(prev => prev.filter(item =>
      !(item.product_id === productId && item.product_type === productType)
    ))
  }

  const calculateTotal = () => {
    return billItems.reduce((sum, item) => sum + item.total, 0)
  }

  const handleGenerateBill = async () => {
    // Form Validation
    const newErrors: {name?: string, phone?: string, general?: string} = {}
    let isValid = true

    if (!customerInfo.name.trim()) {
      newErrors.name = 'Customer name is required'
      isValid = false
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required'
      isValid = false
    } else if (customerInfo.phone.trim().length < 10) {
      newErrors.phone = 'Please enter a valid phone number'
      isValid = false
    }

    if (billItems.length === 0) {
      newErrors.general = 'Please add at least one product to the bill'
      isValid = false
    }

    if (!isValid) {
      setErrors(newErrors)
      return
    }

    try {
      const response = await fetch('/api/admin/inventory/bills/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          items: billItems,
          total_amount: calculateTotal(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedBill(data.data)
        await loadData()
        alert('Bill generated successfully!')
      } else {
        alert('Failed to generate bill')
      }
    } catch (error) {
      console.error('Failed to generate bill:', error)
      setErrors({ general: 'Failed to generate the bill. Please try again.' })
    }
  }

  const handleDownloadPDF = () => {
    if (!generatedBill) return
    const billContent = formatBillForPDF(generatedBill)
    const element = document.createElement('div')
    element.innerHTML = billContent
    const printWindow = window.open('', '', 'height=600,width=800')
    if (printWindow) {
      printWindow.document.write(billContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handlePrintBill = () => {
    if (!generatedBill) return
    const billContent = formatBillForPDF(generatedBill)
    const printWindow = window.open('', '', 'height=600,width=800')
    if (printWindow) {
      printWindow.document.write(billContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const formatBillForPDF = (bill: Bill) => {
    const itemsHTML = bill.items.map(item => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${item.price}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${item.total}</td>
      </tr>
    `).join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; }
          .company { font-size: 18px; margin-top: 10px; }
          .bill-info { margin-bottom: 20px; }
          .bill-info div { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f0f0f0; padding: 10px; border: 1px solid #ddd; text-align: left; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .total-row { font-weight: bold; background-color: #e0e0e0; }
          .footer { margin-top: 30px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">BILL</div>
          <div class="company">SS Supplement</div>
        </div>
        
        <div class="bill-info">
          <div><strong>Bill ID:</strong> ${bill._id.substring(0, 8)}</div>
          <div><strong>Date:</strong> ${new Date(bill.created_at).toLocaleDateString()}</div>
          <div><strong>Customer:</strong> ${bill.customer_name}</div>
          <div><strong>Phone:</strong> ${bill.customer_phone}</div>
          <div><strong>Address:</strong> ${bill.customer_address}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding: 10px;">TOTAL:</td>
              <td style="text-align: right; padding: 10px;">₹${bill.total_amount}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Powered by SS Supplement Admin</p>
        </div>
      </body>
      </html>
    `
  }

  const filteredProducts = allProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.distributor?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing System</h1>
          <p className="text-sm text-muted-foreground mt-1">Create bills and manage inventory sales</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowBillingHistory(!showBillingHistory)}
            variant="outline"
          >
            <History className="h-4 w-4 mr-2" />
            Billing History
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {showBillingHistory ? (
        // Billing History View
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">All Bills</h2>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map(bill => (
                    <TableRow key={bill._id}>
                      <TableCell className="font-mono text-sm">{bill._id.substring(0, 8)}</TableCell>
                      <TableCell className="font-medium">{bill.customer_name}</TableCell>
                      <TableCell>{bill.customer_phone}</TableCell>
                      <TableCell>{new Date(bill.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-semibold">₹{bill.total_amount.toLocaleString()}</TableCell>
                      <TableCell>{bill.items.length}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setGeneratedBill(bill)
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        // Bill Creation View
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Left Side - Products and Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Customer Name *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={e => {
                      setCustomerInfo(prev => ({ ...prev, name: e.target.value }))
                      if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
                    }}
                    placeholder="Enter customer name"
                    className={`mt-2 ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={e => {
                      setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }))
                    }}
                    placeholder="Enter phone number"
                    className={`mt-2 ${errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={customerInfo.address}
                    onChange={e => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Select Products</h2>
              <div className="mb-4">
                <Input
                  placeholder="Search products by name or distributor..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No products found</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {filteredProducts.map((product) => (
                      <div
                        key={`${product.type}-${product._id}`}
                        className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{product.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {product.type === 'supplement' ? (
                              <>
                                {product.batch_code && `Batch: ${product.batch_code}`}
                                {product.batch_code && ' • '}
                                Distributor: {product.distributor}
                              </>
                            ) : (
                              <>
                                Size: {product.size} • Distributor: {product.distributor}
                              </>
                            )}
                          </div>
                          <div className="flex gap-4 mt-2">
                            <span className="text-lg font-bold text-primary">₹{product.price}</span>
                            <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded">
                              Stock: {product.pcs} pcs
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => addProductToBill(product)}
                          disabled={product.pcs === 0}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Bill Preview */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Bill Preview</h2>
                {generatedBill && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setGeneratedBill(null)
                      setBillItems([])
                      setCustomerInfo({ name: '', phone: '', address: '' })
                      setSearchTerm('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {generatedBill ? (
                // Display Generated Bill
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-green-700 font-semibold">✓ Bill Generated</p>
                    <p className="text-sm text-green-600">ID: {generatedBill._id.substring(0, 8)}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{generatedBill.customer_name}</span></div>
                    <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{generatedBill.customer_phone}</span></div>
                    <div><span className="text-muted-foreground">Items:</span> <span className="font-medium">{generatedBill.items.length}</span></div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>₹{generatedBill.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">₹{generatedBill.total_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <Button className="w-full" onClick={handlePrintBill}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Bill
                    </Button>
                    <Button className="w-full" variant="outline" onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              ) : (
                // Bill Items Preview
                <div className="space-y-4">
                  <div className="border rounded-lg max-h-64 overflow-y-auto min-h-[200px]">
                    {billItems.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p className="text-sm">No items added</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Product</TableHead>
                            <TableHead className="text-xs w-12">Qty</TableHead>
                            <TableHead className="text-xs w-16 text-right">Price</TableHead>
                            <TableHead className="text-xs w-8"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {billItems.map((item) => (
                            <TableRow key={`${item.product_type}-${item.product_id}`}>
                              <TableCell className="text-xs font-medium py-2">{item.name}</TableCell>
                              <TableCell className="text-xs py-2">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => updateQuantity(item.product_id, item.product_type, item.quantity - 1)}
                                  >
                                    <Minus className="h-2 w-2" />
                                  </Button>
                                  <span className="w-4 text-center text-xs">{item.quantity}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => updateQuantity(item.product_id, item.product_type, item.quantity + 1)}
                                  >
                                    <Plus className="h-2 w-2" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs py-2 text-right">₹{item.total}</TableCell>
                              <TableCell className="py-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-destructive"
                                  onClick={() => removeItem(item.product_id, item.product_type)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Items:</span>
                      <span className="font-medium">{billItems.length}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-primary">
                      <span>Grand Total:</span>
                      <span>₹{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  {errors.general && <p className="text-sm text-destructive text-center">{errors.general}</p>}
                  <Button
                    onClick={handleGenerateBill}
                    className="w-full text-white"
                    disabled={billItems.length === 0 || !customerInfo.name || !customerInfo.phone}
                    size="lg"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Generate Bill
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}