'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

import { createAuditLog } from "@/lib/audit";

import { TenantStatus, NotificationType, EntityType } from "@prisma/client";
import { AppError } from "@/lib/utils/error";
import { auth } from "@/auth";
import { createNotification } from "@/lib/utils/notifications";

export async function getTenants() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    return await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        leases: {
          include: {
            unit: {
              include: {
                property: true,
              },
            },
            tenant: true,
            payments: true,
          },
        },
        maintenanceRequests: {
          include: {
            unit: {
              include: {
                property: true,
              },
            },
          },
        },
        documents: true,
      },
    });
  } catch (error) {
    throw new AppError(
      "Failed to fetch tenants",
      500,
      "TENANT_FETCH_ERROR"
    );
  }
}

  export async function getTenantById(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401);
    }
  
    try {
      return await prisma.tenant.findUnique({
        where: { id },
        include: {
          leases: {
            include: {
              unit: {
                include: {
                  property: true,
                },
              },
              tenant: true,
              payments: true,
            },
          },
          maintenanceRequests: {
            include: {
              unit: {
                include: {
                  property: true,
                },
              },
            },
          },
          documents: true,
        },
      });
    } catch (error) {
      throw new AppError(
        "Failed to fetch tenant",
        500,
        "TENANT_FETCH_ERROR"
      );
    }
  }

export async function createTenant(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Get all users for global notification
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true }
    });

    const creator = users.find(u => u.id === session.user.id);
    const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown user';

    const tenant = await prisma.tenant.create({
      data: {
        bpCode: formData.get('bpCode') as string,
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        company: formData.get('company') as string,
        businessName: formData.get('businessName') as string || null,
        status: formData.get('status') as TenantStatus,
        emergencyContactName: formData.get('emergencyContactName') as string || null,
        emergencyContactPhone: formData.get('emergencyContactPhone') as string || null,
        createdById: session.user.id,
      },
    });

    await createAuditLog({
      entityId: tenant.id,
      entityType: EntityType.TENANT,
      action: "CREATE",
      changes: Object.fromEntries(formData),
    });

    // Notify all users about the new tenant
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "New Tenant Added",
          message: `New tenant ${tenant.firstName} ${tenant.lastName} has been added by ${creatorName}`,
          type: NotificationType.TENANT,
          entityId: tenant.id,
          entityType: EntityType.TENANT,
          actionUrl: `/dashboard/tenants?selected=${tenant.id}`,
        })
      )
    );

    revalidatePath("/dashboard/tenants");
    return tenant;
  } catch (error) {
    throw new Error("Failed to create tenant");
  }
}

export async function updateTenant(id: string, formData: FormData) {
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

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        bpCode: data.bpCode as string,
        firstName: data.firstName as string,
        lastName: data.lastName as string,
        email: data.email as string,
        phone: data.phone as string,
        company: data.company as string,
        status: data.status as TenantStatus,
        emergencyContactName: data.emergencyContactName as string,
        emergencyContactPhone: data.emergencyContactPhone as string,
      },
    });

    await createAuditLog({
      entityId: tenant.id,
      entityType: EntityType.TENANT,
      action: "UPDATE",
      changes: data,
    });

    // Notify all users about the tenant update
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Tenant Updated",
          message: `Tenant ${tenant.firstName} ${tenant.lastName} has been updated by ${updaterName}`,
          type: NotificationType.TENANT,
          entityId: tenant.id,
          entityType: EntityType.TENANT,
          actionUrl: `/dashboard/tenants?selected=${tenant.id}`,
        })
      )
    );

    revalidatePath("/dashboard/tenants");
    return tenant;
  } catch (error) {
    throw new AppError(
      "Failed to update tenant",
      500,
      "TENANT_UPDATE_ERROR"
    );
  }
}

