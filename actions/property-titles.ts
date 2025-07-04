'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { propertyTitleSchema } from "@/lib/utils/validation";

const prisma = new PrismaClient();

export async function getPropertyTitles(propertyId: string) {
  try {
    const propertyTitles = await prisma.propertyTitles.findMany({
      where: {
        propertyId: propertyId,
      },
      select: {
        id: true,
        titleNo: true,
        lotNo: true,
        lotArea: true,
        registeredOwner: true,
        isEncumbered: true,
        encumbranceDetails: true,
      },
      orderBy: {
        titleNo: 'asc',
      },
    });

    return propertyTitles;
  } catch (error) {
    console.error('Error fetching property titles:', error);
    throw new Error('Failed to fetch property titles');
  } finally {
    await prisma.$disconnect();
  }
}

export async function createPropertyTitle(formData: FormData) {
  try {
    const rawData = {
      titleNo: formData.get("titleNo") as string,
      lotNo: formData.get("lotNo") as string,
      lotArea: parseFloat(formData.get("lotArea") as string),
      registeredOwner: formData.get("registeredOwner") as string,
      isEncumbered: formData.get("isEncumbered") === "true",
      encumbranceDetails: formData.get("encumbranceDetails") as string || undefined,
    };

    // Validate the data
    const validatedData = propertyTitleSchema.parse(rawData);
    const propertyId = formData.get("propertyId") as string;

    if (!propertyId) {
      throw new Error("Property ID is required");
    }

    // Check if title number already exists
    const existingTitle = await prisma.propertyTitles.findUnique({
      where: { titleNo: validatedData.titleNo }
    });

    if (existingTitle) {
      throw new Error("Title number already exists");
    }

    // Create the property title
    await prisma.propertyTitles.create({
      data: {
        ...validatedData,
        propertyId,
      },
    });

    revalidatePath(`/dashboard/properties/${propertyId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to create property title");
  } finally {
    await prisma.$disconnect();
  }
}

export async function deletePropertyTitle(titleId: string, propertyId: string) {
  try {
    await prisma.propertyTitles.delete({
      where: { id: titleId }
    });

    revalidatePath(`/dashboard/properties/${propertyId}`);
    return { success: true };
  } catch (error) {
    throw new Error("Failed to delete property title");
  } finally {
    await prisma.$disconnect();
  }
}