"use client"

import { useState } from "react"
import { User, UserRole } from "@prisma/client"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  MoreHorizontal,
  Edit,
  Trash2,
  KeyRound,
  Shield,
  Mail,
  Phone,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"
import { deleteUser } from "@/actions/user-management"
import { EditUserDialog } from "./edit-user-dialog"
import { ChangeUserPasswordDialog } from "./change-user-pwd-dialog"

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

interface UserManagementTableProps {
  users: UserWithDetails[]
  onRefresh: () => void
}

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  MANAGER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  STAFF: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  TENANT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  TREASURY: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PURCHASER: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  ACCTG: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  VIEWER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  OWNER: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  STOCKROOM: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  MAINTENANCE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
}

export function UserManagementTable({ users, onRefresh }: UserManagementTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsDeleting(true)
    try {
      const result = await deleteUser(selectedUser.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("User deleted successfully")
        onRefresh()
      }
    } catch (error) {
      toast.error("Failed to delete user")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const openDeleteDialog = (user: UserWithDetails) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const openEditDialog = (user: UserWithDetails) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const openPasswordDialog = (user: UserWithDetails) => {
    setSelectedUser(user)
    setPasswordDialogOpen(true)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.contactNo ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {user.contactNo}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No contact</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={roleColors[user.role]}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.emailVerified ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Change Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>{" "}
              and remove all their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            onRefresh()
            setEditDialogOpen(false)
            setSelectedUser(null)
          }}
        />
      )}

      {/* Change Password Dialog */}
      {selectedUser && (
        <ChangeUserPasswordDialog
          user={selectedUser}
          open={passwordDialogOpen}
          onOpenChange={setPasswordDialogOpen}
          onSuccess={() => {
            onRefresh()
            setPasswordDialogOpen(false)
            setSelectedUser(null)
          }}
        />
      )}
    </>
  )
}