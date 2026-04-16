"use client"

import { useState } from "react"
import { useData } from "@/lib/data-store"
import type { Referral } from "@/lib/types"
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
import { Plus, Pencil, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

function ReferralForm({ referral, onSave, onCancel }: { referral?: Referral | null; onSave: (data: Partial<Referral>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    referrer_id: referral?.referrer_id || "",
    referred_name: referral?.referred_user.name || "",
    referred_email: referral?.referred_user.email || "",
    referred_phone: referral?.referred_user.phone || "",
    referrer_points: referral?.referrer_points || 100,
    referee_points: referral?.referee_points || 50,
    status: referral?.status || "pending" as Referral["status"],
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={e => {
        e.preventDefault()
        onSave({
          referrer_id: formData.referrer_id,
          referred_user: {
            name: formData.referred_name,
            email: formData.referred_email,
            phone: formData.referred_phone,
          },
          referrer_points: formData.referrer_points,
          referee_points: formData.referee_points,
          status: formData.status,
        })
      }}
    >
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Referrer ID</Label>
        <Input value={formData.referrer_id} onChange={e => setFormData(prev => ({ ...prev, referrer_id: e.target.value }))} className="bg-secondary border-border text-foreground font-mono text-xs" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Referred User Name</Label>
        <Input value={formData.referred_name} onChange={e => setFormData(prev => ({ ...prev, referred_name: e.target.value }))} className="bg-secondary border-border text-foreground" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Email</Label>
          <Input type="email" value={formData.referred_email} onChange={e => setFormData(prev => ({ ...prev, referred_email: e.target.value }))} className="bg-secondary border-border text-foreground" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Phone</Label>
          <Input value={formData.referred_phone} onChange={e => setFormData(prev => ({ ...prev, referred_phone: e.target.value }))} className="bg-secondary border-border text-foreground" required />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Referrer Points</Label>
          <Input type="number" value={formData.referrer_points} onChange={e => setFormData(prev => ({ ...prev, referrer_points: parseInt(e.target.value) || 0 }))} className="bg-secondary border-border text-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Referee Points</Label>
          <Input type="number" value={formData.referee_points} onChange={e => setFormData(prev => ({ ...prev, referee_points: parseInt(e.target.value) || 0 }))} className="bg-secondary border-border text-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as Referral["status"] }))}>
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="border-border">Cancel</Button>
        <Button type="submit" className="bg-primary text-primary-foreground">{referral ? "Update" : "Add"} Referral</Button>
      </div>
    </form>
  )
}

function ReferralDetail({ referral, onClose }: { referral: Referral; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      {[
        { label: "ID", value: referral._id },
        { label: "Referrer ID", value: referral.referrer_id },
        { label: "Referred Name", value: referral.referred_user.name },
        { label: "Referred Email", value: referral.referred_user.email },
        { label: "Referred Phone", value: referral.referred_user.phone },
        { label: "Referrer Points", value: referral.referrer_points.toString() },
        { label: "Referee Points", value: referral.referee_points.toString() },
        { label: "Status", value: referral.status },
        { label: "Created At", value: format(new Date(referral.created_at), "PPpp") },
      ].map(item => (
        <div key={item.label} className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
          <span className="text-sm text-foreground break-all">{item.value}</span>
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={onClose} className="border-border">Close</Button>
      </div>
    </div>
  )
}

export function ReferralsPage() {
  const { referrals, addReferral, updateReferral, deleteReferral } = useData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null)
  const [detailReferral, setDetailReferral] = useState<Referral | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSave = (data: Partial<Referral>) => {
    if (selectedReferral) {
      void updateReferral(selectedReferral._id, data).catch(console.error)
    } else {
      const newReferral: Referral = {
        _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        referrer_id: data.referrer_id || "",
        referred_user: data.referred_user || { name: "", email: "", phone: "" },
        referrer_points: data.referrer_points || 100,
        referee_points: data.referee_points || 50,
        status: data.status || "pending",
        created_at: new Date().toISOString(),
      }
      void addReferral(newReferral).catch(console.error)
    }
    setDialogOpen(false)
    setSelectedReferral(null)
  }

  const columns = [
    {
      key: "referred_user",
      label: "Referred User",
      render: (ref: Referral) => (
        <div className="flex flex-col">
          <span className="font-medium">{ref.referred_user.name}</span>
          <span className="text-xs text-muted-foreground">{ref.referred_user.email}</span>
        </div>
      ),
    },
    {
      key: "referrer_id",
      label: "Referrer ID",
      className: "hidden md:table-cell",
      render: (ref: Referral) => (
        <span className="font-mono text-xs">{ref.referrer_id.slice(0, 12)}...</span>
      ),
    },
    {
      key: "referrer_points",
      label: "Referrer Pts",
      render: (ref: Referral) => (
        <span className="text-primary font-semibold">+{ref.referrer_points}</span>
      ),
    },
    {
      key: "referee_points",
      label: "Referee Pts",
      render: (ref: Referral) => (
        <span className="text-chart-2 font-semibold">+{ref.referee_points}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (ref: Referral) => (
        <span className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-medium",
          ref.status === "completed" && "bg-primary/20 text-primary",
          ref.status === "pending" && "bg-warning/20 text-warning",
          ref.status === "expired" && "bg-destructive/20 text-destructive",
        )}>
          {ref.status}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Date",
      className: "hidden lg:table-cell",
      render: (ref: Referral) => format(new Date(ref.created_at), "MMM d, yyyy"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (ref: Referral) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setDetailReferral(ref); setDetailOpen(true) }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setSelectedReferral(ref); setDialogOpen(true) }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); setDeleteId(ref._id); setDeleteOpen(true) }}>
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
          <h1 className="text-2xl font-bold text-foreground">Referrals</h1>
          <p className="text-sm text-muted-foreground mt-1">{referrals.length} total referrals</p>
        </div>
        <Button onClick={() => { setSelectedReferral(null); setDialogOpen(true) }} className="bg-primary text-primary-foreground gap-2">
          <Plus className="h-4 w-4" />
          Add Referral
        </Button>
      </div>

      <DataTable
        data={referrals}
        columns={columns}
        searchKey="referred_user"
        searchPlaceholder="Search referrals..."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedReferral ? "Edit Referral" : "Add New Referral"}</DialogTitle>
          </DialogHeader>
          <ReferralForm referral={selectedReferral} onSave={handleSave} onCancel={() => { setDialogOpen(false); setSelectedReferral(null) }} />
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>Referral Details</DialogTitle>
          </DialogHeader>
          {detailReferral && <ReferralDetail referral={detailReferral} onClose={() => setDetailOpen(false)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Referral</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this referral? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) void deleteReferral(deleteId).catch(console.error); setDeleteOpen(false) }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
