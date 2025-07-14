import { 
  Property, 
  Unit, 
  UnitFloor,
  Document, 
  PropertyUtility, 
  PropertyTax,
  UnitTax,
  UtilityBill,
  UnitUtilityAccount,
  Tenant,
  Lease,
  LeaseUnit,
  MaintenanceRequest,
  Payment,
  User,
  AuditLog,
  Notification,
  TitleMovementStatus,
  PropertyTitles,
  UnitStatus,
  LeaseStatus,
  TenantStatus,
  MaintenanceCategory,
  Priority,
  MaintenanceStatus,
  DocumentType
} from "@prisma/client";

export type PropertyWithRelations = Property & {
  units: (Unit & {
    propertyTitle: PropertyTitles | null;
    unitFloors: UnitFloor[];
  })[];
  documents: Document[];
  utilities: PropertyUtility[];
  titles: (PropertyTitles & { propertyTaxes: PropertyTax[] })[];
  titleMovements: {
    id: string;
    propertyId: string;
    requestedBy: string;
    status: TitleMovementStatus;
    location: string;
    purpose: string;
    remarks: string | null;
    requestDate: Date;
    returnDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

export type UnitWithRelations = Unit & {
  property: Property;
  propertyTitle: PropertyTitles | null;
  unitFloors: UnitFloor[];
  leaseUnits: (LeaseUnit & {
    lease: Lease & {
      tenant: Tenant;
    };
  })[];
  documents: Document[];
  unitTaxes: UnitTax[];
  utilityAccounts: (UnitUtilityAccount & {
    bills: UtilityBill[];
  })[];
  maintenanceRequests: MaintenanceRequest[];
  titles: PropertyTitles[];
};

// Updated for multi-unit lease structure
export type LeaseWithRelations = Lease & {
  leaseUnits: (LeaseUnit & {
    unit: Unit & {
      property: Property;
    };
  })[];
  tenant: Tenant;
  payments: Payment[];
};

export type TenantWithRelations = Tenant & {
  leases: LeaseWithRelations[];
  maintenanceRequests: (MaintenanceRequest & {
    unit: Unit & {
      property: Property;
    };
  })[];
  documents: (Document & {
    uploadedBy: {
      id: string;
      firstName: string;
      lastName: string;
    };
  })[];
};

export type MaintenanceRequestWithRelations = MaintenanceRequest & {
  unit: Unit & {
    property: Property;
  };
  tenant: Tenant;
  assignedTo: User | null;
};

export type DocumentWithRelations = Document & {
  property: Property | null;
  unit: (Unit & {
    property: Property;
  }) | null;
  tenant: Tenant | null;
  uploadedBy: User;
};

export type UtilityBillWithRelations = UtilityBill & {
  propertyUtility: PropertyUtility | null;
  unitUtilityAccount: UnitUtilityAccount | null;
};

export type UserWithRelations = User & {
  createdProperties: Property[];
  assignedMaintenance: MaintenanceRequest[];
  uploadedDocuments: Document[];
  tenant: Tenant | null;
  auditLogs: AuditLog[];
  notifications: Notification[];
};

// Multi-unit lease form types
export type MultiUnitLeaseFormData = {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  securityDeposit: number;
  status: LeaseStatus;
  units: {
    unitId: string;
    rentAmount: number;
  }[];
};

// Utility types for lease operations
export type LeaseUnitData = {
  unitId: string;
  rentAmount: number;
};

export type CreateMultiUnitLeaseData = {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  totalRentAmount: number;
  securityDeposit: number;
  status: LeaseStatus;
  units: LeaseUnitData[];
};

// Helper type for unit selection in forms
export type AvailableUnit = {
  id: string;
  unitNumber: string;
  totalRent: number;
  property: {
    id: string;
    propertyName: string;
  };
};

// Legacy type for backward compatibility (if needed)
export type SingleUnitLeaseWithRelations = Lease & {
  unit: Unit & {
    property: Property;
  };
  tenant: Tenant;
  payments: Payment[];
};

// Status types for filtering and display
export type StatusFilter = {
  units: UnitStatus[];
  leases: LeaseStatus[];
  tenants: TenantStatus[];
  maintenance: MaintenanceStatus[];
};

// Search and filter types
export type SearchFilters = {
  query: string;
  status: StatusFilter;
  dateRange?: {
    start: Date;
    end: Date;
  };
};

// Dashboard summary types
export type DashboardStats = {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  totalTenants: number;
  activeTenants: number;
  totalLeases: number;
  activeLeases: number;
  pendingMaintenance: number;
  totalRevenue: number;
  monthlyRevenue: number;
};

// Notification types
export type NotificationData = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
};

// Audit log types
export type AuditLogData = {
  id: string;
  entityType: string;
  action: string;
  userId: string;
  changes?: any;
  createdAt: Date;
  user: {
    firstName: string;
    lastName: string;
  };
};

// Form validation types
export type ValidationError = {
  field: string;
  message: string;
};

export type FormState = {
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
};

// API response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Export commonly used Prisma types
export {
  UnitStatus,
  LeaseStatus,
  TenantStatus,
  MaintenanceCategory,
  Priority,
  MaintenanceStatus,
  DocumentType,
} from "@prisma/client";