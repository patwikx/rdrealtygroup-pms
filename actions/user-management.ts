"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { UserRole } from "@prisma/client"
import { auth } from "@/auth"

// Validation schemas
const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  contactNo: z.string().optional(),
  role: z.nativeEnum(UserRole),
})

const updateUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  contactNo: z.string().optional(),
  role: z.nativeEnum(UserRole),
})

const changeUserPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

const toggleUserStatusSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  isActive: z.boolean(),
})

// Get all users with pagination and filtering
export async function getUsers(
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: UserRole
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const skip = (page - 1) * limit
    
    const where = {
      AND: [
        search ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ]
        } : {},
        role ? { role } : {},
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          contactNo: true,
          role: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error("Get users error:", error)
    return { error: "Failed to fetch users" }
  }
}

// Create new user
export async function createUser(formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedFields = createUserSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      password: formData.get("password"),
      contactNo: formData.get("contactNo") || undefined,
      role: formData.get("role"),
    })

    if (!validatedFields.success) {
      return {
        error: "Invalid input",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { firstName, lastName, email, password, contactNo, role } = validatedFields.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: "User with this email already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        contactNo,
        role,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityId: newUser.id,
        entityType: "USER",
        action: "CREATE",
        userId: session.user.id,
        changes: {
          action: "User created",
          newUser: {
            firstName,
            lastName,
            email,
            role,
          },
        },
      },
    })

    revalidatePath("/dashboard/users")
    
    return { success: "User created successfully", user: newUser }
  } catch (error) {
    console.error("Create user error:", error)
    return { error: "Failed to create user" }
  }
}

// Update user
export async function updateUser(formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedFields = updateUserSchema.safeParse({
      id: formData.get("id"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      contactNo: formData.get("contactNo") || undefined,
      role: formData.get("role"),
    })

    if (!validatedFields.success) {
      return {
        error: "Invalid input",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { id, firstName, lastName, email, contactNo, role } = validatedFields.data

    // Get current user data for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        contactNo: true,
        role: true,
      },
    })

    if (!currentUser) {
      return { error: "User not found" }
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    })

    if (existingUser) {
      return { error: "Email is already taken by another user" }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        contactNo,
        role,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNo: true,
        role: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityId: id,
        entityType: "USER",
        action: "UPDATE",
        userId: session.user.id,
        changes: {
          action: "User updated",
          before: currentUser,
          after: {
            firstName,
            lastName,
            email,
            contactNo,
            role,
          },
        },
      },
    })

    revalidatePath("/dashboard/users")
    
    return { success: "User updated successfully", user: updatedUser }
  } catch (error) {
    console.error("Update user error:", error)
    return { error: "Failed to update user" }
  }
}

// Change user password (admin function)
export async function changeUserPassword(formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedFields = changeUserPasswordSchema.safeParse({
      userId: formData.get("userId"),
      newPassword: formData.get("newPassword"),
    })

    if (!validatedFields.success) {
      return {
        error: "Invalid input",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { userId, newPassword } = validatedFields.data

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password: true },
    })

    if (!user) {
      return { error: "User not found" }
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    
    if (isSamePassword) {
      return { error: "New password must be different from current password" }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityId: userId,
        entityType: "USER",
        action: "PASSWORD_CHANGE",
        userId: session.user.id,
        changes: {
          action: "Password changed by admin",
          targetUser: user.email,
          changedBy: session.user.email,
        },
      },
    })

    revalidatePath("/dashboard/users")
    
    return { success: "Password changed successfully" }
  } catch (error) {
    console.error("Change user password error:", error)
    return { error: "Failed to change password" }
  }
}

// Delete user
export async function deleteUser(userId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return { error: "You cannot delete your own account" }
    }

    // Get user data for audit log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      return { error: "User not found" }
    }

    // Delete user (this will cascade to related records)
    await prisma.user.delete({
      where: { id: userId },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityId: userId,
        entityType: "USER",
        action: "DELETE",
        userId: session.user.id,
        changes: {
          action: "User deleted",
          deletedUser: user,
          deletedBy: session.user.email,
        },
      },
    })

    revalidatePath("/dashboard/users")
    
    return { success: "User deleted successfully" }
  } catch (error) {
    console.error("Delete user error:", error)
    return { error: "Failed to delete user" }
  }
}

// Get user by ID
export async function getUserById(userId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNo: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
      },
    })

    if (!user) {
      return { error: "User not found" }
    }

    return { user }
  } catch (error) {
    console.error("Get user by ID error:", error)
    return { error: "Failed to fetch user" }
  }
}