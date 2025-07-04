export interface AuditLogWithUser {
  id: string;
  entityId: string;
  entityType: string;
  action: string;
  userId: string;
  changes: any;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export interface AuditLogFilters {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  entityType?: string;
  action?: string;
  ipAddress?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogResponse {
  logs: AuditLogWithUser[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export const ENTITY_TYPES = [
  'USER', 'PROPERTY', 'UNIT', 'LEASE', 'TENANT', 'MAINTENANCE_REQUEST',
  'PAYMENT', 'DOCUMENT', 'UTILITY_BILL', 'PROPERTY_TAX', 'UNIT_TAX',
  'PROJECT', 'BOARD', 'TASK', 'COMMENT'
] as const;

export const AUDIT_ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE',
  'EMAIL_CHANGE', 'PERMISSION_CHANGE', 'STATUS_CHANGE', 'ASSIGNMENT',
  'PAYMENT_PROCESSED', 'DOCUMENT_UPLOAD'
] as const;