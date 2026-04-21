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
import { format } from "date-fns"
import { exportBillsToExcel } from "@/lib/export-excel"

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
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - SS Supplements</title>
        <style>
          @page { margin: 15mm; size: A4; }
          body { font-family: Georgia, 'Times New Roman', Times, serif; margin: 0; padding: 0; color: #000; font-size: 12px; }
          .invoice-box { max-width: 850px; margin: auto; padding: 20px; background: #fff; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: 600; }
          .underline { text-decoration: underline; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-4 { margin-bottom: 16px; }
          .mb-6 { margin-bottom: 24px; }
          .mt-2 { margin-top: 8px; }
          .mt-4 { margin-top: 16px; }
          .mt-8 { margin-top: 32px; }
          .text-lg { font-size: 18px; }
          .text-base { font-size: 14px; }
          .text-xs { font-size: 10px; }
          p { margin: 2px 0; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .justify-end { justify-content: flex-end; }
          .w-1-2 { width: 50%; }
          .w-2-3 { width: 66.66%; }
          .w-1-3 { width: 33.33%; }
          .pr-4 { padding-right: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; }
          .w-48 { width: 192px; }
          ul { margin: 4px 0 0 16px; padding: 0; }
          li { margin-bottom: 2px; }
          .uppercase { text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="text-center mb-6">
            <h1 class="font-bold text-lg underline mb-1">INVOICE</h1>
            <h2 class="font-bold text-base mb-1">SS SUPPLEMENTS</h2>
            <p>Haldia, Bhabanipur (Dakshin Palli)</p>
            <p>Near Ambuja City Center Mall</p>
            <p>Purba Medinipur - 721657</p>
            <p>Contact - 9547899170</p>
          </div>
          
          <div class="flex justify-between mb-6">
            <div class="w-1-2 pr-4">
              <p class="font-semibold mb-1">Bill To:</p>
              <p class="font-bold uppercase">${bill.customer_name}</p>
              <p>Ph: ${bill.customer_phone}</p>
              <p>Address: ${bill.customer_address || "N/A"}</p>
              <p>Place of Supply: West Bengal</p>
              <p>State Code: 19</p>
            </div>
            <div class="w-1-2 text-right">
              <p><span class="font-semibold">Invoice No.:</span> #${bill._id.substring(0, 8).toUpperCase()}</p>
              <p><span class="font-semibold">Invoice Date:</span> ${format(new Date(bill.created_at), 'dd-MM-yyyy')}</p>
              <p class="mt-4"><span class="font-semibold">Payment Mode:</span> Credit / Cash</p>
              <p><span class="font-semibold">Amount:</span> ${bill.total_amount.toFixed(2)}</p>
            </div>
          </div>

          <div class="mb-6">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="width: 50px;">SIZE</th>
                  <th style="width: 50px;">Batch No.</th>
                  <th style="width: 60px;">Rate(Rs.)</th>
                  <th style="width: 60px;">Discount(Rs.)</th>
                  <th style="width: 60px;">Discounted<br/>Rate(Rs.)</th>
                  <th style="width: 40px;">QTY</th>
                  <th style="width: 60px;">Total(Rs.)</th>
                </tr>
              </thead>
              <tbody>
                ${bill.items.map((item) => {
                  const product = allProducts.find(p => p._id === item.product_id && p.type === item.product_type);
                  const batch = product?.batch_code || "-";
                  const size = product?.type === 'supplement' ? (product.weight ? `${product.weight}${product.unit || ''}` : '-') : (product?.size || '-');
                  const rate = item.price;
                  const discPercent = item.discount_percent || 0;
                  const discRs = rate * (discPercent / 100);
                  const discountedRate = rate - discRs;
                  
                  return `
                    <tr>
                      <td>${item.name}</td>
                      <td>${size}</td>
                      <td>${batch}</td>
                      <td>${rate.toFixed(2)}</td>
                      <td>${discRs.toFixed(2)}</td>
                      <td>${discountedRate.toFixed(2)}</td>
                      <td>${item.quantity}</td>
                      <td>${item.total.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
                <tr>
                  <td colspan="7" class="text-right font-bold">TOTAL</td>
                  <td class="font-bold">${bill.total_amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end mb-6">
            <table class="w-48">
              <tr>
                <td class="font-semibold">Total (Rs.)</td>
                <td>${bill.total_amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="flex justify-between mt-8">
            <div class="w-2-3 pr-4">
              <p class="font-bold mb-2">Please do not accept if the box is tampered</p>
              <p class="text-xs mb-4" style="color: #444;">Note: This is to certify that items inside do not contain any prohibited or hazardous materials. The items are meant for personal use only and not for resale.</p>
              <p class="font-bold underline mb-1">Terms & Conditions :</p>
              <ul class="text-xs" style="color: #444;">
                <li>All disputes under Haldia Jurisdiction</li>
                <li>No Exchange and Refund</li>
                <li>Please do not accept if the box is tampered.</li>
              </ul>
            </div>
            <div class="w-1-3 text-right mt-8 text-xs">
              <p>Digitally signed</p>
              <p class="font-bold mt-2" style="font-size: 14px;">SS SUPPLEMENTS</p>
              <p class="mt-2">Date: ${format(new Date(), 'yyyy.MM.dd HH:mm:ss')}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  const filteredProducts = allProducts.filter(product => {
    const term = searchTerm.toLowerCase();
    return String(product.name ?? "").toLowerCase().includes(term) ||
      String(product.distributor ?? "").toLowerCase().includes(term) ||
      String(product.batch_code ?? "").toLowerCase().includes(term) ||
      String(product.flavor ?? "").toLowerCase().includes(term) ||
      String(product.size ?? "").toLowerCase().includes(term) ||
      String(product.weight ?? "").toLowerCase().includes(term) ||
      String(product.unit ?? "").toLowerCase().includes(term)
  })

  const { dailyTotal, monthlyTotal, yearlyTotal } = React.useMemo(() => {
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    let daily = 0
    let monthly = 0
    let yearly = 0

    bills.forEach(bill => {
      const billDate = new Date(bill.created_at)
      if (isNaN(billDate.getTime())) return

      const isSameYear = billDate.getFullYear() === currentYear
      const isSameMonth = isSameYear && billDate.getMonth() === currentMonth
      const isSameDay = isSameMonth && billDate.getDate() === currentDay

      if (isSameYear) yearly += bill.total_amount
      if (isSameMonth) monthly += bill.total_amount
      if (isSameDay) daily += bill.total_amount
    })

    return { dailyTotal: daily, monthlyTotal: monthly, yearlyTotal: yearly }
  }, [bills])

  const getGroupedBills = () => {
    const groups: { label: string, date: number, bills: Bill[], totalAmount: number }[] = []
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const searchLower = historySearchTerm.toLowerCase()

    const filtered = bills.filter(bill => {
      if (!searchLower) return true
      const formattedDate = format(new Date(bill.created_at), 'dd/MM/yyyy').toLowerCase()
      
      return (
        bill._id.toLowerCase().includes(searchLower) ||
        bill.customer_name.toLowerCase().includes(searchLower) ||
        bill.customer_phone.toLowerCase().includes(searchLower) ||
        formattedDate.includes(searchLower) ||
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
        label = format(billDate, 'dd/MM/yyyy')
      }

      const existingGroup = groups.find(g => g.label === label)
      if (existingGroup) {
        existingGroup.bills.push(bill)
        existingGroup.totalAmount += bill.total_amount
      } else {
        groups.push({ label, date: billDate.getTime(), bills: [bill], totalAmount: bill.total_amount })
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
            <div className="flex w-full sm:w-auto items-center gap-2">
              <Input
                placeholder="Search by ID, Customer, Product, or Date..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="w-full sm:w-80"
              />
              <Button variant="outline" onClick={() => exportBillsToExcel(bills, allProducts)}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col p-4 border border-border rounded-xl bg-secondary/30 shadow-sm">
              <span className="text-sm font-medium text-muted-foreground mb-1">Today's Sales</span>
              <span className="text-2xl font-bold text-primary">₹{dailyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col p-4 border border-border rounded-xl bg-secondary/30 shadow-sm">
              <span className="text-sm font-medium text-muted-foreground mb-1">This Month's Sales</span>
              <span className="text-2xl font-bold text-primary">₹{monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col p-4 border border-border rounded-xl bg-secondary/30 shadow-sm">
              <span className="text-sm font-medium text-muted-foreground mb-1">This Year's Sales</span>
              <span className="text-2xl font-bold text-primary">₹{yearlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                          <div className="flex justify-between items-center pr-2">
                            <span>{group.label}</span>
                            <span className="text-primary">Total: ₹{group.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                      {group.bills.map(bill => (
                        <TableRow key={bill._id}>
                          <TableCell className="font-mono text-sm">{bill._id.substring(0, 8).toUpperCase()}</TableCell>
                      <TableCell className="font-medium">{bill.customer_name}</TableCell>
                      <TableCell>{bill.customer_phone}</TableCell>
                          <TableCell>{format(new Date(bill.created_at), 'dd/MM/yyyy')}</TableCell>
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
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={e => {
                      const newPhone = e.target.value
                      setCustomerInfo(prev => {
                        const updates = { ...prev, phone: newPhone }
                        
                        // Auto-fill logic when a full phone number is entered
                        if (newPhone.length >= 10) {
                          const recentBill = [...bills]
                            .filter(b => b.customer_phone === newPhone)
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                            
                          if (recentBill) {
                            updates.name = recentBill.customer_name
                            updates.address = recentBill.customer_address || ''
                          }
                        }
                        return updates
                      })
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }))
                    }}
                    placeholder="Enter phone number"
                    className={`mt-2 ${errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>
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
                  placeholder="Search by name, batch code, distributor, flavor, size, weight..."
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
                <div className="space-y-4">
                  <div className="bg-white text-black p-4 text-[10px] sm:text-xs font-serif border shadow-sm overflow-x-auto rounded">
                    <div className="min-w-[600px] xl:min-w-full">
                      {/* Header Section */}
                      <div className="text-center mb-6">
                        <h1 className="font-bold text-lg underline mb-1">INVOICE</h1>
                        <h2 className="font-bold text-base">SS SUPPLEMENTS</h2>
                        <p>Haldia, Bhabanipur (Dakshin Palli)</p>
                        <p>Near Ambuja City Center Mall</p>
                        <p>Purba Medinipur - 721657</p>
                        <p>Contact - 9547899170</p>
                      </div>

                      {/* Details Section */}
                      <div className="flex justify-between mb-6">
                        {/* Bill To */}
                        <div className="w-1/2 pr-4">
                          <p className="font-semibold mb-1">Bill To:</p>
                          <p className="font-bold uppercase">{generatedBill.customer_name}</p>
                          <p>Ph: {generatedBill.customer_phone}</p>
                          <p>Address: {generatedBill.customer_address || "N/A"}</p>
                          <p>Place of Supply: West Bengal</p>
                          <p>State Code: 19</p>
                        </div>

                        {/* Invoice Info */}
                        <div className="w-1/2 text-right">
                          <p><span className="font-semibold">Invoice No.:</span> #{generatedBill._id.substring(0, 8).toUpperCase()}</p>
                          <p><span className="font-semibold">Invoice Date:</span> {format(new Date(generatedBill.created_at), 'dd-MM-yyyy')}</p>
                          <p className="mt-4"><span className="font-semibold">Payment Mode:</span> Credit / Cash</p>
                          <p><span className="font-semibold">Amount:</span> {generatedBill.total_amount.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Table Section */}
                      <div className="mb-6">
                        <table className="w-full border-collapse border border-black text-left">
                          <thead>
                            <tr>
                              <th className="border border-black p-1">Item</th>
                              <th className="border border-black p-1 w-12">SIZE</th>
                              <th className="border border-black p-1 w-14">Batch No.</th>
                              <th className="border border-black p-1 w-14">Rate(Rs.)</th>
                              <th className="border border-black p-1 w-16">Discount(Rs.)</th>
                              <th className="border border-black p-1 w-16">Discounted<br/>Rate(Rs.)</th>
                              <th className="border border-black p-1 w-8">QTY</th>
                              <th className="border border-black p-1 w-16">Total(Rs.)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatedBill.items.map((item, index) => {
                              const product = allProducts.find(p => p._id === item.product_id && p.type === item.product_type);
                              const batch = product?.batch_code || "-";
                              const size = product?.type === 'supplement' ? (product.weight ? `${product.weight}${product.unit || ''}` : '-') : (product?.size || '-');
                              const rate = item.price;
                              const discPercent = item.discount_percent || 0;
                              const discRs = rate * (discPercent / 100);
                              const discountedRate = rate - discRs;

                              return (
                                <tr key={index} className="align-top">
                                  <td className="border border-black p-1">{item.name}</td>
                                  <td className="border border-black p-1">{size}</td>
                                  <td className="border border-black p-1">{batch}</td>
                                  <td className="border border-black p-1">{rate.toFixed(2)}</td>
                                  <td className="border border-black p-1">{discRs.toFixed(2)}</td>
                                  <td className="border border-black p-1">{discountedRate.toFixed(2)}</td>
                                  <td className="border border-black p-1">{item.quantity}</td>
                                  <td className="border border-black p-1">{item.total.toFixed(2)}</td>
                                </tr>
                              );
                            })}
                            {/* Total Row */}
                            <tr>
                              <td colSpan={7} className="border border-black p-1 text-right font-bold">TOTAL</td>
                              <td className="border border-black p-1 font-bold">{generatedBill.total_amount.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Table */}
                      <div className="flex justify-end mb-6">
                        <table className="border-collapse border border-black w-48 text-left">
                          <tbody>
                            <tr>
                              <td className="border border-black p-1 font-semibold">Total (Rs.)</td>
                              <td className="border border-black p-1">{generatedBill.total_amount.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Footer Section */}
                      <div className="mt-8 flex justify-between">
                        <div className="w-2/3 pr-4">
                          <p className="font-bold mb-2">Please do not accept if the box is tampered</p>
                          <p className="text-[9px] mb-4 text-gray-700">Note: This is to certify that items inside do not contain any prohibited or hazardous materials. The items are meant for personal use only and not for resale.</p>
                          
                          <p className="font-bold underline mb-1">Terms &amp; Conditions :</p>
                          <ul className="text-[9px] list-disc pl-4 text-gray-700">
                            <li>All disputes under Haldia Jurisdiction</li>
                            <li>No Exchange and Refund</li>
                            <li>Please do not accept if the box is tampered.</li>
                          </ul>
                        </div>

                        <div className="w-1/3 text-right mt-12 text-[10px]">
                          <p>Digitally signed</p>
                          <p className="font-bold mt-1 text-xs">SS SUPPLEMENTS</p>
                          <p className="mt-1">Date: {format(new Date(), 'yyyy.MM.dd HH:mm:ss')}</p>
                        </div>
                      </div>
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