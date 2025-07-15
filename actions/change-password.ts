"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function changePassword(formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return {
        error: "Unauthorized. Please log in again.",
      }
    }

    const validatedFields = changePasswordSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    })

    if (!validatedFields.success) {
      return {
        error: "Invalid input. Please check your passwords.",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { currentPassword, newPassword } = validatedFields.data

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, email: true },
    })

    if (!user) {
      return {
        error: "User not found.",
      }
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    
    if (!isCurrentPasswordValid) {
      return {
        error: "Current password is incorrect.",
      }
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    
    if (isSamePassword) {
      return {
        error: "New password must be different from your current password.",
      }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityId: user.id,
        entityType: "USER",
        action: "PASSWORD_CHANGE",
        userId: user.id,
        changes: {
          action: "Password changed",
          timestamp: new Date().toISOString(),
        },
        ipAddress: null, // You can get this from headers if needed
        userAgent: null, // You can get this from headers if needed
      },
    })

    revalidatePath("/dashboard")
    
    return {
      success: "Password changed successfully.",
    }
  } catch (error) {
    console.error("Password change error:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}