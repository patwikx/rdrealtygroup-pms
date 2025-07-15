"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { Plus, User, Mail, Phone, Shield, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createUser } from "@/actions/user-management"
import { toast } from "sonner"

const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  contactNo: z.string().optional(),
  role: z.nativeEnum(UserRole),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface CreateUserDialogProps {
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

export function CreateUserDialog({ onSuccess }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      contactNo: "",
      role: UserRole.STAFF,
    },
  })

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("firstName", data.firstName)
      formData.append("lastName", data.lastName)
      formData.append("email", data.email)
      formData.append("password", data.password)
      if (data.contactNo) formData.append("contactNo", data.contactNo)
      formData.append("role", data.role)

      const result = await createUser(formData)

      if (result.error) {
        setError(result.error)
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors) {
              form.setError(field as keyof CreateUserFormData, {
                message: errors[0],
              })
            }
          })
        }
      } else if (result.success) {
        toast.success("User created successfully!")
        form.reset()
        setOpen(false)
        onSuccess()
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Create user error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordStrength = (password: string) => {
    let score = 0
    if (!password) return 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const password = form.watch("password")
  const strength = passwordStrength(password)

  const getStrengthColor = (score: number) => {
    if (score <= 2) return "bg-red-500"
    if (score <= 4) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthWidth = (score: number) => {
    // This now returns a Tailwind CSS width class
    const widthMap: { [key: number]: string } = {
      0: "w-0",
      1: "w-[20%]",
      2: "w-[40%]",
      3: "w-[60%]",
      4: "w-[80%]",
      5: "w-full",
    }
    return widthMap[score] || "w-0"
  }

  const getStrengthText = (score: number) => {
    if (score <= 2) return "Weak"
    if (score <= 4) return "Medium"
    return "Strong"
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the system. Fill in all required information.
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        className="pr-10"
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  {password && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          {/* --- CHANGE IS HERE --- */}
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength)} ${getStrengthWidth(strength)}`}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">
                          {getStrengthText(strength)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Use 8+ characters with a mix of letters, numbers & symbols
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating User..." : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}