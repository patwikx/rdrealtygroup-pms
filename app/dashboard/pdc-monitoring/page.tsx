import { Suspense } from "react"
import { Metadata } from "next"


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getPDCs, getTenants } from "@/actions/pdc-actions"
import { PDCStats } from "./components/pdc-stats"
import { PDCForm } from "./components/pdc-form"
import { PDCTable } from "./components/pdc-table"

export const metadata: Metadata = {
  title: "RD Realty Group - Credit & Collection",
  description: "Manage post-dated checks and credit collection",
}

function PDCTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px]" />
              <Skeleton className="h-3 w-[80px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function PDCContent() {
  const [pdcs, tenants] = await Promise.all([
    getPDCs(),
    getTenants()
  ])

  return (
    <div className="space-y-6">
      <PDCStats pdcs={pdcs} />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Post-Dated Checks</CardTitle>
              <CardDescription>
                Manage and track all post-dated checks in the system
              </CardDescription>
            </div>
            <PDCForm tenants={tenants} />
          </div>
        </CardHeader>
        <CardContent>
          <PDCTable pdcs={pdcs} />
        </CardContent>
      </Card>
    </div>
  )
}

export default function CreditCollectionPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Credit & Collection</h2>
      </div>
      
      <Suspense fallback={<PDCTableSkeleton />}>
        <PDCContent />
      </Suspense>
    </div>
  )
}