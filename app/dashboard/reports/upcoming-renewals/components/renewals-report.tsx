'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Printer, Calendar, Building, DollarSign } from 'lucide-react'
import { RenewalReport } from '@/lib/reports/renewal-reports'
import { formatDate } from '@/lib/utils'
import { exportToCSV } from '@/lib/export'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils/format'
import { getDaysText, getUrgencyBadgeVariant } from '@/lib/data/export-utils'

interface RenewalsReportProps {
  renewals: RenewalReport[]
}

export function RenewalsReport({ renewals }: RenewalsReportProps) {
  const [selectedRenewals, setSelectedRenewals] = useState<string[]>([])

  const handleSelectAll = () => {
    if (selectedRenewals.length === renewals.length) {
      setSelectedRenewals([])
    } else {
      setSelectedRenewals(renewals.map(r => r.id))
    }
  }

  const handleSelectRenewal = (id: string) => {
    setSelectedRenewals(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const exportRenewals = () => {
    const dataToExport = renewals.map(renewal => ({
      'Tenant Name': renewal.tenantName,
      'Email': renewal.email,
      'Phone': renewal.phone,
      'Company': renewal.company,
      'Property': renewal.propertyName,
      'Unit': renewal.unitNumber,
      'Rent Amount': renewal.rentAmount,
      'Lease Start': formatDate(renewal.leaseStartDate),
      'Lease End': formatDate(renewal.leaseEndDate),
      'Days Until Renewal': renewal.daysUntilRenewal,
      'Years With Us': renewal.yearsWithUs,
      'Status': renewal.status
    }))
    exportToCSV(dataToExport, 'tenant-renewals-report')
  }

  const printReport = () => {
    window.print()
  }

  const urgentRenewals = renewals.filter(r => r.daysUntilRenewal <= 30)
  const totalRentValue = renewals.reduce((sum, r) => sum + r.rentAmount, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Renewals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{renewals.length}</div>
            <p className="text-xs text-muted-foreground">
              Next 3 months
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Renewals</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentRenewals.length}</div>
            <p className="text-xs text-muted-foreground">
              Within 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rent Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRentValue)}</div>
            <p className="text-xs text-muted-foreground">
              Monthly recurring
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(renewals.map(r => r.propertyName)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Affected properties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center print-hide">
        <h2 className="text-2xl font-bold">Upcoming Renewals</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportRenewals}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={printReport}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Print Title */}
      <div className="print-show hidden">
        <h1 className="print-title">Tenant Renewals Report</h1>
        <p className="print-subtitle">Generated on {formatDate(new Date())}</p>
      </div>

      {/* Table */}
      <Card className="print-section">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] print-hide">
                  <Input
                    type="checkbox"
                    checked={selectedRenewals.length === renewals.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Property/Unit</TableHead>
                <TableHead>Rent Amount</TableHead>
                <TableHead>Lease End</TableHead>
                <TableHead>Days Until</TableHead>
                <TableHead>Years With Us</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renewals.map((renewal) => (
                <TableRow key={renewal.id} className="hover:bg-muted/50">
                  <TableCell className="print-hide">
                    <Input
                      type="checkbox"
                      checked={selectedRenewals.includes(renewal.id)}
                      onChange={() => handleSelectRenewal(renewal.id)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{renewal.tenantName}</div>
                      <div className="text-sm text-muted-foreground">{renewal.company}</div>
                      <div className="text-xs text-muted-foreground">{renewal.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{renewal.propertyName}</div>
                      <div className="text-sm text-muted-foreground">Unit {renewal.unitNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(renewal.rentAmount)}
                  </TableCell>
                  <TableCell>
                    {formatDate(renewal.leaseEndDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getUrgencyBadgeVariant(renewal.daysUntilRenewal)}>
                      {getDaysText(renewal.daysUntilRenewal)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {renewal.yearsWithUs} {renewal.yearsWithUs === 1 ? 'year' : 'years'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{renewal.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {renewals.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No upcoming renewals</p>
            <p className="text-muted-foreground">All leases are current for the next 3 months</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}