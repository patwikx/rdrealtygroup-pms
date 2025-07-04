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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface OccupancyHistory {
  id: string
  unitNumber: string
  propertyName: string
  unitArea: number
  rentAmount: number
  occupancyPeriods: Array<{
    startDate: Date
    endDate: Date | null
    duration: number
    tenantName: string
  }>
  vacancyPeriods: Array<{
    startDate: Date
    endDate: Date | null
    duration: number
  }>
  yearlyStats: {
    totalOccupiedDays: number
    totalVacantDays: number
    occupancyRate: number
    lostRevenue: number
  }
}

interface OccupancyHistoryTableProps {
  data: OccupancyHistory[]
}

export function OccupancyHistoryTable({ data }: OccupancyHistoryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getOccupancyBadge = (rate: number) => {
    if (rate >= 90) return { color: 'bg-green-100 text-green-800', text: 'Excellent' }
    if (rate >= 75) return { color: 'bg-blue-100 text-blue-800', text: 'Good' }
    if (rate >= 60) return { color: 'bg-yellow-100 text-yellow-800', text: 'Fair' }
    return { color: 'bg-red-100 text-red-800', text: 'Poor' }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Property</TableHead>
              <TableHead className="text-right">Area (sqm)</TableHead>
              <TableHead className="text-center">Occupancy Rate</TableHead>
              <TableHead className="text-right">Occupied Days</TableHead>
              <TableHead className="text-right">Vacant Days</TableHead>
              <TableHead className="text-right">Lost Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((unit) => {
              const isExpanded = expandedRows.has(unit.id)
              const occupancyBadge = getOccupancyBadge(unit.yearlyStats.occupancyRate)
              
              return (
                <Collapsible key={unit.id} asChild>
                  <>
                    <TableRow>
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleRow(unit.id)}
                          >
                            {isExpanded ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                      <TableCell>{unit.propertyName}</TableCell>
                      <TableCell className="text-right">{unit.unitArea.toFixed(1)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-medium">{unit.yearlyStats.occupancyRate.toFixed(1)}%</span>
                          <Badge className={occupancyBadge.color}>
                            {occupancyBadge.text}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{unit.yearlyStats.totalOccupiedDays}</TableCell>
                      <TableCell className="text-right">{unit.yearlyStats.totalVacantDays}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {formatCurrency(unit.yearlyStats.lostRevenue)}
                      </TableCell>
                    </TableRow>
                    
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={8} className="bg-gray-50 p-0">
                          <div className="p-4 space-y-4">
                            {/* Occupancy Periods */}
                            {unit.occupancyPeriods.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2 text-green-700">Occupancy Periods</h4>
                                <div className="space-y-2">
                                  {unit.occupancyPeriods.map((period, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm bg-green-50 p-2 rounded">
                                      <div>
                                        <span className="font-medium">{period.tenantName}</span>
                                        <span className="text-muted-foreground ml-2">
                                          {format(new Date(period.startDate), 'MMM dd, yyyy')} - 
                                          {period.endDate ? format(new Date(period.endDate), 'MMM dd, yyyy') : 'Present'}
                                        </span>
                                      </div>
                                      <Badge variant="outline" className="bg-green-100 text-green-800">
                                        {period.duration} days
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Vacancy Periods */}
                            {unit.vacancyPeriods.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2 text-red-700">Vacancy Periods</h4>
                                <div className="space-y-2">
                                  {unit.vacancyPeriods.map((period, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm bg-red-50 p-2 rounded">
                                      <div>
                                        <span className="text-muted-foreground">
                                          {format(new Date(period.startDate), 'MMM dd, yyyy')} - 
                                          {period.endDate ? format(new Date(period.endDate), 'MMM dd, yyyy') : 'Present'}
                                        </span>
                                      </div>
                                      <Badge variant="outline" className="bg-red-100 text-red-800">
                                        {period.duration} days
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              )
            })}
          </TableBody>
        </Table>
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No occupancy history found matching the selected criteria.
        </div>
      )}
    </div>
  )
}