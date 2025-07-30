"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import {
  type CreatePDCInput,
  createPDCSchema,
  type UpdatePDCStatusInput,
  updatePDCStatusSchema,
  type UpdatePDCInput,
  updatePDCSchema, // You will add this to your validations file
} from "@/lib/validations/pdc-valitdations"

export async function createPDC(data: CreatePDCInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const validatedData = createPDCSchema.parse(data)

    const tenant = await prisma.tenant.findUnique({
      where: { bpCode: validatedData.bpCode },
      select: { company: true, businessName: true },
    })

    if (!tenant) {
      return { success: false, error: "Tenant not found" }
    }

    const pdc = await prisma.pDC.create({
      data: {
        ...validatedData,
        bpName: tenant.company || tenant.businessName,
        updatedById: session.user.id,
      },
    })

    revalidatePath("/credit-collection")
    return { success: true, data: pdc }
  } catch (error) {
    console.error("Error creating PDC:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create PDC",
    }
  }
}

// NEW FUNCTION TO UPDATE A PDC RECORD
export async function updatePDC(data: UpdatePDCInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { id, ...updateData } = updatePDCSchema.parse(data)

    await prisma.pDC.update({
      where: { id },
      data: {
        ...updateData,
        updatedById: session.user.id,
      },
    })

    revalidatePath("/credit-collection")
    return { success: true, message: "PDC record updated successfully." }
  } catch (error) {
    console.error("Error updating PDC:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update PDC",
    }
  }
}

export async function updatePDCStatus(data: UpdatePDCStatusInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const validatedData = updatePDCStatusSchema.parse(data)

    const pdc = await prisma.pDC.update({
      where: { id: validatedData.id },
      data: {
        status: validatedData.status,
        updatedById: session.user.id,
      },
    })

    revalidatePath("/credit-collection")
    return { success: true, data: pdc }
  } catch (error) {
    console.error("Error updating PDC status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update PDC status",
    }
  }
}

export async function getPDCs() {
  try {
    const pdcs = await prisma.pDC.findMany({
      include: {
        tenant: {
          select: {
            company: true,
            businessName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        docDate: "desc",
      },
    })

    return pdcs
  } catch (error) {
    console.error("Error fetching PDCs:", error)
    return []
  }
}

export async function getTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        bpCode: true,
        company: true,
        businessName: true,
        email: true,
      },
      orderBy: {
        company: "asc",
      },
    })

    return tenants
  } catch (error) {
    console.error("Error fetching tenants:", error)
    return []
  }
}

export async function deletePDC(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.pDC.delete({
      where: { id },
    })

    revalidatePath("/credit-collection")
    return { success: true }
  } catch (error) {
    console.error("Error deleting PDC:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete PDC",
    }
  }
}
