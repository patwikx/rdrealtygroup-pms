'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, Table } from 'lucide-react'

interface ExportProps {
  data: any
}

export function OpportunityLossExport({ data }: ExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToCSV = async () => {
    setIsExporting(true)
    try {
      // Create CSV content
      const csvContent = [
        // Header
        'Unit Number,Property Name,Area (sqm),Rent Amount,Vacancy Start Date,Vacancy Duration (days),Monthly Loss,Annual Loss,Occupancy Rate (%),Occupied Days,Vacant Days,Lost Revenue',
        // Data rows
        ...data.vacantUnits.map((unit: any) => [
          unit.unitNumber,
          unit.propertyName,
          unit.unitArea,
          unit.rentAmount,
          new Date(unit.vacancyStartDate).toLocaleDateString(),
          unit.vacancyDuration,
          unit.monthlyLoss,
          unit.annualLoss,
          '', // Occupancy rate - vacant units don't have this
          '', // Occupied days - vacant units don't have this
          '', // Vacant days - vacant units don't have this
          '' // Lost revenue - vacant units don't have this
        ].join(',')),
        // Add occupancy history data
        ...data.occupancyHistory.map((unit: any) => [
          unit.unitNumber,
          unit.propertyName,
          unit.unitArea,
          unit.rentAmount,
          '', // Vacancy start date - not applicable for history
          '', // Vacancy duration - not applicable for history
          '', // Monthly loss - not applicable for history
          '', // Annual loss - not applicable for history
          unit.yearlyStats.occupancyRate.toFixed(1),
          unit.yearlyStats.totalOccupiedDays,
          unit.yearlyStats.totalVacantDays,
          unit.yearlyStats.lostRevenue
        ].join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `opportunity-loss-report-${new Date().toISOString().slice(0, 10)}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      // Call API to generate PDF
      const response = await fetch('/api/reports/opportunity-loss-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `opportunity-loss-report-${new Date().toISOString().slice(0, 10)}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export Report'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToCSV}>
          <Table className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}