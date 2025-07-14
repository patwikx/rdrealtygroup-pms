import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getUpcomingAnniversaries, getUpcomingRenewals } from '@/lib/reports/renewal-reports'
import { ReportsDashboard } from './components/reports-dashboard'
import { RenewalsReport } from './components/renewals-report'
import { AnniversariesReport } from './components/anniversaries-reports'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "RD Realty Group - Renewals & Anniversaries",
  description: "Manage post-dated checks and credit collection",
}


function ReportsLoading() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

async function ReportsContent() {
  const [renewals, anniversaries] = await Promise.all([
    getUpcomingRenewals(3),
    getUpcomingAnniversaries(3)
  ])

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="renewals">Renewals</TabsTrigger>
            <TabsTrigger value="anniversaries">Anniversaries</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <ReportsDashboard renewals={renewals} anniversaries={anniversaries} />
          </TabsContent>
          
          <TabsContent value="renewals" className="space-y-6">
            <RenewalsReport renewals={renewals} />
          </TabsContent>
          
          <TabsContent value="anniversaries" className="space-y-6">
            <AnniversariesReport anniversaries={anniversaries} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsContent />
    </Suspense>
  )
}