import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Download, Building2 } from "lucide-react";
import Link from "next/link";
import { getProperties } from "@/lib/data/properties";
import { auth } from "@/auth";
import { PropertyListSkeleton } from "./components/property-list-skeleton";
import { PropertyList } from "./components/property-list";
import { getUsers } from "@/actions/get-users-property-tax";
import { PropertyExportDialog } from "./components/property-export-dialog";
import { PropertyPrintDialog } from "./components/print-properties-dialog";

export const revalidate = 0;

export default async function PropertiesPage() {
  const [properties, users, session] = await Promise.all([
    getProperties(),
    getUsers(),
    auth()
  ]);

  if (!session?.user) {
    return null; // Or handle unauthorized access
  }

  return (
    <div className="h-full flex-1 flex flex-col space-y-2 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight ml-6">Properties</h2>
          <p className="text-muted-foreground ml-6">
            Manage and monitor all your properties in one place
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <PropertyPrintDialog properties={properties} />
          <PropertyExportDialog properties={properties} />
          <Button asChild>
            <Link href="/dashboard/properties/new">
              <Building2 className="mr-2 h-4 w-4" />
              Add New Property
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<PropertyListSkeleton />}>
        <PropertyList 
          initialProperties={properties.map((property: any) => ({
            taxRecords: [],
            ...property
          }))} 
          users={users}
          currentUserId={session.user.id}
        />
      </Suspense>
    </div>
  );
}