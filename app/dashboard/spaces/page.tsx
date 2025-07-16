
import { UnitStats } from "./components/units-stats";


import { Metadata } from "next";
import { UnitsTableWrapper } from "./components/units-table-wrapper";

export const metadata: Metadata = {
  title: "RD Realty Group - Spaces",
  description: "Manage and monitor all your property spaces in one place",
};

export default function UnitsPage() {
  return (
    <div className="h-full flex-1 flex flex-col space-y-8 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spaces Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all your property spaces in one place
          </p>
        </div>
      </div>

  
        <UnitStats />

  
        <UnitsTableWrapper />
  
    </div>
  );
}