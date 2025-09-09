'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { 
  Notice, 
  CreateNoticeData, 
  UpdateNoticeStatusData, 
  CreateDeliveryData,
  NoticeSignatory,
  SignatoryType 
} from '@/types/notice'

const prisma = new PrismaClient()

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

// Generate notice number
async function generateNoticeNumber(noticeType: string): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  
  const lastNotice = await prisma.notice.findFirst({
    where: {
      noticeNumber: {
        contains: `${year}${month}`
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  let sequence = 1
  if (lastNotice) {
    const lastSequence = parseInt(lastNotice.noticeNumber.slice(-4))
    sequence = lastSequence + 1
  }
  
  const typeCode = noticeType.substring(0, 2).toUpperCase()
  return `${typeCode}${year}${month}${String(sequence).padStart(4, '0')}`
}

// Create a new notice
export async function createNotice(data: CreateNoticeData): Promise<ActionResult<{ noticeId: string }>> {
  try {
    const noticeNumber = await generateNoticeNumber(data.noticeType)
    
    // Get default signatories if none provided
    let signatories: NoticeSignatory[] = []
    if (data.signatoryIds.length === 0) {
      const rawSignatories = await prisma.noticeSignatory.findMany({
        where: {
          noticeId: null,
          isActive: true
        },
        orderBy: {
          order: 'asc'
        }
      })
      signatories = rawSignatories.map(s => ({
        ...s,
        noticeId: s.noticeId === null ? undefined : s.noticeId,
        mobile: s.mobile === null ? undefined : s.mobile,
        email: s.email === null ? undefined : s.email,
        signatoryType: s.signatoryType as SignatoryType // Ensure correct type
      }))
    } else {
      signatories = (await prisma.noticeSignatory.findMany({
        where: {
          id: {
            in: data.signatoryIds
          }
        }
      })).map(s => ({
        ...s,
        noticeId: s.noticeId === null ? undefined : s.noticeId,
        mobile: s.mobile === null ? undefined : s.mobile,
        email: s.email === null ? undefined : s.email,
        signatoryType: s.signatoryType as SignatoryType // Ensure correct type
      }))
    }

    const notice = await prisma.notice.create({
      data: {
        noticeNumber,
        noticeType: data.noticeType as any,
        tenantId: data.tenantId,
        leaseId: data.leaseId,
        subject: data.subject || 'First Notice of Collection',
        outstandingAmount: data.outstandingAmount,
        customAmount: data.customAmount,
        description: data.description,
        dueDate: data.dueDate,
        customNotes: data.customNotes,
        createdById: 'user-id', // TODO: Get from session
        status: 'DRAFT' as any,
        noticeDetails: {
          create: data.details.map(detail => ({
            itemType: detail.itemType as any,
            description: detail.description,
            periodFrom: detail.periodFrom,
            periodTo: detail.periodTo,
            dueDate: detail.dueDate,
            amount: detail.amount,
            status: detail.status || 'PAST DUE'
          }))
        },
        noticeSignatories: {
          create: signatories.map((signatory, index) => ({
            name: signatory.name,
            position: signatory.position,
            mobile: signatory.mobile,
            email: signatory.email,
            signatoryType: signatory.signatoryType as any,
            order: index + 1,
            isActive: true
          }))
        }
      }
    })

    // Create history record
    await prisma.noticeHistory.create({
      data: {
        noticeId: notice.id,
        newStatus: 'DRAFT' as any,
        action: 'CREATED' as any,
        actionBy: 'user-id', // TODO: Get from session
        notes: 'Notice created'
      }
    })

    revalidatePath('/dashboard/tenant-notice')
    return { 
      success: true, 
      data: { noticeId: notice.id } 
    }
  } catch (error) {
    console.error('Error creating notice:', error)
    return { 
      success: false, 
      error: 'Failed to create notice' 
    }
  }
}

// Get all notices with filters
export async function getNotices(filters?: {
  status?: string;
  tenantId?: string;
  noticeType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}): Promise<ActionResult<Notice[]>> {
  try {
    const where: any = {}
    
    if (filters?.status) where.status = filters.status
    if (filters?.tenantId) where.tenantId = filters.tenantId
    if (filters?.noticeType) where.noticeType = filters.noticeType
    if (filters?.dateFrom || filters?.dateTo) {
      where.dateIssued = {}
      if (filters.dateFrom) where.dateIssued.gte = filters.dateFrom
      if (filters.dateTo) where.dateIssued.lte = filters.dateTo
    }

    const notices = await prisma.notice.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            bpCode: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            businessName: true,
            status: true
          }
        },
        lease: {
          include: {
            leaseUnits: {
              include: {
                unit: {
                  include: {
                    property: {
                      select: {
                        id: true,
                        propertyName: true,
                        address: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        noticeDetails: true,
        noticeSignatories: {
          orderBy: {
            order: 'asc'
          }
        },
        deliveryRecords: {
          orderBy: {
            deliveryDate: 'desc'
          }
        }
      },
      orderBy: {
        dateIssued: 'desc'
      }
    })

    return { 
      success: true, 
      data: notices as Notice[] 
    }
  } catch (error) {
    console.error('Error fetching notices:', error)
    return { 
      success: false, 
      error: 'Failed to fetch notices' 
    }
  }
}

// Get single notice by ID
export async function getNoticeById(noticeId: string): Promise<ActionResult<Notice>> {
  try {
    const notice = await prisma.notice.findUnique({
      where: { id: noticeId },
      include: {
        tenant: {
          select: {
            id: true,
            bpCode: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            businessName: true,
            status: true
          }
        },
        lease: {
          include: {
            leaseUnits: {
              include: {
                unit: {
                  include: {
                    property: {
                      select: {
                        id: true,
                        propertyName: true,
                        address: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        noticeDetails: true,
        noticeSignatories: {
          orderBy: {
            order: 'asc'
          }
        },
        deliveryRecords: {
          orderBy: {
            deliveryDate: 'desc'
          }
        }
      }
    })

    if (!notice) {
      return { 
        success: false, 
        error: 'Notice not found' 
      }
    }

    return { 
      success: true, 
      data: notice as Notice 
    }
  } catch (error) {
    console.error('Error fetching notice:', error)
    return { 
      success: false, 
      error: 'Failed to fetch notice' 
    }
  }
}

// Update notice status
export async function updateNoticeStatus(data: UpdateNoticeStatusData): Promise<ActionResult> {
  try {
    const currentNotice = await prisma.notice.findUnique({
      where: { id: data.noticeId },
      select: { status: true }
    })

    if (!currentNotice) {
      return { 
        success: false, 
        error: 'Notice not found' 
      }
    }

    await prisma.notice.update({
      where: { id: data.noticeId },
      data: { status: data.status as any }
    })

    // Create history record
    await prisma.noticeHistory.create({
      data: {
        noticeId: data.noticeId,
        previousStatus: currentNotice.status as any,
        newStatus: data.status as any,
        action: 'STATUS_CHANGED' as any,
        actionBy: 'user-id', // TODO: Get from session
        notes: data.notes || `Status changed to ${data.status}`
      }
    })

    revalidatePath('/dashboard/tenant-notice')
    revalidatePath(`/dashboard/tenant-notice/${data.noticeId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error updating notice status:', error)
    return { 
      success: false, 
      error: 'Failed to update notice status' 
    }
  }
}

// Create delivery record
export async function createDeliveryRecord(data: CreateDeliveryData): Promise<ActionResult> {
  try {
    await prisma.noticeDelivery.create({
      data: {
        noticeId: data.noticeId,
        deliveryMethod: data.deliveryMethod as any,
        deliveryDate: data.deliveryDate,
        deliveredTo: data.deliveredTo,
        trackingNumber: data.trackingNumber,
        notes: data.notes,
        deliveryStatus: 'SENT' as any,
        deliveredBy: 'user-id' // TODO: Get from session
      }
    })

    // Update notice status to DELIVERED if not already
    const notice = await prisma.notice.findUnique({
      where: { id: data.noticeId },
      select: { status: true }
    })

    if (notice?.status === 'ISSUED') {
      await updateNoticeStatus({
        noticeId: data.noticeId,
        status: 'DELIVERED' as any,
        notes: `Delivered via ${data.deliveryMethod}`
      })
    }

    revalidatePath('/dashboard/tenant-notice')
    revalidatePath(`/dashboard/tenant-notice/${data.noticeId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error creating delivery record:', error)
    return { 
      success: false, 
      error: 'Failed to create delivery record' 
    }
  }
}

// Get tenants for notice creation
export async function getTenants(): Promise<ActionResult<Array<{
  id: string;
  bpCode: string;
  businessName: string;
  company: string;
  email: string;
  phone: string;
}>>> {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        bpCode: true,
        businessName: true,
        company: true,
        email: true,
        phone: true
      },
      orderBy: {
        businessName: 'asc'
      }
    })

    return { 
      success: true, 
      data: tenants 
    }
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return { 
      success: false, 
      error: 'Failed to fetch tenants' 
    }
  }
}

// Get default signatories
export async function getDefaultSignatories(): Promise<ActionResult<NoticeSignatory[]>> {
  try {
    const signatories = await prisma.noticeSignatory.findMany({
      where: {
        noticeId: null,
        isActive: true
      },
      orderBy: {
        order: 'asc'
      }
    })

    return { 
      success: true, 
      data: signatories as NoticeSignatory[] 
    }
  } catch (error) {
    console.error('Error fetching signatories:', error)
    return { 
      success: false, 
      error: 'Failed to fetch signatories' 
    }
  }
}