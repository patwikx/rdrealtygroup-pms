"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        status: "ACTIVE"
      },
      select: {
        id: true,
        bpCode: true,
        firstName: true,
        lastName: true,
        company: true,
        businessName: true,
      },
      orderBy: {
        businessName: "asc"
      }
    });

    return tenants;
  } catch (error) {
    console.error("Error fetching tenants:", error);
    throw new Error("Failed to fetch tenants");
  }
}

export async function createTenantNotice(data: {
  tenantId: string;
  noticeType: string;
  items: Array<{
    description: string;
    status: string;
    amount: number;
    months?: string;
  }>;
  forYear: number;
  primarySignatory: string;
  primaryTitle: string;
  primaryContact: string;
  secondarySignatory: string;
  secondaryTitle: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get the next notice number for this tenant
    const existingNotices = await prisma.tenantNotice.findMany({
      where: {
        tenantId: data.tenantId,
        isSettled: false
      },
      orderBy: {
        noticeNumber: "desc"
      }
    });

    let noticeNumber = 1;
    if (existingNotices.length > 0) {
      const lastNotice = existingNotices[0];
      noticeNumber = lastNotice.noticeNumber + 1;
      
      // Cap at 3 (Final Notice)
      if (noticeNumber > 3) {
        noticeNumber = 3;
      }
    }

    // Auto-determine notice type based on number
    let noticeType = data.noticeType;
    if (noticeNumber === 1) noticeType = "FIRST_NOTICE";
    else if (noticeNumber === 2) noticeType = "SECOND_NOTICE";
    else if (noticeNumber >= 3) noticeType = "FINAL_NOTICE";

    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

    const notice = await prisma.tenantNotice.create({
      data: {
        tenantId: data.tenantId,
        noticeType: noticeType as any,
        noticeNumber,
        totalAmount,
        forMonth: data.items[0]?.months || new Date().toLocaleString('default', { month: 'long' }),
        forYear: data.forYear,
        primarySignatory: data.primarySignatory,
        primaryTitle: data.primaryTitle,
        primaryContact: data.primaryContact,
        secondarySignatory: data.secondarySignatory,
        secondaryTitle: data.secondaryTitle,
        createdById: session.user.id,
        items: {
          create: data.items.map(item => {
            // For custom status, we need to extract the actual custom text
            const isCustom = typeof item.status === 'string' && !['PAST_DUE', 'OVERDUE', 'CRITICAL', 'PENDING', 'UNPAID'].includes(item.status);
            
            return {
              description: item.description,
              status: isCustom ? "CUSTOM" as any : item.status as any,
              customStatus: isCustom ? item.status : null,
              amount: item.amount,
              months: item.months || new Date().toLocaleString('default', { month: 'long' }),
            };
          })
        }
      },
      include: {
        tenant: {
          select: {
            businessName: true,
            bpCode: true
          }
        },
        items: true
      }
    });

    revalidatePath("/dashboard/tenant-notice");
    return notice;
  } catch (error) {
    console.error("Error creating tenant notice:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to create tenant notice: ${error.message}`);
    }
    throw new Error("Failed to create tenant notice");
  }
}

export async function getTenantNotices(filters?: {
  tenantId?: string;
  status?: string;
  isSettled?: boolean;
}) {
  try {
    const notices = await prisma.tenantNotice.findMany({
      where: {
        ...(filters?.tenantId && { tenantId: filters.tenantId }),
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.isSettled !== undefined && { isSettled: filters.isSettled }),
      },
      include: {
        tenant: {
          select: {
            id: true,
            bpCode: true,
            businessName: true,
            company: true,
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        items: true
      },
      orderBy: [
        { isSettled: "asc" },
        { dateIssued: "desc" }
      ]
    });

    return notices;
  } catch (error) {
    console.error("Error fetching tenant notices:", error);
    throw new Error("Failed to fetch tenant notices");
  }
}

export async function getTenantNoticeById(id: string) {
  try {
    const notice = await prisma.tenantNotice.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            bpCode: true,
            businessName: true,
            company: true,
            firstName: true,
            lastName: true,
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        items: true
      }
    });

    return notice;
  } catch (error) {
    console.error("Error fetching tenant notice:", error);
    throw new Error("Failed to fetch tenant notice");
  }
}

export async function settleNotice(noticeId: string, settledBy: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const notice = await prisma.tenantNotice.update({
      where: { id: noticeId },
      data: {
        isSettled: true,
        settledDate: new Date(),
        settledBy: settledBy,
      }
    });

    // Reset notice count for tenant (delete unsettled notices)
    await prisma.tenantNotice.deleteMany({
      where: {
        tenantId: notice.tenantId,
        isSettled: false,
        id: { not: noticeId }
      }
    });

    revalidatePath("/dashboard/tenant-notice");
    return notice;
  } catch (error) {
    console.error("Error settling notice:", error);
    throw new Error("Failed to settle notice");
  }
}

export async function getTenantNoticeCount(tenantId: string) {
  try {
    const count = await prisma.tenantNotice.count({
      where: {
        tenantId,
        isSettled: false
      }
    });

    return count;
  } catch (error) {
    console.error("Error getting tenant notice count:", error);
    return 0;
  }
}

export async function deleteNotice(noticeId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    await prisma.tenantNotice.delete({
      where: { id: noticeId }
    });

    revalidatePath("/dashboard/tenant-notice");
  } catch (error) {
    console.error("Error deleting notice:", error);
    throw new Error("Failed to delete notice");
  }
}