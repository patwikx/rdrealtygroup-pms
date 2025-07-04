'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db"
import { PropertyType, NotificationType, EntityType } from "@prisma/client";
import { auth } from "@/auth";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/utils/notifications";


export async function createProperty(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const data = Object.fromEntries(formData);
  
  try {
    // Get all users for global notification
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true }
    });

    const creator = users.find(u => u.id === session.user.id);
    const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown user';

    const property = await prisma.property.create({
      data: {
        propertyName: data.propertyName as string,
        propertyCode: data.propertyCode as string,
        leasableArea: parseFloat(data.leasableArea as string),
        address: data.address as string,
        propertyType: data.propertyType as PropertyType,
        createdById: session.user.id,
      },
    });

    await createAuditLog({
      entityId: property.id,
      entityType: EntityType.PROPERTY,
      action: "CREATE",
      changes: data,
    });

    // Notify all users about the new property
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "New Property Created",
          message: `Property "${property.propertyName}" has been created by ${creatorName}`,
          type: NotificationType.PROPERTY,
          entityId: property.id,
          entityType: EntityType.PROPERTY,
          actionUrl: `/dashboard/properties?selected=${property.id}`,
        })
      )
    );

    revalidatePath("/dashboard/properties");
    return property;
  } catch (error) {
    throw new Error("Failed to create property");
  }
}

export async function updateProperty(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const data = Object.fromEntries(formData);
  
  try {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true }
    });

    const updater = users.find(u => u.id === session.user.id);
    const updaterName = updater ? `${updater.firstName} ${updater.lastName}` : 'Unknown user';

    const property = await prisma.property.update({
      where: { id },
      data: {
        propertyName: data.propertyName as string,
        propertyCode: data.propertyCode as string,
        leasableArea: parseFloat(data.leasableArea as string),
        address: data.address as string,
        propertyType: data.propertyType as PropertyType,
      },
    });

    await createAuditLog({
      entityId: property.id,
      entityType: EntityType.PROPERTY,
      action: "UPDATE",
      changes: data,
    });

    // Notify all users about the property update
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Property Updated",
          message: `Property "${property.propertyName}" has been updated by ${updaterName}`,
          type: NotificationType.PROPERTY,
          entityId: property.id,
          entityType: EntityType.PROPERTY,
          actionUrl: `/dashboard/properties?selected=${property.id}`,
        })
      )
    );

    revalidatePath("/dashboard/properties");
    return property;
  } catch (error) {
    throw new Error("Failed to update property");
  }
}

export async function deleteProperty(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true }
    });

    const deleter = users.find(u => u.id === session.user.id);
    const deleterName = deleter ? `${deleter.firstName} ${deleter.lastName}` : 'Unknown user';

    const property = await prisma.property.delete({
      where: { id },
    });

    await createAuditLog({
      entityId: property.id,
      entityType: EntityType.PROPERTY,
      action: "DELETE",
    });

    // Notify all users about the property deletion
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Property Deleted",
          message: `Property "${property.propertyName}" has been deleted by ${deleterName}`,
          type: NotificationType.PROPERTY,
          priority: "HIGH",
          entityId: property.id,
          entityType: EntityType.PROPERTY,
          actionUrl: `/dashboard/properties`,
        })
      )
    );

    revalidatePath("/dashboard/properties");
    return property;
  } catch (error) {
    throw new Error("Failed to delete property");
  }
}

export async function bulkDeleteProperties(ids: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true }
    });

    const deleter = users.find(u => u.id === session.user.id);
    const deleterName = deleter ? `${deleter.firstName} ${deleter.lastName}` : 'Unknown user';

    const properties = await prisma.property.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    await prisma.property.deleteMany({
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
          entityType: EntityType.PROPERTY,
          action: "DELETE",
        })
      )
    );

    // Notify all users about bulk property deletion
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "Properties Deleted",
          message: `${properties.length} properties have been deleted by ${deleterName}`,
          type: NotificationType.PROPERTY,
          priority: "HIGH",
          entityType: EntityType.PROPERTY,
          actionUrl: `/dashboard/properties`,
        })
      )
    );

    revalidatePath("/dashboard/properties");
  } catch (error) {
    throw new Error("Failed to delete properties");
  }
}

export async function exportProperties() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const properties = await prisma.property.findMany({
    include: {
      units: true,
      documents: true,
      utilities: true,
    },
  });

  return properties;
}

function normalizePropertyType(type: string): PropertyType {
  // Convert to uppercase and remove spaces
  const normalized = type.toUpperCase().trim();
  
  // Validate that it's a valid PropertyType
  if (Object.values(PropertyType).includes(normalized as PropertyType)) {
    return normalized as PropertyType;
  }
  
  throw new Error(`Invalid property type: ${type}. Must be one of: ${Object.values(PropertyType).join(', ')}`);
}

export async function importPropertiesFromCSV(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const file = formData.get('file') as File;
  const text = await file.text();
  const [headers, ...rows] = text.split('\n').map(row => row.trim()).filter(Boolean);
  const headerArray = headers.split(',').map(h => h.trim());

  const properties = rows.map(row => {
    const values = row.split(',').map(v => v.trim());
    const property = headerArray.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {} as any);

    try {
      return {
        propertyName: property.propertyName,
        propertyCode: property.propertyCode,
        leasableArea: parseFloat(property.leasableArea),
        address: property.address,
        propertyType: normalizePropertyType(property.propertyType),
        createdById: session.user.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Row error (${property.propertyName}): ${error.message}`);
      } else {
        throw new Error(`Row error (${property.propertyName}): Unknown error`);
      }
    }
  });

  const results = {
    created: [] as any[],
    duplicates: [] as string[],
  };

  // Process each property individually to handle duplicates
  for (const property of properties) {
    try {
      const created = await prisma.property.create({
        data: property
      });
      results.created.push(created);
    } catch (error: any) {
      // Check if error is due to unique constraint violation
      if (error.code === 'P2002' && error.meta?.target?.includes('propertyCode')) {
        results.duplicates.push(property.propertyCode);
        continue;
      }
      throw error;
    }
  }

  if (results.created.length > 0) {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true }
    });

    const importer = users.find(u => u.id === session.user.id);
    const importerName = importer ? `${importer.firstName} ${importer.lastName}` : 'Unknown user';

    await Promise.all(
      results.created.map(property => 
        Promise.all([
          createAuditLog({
            entityId: property.id,
            entityType: EntityType.PROPERTY,
            action: "CREATE",
            changes: property,
            metadata: { source: "CSV_IMPORT" }
          }),
          ...users.map(user =>
            createNotification({
              userId: user.id,
              title: "Property Imported",
              message: `Property "${property.propertyName}" has been imported by ${importerName}`,
              type: NotificationType.PROPERTY,
              entityId: property.id,
              entityType: EntityType.PROPERTY,
              actionUrl: `/dashboard/properties?selected=${property.id}`,
            })
          )
        ])
      )
    );
  }

  revalidatePath("/dashboard/properties");
  
  if (results.duplicates.length > 0) {
    throw new Error(`Some properties were not imported due to duplicate property codes: ${results.duplicates.join(', ')}`);
  }

  return results.created;
}