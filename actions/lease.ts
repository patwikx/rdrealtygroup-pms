'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { EntityType, NotificationType, LeaseStatus, UnitStatus } from "@prisma/client";
import { AppError } from "@/lib/utils/error";
import { auth } from "@/auth";
import { createNotification } from "@/lib/utils/notifications";

export async function createMultiUnitLease(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const data = Object.fromEntries(formData);
  const units = JSON.parse(data.units as string) as Array<{
    unitId: string;
    rentAmount: number;
  }>;
  
  try {
    // Get all users for global notification
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    // Start a transaction since we need to update multiple records
    const lease = await prisma.$transaction(async (tx) => {
      // Create the lease
      const lease = await tx.lease.create({
        data: {
          tenant: {
            connect: {
              id: data.tenantId as string
            }
          },
          startDate: new Date(data.startDate as string),
          endDate: new Date(data.endDate as string),
          totalRentAmount: parseFloat(data.totalRentAmount as string),
          securityDeposit: parseFloat(data.securityDeposit as string),
          status: data.status as LeaseStatus || LeaseStatus.PENDING,
        },
        include: {
          tenant: true,
          leaseUnits: {
            include: {
              unit: {
                include: {
                  property: true
                }
              }
            }
          }
        }
      });

      // Create lease-unit relationships
      await Promise.all(
        units.map(unitData =>
          tx.leaseUnit.create({
            data: {
              leaseId: lease.id,
              unitId: unitData.unitId,
              rentAmount: unitData.rentAmount,
            }
          })
        )
      );

      // Update unit statuses to OCCUPIED if lease is active
      if (lease.status === LeaseStatus.ACTIVE) {
        await Promise.all(
          units.map(unitData =>
            tx.unit.update({
              where: { id: unitData.unitId },
              data: { status: UnitStatus.OCCUPIED }
            })
          )
        );
      }

      // Fetch the complete lease with all relations
      const completeLease = await tx.lease.findUnique({
        where: { id: lease.id },
        include: {
          tenant: true,
          leaseUnits: {
            include: {
              unit: {
                include: {
                  property: true
                }
              }
            }
          }
        }
      });

      return completeLease!;
    });

    await createAuditLog({
      entityId: lease.id,
      entityType: EntityType.LEASE,
      action: "CREATE",
      changes: { ...data, units },
    });

    // Create notification message with unit details
    const unitNames = lease.leaseUnits.map(lu => 
      `${lu.unit.property.propertyName} - ${lu.unit.unitNumber}`
    ).join(', ');

    // Notify all users about the new lease
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "New Multi-Unit Lease Created",
          message: `Multi-unit lease for ${lease.tenant.firstName} ${lease.tenant.lastName} has been created for: ${unitNames}`,
          type: NotificationType.LEASE,
          entityId: lease.id,
          entityType: EntityType.LEASE,
          actionUrl: `/dashboard/tenants?selected=${lease.tenantId}`,
        })
      )
    );

    // Revalidate all necessary paths
    revalidatePath("/dashboard/tenants");
    revalidatePath("/dashboard/spaces");
    revalidatePath(`/dashboard/tenants/${data.tenantId}`);
    
    return lease;
  } catch (error) {
    console.error('Error creating multi-unit lease:', error);
    throw new AppError(
      "Failed to create multi-unit lease. Please try again.",
      500,
      "MULTI_UNIT_LEASE_CREATE_ERROR"
    );
  }
}

export async function updateLease(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const data = Object.fromEntries(formData);
  
  try {
    // Get all users for global notification
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    const lease = await prisma.$transaction(async (tx) => {
      const lease = await tx.lease.update({
        where: { id },
        data: {
          startDate: new Date(data.startDate as string),
          endDate: new Date(data.endDate as string),
          totalRentAmount: parseFloat(data.totalRentAmount as string),
          securityDeposit: parseFloat(data.securityDeposit as string),
          status: data.status as LeaseStatus,
        },
        include: {
          tenant: true,
          leaseUnits: {
            include: {
              unit: {
                include: {
                  property: true
                }
              }
            }
          }
        }
      });

      // Update unit statuses based on lease status
      await Promise.all(
        lease.leaseUnits.map(leaseUnit =>
          tx.unit.update({
            where: { id: leaseUnit.unitId },
            data: {
              status: lease.status === LeaseStatus.ACTIVE ? UnitStatus.OCCUPIED : UnitStatus.VACANT
            }
          })
        )
      );

      return lease;
    });

    await createAuditLog({
      entityId: lease.id,
      entityType: EntityType.LEASE,
      action: "UPDATE",
      changes: data,
    });

    // Create notification message with unit details
    const unitNames = lease.leaseUnits.map(lu => 
      `${lu.unit.property.propertyName} - ${lu.unit.unitNumber}`
    ).join(', ');

    // Notify all users about the lease update
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Lease Updated",
          message: `Lease for ${lease.tenant.firstName} ${lease.tenant.lastName} has been updated. Units: ${unitNames}`,
          type: NotificationType.LEASE,
          entityId: lease.id,
          entityType: EntityType.LEASE,
          actionUrl: `/dashboard/tenants?selected=${lease.tenantId}`,
        })
      )
    );

    revalidatePath("/dashboard/tenants");
    return lease;
  } catch (error) {
    throw new AppError(
      "Failed to update lease. Please try again.",
      500,
      "LEASE_UPDATE_ERROR"
    );
  }
}

