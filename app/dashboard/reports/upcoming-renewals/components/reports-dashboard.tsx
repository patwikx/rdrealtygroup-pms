'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Heart, AlertTriangle, TrendingUp, Building, Users } from 'lucide-react'
import { AnniversaryReport, RenewalReport } from '@/lib/reports/renewal-reports'
import { getDaysText } from '@/lib/data/export-utils'
import { formatCurrency } from '@/lib/data/excel-export-properties-utils'
import { formatDate } from '@/lib/utils'


interface ReportsDashboardProps {
  renewals: RenewalReport[]
  anniversaries: AnniversaryReport[]
}

export function ReportsDashboard({ renewals, anniversaries }: ReportsDashboardProps) {
  const urgentRenewals = renewals.filter(r => r.daysUntilRenewal <= 30)
  const upcomingAnniversaries = anniversaries.filter(a => a.daysUntilAnniversary <= 30)
  const longTermTenants = anniversaries.filter(a => a.yearsWithUs >= 5)
  
  const nextRenewal = renewals[0]
  const nextAnniversary = anniversaries[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold print-title">Reports Dashboard</h1>
        <p className="text-muted-foreground print-subtitle">
          Overview of upcoming renewals and tenant anniversaries
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 print-section">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Renewals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{renewals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Renewals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentRenewals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Anniversaries</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anniversaries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingAnniversaries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Long-term Tenants</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{longTermTenants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set([...renewals.map(r => r.propertyName), ...anniversaries.map(a => a.propertyName)]).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Highlighted Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-section">
        {/* Next Renewal */}
        {nextRenewal && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Next Renewal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{nextRenewal.tenantName}</p>
                  <p className="text-sm text-muted-foreground">{nextRenewal.company}</p>
                </div>
                <Badge variant="destructive">
                  {getDaysText(nextRenewal.daysUntilRenewal)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm font-medium">Property</p>
                  <p className="text-sm text-muted-foreground">{nextRenewal.propertyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Unit</p>
                  <p className="text-sm text-muted-foreground">{nextRenewal.unitNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Rent</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(nextRenewal.rentAmount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">End Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(nextRenewal.leaseEndDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Anniversary */}
        {nextAnniversary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Next Anniversary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{nextAnniversary.tenantName}</p>
                  <p className="text-sm text-muted-foreground">{nextAnniversary.company}</p>
                </div>
                <Badge variant="default">
                  {getDaysText(nextAnniversary.daysUntilAnniversary)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm font-medium">Property</p>
                  <p className="text-sm text-muted-foreground">{nextAnniversary.propertyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Unit</p>
                  <p className="text-sm text-muted-foreground">{nextAnniversary.unitNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Years</p>
                  <p className="text-sm text-muted-foreground">{nextAnniversary.yearsWithUs} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Anniversary</p>
                  <p className="text-sm text-muted-foreground">{formatDate(nextAnniversary.anniversaryDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty states */}
        {!nextRenewal && (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No upcoming renewals</p>
              <p className="text-muted-foreground">All leases are current</p>
            </CardContent>
          </Card>
        )}

        {!nextAnniversary && (
          <Card>
            <CardContent className="py-8 text-center">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No upcoming anniversaries</p>
              <p className="text-muted-foreground">No anniversaries in the next 3 months</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity Summary */}
      <Card className="print-section">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Urgent Actions Required
              </h4>
              <ul className="text-sm space-y-1">
                <li className="flex justify-between">
                  <span>Renewals due within 30 days</span>
                  <Badge variant="destructive" className="text-xs">
                    {urgentRenewals.length}
                  </Badge>
                </li>
                <li className="flex justify-between">
                  <span>Anniversaries this month</span>
                  <Badge variant="default" className="text-xs">
                    {upcomingAnniversaries.length}
                  </Badge>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Tenant Retention
              </h4>
              <ul className="text-sm space-y-1">
                <li className="flex justify-between">
                  <span>Long-term tenants (5+ years)</span>
                  <Badge variant="secondary" className="text-xs">
                    {longTermTenants.length}
                  </Badge>
                </li>
                <li className="flex justify-between">
                  <span>Average tenant tenure</span>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(anniversaries.reduce((sum, a) => sum + a.yearsWithUs, 0) / anniversaries.length || 0)} years
                  </Badge>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}