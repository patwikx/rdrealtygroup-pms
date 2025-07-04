"use client";

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileBarChart, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuditLogFilters, AuditLogWithUser } from '@/types/audit-log';
import { toast } from 'sonner';
import { getAuditLogs, getAuditLogStats } from '@/lib/audit-log';
import { ExportButtons } from './components/export-buttons';
import { AuditLogsFilters } from './components/audit-logs-filter';
import { AuditLogsTable } from './components/audit-logs-table';

const initialFilters: AuditLogFilters = {
  page: 1,
  limit: 50,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([]);
  const [filters, setFilters] = useState<AuditLogFilters>(initialFilters);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalLogs: 0,
    last24Hours: 0,
    uniqueUsers: 0,
    topActions: [] as { action: string; count: number }[]
  });

  const [isPending, startTransition] = useTransition();

  const fetchAuditLogs = async (currentFilters: AuditLogFilters) => {
    startTransition(async () => {
      try {
        setError(null);
        
        const result = await getAuditLogs(currentFilters);
        
        if (result.success && result.data) {
          setLogs(result.data.logs);
          setTotal(result.data.total);
          setTotalPages(result.data.totalPages);
          setCurrentPage(result.data.currentPage);
          setUsers(result.data.users);
        } else {
          setError(result.error || 'Failed to fetch audit logs');
          toast.error(result.error || 'Failed to load audit logs');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch audit logs';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error fetching audit logs:', err);
      }
    });
  };

  const fetchStats = async () => {
    try {
      const result = await getAuditLogStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchAuditLogs(filters);
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFiltersChange = (newFilters: AuditLogFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const handleRetry = () => {
    fetchAuditLogs(filters);
  };

  const handleRefresh = () => {
    fetchAuditLogs(filters);
    fetchStats();
    toast.success('Data refreshed');
  };

  const getActivitySummary = () => {
    // Use server-side stats when available, fallback to client-side calculation
    if (stats.totalLogs > 0) {
      return {
        last24Hours: stats.last24Hours,
        uniqueUsers: stats.uniqueUsers,
        topAction: stats.topActions[0] ? `${stats.topActions[0].action} (${stats.topActions[0].count})` : 'N/A'
      };
    }

    // Fallback to client-side calculation for current view
    const last24Hours = logs.filter(log => {
      const logDate = new Date(log.createdAt);
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return logDate >= yesterday;
    }).length;

    const uniqueUsers = new Set(logs.map(log => log.userId)).size;
    const mostCommonAction = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topAction = Object.entries(mostCommonAction).sort(([,a], [,b]) => b - a)[0];

    return {
      last24Hours,
      uniqueUsers,
      topAction: topAction ? `${topAction[0]} (${topAction[1]})` : 'N/A'
    };
  };

  const summary = getActivitySummary();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and track all system activities, user actions, and data changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <ExportButtons 
            logs={logs} 
            totalRecords={total}
            disabled={isPending}
            filters={filters}
          />
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.last24Hours.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Activities recorded</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalLogs > 0 ? 'Total unique users' : 'Unique users in current view'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common Action</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.topAction.split(' ')[0]}</div>
            <p className="text-xs text-muted-foreground">{summary.topAction}</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isPending}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <AuditLogsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            users={users}
            onReset={handleResetFilters}
            disabled={isPending}
          />
        </div>

        {/* Audit Logs Table */}
        <div className="lg:col-span-3">
          <AuditLogsTable
            logs={logs}
            total={total}
            totalPages={totalPages}
            currentPage={currentPage}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            isLoading={isPending}
          />
        </div>
      </div>
    </div>
  );
}