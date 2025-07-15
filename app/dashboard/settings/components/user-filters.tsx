"use client"

import { useState } from "react"
import { UserRole } from "@prisma/client"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface UserFiltersProps {
  search: string
  role: UserRole | undefined
  onSearchChange: (search: string) => void
  onRoleChange: (role: UserRole | undefined) => void
  onClearFilters: () => void
}

const roleOptions = [
  { value: UserRole.ADMIN, label: "Admin" },
  { value: UserRole.MANAGER, label: "Manager" },
  { value: UserRole.STAFF, label: "Staff" },
  { value: UserRole.TENANT, label: "Tenant" },
  { value: UserRole.TREASURY, label: "Treasury" },
  { value: UserRole.PURCHASER, label: "Purchaser" },
  { value: UserRole.ACCTG, label: "Accounting" },
  { value: UserRole.VIEWER, label: "Viewer" },
  { value: UserRole.OWNER, label: "Owner" },
  { value: UserRole.STOCKROOM, label: "Stockroom" },
  { value: UserRole.MAINTENANCE, label: "Maintenance" },
]

export function UserFilters({
  search,
  role,
  onSearchChange,
  onRoleChange,
  onClearFilters,
}: UserFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange(localSearch)
  }

  const handleClearFilters = () => {
    setLocalSearch("")
    onClearFilters()
  }

  const hasActiveFilters = search || role

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        <div className="flex gap-2">
          <Select
            value={role || ""}
            // FIX 2: Update the handler to check for the new "all" value.
            onValueChange={(value) => onRoleChange(value === "all" ? undefined : (value as UserRole))}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter by role" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {/* FIX 1: Use a non-empty value for the "All Roles" option. */}
              <SelectItem value="all">All Roles</SelectItem>
              {roleOptions.map((roleOption) => (
                <SelectItem key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="px-3"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setLocalSearch("")
                  onSearchChange("")
                }}
              />
            </Badge>
          )}
          {role && (
            <Badge variant="secondary" className="gap-1">
              Role: {roleOptions.find((r) => r.value === role)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onRoleChange(undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}