export async function deleteTenant(id: string) {
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

    const tenant = await prisma.tenant.delete({
      where: { id },
    });

    await createAuditLog({
      entityId: tenant.id,
      entityType: EntityType.TENANT,
      action: "DELETE",
    });

    // Notify all users about the tenant deletion
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Tenant Deleted",
          message: `Tenant ${tenant.firstName} ${tenant.lastName} has been deleted by ${deleterName}`,
          type: NotificationType.TENANT,
          priority: "HIGH",
          entityId: tenant.id,
          entityType: EntityType.TENANT,
          actionUrl: `/dashboard/tenants`,
        })
      )
    );

    revalidatePath("/dashboard/tenants");
    return tenant;
  } catch (error) {
    throw new AppError(
      "Failed to delete tenant",
      500,
      "TENANT_DELETE_ERROR"
    );
  }
}

export async function bulkDeleteTenants(ids: string[]) {
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

    const tenants = await prisma.tenant.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    await prisma.tenant.deleteMany({
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
          entityType: EntityType.TENANT,
          action: "DELETE",
        })
      )
    );

    // Notify all users about bulk tenant deletion
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Tenants Deleted",
          message: `${tenants.length} tenants have been deleted by ${deleterName}`,
          type: NotificationType.TENANT,
          priority: "HIGH",
          entityType: EntityType.TENANT,
          actionUrl: `/dashboard/tenants`,
        })
      )
    );

    revalidatePath("/dashboard/tenants");
  } catch (error) {
    throw new AppError(
      "Failed to delete tenants",
      500,
      "TENANT_BULK_DELETE_ERROR"
    );
  }
}

function normalizeTenantStatus(status: string): TenantStatus {
  const normalized = status.toUpperCase().trim();
  
  if (Object.values(TenantStatus).includes(normalized as TenantStatus)) {
    return normalized as TenantStatus;
  }
  
  throw new Error(`Invalid tenant status: ${status}. Must be one of: ${Object.values(TenantStatus).join(', ')}`);
}

export async function importTenantsFromCSV(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const file = formData.get('file') as File;
  const text = await file.text();
  const [headers, ...rows] = text.split('\n').map(row => row.trim()).filter(Boolean);
  const headerArray = headers.split(',').map(h => h.trim());

  try {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true }
    });

    const importer = users.find(u => u.id === session.user.id);
    const importerName = importer ? `${importer.firstName} ${importer.lastName}` : 'Unknown user';

    const tenants = rows.map(row => {
      const values = row.split(',').map(v => v.trim());
      const tenant = headerArray.reduce((obj, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {} as any);

      return {
        bpCode: tenant.bpCode,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email,
        phone: tenant.phone,
        company: tenant.company,
        status: normalizeTenantStatus(tenant.status),
        emergencyContactName: tenant.emergencyContactName,
        emergencyContactPhone: tenant.emergencyContactPhone,
        createdById: session.user.id,
      };
    });

    const createdTenants = await prisma.$transaction(
      tenants.map(tenant => 
        prisma.tenant.create({
          data: tenant
        })
      )
    );

    await Promise.all(
      createdTenants.map(tenant => 
        Promise.all([
          createAuditLog({
            entityId: tenant.id,
            entityType: EntityType.TENANT,
            action: "CREATE",
            changes: tenant,
            metadata: { source: "CSV_IMPORT" }
          }),
          ...users.map(user =>
            createNotification({
              userId: user.id,
              title: "Tenant Imported",
              message: `Tenant ${tenant.firstName} ${tenant.lastName} has been imported by ${importerName}`,
              type: NotificationType.TENANT,
              entityId: tenant.id,
              entityType: EntityType.TENANT,
              actionUrl: `/dashboard/tenants?selected=${tenant.id}`,
            })
          )
        ])
      )
    );

    revalidatePath("/dashboard/tenants");
    return createdTenants;
  } catch (error) {
    throw new AppError(
      "Failed to import tenants",
      500,
      "TENANT_IMPORT_ERROR"
    );
  }
}