'use client'

// **FIXED**: Added necessary type imports from Prisma client
import { User, Unit, Property, UnitFloor, LeaseUnit, Lease, Tenant, MaintenanceRequest, UnitTax, UnitUtilityAccount } from "@prisma/client";
import { UnitDetailsClientView } from "./unit-details-client-view";

// **FIXED**: Defined a corrected UnitWithRelations type that matches the structure 
// expected by the UnitDetailsClientView component. The original type imported from 
// '@/types' was missing the nested 'tenant' relation within 'maintenanceRequests'.
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
  documents: Document[]; // Assuming documents are also part of the unit details
}

// The props for this component now use the corrected, more specific type.
interface UnitDetailsViewProps {
  unit: UnitWithRelations;
  users: User[];
  currentUserId: string | undefined;
}

export function UnitDetailsView({ unit, users, currentUserId }: UnitDetailsViewProps) {
  // By using the correct type, the 'unit' prop passed to the client view 
  // will now have the correct shape, which resolves the TypeScript error.
  return (
    <UnitDetailsClientView 
      unit={unit}
      users={users}
      currentUserId={currentUserId}
    />
  );
}
