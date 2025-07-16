'use client'

// **FIXED**: Added 'Document' to the Prisma imports.
import { User, Unit, Property, UnitFloor, LeaseUnit, Lease, Tenant, MaintenanceRequest, UnitTax, UnitUtilityAccount, Document } from "@prisma/client";
import { UnitDetailsClientView } from "./unit-details-client-view";

interface UnitWithRelations extends Unit {
  property: Property;
  unitFloors: UnitFloor[];
  maintenanceRequests: (MaintenanceRequest & {
    tenant: Tenant | null;
  })[];
  leaseUnits: (LeaseUnit & {
    lease: Lease & {
      tenant: Tenant;
    };
  })[];
  unitTaxes: UnitTax[];
  utilityAccounts: UnitUtilityAccount[];
  documents: Document[]; // **FIXED**: Added the missing 'documents' property to match the client view's type.
}

interface UnitDetailsViewProps {
  unit: UnitWithRelations;
  users: User[];
  currentUserId: string | undefined;
}

export function UnitDetailsView({ unit, users, currentUserId }: UnitDetailsViewProps) {
  // Now the 'unit' prop has the correct shape, resolving the error.
  return (
    <UnitDetailsClientView
      unit={unit}
      users={users}
      currentUserId={currentUserId}
    />
  );
}