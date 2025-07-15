"use client"

// 1. Import useCallback
import { useState, useEffect, useCallback } from "react"
import { UserRole } from "@prisma/client"
import { Users, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getUsers } from "@/actions/user-management"
import { toast } from "sonner"
import { CreateUserDialog } from "./components/create-user-dialog"
import { UserFilters } from "./components/user-filters"
import { UserManagementTable } from "./components/user-management-table"

type UserWithDetails = {
  id: string
  firstName: string
  lastName: string
  email: string
  contactNo: string | null
  role: UserRole
  image: string | null
  createdAt: Date
  updatedAt: Date
  emailVerified: Date | null
}

type PaginationInfo = {
  page: number
  limit: number
  total: number
  pages: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<UserRole | undefined>(undefined)

  // 2. Wrap the fetchUsers function in useCallback
  const fetchUsers = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const result = await getUsers(page, 10, search, role)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else if (result.users && result.pagination) {
        setUsers(result.users)
        setPagination(result.pagination)
      }
    } catch (error) {
      const errorMessage = "Failed to fetch users"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [search, role]) // Dependencies for useCallback

  // 3. Update the useEffect dependency array
  useEffect(() => {
    fetchUsers(1)
  }, [fetchUsers])

  const handlePageChange = (page: number) => {
    fetchUsers(page)
  }

  const handleRefresh = () => {
    fetchUsers(pagination.page)
  }

  const handleClearFilters = () => {
    setSearch("")
    setRole(undefined)
  }

  const renderPagination = () => {
    if (pagination.pages <= 1) return null

    const pages = []
    const currentPage = pagination.page
    const totalPages = pagination.pages

    pages.push(1)

    if (currentPage > 3) {
      pages.push("ellipsis-start")
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i)
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis-end")
    }

    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages)
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {pages.map((page, index) => (
            <PaginationItem key={index}>
              {page === "ellipsis-start" || page === "ellipsis-end" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => handlePageChange(page as number)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <CreateUserDialog onSuccess={handleRefresh} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : pagination.total}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : users.filter(u => u.emailVerified).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Verified accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : users.filter(u => u.role === 'ADMIN').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Administrator accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : users.filter(u => u.role === 'STAFF').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Staff members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <UserFilters
        search={search}
        role={role}
        onSearchChange={setSearch}
        onRoleChange={setRole}
        onClearFilters={handleClearFilters}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {loading ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              `Showing ${users.length} of ${pagination.total} users`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : (
            <UserManagementTable users={users} onRefresh={handleRefresh} />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && renderPagination()}
    </div>
  )
}