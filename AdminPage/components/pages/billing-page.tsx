"use client"

import React, { useEffect, useState } from "react"
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
import { Plus, Minus, Trash2, Receipt, Download, Printer, History, X, Eye } from "lucide-react"

interface AllProduct {
  _id: string
  name: string
  price: number
  pcs: number
  type: 'supplement' | 'sports'
  batch_code?: string
  size?: string
  distributor?: string
  flavor?: string
  weight?: number
  unit?: string
}

interface BillItem {
  product_id: string
  product_type: 'supplement' | 'sports'
  name: string
  quantity: number
  price: number
  discount_percent: number
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
  const [historySearchTerm, setHistorySearchTerm] = useState('')
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
          flavor: p.flavor,
          weight: p.weight || 0,
          unit: p.unit || 'pcs',
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
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price * (1 - (item.discount_percent || 0) / 100) }
          : item
      ))
    } else {
      const newItem: BillItem = {
        product_id: product._id,
        product_type: product.type,
        name: product.flavor ? `${product.name} (${product.flavor})` : product.name,
        quantity: 1,
        price: product.price,
        discount_percent: 0,
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
        ? { ...item, quantity, total: quantity * item.price * (1 - (item.discount_percent || 0) / 100) }
        : item
    ))
  }

  const updateDiscount = (productId: string, productType: 'supplement' | 'sports', discount_percent: number) => {
    if (discount_percent < 0) discount_percent = 0;
    if (discount_percent > 100) discount_percent = 100;
    
    setBillItems(prev => prev.map(item =>
      item.product_id === productId && item.product_type === productType
        ? { ...item, discount_percent, total: item.quantity * item.price * (1 - discount_percent / 100) }
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

  const handleViewInvoice = () => {
    if (!generatedBill) return
    const billContent = formatBillForPDF(generatedBill)
    const viewWindow = window.open('', '_blank')
    if (viewWindow) {
      viewWindow.document.write(billContent)
      viewWindow.document.close()
    }
  }

  const formatBillForPDF = (bill: Bill) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - SS Supplements</title>
        <style>
          @page { margin: 0; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 40px; color: #333; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header-left { display: flex; flex-direction: column; }
          .header-right { text-align: right; }
          .logo { max-height: 60px; margin-bottom: 10px; object-fit: contain; }
          .title { font-size: 36px; font-weight: bold; color: #111; margin: 0; letter-spacing: 2px; }
          .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
          .invoice-details { text-align: right; }
          .invoice-details h2 { margin: 0; font-size: 24px; color: #333; }
          .invoice-details p { margin: 5px 0 0 0; font-size: 14px; color: #555; }
          
          .customer-info { margin-bottom: 40px; display: flex; justify-content: space-between; }
          .customer-info div { width: 48%; }
          .info-title { font-size: 12px; font-weight: bold; color: #888; text-transform: uppercase; margin-bottom: 5px; }
          .info-content { font-size: 15px; line-height: 1.5; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #f8f9fa; padding: 12px 15px; border-bottom: 2px solid #ddd; text-align: left; font-weight: bold; color: #333; font-size: 14px; text-transform: uppercase; }
          td { padding: 12px 15px; border-bottom: 1px solid #eee; font-size: 14px; }
          tr:last-child td { border-bottom: none; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          
          .totals-box { width: 100%; display: flex; justify-content: flex-end; }
          .totals-table { width: 300px; border-collapse: collapse; }
          .totals-table td { padding: 10px 15px; border-bottom: 1px solid #eee; }
          .totals-table tr:last-child td { border-bottom: 2px solid #333; font-weight: bold; font-size: 18px; color: #111; }
          
          .footer { margin-top: 50px; text-align: center; color: #777; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          .footer p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div class="header-left">
              <div style="display: flex; align-items: center; gap: 15px;">
                <img src="${baseUrl}/logo.png" alt="SS Supplements" class="logo" onerror="this.style.display='none'" />
                <h1 class="title">SS SUPPLEMENTS</h1>
              </div>
              <div class="subtitle">Premium Quality Supplements & Sports Nutrition</div>
            </div>
            <div class="invoice-details">
              <h2>INVOICE</h2>
              <p><strong>Bill No:</strong> #${bill._id.substring(0, 8).toUpperCase()}</p>
              <p><strong>Date:</strong> ${new Date(bill.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          
          <div class="customer-info">
            <div>
              <div class="info-title">Billed To</div>
              <div class="info-content">
                <strong>${bill.customer_name}</strong><br>
                Phone: ${bill.customer_phone}<br>
                ${bill.customer_address ? `Address: ${bill.customer_address}` : ''}
              </div>
            </div>
            <div style="text-align: right;">
              <div class="info-title">Authorized By</div>
              <div class="info-content">
                <strong>SS Supplements</strong><br>
                Store Admin
              </div>
            </div>
          </div>

        <table>
          <thead>
            <tr>
              <th width="5%">#</th>
              <th width="40%">Product Description</th>
              <th width="10%" class="text-center">Qty</th>
              <th width="15%" class="text-right">Unit Price</th>
              <th width="10%" class="text-right">Disc %</th>
              <th width="20%" class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>
                  <strong>${item.name}</strong><br>
                  <span style="font-size: 12px; color: #777; text-transform: capitalize;">${item.product_type}</span>
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">₹${item.price.toFixed(2)}</td>
                <td class="text-right">${item.discount_percent ? item.discount_percent + '%' : '-'}</td>
                <td class="text-right">₹${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

          <div class="totals-box">
            <table class="totals-table">
              <tr>
                <td>Subtotal</td>
                <td class="text-right">₹${bill.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</td>
              </tr>
              ${bill.items.some(i => (i.discount_percent || 0) > 0) ? `
              <tr>
                <td>Total Discount</td>
                <td class="text-right">-₹${bill.items.reduce((sum, item) => sum + (item.price * item.quantity - item.total), 0).toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr>
                <td>Tax (0%)</td>
                <td class="text-right">₹0.00</td>
              </tr>
              <tr>
                <td>Grand Total</td>
                <td class="text-right">₹${bill.total_amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p><strong>Thank you for choosing SS Supplements!</strong></p>
            <p>For any queries regarding this invoice, please contact our support.</p>
            <p>&copy; ${new Date().getFullYear()} SS Supplements. All Rights Reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  const filteredProducts = allProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.distributor?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getGroupedBills = () => {
    const groups: { label: string, date: number, bills: Bill[] }[] = []
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const searchLower = historySearchTerm.toLowerCase()

    const filtered = bills.filter(bill => {
      if (!searchLower) return true
      const billDate = new Date(bill.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase()
      const numericDate = new Date(bill.created_at).toLocaleDateString('en-IN').toLowerCase()
      
      return (
        bill._id.toLowerCase().includes(searchLower) ||
        bill.customer_name.toLowerCase().includes(searchLower) ||
        bill.customer_phone.toLowerCase().includes(searchLower) ||
        billDate.includes(searchLower) ||
        numericDate.includes(searchLower) ||
        bill.items.some(item => item.name.toLowerCase().includes(searchLower))
      )
    })

    filtered.forEach(bill => {
      const billDate = new Date(bill.created_at)
      billDate.setHours(0, 0, 0, 0)

      let label = ''
      if (billDate.getTime() === today.getTime()) {
        label = 'Today'
      } else if (billDate.getTime() === yesterday.getTime()) {
        label = 'Yesterday'
      } else {
        label = billDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      }

      const existingGroup = groups.find(g => g.label === label)
      if (existingGroup) {
        existingGroup.bills.push(bill)
      } else {
        groups.push({ label, date: billDate.getTime(), bills: [bill] })
      }
    })

    return groups.sort((a, b) => b.date - a.date)
  }

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-semibold text-foreground">All Bills</h2>
            <div className="w-full sm:w-96">
              <Input
                placeholder="Search by ID, Customer, Product, or Date..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
              />
            </div>
          </div>
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
                {getGroupedBills().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  getGroupedBills().map(group => (
                    <React.Fragment key={group.label}>
                      <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                        <TableCell colSpan={7} className="font-semibold text-foreground py-2 px-4">
                          {group.label}
                        </TableCell>
                      </TableRow>
                      {group.bills.map(bill => (
                        <TableRow key={bill._id}>
                          <TableCell className="font-mono text-sm">{bill._id.substring(0, 8).toUpperCase()}</TableCell>
                      <TableCell className="font-medium">{bill.customer_name}</TableCell>
                      <TableCell>{bill.customer_phone}</TableCell>
                          <TableCell>{new Date(bill.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell className="font-semibold">₹{bill.total_amount.toLocaleString()}</TableCell>
                      <TableCell>{bill.items.length}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setGeneratedBill(bill)
                            setShowBillingHistory(false)
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                      ))}
                    </React.Fragment>
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
                              {product.flavor && ` • Flavor: ${product.flavor}`}
                              {product.weight && product.weight > 0 ? ` • Weight: ${product.weight}${product.unit || ''}` : ''}
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
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                      <Receipt className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">SS SUPPLEMENTS</h3>
                    <p className="text-sm text-muted-foreground mb-4">Invoice Generated Successfully</p>
                    <div className="bg-background px-4 py-2 rounded-lg border shadow-sm w-full text-center">
                      <span className="text-xs text-muted-foreground block mb-1">Invoice Number</span>
                      <span className="font-mono font-bold text-lg">#{generatedBill._id.substring(0, 8).toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm bg-card border rounded-xl p-4">
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">{new Date(generatedBill.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-muted-foreground">Customer Name</span>
                      <span className="font-medium">{generatedBill.customer_name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-muted-foreground">Phone Number</span>
                      <span className="font-medium">{generatedBill.customer_phone}</span>
                    </div>
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-muted-foreground">Total Items</span>
                      <span className="font-medium">{generatedBill.items.length} items</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-muted-foreground font-medium">Grand Total</span>
                      <span className="text-xl font-bold text-primary">₹{generatedBill.total_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Button variant="outline" className="w-full bg-secondary/50 hover:bg-secondary px-2 text-xs" onClick={handleViewInvoice}>
                      <Eye className="h-4 w-4 mr-1" />
                      View PDF
                    </Button>
                    <Button variant="outline" className="w-full bg-secondary/50 hover:bg-secondary px-2 text-xs" onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4 mr-1" />
                      Save PDF
                    </Button>
                    <Button className="w-full px-2 text-xs" onClick={handlePrintBill}>
                      <Printer className="h-4 w-4 mr-1" />
                      Print
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
                            <TableHead className="text-xs w-20">Qty</TableHead>
                            <TableHead className="text-xs w-16">Disc %</TableHead>
                            <TableHead className="text-xs w-20 text-right">Total</TableHead>
                            <TableHead className="text-xs w-8"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {billItems.map((item) => (
                            <TableRow key={`${item.product_type}-${item.product_id}`}>
                              <TableCell className="text-xs font-medium py-2">
                                {item.name}
                                <div className="text-[10px] text-muted-foreground mt-0.5">₹{item.price}/pc</div>
                              </TableCell>
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
                              <TableCell className="text-xs py-2">
                                <Input 
                                  type="number" 
                                  min="0"
                                  max="100"
                                  className="h-6 px-1 py-0 text-xs w-14" 
                                  value={item.discount_percent === 0 ? "" : item.discount_percent} 
                                  placeholder="0"
                                  onChange={(e) => updateDiscount(item.product_id, item.product_type, parseFloat(e.target.value) || 0)} 
                                />
                              </TableCell>
                              <TableCell className="text-xs py-2 text-right">₹{item.total.toFixed(2)}</TableCell>
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