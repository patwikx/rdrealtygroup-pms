'use server'

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { unitSchema } from "@/lib/validations/unit-page-validation"; // Assuming you have this validation schema
import { UnitStatus, FloorType } from "@prisma/client";

export async function createUnit(data: any) {
  const validated = unitSchema.parse(data);

  // Calculate totals from floor data
  const totalArea = validated.floors?.reduce((sum: number, floor: any) => sum + floor.area, 0) || 0;
  const totalRent = validated.floors?.reduce((sum: number, floor: any) => sum + floor.rent, 0) || 0;

  const unit = await prisma.unit.create({
    data: {
      propertyId: validated.propertyId,
      propertyTitleId: validated.propertyTitleId,
      unitNumber: validated.unitNumber,
      totalArea,
      totalRent,
      status: validated.status,
      unitFloors: {
        create: validated.floors?.map((floor: any) => ({
          floorType: floor.floorType,
          area: floor.area,
          rate: floor.rate,
          rent: floor.rent,
        })) || [],
      },
    },
    include: {
      property: {
        select: {
          propertyName: true,
        },
      },
      unitFloors: true,
    },
  });

  revalidatePath("/dashboard/spaces");
  return unit;
}

export async function updateUnit(id: string, data: any) {
  const validated = unitSchema.parse(data);

  // Calculate totals from floor data
  const totalArea = validated.floors?.reduce((sum: number, floor: any) => sum + floor.area, 0) || 0;
  const totalRent = validated.floors?.reduce((sum: number, floor: any) => sum + floor.rent, 0) || 0;

  // Use a transaction to ensure atomicity
  const unit = await prisma.$transaction(async (tx) => {
    // First, delete existing floors
    await tx.unitFloor.deleteMany({
        where: { unitId: id },
    });
    
    // Then, update the unit and create the new floors
    return tx.unit.update({
        where: { id },
        data: {
            propertyId: validated.propertyId,
            propertyTitleId: validated.propertyTitleId,
            unitNumber: validated.unitNumber,
            totalArea,
            totalRent,
            status: validated.status,
            unitFloors: {
                create: validated.floors?.map((floor: any) => ({
                    floorType: floor.floorType,
                    area: floor.area,
                    rate: floor.rate,
                    rent: floor.rent,
                })) || [],
            },
        },
        include: {
            property: {
                select: {
                    propertyName: true,
                },
            },
            unitFloors: true,
        },
    });
  });


  revalidatePath("/dashboard/spaces");
  revalidatePath(`/dashboard/spaces/${id}`);
  return unit;
}

export async function deleteUnit(id: string) {
  const unit = await prisma.unit.delete({
    where: { id },
  });

  revalidatePath("/dashboard/spaces");
  return unit;
}

export async function getProperties() {
  return await prisma.property.findMany({
    select: {
      id: true,
      propertyName: true,
    },
    orderBy: {
      propertyName: 'asc',
    },
  });
}

export async function getPropertyTitles(propertyId?: string) {
  return await prisma.propertyTitles.findMany({
    where: propertyId ? { propertyId } : undefined,
    select: {
      id: true,
      titleNo: true,
      lotNo: true,
      property: {
        select: {
          propertyName: true,
        },
      },
    },
    orderBy: {
      titleNo: 'asc',
    },
  });
}

export async function getUnits() {
  try {
    const units = await prisma.unit.findMany({
      include: {
        property: {
          select: {
            propertyName: true,
          },
        },
        propertyTitle: {
          select: {
            titleNo: true,
            lotNo: true,
          },
        },
        unitFloors: {
          select: {
            floorType: true,
            area: true,
            rate: true,
            rent: true,
          },
        },
      },
      orderBy: {
        unitNumber: 'asc',
      },
    });

    return units;
  } catch (error) {
    console.error('Error fetching units:', error);
    throw new Error('Failed to fetch units');
  }
}

export async function getUnitStats() {
  const total = await prisma.unit.count();
  const occupied = await prisma.unit.count({
    where: { status: UnitStatus.OCCUPIED },
  });
  const vacant = await prisma.unit.count({
    where: { status: UnitStatus.VACANT },
  });
  const maintenance = await prisma.unit.count({
    where: { status: UnitStatus.MAINTENANCE },
  });
  const reserved = await prisma.unit.count({
    where: { status: UnitStatus.RESERVED },
  });

  return {
    total,
    occupied,
    vacant,
    maintenance,
    reserved,
  };
}

export async function getUnitDetails(id: string) {
  return await prisma.unit.findUnique({
    where: { id },
    include: {
      property: true,
      propertyTitle: {
        select: {
          titleNo: true,
          lotNo: true,
          lotArea: true,
          registeredOwner: true,
        },
      },
      unitFloors: {
        orderBy: {
          floorType: 'asc',
        },
      },
      maintenanceRequests: {
        include: {
          // ✅ FIX: Changed from `select` to `true` to fetch the full tenant object.
          tenant: true, 
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      leaseUnits: {
        include: {
          lease: {
            include: {
              // ✅ FIX: Changed from `select` to `true` to fetch the full tenant object.
              tenant: true, 
            }
          }
        },
        orderBy: {
            createdAt: 'desc'
        }
      },
      unitTaxes: {
        orderBy: {
         taxYear: 'desc',
        },
      },
      utilityAccounts: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      documents: {
        orderBy: {
            createdAt: 'desc',
}
}
    },
  });
}

export async function getUnitDocuments(unitId: string) {
  return await prisma.document.findMany({

    select: {
      id: true,
      name: true,
      description: true, // Ensure description is optional
      fileUrl: true,
      documentType: true,
      createdAt: true,
      uploadedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    
    },
    where: {
      unitId: unitId,
    },

    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Helper function to get floor types enum values
export async function getFloorTypes() {
  return Object.values(FloorType);
}

// Helper function to calculate unit totals from floors
export async function calculateUnitTotals(floors: Array<{ area: number; rent: number }>) {
  return {
    totalArea: floors.reduce((sum, floor) => sum + floor.area, 0),
    totalRent: floors.reduce((sum, floor) => sum + floor.rent, 0),
  };
}