export async function terminateLease(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const data = Object.fromEntries(formData);
  
  try {
    // Get all users for global notification
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    const lease = await prisma.$transaction(async (tx) => {
      const lease = await tx.lease.update({
        where: { id },
        data: {
          status: LeaseStatus.TERMINATED,
          terminationDate: new Date(data.terminationDate as string),
          terminationReason: data.reason as string,
        },
        include: {
          tenant: true,
          leaseUnits: {
            include: {
              unit: {
                include: {
                  property: true
                }
              }
            }
          }
        }
      });

      // Update all unit statuses to VACANT
      await Promise.all(
        lease.leaseUnits.map(leaseUnit =>
          tx.unit.update({
            where: { id: leaseUnit.unitId },
            data: { status: UnitStatus.VACANT }
          })
        )
      );

      return lease;
    });

    await createAuditLog({
      entityId: lease.id,
      entityType: EntityType.LEASE,
      action: "UPDATE",
      changes: { status: LeaseStatus.TERMINATED, ...data },
    });

    // Create notification message with unit details
    const unitNames = lease.leaseUnits.map(lu => 
      `${lu.unit.property.propertyName} - ${lu.unit.unitNumber}`
    ).join(', ');

    // Notify all users about the lease termination
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Lease Terminated",
          message: `Lease for ${lease.tenant.firstName} ${lease.tenant.lastName} has been terminated. Units: ${unitNames}`,
          type: NotificationType.LEASE,
          priority: "HIGH",
          entityId: lease.id,
          entityType: EntityType.LEASE,
          actionUrl: `/dashboard/tenants?selected=${lease.tenantId}`,
        })
      )
    );

    revalidatePath("/dashboard/tenants");
    return lease;
  } catch (error) {
    throw new AppError(
      "Failed to terminate lease. Please try again.",
      500,
      "LEASE_TERMINATE_ERROR"
    );
  }
}

export async function deleteLease(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    // Get all users for global notification
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    const lease = await prisma.$transaction(async (tx) => {
      // First get the lease with all relations before deletion
      const lease = await tx.lease.findUnique({
        where: { id },
        include: {
          tenant: true,
          leaseUnits: {
            include: {
              unit: {
                include: {
                  property: true
                }
              }
            }
          }
        }
      });

      if (!lease) {
        throw new AppError("Lease not found", 404);
      }

      // Update all unit statuses to VACANT
      await Promise.all(
        lease.leaseUnits.map(leaseUnit =>
          tx.unit.update({
            where: { id: leaseUnit.unitId },
            data: { status: UnitStatus.VACANT }
          })
        )
      );

      // Delete the lease (this will cascade to leaseUnits)
      await tx.lease.delete({
        where: { id }
      });

      return lease;
    });

    await createAuditLog({
      entityId: lease.id,
      entityType: EntityType.LEASE,
      action: "DELETE",
    });

    // Create notification message with unit details
    const unitNames = lease.leaseUnits.map(lu => 
      `${lu.unit.property.propertyName} - ${lu.unit.unitNumber}`
    ).join(', ');

    // Notify all users about the lease deletion
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Lease Deleted",
          message: `Lease for ${lease.tenant.firstName} ${lease.tenant.lastName} has been deleted. Units: ${unitNames}`,
          type: NotificationType.LEASE,
          priority: "HIGH",
          entityId: lease.id,
          entityType: EntityType.LEASE,
          actionUrl: `/dashboard/tenants?selected=${lease.tenantId}`,
        })
      )
    );

    revalidatePath("/dashboard/tenants");
    return lease;
  } catch (error) {
    throw new AppError(
      "Failed to delete lease. Please try again.",
      500,
      "LEASE_DELETE_ERROR"
    );
  }
}

// Legacy function for backward compatibility
export async function createLease(formData: FormData) {
  return createMultiUnitLease(formData);
}