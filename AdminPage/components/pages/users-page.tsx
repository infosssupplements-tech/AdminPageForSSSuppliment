"use client"

import { useState } from "react"
import { useData } from "@/lib/data-store"
import type { User } from "@/lib/types"
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
import { Plus, Pencil, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"

function UserForm({ user, onSave, onCancel }: { user?: User | null; onSave: (data: Partial<User>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    points: user?.points || 0,
    referral_code: user?.referral_code || "",
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={e => {
        e.preventDefault()
        onSave({
          ...formData,
          referral_code: formData.referral_code || null,
        })
      }}
    >
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Name</Label>
        <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="bg-secondary border-border text-foreground" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Email</Label>
        <Input type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} className="bg-secondary border-border text-foreground" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Phone</Label>
        <Input value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="bg-secondary border-border text-foreground" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Points</Label>
          <Input type="number" value={formData.points} onChange={e => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))} className="bg-secondary border-border text-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Referral Code</Label>
          <Input value={formData.referral_code} onChange={e => setFormData(prev => ({ ...prev, referral_code: e.target.value }))} className="bg-secondary border-border text-foreground" placeholder="Optional" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="border-border">Cancel</Button>
        <Button type="submit" className="bg-primary text-primary-foreground">{user ? "Update" : "Add"} User</Button>
      </div>
    </form>
  )
}

function UserDetail({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      {[
        { label: "ID", value: user._id },
        { label: "Name", value: user.name },
        { label: "Email", value: user.email },
        { label: "Phone", value: user.phone },
        { label: "Points", value: user.points.toString() },
        { label: "Referral Code", value: user.referral_code || "None" },
        { label: "Created At", value: format(new Date(user.created_at), "PPpp") },
        { label: "Updated At", value: format(new Date(user.updated_at), "PPpp") },
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

export function UsersPage() {
  const { users, addUser, updateUser, deleteUser } = useData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  const handleSave = (data: Partial<User>) => {
    if (selectedUser) {
      void updateUser(selectedUser._id, { ...data, updated_at: new Date().toISOString() }).catch(console.error)
    } else {
      const newUser: User = {
        _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        password: "$2b$12$placeholder",
        points: data.points || 0,
        referral_code: data.referral_code || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      void addUser(newUser).catch(console.error)
    }
    setDialogOpen(false)
    setSelectedUser(null)
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (user: User) => (
        <span className="font-medium">{user.name}</span>
      ),
    },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone", className: "hidden md:table-cell" },
    {
      key: "points",
      label: "Points",
      render: (user: User) => (
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {user.points}
        </span>
      ),
    },
    {
      key: "referral_code",
      label: "Referral Code",
      className: "hidden lg:table-cell",
      render: (user: User) => (
        <span className={user.referral_code ? "font-mono text-xs" : "text-muted-foreground"}>
          {user.referral_code || "None"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Joined",
      className: "hidden xl:table-cell",
      render: (user: User) => format(new Date(user.created_at), "MMM d, yyyy"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (user: User) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setDetailUser(user); setDetailOpen(true) }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setDialogOpen(true) }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); setDeleteUserId(user._id); setDeleteOpen(true) }}
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
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} total users</p>
        </div>
        <Button onClick={() => { setSelectedUser(null); setDialogOpen(true) }} className="bg-primary text-primary-foreground gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <DataTable
        data={users}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search users by name..."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <UserForm
            user={selectedUser}
            onSave={handleSave}
            onCancel={() => { setDialogOpen(false); setSelectedUser(null) }}
          />
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {detailUser && <UserDetail user={detailUser} onClose={() => setDetailOpen(false)} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteUserId) void deleteUser(deleteUserId).catch(console.error); setDeleteOpen(false) }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
