"use server";

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { AuditLogFilters, AuditLogWithUser } from '@/types/audit-log';

export interface AuditLogActionResponse {
  success: boolean;
  data?: {
    logs: AuditLogWithUser[];
    total: number;
    totalPages: number;
    currentPage: number;
    users: { id: string; firstName: string; lastName: string; email: string }[];
  };
  error?: string;
}

export async function getAuditLogs(filters: AuditLogFilters): Promise<AuditLogActionResponse> {
  try {
    const {
      dateFrom,
      dateTo,
      userId,
      entityType,
      action,
      ipAddress,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    // Simple filters
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType as any;
    if (action) where.action = action as any;
    if (ipAddress) where.ipAddress = { contains: ipAddress, mode: 'insensitive' };

    // Search filter
    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { 
          user: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    // Build orderBy clause
    let orderBy: Prisma.AuditLogOrderByWithRelationInput = {};
    if (sortBy === 'user.firstName') {
      orderBy = { user: { firstName: sortOrder } };
    } else if (sortBy === 'user.lastName') {
      orderBy = { user: { lastName: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Execute queries in parallel
    const [logs, total, users] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where }),
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        },
        orderBy: { firstName: 'asc' }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        logs: logs as AuditLogWithUser[],
        total,
        totalPages,
        currentPage: page,
        users
      }
    };

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    
    let errorMessage = 'Failed to fetch audit logs';
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorMessage = `Database error: ${error.message}`;
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      errorMessage = 'Invalid query parameters';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

export async function createAuditLog(data: {
  entityId: string;
  entityType: string;
  action: string;
  userId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.auditLog.create({
      data: {
        entityId: data.entityId,
        entityType: data.entityType as any,
        action: data.action as any,
        userId: data.userId,
        changes: data.changes,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating audit log:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create audit log'
    };
  }
}

export async function getAuditLogStats(): Promise<{
  success: boolean;
  data?: {
    totalLogs: number;
    last24Hours: number;
    uniqueUsers: number;
    topActions: { action: string; count: number }[];
  };
  error?: string;
}> {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalLogs, last24HoursLogs, actionStats] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: yesterday
          }
        }
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: {
          action: true
        },
        orderBy: {
          _count: {
            action: 'desc'
          }
        },
        take: 5
      })
    ]);

    const uniqueUsers = await prisma.auditLog.findMany({
      select: {
        userId: true
      },
      distinct: ['userId']
    });

    const topActions = actionStats.map(stat => ({
      action: stat.action,
      count: stat._count.action
    }));

    return {
      success: true,
      data: {
        totalLogs,
        last24Hours: last24HoursLogs,
        uniqueUsers: uniqueUsers.length,
        topActions
      }
    };
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats'
    };
  }
}

export async function exportAuditLogsData(filters: AuditLogFilters): Promise<{
  success: boolean;
  data?: AuditLogWithUser[];
  error?: string;
}> {
  try {
    const {
      dateFrom,
      dateTo,
      userId,
      entityType,
      action,
      ipAddress,
      search
    } = filters;

    // Build where clause (same as getAuditLogs but without pagination)
    const where: Prisma.AuditLogWhereInput = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType as any;
    if (action) where.action = action as any;
    if (ipAddress) where.ipAddress = { contains: ipAddress, mode: 'insensitive' };

    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { 
          user: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10000 // Limit export to 10k records for performance
    });

    return {
      success: true,
      data: logs as AuditLogWithUser[]
    };
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export audit logs'
    };
  }
}