"use client"

import { useState } from "react"
import { useData } from "@/lib/data-store"
import type { Order } from "@/lib/types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Trash2, Eye, MapPin, Package, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
      {/* Order Info */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Order Info
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Order ID", value: `#${order.order_id}` },
            { label: "Status", value: order.status },
            { label: "Payment", value: order.payment_method.toUpperCase() },
            { label: "UTR", value: order.utr_number || "N/A" },
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
              <span className="text-sm text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          Pricing Breakdown
        </h3>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">₹{order.actual_subtotal}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">₹{order.shipping_fee}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Coins Used</span><span className="text-foreground">{order.coins_used}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Coin Discount</span><span className="text-primary">-₹{order.coin_discount_value}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Earned Points</span><span className="text-primary">+{order.earned_points}</span></div>
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span className="text-foreground">Total Paid</span>
            <span className="text-foreground">₹{order.cash_paid}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Order Items</h3>
        <div className="flex flex-col gap-2">
          {order.order_items.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.flavor} - {item.weight} x{item.quantity}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">₹{item.total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Address */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Delivery Address
        </h3>
        <div className="text-sm text-foreground leading-relaxed">
          <p className="font-medium">{order.address.fullName}</p>
          <p className="text-muted-foreground">{order.address.phone}</p>
          <p className="text-muted-foreground mt-1">
            {order.address.address}, {order.address.city}, {order.address.state} - {order.address.pincode}
          </p>
          {order.address.landmark && <p className="text-muted-foreground">Landmark: {order.address.landmark}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose} className="border-border">Close</Button>
      </div>
    </div>
  )
}

function OrderStatusForm({ order, onSave, onCancel }: { order: Order; onSave: (data: Partial<Order>) => void; onCancel: () => void }) {
  const [status, setStatus] = useState(order.status)

  return (
    <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSave({ status }) }}>
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Order Status</Label>
        <Select value={status} onValueChange={v => setStatus(v as Order["status"])}>
          <SelectTrigger className="bg-secondary border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="border-border">Cancel</Button>
        <Button type="submit" className="bg-primary text-primary-foreground">Update Status</Button>
      </div>
    </form>
  )
}

export function OrdersPage() {
  const { orders, updateOrder, deleteOrder } = useData()
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns = [
    {
      key: "order_id",
      label: "Order ID",
      render: (order: Order) => (
        <span className="font-mono text-sm font-semibold text-primary">#{order.order_id}</span>
      ),
    },
    {
      key: "address",
      label: "Customer",
      render: (order: Order) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{order.address.fullName}</span>
          <span className="text-xs text-muted-foreground">{order.address.city}, {order.address.state}</span>
        </div>
      ),
    },
    {
      key: "order_items",
      label: "Items",
      className: "hidden md:table-cell",
      render: (order: Order) => (
        <span className="text-sm">{order.order_items.length} item(s)</span>
      ),
    },
    {
      key: "cash_paid",
      label: "Amount",
      render: (order: Order) => (
        <span className="font-semibold">₹{order.cash_paid.toLocaleString()}</span>
      ),
    },
    {
      key: "payment_method",
      label: "Payment",
      className: "hidden lg:table-cell",
      render: (order: Order) => (
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium uppercase">
          {order.payment_method}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (order: Order) => (
        <span className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-medium",
          order.status === "pending" && "bg-warning/20 text-warning",
          order.status === "confirmed" && "bg-chart-2/20 text-chart-2",
          order.status === "shipped" && "bg-primary/20 text-primary",
          order.status === "delivered" && "bg-primary/20 text-primary",
          order.status === "cancelled" && "bg-destructive/20 text-destructive",
        )}>
          {order.status}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Date",
      className: "hidden xl:table-cell",
      render: (order: Order) => format(new Date(order.created_at), "MMM d, yyyy"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (order: Order) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setDetailOrder(order); setDetailOpen(true) }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setEditOpen(true) }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); setDeleteId(order._id); setDeleteOpen(true) }}>
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
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">{orders.length} total orders</p>
        </div>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        searchKey="order_id"
        searchPlaceholder="Search by order ID..."
      />

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {detailOrder && <OrderDetail order={detailOrder} onClose={() => setDetailOpen(false)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <OrderStatusForm
              order={selectedOrder}
              onSave={(data) => { void updateOrder(selectedOrder._id, data).catch(console.error); setEditOpen(false) }}
              onCancel={() => setEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Order</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) void deleteOrder(deleteId).catch(console.error); setDeleteOpen(false) }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
