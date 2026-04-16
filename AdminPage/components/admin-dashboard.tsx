"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-store"
import { exportAdminDataToExcel } from "@/lib/export-excel"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Users,
  ShoppingCart,
  Package,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Dumbbell,
  ChevronRight,
  TrendingUp,
  IndianRupee,
  Download,
} from "lucide-react"
import { UsersPage } from "@/components/pages/users-page"
import { ReferralsPage } from "@/components/pages/referrals-page"
import { OrdersPage } from "@/components/pages/orders-page"
import { ProductsPage } from "@/components/pages/products-page"
import { InventoryDashboard } from "@/components/pages/inventory-dashboard"
import { SupplementsProductsPage } from "@/components/pages/supplements-products-page"
import { SportsProductsPage } from "@/components/pages/sports-products-page"
import { BillingPage } from "@/components/pages/billing-page"

type Page = "dashboard" | "users" | "referrals" | "orders" | "web-products" | "inventory-dashboard" | "supplements-products" | "sports-products" | "billing"

const navSections = [
  {
    title: "GENERAL",
    items: [
      { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
      { id: "users" as Page, label: "Users", icon: Users },
      { id: "referrals" as Page, label: "Referrals", icon: Gift },
      { id: "orders" as Page, label: "Orders", icon: ShoppingCart },
      { id: "web-products" as Page, label: "WebProducts", icon: Package },
    ]
  },
  {
    title: "INVENTORY SECTION",
    items: [
      { id: "inventory-dashboard" as Page, label: "Inventory Dashboard", icon: Package },
      { id: "supplements-products" as Page, label: "Supplements Products", icon: Package },
      { id: "sports-products" as Page, label: "Sports Products", icon: Dumbbell },
      { id: "billing" as Page, label: "Billing Section", icon: ShoppingCart },
    ]
  }
]

function StatCard({ title, value, icon: Icon, trend }: { title: string; value: string; icon: React.ElementType; trend?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </div>
          )}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  )
}

function DashboardOverview() {
  const { users, referrals, orders, products } = useData()
  const totalRevenue = orders.reduce((sum, o) => sum + o.cash_paid, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back to SSSupplement Admin</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={users.length.toString()} icon={Users} trend="+12% this month" />
        <StatCard title="Total Orders" value={orders.length.toString()} icon={ShoppingCart} trend="+8% this month" />
        <StatCard title="Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={IndianRupee} trend="+15% this month" />
        <StatCard title="Products" value={products.length.toString()} icon={Package} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Recent Orders</h3>
          <div className="flex flex-col gap-3">
            {orders.slice(0, 5).map(order => (
              <div key={order._id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">#{order.order_id}</span>
                  <span className="text-xs text-muted-foreground">{order.address.fullName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">₹{order.cash_paid.toLocaleString()}</span>
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    order.status === "pending" && "bg-warning/20 text-warning",
                    order.status === "confirmed" && "bg-primary/20 text-primary",
                    order.status === "shipped" && "bg-chart-2/20 text-chart-2",
                    order.status === "delivered" && "bg-primary/20 text-primary",
                    order.status === "cancelled" && "bg-destructive/20 text-destructive",
                  )}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Recent Referrals</h3>
          <div className="flex flex-col gap-3">
            {referrals.slice(0, 5).map(ref => (
              <div key={ref._id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{ref.referred_user.name}</span>
                  <span className="text-xs text-muted-foreground">{ref.referred_user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary font-medium">+{ref.referrer_points} pts</span>
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    ref.status === "completed" && "bg-primary/20 text-primary",
                    ref.status === "pending" && "bg-warning/20 text-warning",
                    ref.status === "expired" && "bg-destructive/20 text-destructive",
                  )}>
                    {ref.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const { logout } = useAuth()
  const { users, referrals, orders, products, isLoading } = useData()
  const router = useRouter()
  const [activePage, setActivePage] = useState<Page>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardOverview />
      case "users": return <UsersPage />
      case "referrals": return <ReferralsPage />
      case "orders": return <OrdersPage />
      case "web-products": return <ProductsPage />
      case "inventory-dashboard": return <InventoryDashboard />
      case "supplements-products": return <SupplementsProductsPage />
      case "sports-products": return <SportsProductsPage />
      case "billing": return <BillingPage />
      default: return <DashboardOverview />
    }
  }

  const pageTitles: Record<Page, string> = {
    dashboard: "Dashboard",
    users: "Users",
    referrals: "Referrals",
    orders: "Orders",
    "web-products": "WebProducts",
    "inventory-dashboard": "Inventory Dashboard",
    "supplements-products": "Supplements Products",
    "sports-products": "Sports Products",
    billing: "Billing",
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-sidebar-foreground">SSSupplement</h2>
            <p className="text-[10px] text-muted-foreground leading-none">Admin Panel</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-3">
          <div className="flex flex-col gap-4">
            {navSections.map(section => (
              <div key={section.title} className="flex flex-col gap-1">
                <h3 className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="flex flex-col gap-1">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id)
                        setSidebarOpen(false)
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        activePage === item.id
                          ? "bg-sidebar-accent text-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5" />
                      {item.label}
                      {activePage === item.id && (
                        <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={async () => {
              await logout()
              router.push("/")
              router.refresh()
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {pageTitles[activePage]}
            </h2>
          </div>
          <Button
            variant="outline"
            className="hidden sm:flex"
            disabled={isLoading}
            onClick={() =>
              exportAdminDataToExcel({
                users,
                referrals,
                orders,
                products,
              })
            }
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">A</span>
            </div>
            <span className="hidden text-sm font-medium text-foreground sm:inline">Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
