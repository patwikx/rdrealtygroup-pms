'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { EntityType, NotificationType, UnitStatus, FloorType } from "@prisma/client";
import { AppError } from "@/lib/utils/error";
import { auth } from "@/auth";
import { createNotification } from "@/lib/utils/notifications";

interface FloorItem {
  floorType: string;
  area: number;
  rate: number;
}

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

    // Parse floors data
    const floorsData: FloorItem[] = JSON.parse(data.floors as string);
    
    // Validate floors data
    if (!floorsData || floorsData.length === 0) {
      throw new AppError("At least one floor must be specified", 400);
    }

    const unitData: any = {
      propertyId: data.propertyId as string,
      unitNumber: data.unitNumber as string,
      totalArea: parseFloat(data.totalArea as string),
      totalRent: parseFloat(data.totalRent as string),
      status: data.status as UnitStatus,
    };

    if (data.propertyTitleId) {
      unitData.propertyTitleId = data.propertyTitleId as string;
    }

    // Create unit with floors in a transaction
    const unit = await prisma.$transaction(async (prisma) => {
      // Create the unit
      const createdUnit = await prisma.unit.create({
        data: unitData,
        include: {
          property: true,
        },
      });

      // Create the unit floors
      const floorPromises = floorsData.map(floor => {
        return prisma.unitFloor.create({
          data: {
            unitId: createdUnit.id,
            floorType: floor.floorType as FloorType,
            area: floor.area,
            rate: floor.rate,
            rent: floor.area * floor.rate,
          },
        });
      });

      await Promise.all(floorPromises);

      return createdUnit;
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
      changes: { ...data, floors: floorsData },
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

    // Parse floors data
    const floorsData: FloorItem[] = JSON.parse(data.floors as string);
    
    // Validate floors data
    if (!floorsData || floorsData.length === 0) {
      throw new AppError("At least one floor must be specified", 400);
    }

    const updateData: any = {
      unitNumber: data.unitNumber as string,
      totalArea: parseFloat(data.totalArea as string),
      totalRent: parseFloat(data.totalRent as string),
      status: data.status as UnitStatus,
    };

    if (data.propertyTitleId) {
      updateData.propertyTitleId = data.propertyTitleId as string;
    }

    // Update unit with floors in a transaction
    const unit = await prisma.$transaction(async (prisma) => {
      // Update the unit
      const updatedUnit = await prisma.unit.update({
        where: { id },
        data: updateData,
        include: {
          property: true,
        },
      });

      // Delete existing floors
      await prisma.unitFloor.deleteMany({
        where: { unitId: id },
      });

      // Create new floors
      const floorPromises = floorsData.map(floor => {
        return prisma.unitFloor.create({
          data: {
            unitId: id,
            floorType: floor.floorType as FloorType,
            area: floor.area,
            rate: floor.rate,
            rent: floor.area * floor.rate,
          },
        });
      });

      await Promise.all(floorPromises);

      return updatedUnit;
    });

    await createAuditLog({
      entityId: unit.id,
      entityType: EntityType.UNIT,
      action: "UPDATE",
      changes: { ...data, floors: floorsData },
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

    // Delete unit and associated floors (will cascade)
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
        property: true,
        unitFloors: true,
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
    
    // Delete units (floors will cascade)
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
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    // Parse floors data if provided
    const floorsData = formData.get("floors");
    let floors: FloorItem[] = [];
    
    if (floorsData) {
      floors = JSON.parse(floorsData as string);
    }

    const updateData: any = {};

    // Handle individual field updates
    if (formData.get("totalArea")) {
      updateData.totalArea = parseFloat(formData.get("totalArea") as string);
    }
    if (formData.get("totalRent")) {
      updateData.totalRent = parseFloat(formData.get("totalRent") as string);
    }
    if (formData.get("status")) {
      updateData.status = formData.get("status") as UnitStatus;
    }

    const updatedUnit = await prisma.$transaction(async (prisma) => {
      // Update the unit
      const unit = await prisma.unit.update({
        where: { id },
        data: updateData,
        include: {
          unitFloors: true,
        },
      });

      // If floors data is provided, update floors
      if (floors.length > 0) {
        // Delete existing floors
        await prisma.unitFloor.deleteMany({
          where: { unitId: id },
        });

        // Create new floors
        const floorPromises = floors.map(floor => {
          return prisma.unitFloor.create({
            data: {
              unitId: id,
              floorType: floor.floorType as FloorType,
              area: floor.area,
              rate: floor.rate,
              rent: floor.area * floor.rate,
            },
          });
        });

        await Promise.all(floorPromises);
      }

      return unit;
    });

    await createAuditLog({
      entityId: id,
      entityType: EntityType.UNIT,
      action: "UPDATE",
      changes: Object.fromEntries(formData),
    });

    revalidatePath("/dashboard/spaces");
    revalidatePath(`/units/${id}`);
    
    return updatedUnit;
  } catch (error) {
    console.error("Error updating unit:", error);
    throw new AppError(
      "Failed to update space. Please try again.",
      500
    );
  }
}

export async function getUnitWithFloors(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    return await prisma.unit.findUnique({
      where: { id },
      include: {
        property: true,
        propertyTitle: true,
        unitFloors: {
          orderBy: {
            floorType: 'asc'
          }
        },
        leaseUnits: {
          include: {
            lease: {
              
              include: {
                tenant: true
              }
            }
          }
        },
        maintenanceRequests: {
          where: {
            status: {
              not: 'COMPLETED'
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });
  } catch (error) {
    throw new AppError(
      "Failed to fetch space details",
      500,
      "UNIT_FETCH_ERROR"
    );
  }
}