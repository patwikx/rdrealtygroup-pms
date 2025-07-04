'use client'

import { useTransition } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from 'lucide-react'

interface Property {
  id: string
  name: string
  code: string
  type: string
  totalUnits: number
  leasableArea: number
}

interface FiltersProps {
  properties: Property[]
  currentFilters: {
    propertyId?: string
    unitStatus?: string
    vacancyDuration?: string
    dateRange?: string
  }
  updateFilters: (filters: any) => Promise<void>
  clearFilters: () => Promise<void>
}

export function OpportunityLossFilters({ 
  properties, 
  currentFilters, 
  updateFilters, 
  clearFilters 
}: FiltersProps) {
  const [isPending, startTransition] = useTransition()

  const handleFilterChange = (key: string, value: string) => {
    startTransition(async () => {
      // If value is "all", remove the filter by setting it to undefined
      const newFilters = { ...currentFilters }
      if (value === 'all') {
        delete newFilters[key as keyof typeof newFilters]
      } else {
        newFilters[key as keyof typeof newFilters] = value
      }
      await updateFilters(newFilters)
    })
  }

  const handleClearFilters = () => {
    startTransition(async () => {
      await clearFilters()
    })
  }

  const activeFiltersCount = Object.values(currentFilters).filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="propertyId">Property</Label>
          <Select 
            value={currentFilters.propertyId || 'all'} 
            onValueChange={(value) => handleFilterChange('propertyId', value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitStatus">Space Status</Label>
          <Select 
            value={currentFilters.unitStatus || 'all'} 
            onValueChange={(value) => handleFilterChange('unitStatus', value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="VACANT">Vacant</SelectItem>
              <SelectItem value="OCCUPIED">Occupied</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="RESERVED">Reserved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vacancyDuration">Vacancy Duration</Label>
          <Select 
            value={currentFilters.vacancyDuration || 'all'} 
            onValueChange={(value) => handleFilterChange('vacancyDuration', value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Durations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Durations</SelectItem>
              <SelectItem value="0-30">0-30 days</SelectItem>
              <SelectItem value="31-60">31-60 days</SelectItem>
              <SelectItem value="61-90">61-90 days</SelectItem>
              <SelectItem value="91-180">91-180 days</SelectItem>
              <SelectItem value="181+">181+ days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateRange">Date Range</Label>
          <Select 
            value={currentFilters.dateRange || 'all'} 
            onValueChange={(value) => handleFilterChange('dateRange', value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Current Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Current Year</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {activeFiltersCount > 0 && (
          <Button 
            variant="outline" 
            onClick={handleClearFilters}
            disabled={isPending}
          >
            Clear All
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
        
        {activeFiltersCount > 0 && (
          <Badge variant="secondary">
            {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
          </Badge>
        )}
        
        {isPending && (
          <Badge variant="outline">
            Updating...
          </Badge>
        )}
      </div>
    </div>
  )
}