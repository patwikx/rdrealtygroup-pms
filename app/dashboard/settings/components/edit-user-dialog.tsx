"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { User, Mail, Phone, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateUser } from "@/actions/user-management"
import { toast } from "sonner"

const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  contactNo: z.string().optional(),
  role: z.nativeEnum(UserRole),
})

type UpdateUserFormData = z.infer<typeof updateUserSchema>

interface EditUserDialogProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    contactNo: string | null
    role: UserRole
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
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

export function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNo: user.contactNo || "",
      role: user.role,
    },
  })

  // Reset form when user changes
  useEffect(() => {
    form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNo: user.contactNo || "",
      role: user.role,
    })
  }, [user, form])

  const onSubmit = async (data: UpdateUserFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("id", user.id)
      formData.append("firstName", data.firstName)
      formData.append("lastName", data.lastName)
      formData.append("email", data.email)
      if (data.contactNo) formData.append("contactNo", data.contactNo)
      formData.append("role", data.role)

      const result = await updateUser(formData)

      if (result.error) {
        setError(result.error)
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors) {
              form.setError(field as keyof UpdateUserFormData, {
                message: errors[0],
              })
            }
          })
        }
      } else if (result.success) {
        toast.success("User updated successfully!")
        onSuccess()
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Update user error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="Enter first name"
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="Enter last name"
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter email address"
                        className="pl-10"
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="Enter contact number"
                        className="pl-10"
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select a role" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating User..." : "Update User"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}