"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { AuditLogFilters, ENTITY_TYPES, AUDIT_ACTIONS } from '@/types/audit-log';
import { cn } from '@/lib/utils';

interface AuditLogsFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  users: { id: string; firstName: string; lastName: string; email: string }[];
  onReset: () => void;
  disabled?: boolean;
}

export function AuditLogsFilters({ 
  filters, 
  onFiltersChange, 
  users, 
  onReset, 
  disabled = false 
}: AuditLogsFiltersProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : undefined
  );

  const handleFilterChange = (key: keyof AuditLogFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filters change
    });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    handleFilterChange('dateFrom', date ? format(date, 'yyyy-MM-dd') : undefined);
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    handleFilterChange('dateTo', date ? format(date, 'yyyy-MM-dd') : undefined);
  };

  const handleReset = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onReset();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Search
          </Label>
          <Input
            id="search"
            placeholder="Search entity ID, IP address, or changes..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            className="w-full"
            disabled={disabled}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={handleDateFromChange}
                  initialFocus
                  disabled={disabled}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={handleDateToChange}
                  initialFocus
                  disabled={disabled}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* User Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">User</Label>
          <Select
            value={filters.userId || "all"}
            onValueChange={(value) => handleFilterChange('userId', value === 'all' ? undefined : value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Entity Type</Label>
          <Select
            value={filters.entityType || "all"}
            onValueChange={(value) => handleFilterChange('entityType', value === 'all' ? undefined : value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="All entity types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entity types</SelectItem>
              {ENTITY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Action</Label>
          <Select
            value={filters.action || "all"}
            onValueChange={(value) => handleFilterChange('action', value === 'all' ? undefined : value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {AUDIT_ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {action.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* IP Address Filter */}
        <div className="space-y-2">
          <Label htmlFor="ipAddress" className="text-sm font-medium">
            IP Address
          </Label>
          <Input
            id="ipAddress"
            placeholder="Filter by IP address"
            value={filters.ipAddress || ''}
            onChange={(e) => handleFilterChange('ipAddress', e.target.value || undefined)}
            disabled={disabled}
          />
        </div>

        {/* Reset Button */}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleReset}
          disabled={disabled}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
}