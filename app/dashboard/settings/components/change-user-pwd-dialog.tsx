"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, KeyRound, Shield } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { changeUserPassword } from "@/actions/user-management"
import { toast } from "sonner"

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm the password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

interface ChangeUserPasswordDialogProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ChangeUserPasswordDialog({ 
  user, 
  open, 
  onOpenChange, 
  onSuccess 
}: ChangeUserPasswordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("userId", user.id)
      formData.append("newPassword", data.newPassword)

      const result = await changeUserPassword(formData)

      if (result.error) {
        setError(result.error)
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors) {
              form.setError(field as keyof ChangePasswordFormData, {
                message: errors[0],
              })
            }
          })
        }
      } else if (result.success) {
        toast.success("Password changed successfully!")
        form.reset()
        onSuccess()
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Change password error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordStrength = (password: string) => {
    let score = 0
    if (!password) return 0;
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const newPassword = form.watch("newPassword")
  const strength = passwordStrength(newPassword)

  const getStrengthColor = (score: number) => {
    if (score <= 2) return "bg-red-500"
    if (score <= 4) return "bg-yellow-500"
    return "bg-green-500"
  }

  // **New helper function to return a Tailwind width class**
  const getStrengthWidth = (score: number) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Change Password
          </DialogTitle>
          <DialogDescription>
            Change password for <strong>{user.firstName} {user.lastName}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        className="pl-10 pr-10"
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        disabled={isSubmitting}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  {newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          {/* **Change is here: `style` attribute removed** */}
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        className="pl-10 pr-10"
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
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
                {isSubmitting ? "Changing Password..." : "Change Password"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}