'use server'

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { TitleMovementStatus } from "@prisma/client";

export async function createTitleMovement(propertyId: string, formData: FormData) {
  try {
    const location = formData.get("location") as string;
    const purpose = formData.get("purpose") as string;
    const status = formData.get("status") as TitleMovementStatus;
    const remarks = formData.get("remarks") as string;
    const requestedBy = formData.get("requestedBy") as string;

    if (!location || !purpose || !status || !requestedBy) {
      throw new Error("Missing required fields");
    }

    const titleMovement = await prisma.propertyTitleMovement.create({
      data: {
        propertyId,
        location,
        purpose,
        status,
        remarks,
        requestedBy,
      },
    });

    revalidatePath(`/dashboard/properties/${propertyId}`);
    return { success: true, data: titleMovement };
  } catch (error) {
    console.error("Error creating title movement:", error);
    return { success: false, error: "Failed to create title movement" };
  }
}

export async function updateTitleMovementStatus(
  id: string,
  status: TitleMovementStatus,
  returnDate?: Date
) {
  try {
    const titleMovement = await prisma.propertyTitleMovement.update({
      where: { id },
      data: {
        status,
        ...(status === "RETURNED" && { returnDate: returnDate || new Date() }),
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/dashboard/properties/${titleMovement.propertyId}`);
    return { success: true, data: titleMovement };
  } catch (error) {
    console.error("Error updating title movement status:", error);
    return { success: false, error: "Failed to update title movement status" };
  }
}

export async function deleteTitleMovement(id: string) {
  try {
    const titleMovement = await prisma.propertyTitleMovement.delete({
      where: { id },
    });

    revalidatePath(`/dashboard/properties/${titleMovement.propertyId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting title movement:", error);
    return { success: false, error: "Failed to delete title movement" };
  }
}

export async function getTitleMovements(propertyId: string) {
  try {
    const titleMovements = await prisma.propertyTitleMovement.findMany({
      where: { propertyId },
      orderBy: { requestDate: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return { success: true, data: titleMovements };
  } catch (error) {
    console.error("Error fetching title movements:", error);
    return { success: false, error: "Failed to fetch title movements" };
  }
}