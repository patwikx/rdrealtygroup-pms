'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { EntityType, NotificationType } from "@prisma/client";
import { AppError } from "@/lib/utils/error";
import { auth } from "@/auth";
import { createNotification } from "@/lib/utils/notifications";

export async function createPropertyTax(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const data = Object.fromEntries(formData);
  
  try {
    // Get all users for global notification
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true }
    });

    const creator = users.find(u => u.id === session.user.id);
    const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown user';

    // Get the property title and property info for notifications
    const propertyTitle = await prisma.propertyTitles.findUnique({
      where: { id: data.propertyTitleId as string },
      include: {
        property: true
      }
    });

    if (!propertyTitle) {
      throw new AppError("Property title not found", 404);
    }

    const propertyTax = await prisma.propertyTax.create({
      data: {
        propertyTitle: {
          connect: {
            id: data.propertyTitleId as string
          }
        },
        taxYear: parseInt(data.taxYear as string),
        TaxDecNo: data.taxDecNo as string,
        taxAmount: parseFloat(data.taxAmount as string),
        dueDate: new Date(data.dueDate as string),
        isAnnual: data.isAnnual === "true",
        isQuarterly: data.isQuarterly === "true",
        whatQuarter: data.whatQuarter as string || null,
        processedBy: data.processedBy as string || null,
        remarks: data.remarks as string || null,
        markedAsPaidBy: data.markedAsPaidBy as string,
      },
      include: {
        propertyTitle: {
          include: {
            property: true
          }
        },
      },
    });

    await createAuditLog({
      entityId: propertyTax.id,
      entityType: EntityType.PROPERTY_TAX,
      action: "CREATE",
      changes: data,
    });

    // Notify all users about the new property tax record
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Property Tax Record Added",
          message: `Property tax record for ${propertyTitle.property.propertyName} - Title ${propertyTitle.titleNo} (${propertyTax.taxYear}) has been added by ${creatorName}`,
          type: NotificationType.TAX,
          entityId: propertyTax.id,
          entityType: EntityType.PROPERTY_TAX,
          actionUrl: `/dashboard/properties/${propertyTitle.propertyId}`,
        })
      )
    );

    revalidatePath(`/dashboard/properties/${propertyTitle.propertyId}`);
    return propertyTax;
  } catch (error) {
    console.error("Error creating property tax:", error);
    throw new AppError(
      "Failed to create property tax record. Please try again.",
      500
    );
  }
}

export async function updatePropertyTax(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const data = Object.fromEntries(formData);
  
  try {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true }
    });

    const updater = users.find(u => u.id === session.user.id);
    const updaterName = updater ? `${updater.firstName} ${updater.lastName}` : 'Unknown user';

    const propertyTax = await prisma.propertyTax.update({
      where: { id },
      data: {
        taxYear: parseInt(data.taxYear as string),
        TaxDecNo: data.taxDecNo as string,
        taxAmount: parseFloat(data.taxAmount as string),
        dueDate: new Date(data.dueDate as string),
        isPaid: data.isPaid === "true",
        paidDate: data.isPaid === "true" ? new Date() : null,
        isAnnual: data.isAnnual === "true",
        isQuarterly: data.isQuarterly === "true",
        whatQuarter: data.whatQuarter as string || null,
        processedBy: data.processedBy as string || null,
        remarks: data.remarks as string || null,
      },
      include: {
        propertyTitle: {
          include: {
            property: true
          }
        },
      },
    });

    await createAuditLog({
      entityId: propertyTax.id,
      entityType: EntityType.PROPERTY_TAX,
      action: "UPDATE",
      changes: data,
    });

    // Notify all users about the property tax update
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Property Tax Record Updated",
          message: `Property tax record for ${propertyTax.propertyTitle.property.propertyName} - Title ${propertyTax.propertyTitle.titleNo} (${propertyTax.taxYear}) has been updated by ${updaterName}`,
          type: NotificationType.TAX,
          entityId: propertyTax.id,
          entityType: EntityType.PROPERTY_TAX,
          actionUrl: `/dashboard/properties/${propertyTax.propertyTitle.propertyId}`,
        })
      )
    );

    revalidatePath(`/dashboard/properties/${propertyTax.propertyTitle.propertyId}`);
    return propertyTax;
  } catch (error) {
    console.error("Error updating property tax:", error);
    throw new AppError(
      "Failed to update property tax record. Please try again.",
      500
    );
  }
}

export async function deletePropertyTax(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true }
    });

    const deleter = users.find(u => u.id === session.user.id);
    const deleterName = deleter ? `${deleter.firstName} ${deleter.lastName}` : 'Unknown user';

    const propertyTax = await prisma.propertyTax.delete({
      where: { id },
      include: {
        propertyTitle: {
          include: {
            property: true
          }
        },
      },
    });

    await createAuditLog({
      entityId: propertyTax.id,
      entityType: EntityType.PROPERTY_TAX,
      action: "DELETE",
    });

    // Notify all users about the property tax deletion
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Property Tax Record Deleted",
          message: `Property tax record for ${propertyTax.propertyTitle.property.propertyName} - Title ${propertyTax.propertyTitle.titleNo} (${propertyTax.taxYear}) has been deleted by ${deleterName}`,
          type: NotificationType.TAX,
          priority: "HIGH",
          entityId: propertyTax.id,
          entityType: EntityType.PROPERTY_TAX,
          actionUrl: `/dashboard/properties/${propertyTax.propertyTitle.propertyId}`,
        })
      )
    );

    revalidatePath(`/dashboard/properties/${propertyTax.propertyTitle.propertyId}`);
    return propertyTax;
  } catch (error) {
    console.error("Error deleting property tax:", error);
    throw new AppError(
      "Failed to delete property tax record. Please try again.",
      500
    );
  }
}

export async function updatePropertyTaxStatus(id: string, isPaid: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    const tax = await prisma.propertyTax.update({
      where: { id },
      data: {
        isPaid,
        paidDate: isPaid ? new Date() : null,
      },
      include: {
        propertyTitle: {
          include: {
            property: true
          }
        }
      }
    });

    await createAuditLog({
      entityId: tax.id,
      entityType: EntityType.PROPERTY_TAX,
      action: "UPDATE",
      changes: { isPaid, paidDate: isPaid ? new Date() : null },
    });

    revalidatePath(`/dashboard/properties/${tax.propertyTitle.propertyId}`);
    return tax;
  } catch (error) {
    console.error("Error updating property tax status:", error);
    throw new AppError("Failed to update property tax status. Please try again.", 500);
  }
}

export async function updateUtilityStatus(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    const utility = await prisma.propertyUtility.update({
      where: { id },
      data: {
        isActive,
      },
    });

    await createAuditLog({
      entityId: utility.id,
      entityType: EntityType.UTILITY_BILL,
      action: "UPDATE",
      changes: { isActive },
    });

    revalidatePath(`/dashboard/properties/${utility.propertyId}`);
    return utility;
  } catch (error) {
    console.error("Error updating utility status:", error);
    throw new AppError("Failed to update utility status. Please try again.", 500);
  }
}

export async function deletePropertyUtility(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    const utility = await prisma.propertyUtility.delete({
      where: { id },
    });

    await createAuditLog({
      entityId: utility.id,
      entityType: EntityType.UTILITY_BILL,
      action: "DELETE",
    });

    revalidatePath(`/dashboard/properties/${utility.propertyId}`);
    return utility;
  } catch (error) {
    console.error("Error deleting utility:", error);
    throw new AppError("Failed to delete utility. Please try again.", 500);
  }
}