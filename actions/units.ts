'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { EntityType, NotificationType, UnitStatus } from "@prisma/client";
import { AppError } from "@/lib/utils/error";
import { auth } from "@/auth";
import { createNotification } from "@/lib/utils/notifications";

export async function createUnit(formData: FormData) {
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

    const unitData: any = {
      propertyId: data.propertyId as string,
      unitNumber: data.unitNumber as string,
      unitArea: parseFloat(data.unitArea as string),
      unitRate: parseFloat(data.unitRate as string),
      rentAmount: parseFloat(data.rentAmount as string),
      status: data.status as UnitStatus,
      // Add new floor-related fields
      isFirstFloor: data.isFirstFloor === 'true',
      isSecondFloor: data.isSecondFloor === 'true',
      isThirdFloor: data.isThirdFloor === 'true',
      isRoofTop: data.isRoofTop === 'true',
      isMezzanine: data.isMezzanine === 'true',
    };

    if (data.propertyTitleId) {
      unitData.propertyTitleId = data.propertyTitleId as string;
    }

    const unit = await prisma.unit.create({
      data: unitData,
      include: {
        property: true,
      },
    });

    // Update property total units count
    await prisma.property.update({
      where: { id: data.propertyId as string },
      data: {
        totalUnits: {
          increment: 1
        }
      }
    });

    await createAuditLog({
      entityId: unit.id,
      entityType: EntityType.UNIT,
      action: "CREATE",
      changes: data,
    });

    // Notify all users about the new unit
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "New Space Added",
          message: `Space ${unit.unitNumber} has been added to ${unit.property.propertyName} by ${creatorName}`,
          type: NotificationType.UNIT,
          entityId: unit.id,
          entityType: EntityType.UNIT,
          actionUrl: `/dashboard/properties?selected=${data.propertyId}`,
        })
      )
    );

    revalidatePath(`/dashboard/properties/${data.propertyId}`);
    return unit;
  } catch (error) {
    console.error("Error creating unit:", error);
    throw new AppError(
      "Failed to create space. Please try again.",
      500
    );
  }
}

export async function updateUnit(id: string, formData: FormData) {
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

    const updateData: any = {
      unitNumber: data.unitNumber as string,
      unitArea: parseFloat(data.unitArea as string),
      unitRate: parseFloat(data.unitRate as string),
      rentAmount: parseFloat(data.rentAmount as string),
      status: data.status as UnitStatus,
      // Add new floor-related fields
      isFirstFloor: data.isFirstFloor === 'true',
      isSecondFloor: data.isSecondFloor === 'true',
      isThirdFloor: data.isThirdFloor === 'true',
      isRoofTop: data.isRoofTop === 'true',
      isMezzanine: data.isMezzanine === 'true',
    };

    if (data.propertyTitleId) {
      updateData.propertyTitleId = data.propertyTitleId as string;
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: updateData,
      include: {
        property: true,
      },
    });

    await createAuditLog({
      entityId: unit.id,
      entityType: EntityType.UNIT,
      action: "UPDATE",
      changes: data,
    });

    // Notify all users about the unit update
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Space Updated",
          message: `Space ${unit.unitNumber} in ${unit.property.propertyName} has been updated by ${updaterName}`,
          type: NotificationType.UNIT,
          entityId: unit.id,
          entityType: EntityType.UNIT,
          actionUrl: `/dashboard/properties?selected=${unit.propertyId}`,
        })
      )
    );

    revalidatePath(`/dashboard/properties/${unit.propertyId}`);
    return unit;
  } catch (error) {
    console.error("Error updating unit:", error);
    throw new AppError(
      "Failed to update space. Please try again.",
      500
    );
  }
}

export async function deleteUnit(id: string) {
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

    const unit = await prisma.unit.delete({
      where: { id },
      include: {
        property: true,
      },
    });

    // Update property total units count
    await prisma.property.update({
      where: { id: unit.propertyId },
      data: {
        totalUnits: {
          decrement: 1
        }
      }
    });

    await createAuditLog({
      entityId: unit.id,
      entityType: EntityType.UNIT,
      action: "DELETE",
    });

    // Notify all users about the unit deletion
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Space Deleted",
          message: `Space ${unit.unitNumber} has been deleted from ${unit.property.propertyName} by ${deleterName}`,
          type: NotificationType.UNIT,
          priority: "HIGH",
          entityId: unit.id,
          entityType: EntityType.UNIT,
          actionUrl: `/dashboard/properties?selected=${unit.propertyId}`,
        })
      )
    );

    revalidatePath(`/dashboard/properties/${unit.propertyId}`);
    return unit;
  } catch (error) {
    console.error("Error deleting unit:", error);
    throw new AppError(
      "Failed to delete space. Please try again.",
      500
    );
  }
}

export async function getAvailableUnits() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    return await prisma.unit.findMany({
      where: {
        OR: [
          { status: UnitStatus.VACANT },
          { status: UnitStatus.RESERVED }
        ]
      },
      include: {
        property: true
      }
    });
  } catch (error) {
    throw new AppError(
      "Failed to fetch available spaces",
      500,
      "UNIT_FETCH_ERROR"
    );
  }
}

export async function bulkDeleteUnits(ids: string[]) {
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

    const units = await prisma.unit.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        property: true,
      },
    });
    
    await prisma.unit.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    
    await Promise.all(
      ids.map((id) =>
        createAuditLog({
          entityId: id,
          entityType: EntityType.UNIT,
          action: "DELETE",
        })
      )
    );
    
    // Notify all users about bulk unit deletion
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Spaces Deleted",
          message: `${units.length} spaces have been deleted by ${deleterName}`,
          type: NotificationType.UNIT,
          priority: "HIGH",
          entityType: EntityType.UNIT,
        })
      )
    );
    
    revalidatePath("/dashboard/spaces");
  } catch (error) {
    throw new AppError(
      "Failed to delete units",
      500,
      "UNIT_BULK_DELETE_ERROR"
    );
  }
}

export async function updateUnitDialog(id: string, formData: FormData) {
  const unitArea = formData.get("unitArea");
  const unitRate = formData.get("unitRate");
  const rentAmount = formData.get("rentAmount");
  const isFirstFloor = formData.get("isFirstFloor") === "on";
  const isSecondFloor = formData.get("isSecondFloor") === "on";
  const isThirdFloor = formData.get("isThirdFloor") === "on";
  const isRoofTop = formData.get("isRoofTop") === "on";
  const isMezzanine = formData.get("isMezzanine") === "on";

  const updatedUnit = await prisma.unit.update({
    where: { id },
    data: {
      unitArea: parseFloat(unitArea as string),
      unitRate: parseFloat(unitRate as string),
      rentAmount: parseFloat(rentAmount as string),
      isFirstFloor,
      isSecondFloor,
      isThirdFloor,
      isRoofTop,
      isMezzanine,
    },
  });

  revalidatePath("/dashboard/spaces");
  revalidatePath(`/units/${id}`);
  
  return updatedUnit;
}