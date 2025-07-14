'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { auth } from "@/auth";
import { createNotification } from "@/lib/utils/notifications";
import { AppError } from "@/lib/utils/error";
import { EntityType, NotificationType, DocumentType } from "@prisma/client";

// Define the shape of the data expected by the action
interface CreateDocumentArgs {
  name: string;
  fileUrl: string;
  documentType: DocumentType;
  uploadedById: string; // This was the missing property
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  description?: string;
}

export async function createDocument(data: CreateDocumentArgs) {
  const session = await auth();
  if (!session?.user?.id || session.user.id !== data.uploadedById) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    const document = await prisma.document.create({
      data: {
        name: data.name,
        fileUrl: data.fileUrl,
        documentType: data.documentType,
        uploadedById: data.uploadedById,
        propertyId: data.propertyId || null,
        unitId: data.unitId || null,
        tenantId: data.tenantId || null,
        description: data.description || null,
      },
      include: {
        property: true,
        unit: {
          include: {
            property: true,
          },
        },
        tenant: true,
        uploadedBy: true,
      },
    });

    await createAuditLog({
      entityId: document.id,
      entityType: EntityType.DOCUMENT,
      action: "CREATE",
  
      changes: {
        name: document.name,
        type: document.documentType,
        fileUrl: document.fileUrl,
      },
    });

    // Create appropriate notification based on document context
    let notificationMessage = `Document "${document.name}" has been uploaded`;
    if (document.property) {
      notificationMessage += ` for property ${document.property.propertyName}`;
    } else if (document.unit) {
      notificationMessage += ` for space ${document.unit.unitNumber} in ${document.unit.property.propertyName}`;
    } else if (document.tenant) {
      notificationMessage += ` for tenant ${document.tenant.firstName} ${document.tenant.lastName}`;
    }

    await createNotification({
      userId: session.user.id,
      title: "Document Uploaded",
      message: notificationMessage,
      type: NotificationType.DOCUMENT,
      entityId: document.id,
      entityType: EntityType.DOCUMENT,
    });

    // Revalidate appropriate paths based on document context
    if (document.propertyId) {
      revalidatePath(`/dashboard/properties/${document.propertyId}`);
    }
    if (document.unitId) {
      revalidatePath(`/dashboard/spaces/${document.unitId}`);
    }
    if (document.tenantId) {
      revalidatePath(`/dashboard/tenants/${document.tenantId}`);
    }

    return document;
  } catch (error) {
    console.error("Failed to create document record:", error);
    throw new AppError(
      "Failed to save document record",
      500,
      "DOCUMENT_CREATE_ERROR"
    );
  }
}

export async function deleteDocument(documentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new AppError("Unauthorized", 401);
    }

    try {
        const document = await prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            throw new AppError("Document not found", 404);
        }

        // Optional: Add ownership check if necessary
        // if (document.uploadedById !== session.user.id) {
        //     throw new AppError("Forbidden", 403);
        // }

        await prisma.document.delete({
            where: { id: documentId },
        });

        await createAuditLog({
            entityId: document.id,
            entityType: EntityType.DOCUMENT,
            action: "DELETE",
            
            changes: { name: document.name },
        });

        if (document.propertyId) {
            revalidatePath(`/dashboard/properties/${document.propertyId}`);
        }
        if (document.tenantId) {
            revalidatePath(`/dashboard/tenants/${document.tenantId}`);
        }

        return { success: true };

    } catch (error) {
        console.error("Failed to delete document:", error);
        if (error instanceof AppError) throw error;
        throw new AppError("Failed to delete document", 500, "DOCUMENT_DELETE_ERROR");
    }
}
