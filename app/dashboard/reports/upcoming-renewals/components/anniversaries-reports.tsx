'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Printer, Calendar, Building, Users, Heart } from 'lucide-react'
import { AnniversaryReport } from '@/lib/reports/renewal-reports'
import { formatDate } from '@/lib/utils'
import { exportToCSV } from '@/lib/export'
import { formatCurrency } from '@/lib/data/excel-export-properties-utils'
import { Input } from '@/components/ui/input'
import { getDaysText, getUrgencyBadgeVariant } from '@/lib/data/export-utils'


interface AnniversariesReportProps {
  anniversaries: AnniversaryReport[]
}

export function AnniversariesReport({ anniversaries }: AnniversariesReportProps) {
  const [selectedAnniversaries, setSelectedAnniversaries] = useState<string[]>([])

  const handleSelectAll = () => {
    if (selectedAnniversaries.length === anniversaries.length) {
      setSelectedAnniversaries([])
    } else {
      setSelectedAnniversaries(anniversaries.map(a => a.id))
    }
  }

  const handleSelectAnniversary = (id: string) => {
    setSelectedAnniversaries(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const exportAnniversaries = () => {
    const dataToExport = anniversaries.map(anniversary => ({
      'Tenant Name': anniversary.tenantName,
      'Email': anniversary.email,
      'Phone': anniversary.phone,
      'Company': anniversary.company,
      'Property': anniversary.propertyName,
      'Unit': anniversary.unitNumber,
      'Rent Amount': anniversary.rentAmount,
      'Lease Start': formatDate(anniversary.leaseStartDate),
      'Anniversary Date': formatDate(anniversary.anniversaryDate),
      'Days Until Anniversary': anniversary.daysUntilAnniversary,
      'Years With Us': anniversary.yearsWithUs,
      'Status': anniversary.status
    }))
    exportToCSV(dataToExport, 'tenant-anniversaries-report')
  }

  const printReport = () => {
    window.print()
  }

  const thisMonthAnniversaries = anniversaries.filter(a => a.daysUntilAnniversary <= 30)
  const longTermTenants = anniversaries.filter(a => a.yearsWithUs >= 5)
  const totalRentValue = anniversaries.reduce((sum, a) => sum + a.rentAmount, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Anniversaries</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anniversaries.length}</div>
            <p className="text-xs text-muted-foreground">
              Next 3 months
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{thisMonthAnniversaries.length}</div>
            <p className="text-xs text-muted-foreground">
              Within 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Long-term Tenants</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{longTermTenants.length}</div>
            <p className="text-xs text-muted-foreground">
              5+ years with us
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rent Value</CardTitle>
            <Building className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRentValue)}</div>
            <p className="text-xs text-muted-foreground">
              Monthly recurring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center print-hide">
        <h2 className="text-2xl font-bold">Upcoming Anniversaries</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAnniversaries}>
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
        <h1 className="print-title">Tenant Anniversaries Report</h1>
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
                    checked={selectedAnniversaries.length === anniversaries.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Property/Unit</TableHead>
                <TableHead>Rent Amount</TableHead>
                <TableHead>Anniversary Date</TableHead>
                <TableHead>Days Until</TableHead>
                <TableHead>Years With Us</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anniversaries.map((anniversary) => (
                <TableRow key={anniversary.id} className="hover:bg-muted/50">
                  <TableCell className="print-hide">
                    <Input
                      type="checkbox"
                      checked={selectedAnniversaries.includes(anniversary.id)}
                      onChange={() => handleSelectAnniversary(anniversary.id)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{anniversary.tenantName}</div>
                      <div className="text-sm text-muted-foreground">{anniversary.company}</div>
                      <div className="text-xs text-muted-foreground">{anniversary.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{anniversary.propertyName}</div>
                      <div className="text-sm text-muted-foreground">Unit {anniversary.unitNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(anniversary.rentAmount)}
                  </TableCell>
                  <TableCell>
                    {formatDate(anniversary.anniversaryDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getUrgencyBadgeVariant(anniversary.daysUntilAnniversary)}>
                      {getDaysText(anniversary.daysUntilAnniversary)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={anniversary.yearsWithUs >= 5 ? "default" : "secondary"}
                      className={anniversary.yearsWithUs >= 5 ? "bg-green-600" : ""}
                    >
                      {anniversary.yearsWithUs} {anniversary.yearsWithUs === 1 ? 'year' : 'years'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{anniversary.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {anniversaries.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No upcoming anniversaries</p>
            <p className="text-muted-foreground">No tenant anniversaries in the next 3 months</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}