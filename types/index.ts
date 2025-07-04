import { 
  Property, 
  Unit, 
  Document, 
  PropertyUtility, 
  PropertyTax,
  UnitTax,
  UtilityBill,
  UnitUtilityAccount,
  Tenant,
  Lease,
  MaintenanceRequest,
  Payment,
  User,
  AuditLog,
  Notification,
  TitleMovementStatus,
  PropertyTitles
} from "@prisma/client";

export type PropertyWithRelations = Property & {
  units: (Unit & {
    propertyTitle: PropertyTitles | null;
  })[];
  documents: Document[];
  utilities: PropertyUtility[];
  //propertyTaxes: PropertyTax[];
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
  leases: (Lease & {
    tenant: Tenant;
  })[];
  documents: Document[];
  unitTaxes: UnitTax[];
  utilityAccounts: (UnitUtilityAccount & {
    bills: UtilityBill[];
  })[];
  maintenanceRequests: MaintenanceRequest[];
  titles: PropertyTitles[];
};

export type TenantWithRelations = Tenant & {
  leases: LeaseWithRelations[];
  maintenanceRequests: (MaintenanceRequest & {
    unit: Unit & {
      property: Property;
    };
  })[];
  documents: Document[];
};

export type LeaseWithRelations = Lease & {
  unit: Unit & {
    property: Property;
  };
  tenant: Tenant;
  payments: Payment[];
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
  // documents: Document[]; //added on 02/04/2025
};

export type UserWithRelations = User & {
  createdProperties: Property[];
  assignedMaintenance: MaintenanceRequest[];
  uploadedDocuments: Document[];
  tenant: Tenant | null;
  auditLogs: AuditLog[];
  notifications: Notification[];
};