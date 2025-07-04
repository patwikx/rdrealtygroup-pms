'use client'

import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { ArrowUpDown, ExternalLink } from 'lucide-react'

interface VacantUnit {
  id: string
  unitNumber: string
  propertyName: string
  unitArea: number
  rentAmount: number
  vacancyStartDate: Date
  vacancyDuration: number
  monthlyLoss: number
  annualLoss: number
  status: string
}

interface VacancyDurationTableProps {
  data: VacantUnit[]
}

export function VacancyDurationTable({ data }: VacancyDurationTableProps) {
  const [sortKey, setSortKey] = useState<keyof VacantUnit>('vacancyDuration')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortKey]
    const bValue = b[sortKey]
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key: keyof VacantUnit) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const getVacancyBadge = (duration: number) => {
    if (duration <= 30) return { color: 'bg-green-100 text-green-800', text: 'Recent' }
    if (duration <= 60) return { color: 'bg-yellow-100 text-yellow-800', text: 'Moderate' }
    if (duration <= 90) return { color: 'bg-orange-100 text-orange-800', text: 'Concerning' }
    return { color: 'bg-red-100 text-red-800', text: 'Critical' }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Property</TableHead>
              <TableHead className="text-right">Area (sqm)</TableHead>
              <TableHead className="text-right">Rent Amount</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('vacancyStartDate')}
                  className="h-auto p-0 font-medium"
                >
                  Vacant Since
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('vacancyDuration')}
                  className="h-auto p-0 font-medium"
                >
                  Duration
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('monthlyLoss')}
                  className="h-auto p-0 font-medium"
                >
                  Monthly Loss
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Annual Loss</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((unit) => {
              const vacancyBadge = getVacancyBadge(unit.vacancyDuration)
              return (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                  <TableCell>{unit.propertyName}</TableCell>
                  <TableCell className="text-right">{unit.unitArea.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(unit.rentAmount)}</TableCell>
                  <TableCell>
                    {format(new Date(unit.vacancyStartDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{unit.vacancyDuration} days</span>
                      <Badge className={vacancyBadge.color}>
                        {vacancyBadge.text}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    {formatCurrency(unit.monthlyLoss)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    {formatCurrency(unit.annualLoss)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No vacant units found matching the selected criteria.
        </div>
      )}
    </div>
  )
}