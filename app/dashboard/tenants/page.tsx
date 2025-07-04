'use client';

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download, UserPlus2 } from "lucide-react";
import Link from "next/link";
import { TenantListSkeleton } from "./components/tenants-list-skeletion";
import { TenantList } from "./components/tenants-list";


export default function TenantsPage() {
  return (
    <div className="h-full flex-1 flex flex-col space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight ml-6">Tenants</h2>
          <p className="text-muted-foreground ml-6">
            Manage and monitor all your tenants in one place
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/dashboard/tenants/new">
              <UserPlus2 className="mr-2 h-4 w-4" />
              Add Tenant
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<TenantListSkeleton />}>
        <TenantList />
      </Suspense>
    </div>
  );
}