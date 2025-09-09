// types/notice.ts

export enum NoticeType {
  FIRST_NOTICE = 'FIRST_NOTICE',
  SECOND_NOTICE = 'SECOND_NOTICE',
  THIRD_NOTICE = 'THIRD_NOTICE',
  FINAL_NOTICE = 'FINAL_NOTICE',
  DEMAND_LETTER = 'DEMAND_LETTER',
  EVICTION_NOTICE = 'EVICTION_NOTICE',
  RENT_INCREASE = 'RENT_INCREASE',
  LEASE_TERMINATION = 'LEASE_TERMINATION',
  MAINTENANCE_NOTICE = 'MAINTENANCE_NOTICE',
  CUSTOM = 'CUSTOM'
}

export enum NoticeStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  DELIVERED = 'DELIVERED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESPONDED = 'RESPONDED',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  CANCELLED = 'CANCELLED'
}

export enum NoticeItemType {
  SPACE_RENTAL = 'SPACE_RENTAL',
  UTILITIES = 'UTILITIES',
  MAINTENANCE_FEE = 'MAINTENANCE_FEE',
  SECURITY_DEPOSIT = 'SECURITY_DEPOSIT',
  LATE_FEES = 'LATE_FEES',
  PENALTIES = 'PENALTIES',
  OTHER_CHARGES = 'OTHER_CHARGES',
  CUSTOM = 'CUSTOM'
}

export enum SignatoryType {
  CREDIT_COLLECTION = 'CREDIT_COLLECTION',
  FINANCE_CONTROLLER = 'FINANCE_CONTROLLER',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  LEGAL_OFFICER = 'LEGAL_OFFICER',
  GENERAL_MANAGER = 'GENERAL_MANAGER',
  CUSTOM = 'CUSTOM'
}

export enum DeliveryMethod {
  EMAIL = 'EMAIL',
  HAND_DELIVERY = 'HAND_DELIVERY',
  REGISTERED_MAIL = 'REGISTERED_MAIL',
  COURIER = 'COURIER',
  SMS = 'SMS',
  PORTAL_NOTIFICATION = 'PORTAL_NOTIFICATION',
  POSTED = 'POSTED'
}

export enum DeliveryStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  BOUNCED = 'BOUNCED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface NoticeSignatory {
  id: string;
  noticeId?: string;
  name: string;
  position: string;
  mobile?: string;
  email?: string;
  isActive: boolean;
  signatoryType: SignatoryType;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoticeDetail {
  id: string;
  noticeId: string;
  itemType: NoticeItemType;
  description: string;
  periodFrom?: Date;
  periodTo?: Date;
  dueDate?: Date;
  amount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoticeDelivery {
  id: string;
  noticeId: string;
  deliveryMethod: DeliveryMethod;
  deliveryDate: Date;
  deliveredTo?: string;
  receivedAt?: Date;
  deliveryStatus: DeliveryStatus;
  trackingNumber?: string;
  notes?: string;
  proofImageUrl?: string;
  signature?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveredBy: string;
}

export interface Notice {
  id: string;
  noticeNumber: string;
  noticeType: NoticeType;
  tenantId: string;
  leaseId?: string;
  subject: string;
  outstandingAmount: number;
  description?: string;
  dueDate?: Date;
  dateIssued: Date;
  status: NoticeStatus;
  issuedByName: string;
  issuedByAddress: string;
  issuedByTel: string;
  issuedByFax: string;
  issuedByWebsite: string;
  customAmount?: number;
  customNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  tenant: {
    id: string;
    bpCode: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
    company: string;
    businessName: string;
    status: string;
  };
  lease?: {
    id: string;
    startDate: Date;
    endDate: Date;
    totalRentAmount: number;
    status: string;
    leaseUnits: Array<{
      id: string;
      unit: {
        id: string;
        unitNumber: string;
        property: {
          id: string;
          propertyName: string;
          address: string;
        };
      };
    }>;
  };
  noticeDetails: NoticeDetail[];
  noticeSignatories: NoticeSignatory[];
  deliveryRecords: NoticeDelivery[];
}

export interface CreateNoticeData {
  tenantId: string;
  leaseId?: string;
  noticeType: NoticeType;
  subject?: string;
  outstandingAmount: number;
  customAmount?: number;
  description?: string;
  dueDate?: Date;
  customNotes?: string;
  details: Array<{
    itemType: NoticeItemType;
    description: string;
    periodFrom?: Date;
    periodTo?: Date;
    dueDate?: Date;
    amount: number;
    status?: string;
  }>;
  signatoryIds: string[];
}

export interface UpdateNoticeStatusData {
  noticeId: string;
  status: NoticeStatus;
  notes?: string;
}

export interface CreateDeliveryData {
  noticeId: string;
  deliveryMethod: DeliveryMethod;
  deliveryDate: Date;
  deliveredTo?: string;
  trackingNumber?: string;
  notes?: string;
}