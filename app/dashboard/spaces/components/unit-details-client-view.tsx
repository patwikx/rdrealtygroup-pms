'use client'

import { Unit, Property, MaintenanceRequest, Lease, Tenant, UnitTax, UnitUtilityAccount, User, UnitFloor, LeaseUnit } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format";
import { ArrowLeft, Square, Calendar, Receipt} from "lucide-react";
import Link from "next/link";
import { MaintenanceList } from "./maintenance-list";
import { LeaseHistory } from "./lease-history";
import { UnitDocuments } from "./unit-documents";
import { DeleteUnitDialog } from "./delete-unit-dialog";
import { CurrentTenant } from "./current-tenant";
import { UnitTaxes } from "./unit-taxes";
import { UnitUtilities } from "./unit-utilities";
import { EditUnitDialog } from "./edit-unit-dialog";

// **FIXED**: Updated interface to reflect the new many-to-many relationship via LeaseUnit
// and to include the required `unitFloors` property.
interface UnitWithRelations extends Unit {
  property: Property;
  unitFloors: UnitFloor[];
  maintenanceRequests: (MaintenanceRequest & { tenant: Tenant | null })[];
  leaseUnits: (LeaseUnit & {
    lease: Lease & {
      tenant: Tenant;
    };
  })[];
  unitTaxes: UnitTax[];
  utilityAccounts: UnitUtilityAccount[];
}

interface UnitDetailsClientViewProps {
  unit: UnitWithRelations;
  users: User[];
  currentUserId: string | undefined;
}

const statusColorMap: { [key in Unit['status']]: string } = {
  VACANT: "bg-green-100 text-green-800 border-green-200",
  OCCUPIED: "bg-blue-100 text-blue-800 border-blue-200",
  MAINTENANCE: "bg-red-100 text-red-800 border-red-200",
  RESERVED: "bg-purple-100 text-purple-800 border-purple-200",
};

export function UnitDetailsClientView({ unit, users, currentUserId }: UnitDetailsClientViewProps) {
  // **FIXED**: Logic to find the active lease through the `leaseUnits` junction table.
  const activeLeaseUnit = unit.leaseUnits.find(lu => lu.lease.status === "ACTIVE");
  const activeLease = activeLeaseUnit?.lease;
  const currentTenant = activeLease?.tenant;

  // Extract the list of leases from the leaseUnits junction records.
  const allLeases = unit.leaseUnits.map(lu => lu.lease);

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-4">
            {/* Main unit info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <Link href="/dashboard/spaces">
                  <Button variant="outline" size="sm" className="border-slate-300 hover:bg-slate-50">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Spaces
                  </Button>
                </Link>
              </div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Space {unit.unitNumber}
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-xs bg-slate-50 border-slate-300">
                  {unit.property.propertyName}
                </Badge>
                <Badge
                  variant="secondary"
                  className={statusColorMap[unit.status]}
                >
                  {unit.status}
                </Badge>
              </div>
            </div>

            {/* unit details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <Square className="h-5 w-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{unit.totalArea.toFixed(2)} sqm</p>
                  <p className="text-xs text-slate-500">Total Area</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <Receipt className="h-5 w-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(unit.totalRent)}</p>
                  <p className="text-xs text-slate-500">Monthly Rent</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <Calendar className="h-5 w-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{activeLease ? "Active" : "No Active Lease"}</p>
                  <p className="text-xs text-slate-500">Current Lease</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 ml-6">
            <EditUnitDialog unit={unit} />
            <DeleteUnitDialog unitId={unit.id} unitNumber={unit.unitNumber} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="leases" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
          <TabsTrigger value="leases" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Lease History
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {allLeases.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="taxes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Real Property Taxes
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {unit.unitTaxes.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="utilities" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Utilities
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {unit.utilityAccounts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Documents  <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {unit.utilityAccounts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Maintenance
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {unit.maintenanceRequests.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leases" className="space-y-6">
          <LeaseHistory leases={allLeases} />
        </TabsContent>
        <TabsContent value="maintenance" className="space-y-6">
          <MaintenanceList requests={unit.maintenanceRequests} />
        </TabsContent>
        <TabsContent value="taxes" className="space-y-6">
          <UnitTaxes
            taxes={unit.unitTaxes}
            unitId={unit.id}
            unitNumber={unit.unitNumber}
          />
        </TabsContent>
        <TabsContent value="utilities" className="space-y-6">
          <UnitUtilities utilities={unit.utilityAccounts} unitId={unit.id} />
        </TabsContent>
        <TabsContent value="documents" className="space-y-6">
          <UnitDocuments unitId={unit.id} />
        </TabsContent>
      </Tabs>

      {unit.status === "OCCUPIED" && currentTenant && activeLease && (
        <CurrentTenant tenant={currentTenant} lease={activeLease} />
      )}
    </div>
  );
}