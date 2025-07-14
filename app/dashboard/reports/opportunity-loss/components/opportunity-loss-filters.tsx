"use client"

import React, { useTransition } from 'react'
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
import { X, Building, Tag, Clock, Calendar, ListFilter, RotateCw } from 'lucide-react'

// Mock Property Data for standalone demonstration
interface Property {
  id: string
  name: string
  code: string
  type: string
  totalUnits: number
  leasableArea: number
}

// Props for the component - Reverted dateRange to string
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

// Main Filter Component
export function OpportunityLossFilters({
  properties,
  currentFilters,
  updateFilters,
  clearFilters,
}: FiltersProps) {
  const [isPending, startTransition] = useTransition()

  const handleFilterChange = (key: string, value: string | undefined) => {
    startTransition(async () => {
      const newFilters = { ...currentFilters };
      // If value is "all" or undefined, remove the filter
      if (value === 'all' || value === undefined) {
        delete newFilters[key as keyof typeof newFilters];
      } else {
        newFilters[key as keyof typeof newFilters] = value;
      }
      await updateFilters(newFilters);
    });
  };

  const handleClearSingleFilter = (key: string) => {
    handleFilterChange(key, undefined);
  };

  const handleClearAll = () => {
    startTransition(async () => {
      await clearFilters();
    });
  };

  const dateRangeOptions = [
    { value: 'current-year', label: 'Current Year' },
    { value: 'last-3-months', label: 'Last 3 Months' },
    { value: 'last-6-months', label: 'Last 6 Months' },
    { value: 'last-year', label: 'Last Year' },
  ];

  const getFilterDisplayName = (key: string, value: any): string => {
    if (!value) return '';
    switch (key) {
      case 'propertyId':
        return properties.find(p => p.id === value)?.name || 'Unknown Property';
      case 'unitStatus':
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      case 'vacancyDuration':
        return value.includes('+') ? `${value.replace('+', '')}+ days` : `${value} days`;
      case 'dateRange':
        return dateRangeOptions.find(o => o.value === value)?.label || 'Current Year';
      default:
        return String(value);
    }
  };

  const activeFilters = Object.entries(currentFilters).filter(([, value]) => value !== undefined && value !== null && value !== '');

  return (
    <div className="p-4 bg-card border rounded-lg shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ListFilter className="h-5 w-5" />
          <span>Filters</span>
        </h3>
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RotateCw className="h-4 w-4 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>
      
      {/* Filter Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FilterSelect
          label="Property"
          value={currentFilters.propertyId}
          onValueChange={(value) => handleFilterChange('propertyId', value)}
          options={properties.map(p => ({ value: p.id, label: p.name }))}
          icon={Building}
          isPending={isPending}
        />
        <FilterSelect
          label="Space Status"
          value={currentFilters.unitStatus}
          onValueChange={(value) => handleFilterChange('unitStatus', value)}
          options={[
            { value: 'VACANT', label: 'Vacant' },
            { value: 'OCCUPIED', label: 'Occupied' },
            { value: 'MAINTENANCE', label: 'Maintenance' },
            { value: 'RESERVED', label: 'Reserved' },
          ]}
          icon={Tag}
          isPending={isPending}
        />
        <FilterSelect
          label="Vacancy Duration"
          value={currentFilters.vacancyDuration}
          onValueChange={(value) => handleFilterChange('vacancyDuration', value)}
          options={[
            { value: '0-30', label: '0-30 days' },
            { value: '31-60', label: '31-60 days' },
            { value: '61-90', label: '61-90 days' },
            { value: '91-180', label: '91-180 days' },
            { value: '181+', label: '181+ days' },
          ]}
          icon={Clock}
          isPending={isPending}
        />
        <FilterSelect
          label="Date Range"
          value={currentFilters.dateRange}
          onValueChange={(value) => handleFilterChange('dateRange', value)}
          options={dateRangeOptions}
          icon={Calendar}
          isPending={isPending}
        />
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Active Filters:</span>
              {activeFilters.map(([key, value]) => (
                <Badge key={key} variant="secondary" className="flex items-center gap-1.5">
                  <span>{getFilterDisplayName(key, value)}</span>
                  <Button onClick={() => handleClearSingleFilter(key)} className="rounded-full hover:bg-muted-foreground/20 p-0.5" disabled={isPending}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearAll}
                disabled={isPending}
                className="text-primary hover:bg-primary/10 h-auto px-2 py-1"
              >
                Clear All
              </Button>
            </div>
        </div>
      )}
    </div>
  )
}

// Reusable Select Component for Filters
function FilterSelect({ label, value, onValueChange, options, icon: Icon, isPending }: {
    label: string;
    value?: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    icon: React.ElementType;
    isPending: boolean;
}) {
    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</Label>
            <Select 
              value={value || 'all'} 
              onValueChange={onValueChange}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={`All ${label}s`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {label}s</SelectItem>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
    )
}
