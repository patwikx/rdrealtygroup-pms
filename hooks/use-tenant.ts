'use client';

import { useState, useCallback } from 'react';
import { Tenant, TenantStatus } from '@prisma/client';
import { useDebounce } from './use-debounce';

interface UseTenantFilters {
  status?: TenantStatus;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export function useTenants(initialTenants: Tenant[]) {
  const [filters, setFilters] = useState<UseTenantFilters>({});
  const [tenants, setTenants] = useState(initialTenants);
  const debouncedSearch = useDebounce(filters.search, 300);

  const filterTenants = useCallback(() => {
    let filtered = [...initialTenants];

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(tenant => tenant.status === filters.status);
    }

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(tenant =>
        tenant.bpCode.toLowerCase().includes(searchLower) ||
        tenant.company.toLowerCase().includes(searchLower) ||
        tenant.businessName.toLowerCase().includes(searchLower) ||
        tenant.email.toLowerCase().includes(searchLower) ||
        tenant.bpCode.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a: any, b: any) => {
        const aValue = a[filters.sortBy!];
        const bValue = b[filters.sortBy!];
        
        if (typeof aValue === 'string') {
          return filters.sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return filters.sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      });
    }

    setTenants(filtered);
  }, [initialTenants, filters, debouncedSearch]);

  const updateFilter = useCallback((key: keyof UseTenantFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    tenants,
    filters,
    updateFilter,
    resetFilters,
    filterTenants,
  };
}