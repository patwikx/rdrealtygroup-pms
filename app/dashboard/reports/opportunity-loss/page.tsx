import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Building2, AlertTriangle, TrendingDown, Clock } from 'lucide-react'
import { getOpportunityLossData } from '@/lib/reports/comprehensive-opportunity-loss'
import { formatCurrency } from '@/lib/utils'
import { prisma } from '@/lib/db'
import { OpportunityLossExport } from './components/opportunity-loss-export'
import { OpportunityLossFilters } from './components/opportunity-loss-filters'
import { OpportunityLossChart } from './components/oppotunity-loss-charts'
import { VacancyDurationTable } from './components/vacancy-duration-table'
import { OccupancyHistoryTable } from './components/occupancy-history-table'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "RD Realty Group - Opportunity Loss Analysis",
  description: "Manage vacancy durations and opportunity loss",
}

interface PageProps {
  searchParams: {
    propertyId?: string
    unitStatus?: string
    vacancyDuration?: string
    dateRange?: string
  }
}

// Server Actions
async function updateFilters(filters: any) {
  'use server'
  
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== '') {
      params.set(key, value as string)
    }
  })
  
  const queryString = params.toString()
  const redirectUrl = queryString 
    ? `/dashboard/reports/opportunity-loss?${queryString}`
    : '/dashboard/reports/opportunity-loss'
  
  redirect(redirectUrl)
}

async function clearFilters() {
  'use server'
  redirect('/dashboard/reports/opportunity-loss')
}

async function getProperties() {
  const properties = await prisma.property.findMany({
    select: {
      id: true,
      propertyName: true,
      propertyCode: true,
      propertyType: true,
      totalUnits: true,
      leasableArea: true,
    },
    orderBy: {
      propertyName: 'asc'
    }
  })

  return properties.map(property => ({
    id: property.id,
    name: property.propertyName,
    code: property.propertyCode,
    type: property.propertyType,
    totalUnits: property.totalUnits || 0,
    leasableArea: Number(property.leasableArea),
  }))
}

export default async function OpportunityLossPage({ searchParams }: PageProps) {
  const [data, properties] = await Promise.all([
    getOpportunityLossData(searchParams),
    getProperties()
  ])
  
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Opportunity Loss Analysis</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of revenue loss from vacant spaces
          </p>
        </div>
        <OpportunityLossExport data={data} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly Loss</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.summary.totalMonthlyLoss)}
            </div>
            <p className="text-xs text-muted-foreground">
              Annual: {formatCurrency(data.summary.totalAnnualLoss)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacant Spaces</CardTitle>
            <Building2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalVacantUnits}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.totalVacantArea.toFixed(1)} sqm total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Vacancy Duration</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.avgVacancyDuration} days
            </div>
            <p className="text-xs text-muted-foreground">
              Longest: {data.summary.longestVacancy} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <CalendarDays className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.occupancyRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Year-to-date average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div>
             <OpportunityLossFilters 
            properties={properties}
            currentFilters={searchParams}
            updateFilters={updateFilters}
            clearFilters={clearFilters}
          />
      </div>

            {/* Detailed Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vacant Space Detail</CardTitle>
            <CardDescription>
              Detailed breakdown of currently vacant spaces and their duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VacancyDurationTable data={data.vacantUnits} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy History</CardTitle>
            <CardDescription>
              Historical occupancy patterns for all spaces this year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OccupancyHistoryTable data={data.occupancyHistory} />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Loss Trend</CardTitle>
            <CardDescription>
              Opportunity loss over the past 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OpportunityLossChart data={data.monthlyTrends} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vacancy Duration Distribution</CardTitle>
            <CardDescription>
              Distribution of vacancy periods across spaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OpportunityLossChart 
              data={data.vacancyDistribution} 
              type="bar"
              xKey="range"
              yKey="count"
            />
          </CardContent>
        </Card>
      </div>


    </div>
  )
}