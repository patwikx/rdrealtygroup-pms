'use server'

import { prisma } from "@/lib/db";
import { AuditAction, EntityType } from "@prisma/client";

export interface GetAuditLogsParams {
  userId?: string;
  entityType?: EntityType;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export async function getAuditLogs({
  userId,
  entityType,
  action,
  startDate,
  endDate,
  page = 1,
  limit = 50,
}: GetAuditLogsParams = {}) {
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export async function getLoginAuditLogs(userId?: string) {
  return getAuditLogs({
    userId,
    action: "LOGIN",
  });
}

export async function getLogoutAuditLogs(userId?: string) {
  return getAuditLogs({
    userId,
    action: "LOGOUT", 
  });
}

export async function getUserLoginHistory(userId: string, limit: number = 10) {
  return prisma.auditLog.findMany({
    where: {
      userId,
      action: {
        in: ["LOGIN", "LOGOUT"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}