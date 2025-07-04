import { prisma } from "@/lib/db";
import { AuditAction, EntityType } from "@prisma/client";

interface CreateAuditLogProps {
  entityId: string;
  entityType: EntityType;
  action: AuditAction;
  userId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export async function createAuditLog({
  entityId,
  entityType,
  action,
  userId,
  changes,
  ipAddress,
  userAgent,
  metadata,
}: CreateAuditLogProps) {
  try {
    await prisma.auditLog.create({
      data: {
        entityId,
        entityType,
        action,
        userId,
        changes: changes ? JSON.parse(JSON.stringify(changes)) : null,
        ipAddress,
        userAgent,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export async function logUserLogin(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  loginMethod?: string
) {
  await createAuditLog({
    entityId: userId,
    entityType: "USER",
    action: "LOGIN",
    userId,
    ipAddress,
    userAgent,
    metadata: {
      loginMethod,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function logUserLogout(
  userId: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    entityId: userId,
    entityType: "USER",
    action: "LOGOUT",
    userId,
    ipAddress,
    userAgent,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
}