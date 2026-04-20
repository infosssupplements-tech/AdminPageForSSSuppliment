"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

interface DataTableProps<T> {
  data: T[]
  columns: {
    key: string
    label: string
    render?: (item: T) => React.ReactNode
    className?: string
  }[]
  searchKey?: keyof T | string
  searchKeys?: (keyof T | string)[]
  searchPlaceholder?: string
  pageSize?: number
  loading?: boolean
  onRowClick?: (item: T) => void
}

export function DataTable<T extends object>({
  data,
  columns,
  searchKey,
  searchKeys,
  searchPlaceholder = "Search...",
  pageSize = 10,
  loading = false,
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  const filtered = searchKey || searchKeys
    ? data.filter(item => {
        if (searchKeys) {
          return searchKeys.some(key => {
            const val = (item as any)[key]
            return String(val ?? "").toLowerCase().includes(search.toLowerCase())
          })
        }
        if (searchKey) {
          const val = (item as any)[searchKey]
          return String(val ?? "").toLowerCase().includes(search.toLowerCase())
        }
        return true
      })
    : data

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="flex flex-col gap-4">
      {(searchKey || searchKeys) && (
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            disabled={loading}
            className="pl-10 bg-secondary border-border text-foreground"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {columns.map(col => (
                <th key={col.key} className={`px-4 py-3 text-left font-medium text-muted-foreground ${col.className || ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  No data found
                </td>
              </tr>
            ) : (
              paginated.map((item, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(item)}
                  className={`border-b border-border transition-colors hover:bg-secondary/30 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map(col => (
                    <td key={col.key} className={`px-4 py-3 text-foreground ${col.className || ""}`}>
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[String(col.key)] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 w-8 border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-8 w-8 border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
