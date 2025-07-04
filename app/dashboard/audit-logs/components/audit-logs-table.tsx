"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { AuditLogWithUser, AuditLogFilters } from '@/types/audit-log';
import { cn } from '@/lib/utils';
import { formatChanges, getActionColor } from '@/lib/audit-log-utils';

interface AuditLogsTableProps {
  logs: AuditLogWithUser[];
  total: number;
  totalPages: number;
  currentPage: number;
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  isLoading?: boolean;
}

export function AuditLogsTable({
  logs,
  total,
  totalPages,
  currentPage,
  filters,
  onFiltersChange,
  isLoading = false
}: AuditLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLogWithUser | null>(null);

  const handleSort = (field: string) => {
    const currentSort = filters.sortBy;
    const currentOrder = filters.sortOrder || 'desc';
    
    let newOrder: 'asc' | 'desc' = 'desc';
    if (currentSort === field && currentOrder === 'desc') {
      newOrder = 'asc';
    }

    onFiltersChange({
      ...filters,
      sortBy: field,
      sortOrder: newOrder,
      page: 1,
    });
  };

  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return filters.sortOrder === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const handlePageChange = (page: number) => {
    onFiltersChange({
      ...filters,
      page,
    });
  };

  const formatUserAgent = (userAgent: string | null): string => {
    if (!userAgent) return 'N/A';
    
    // Extract browser name and version
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/([0-9.]+)/);
    if (browserMatch) {
      return `${browserMatch[1]} ${browserMatch[2].split('.')[0]}`;
    }
    
    return userAgent.length > 30 ? `${userAgent.substring(0, 30)}...` : userAgent;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading audit logs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Audit Logs</span>
          <Badge variant="secondary">
            {total.toLocaleString()} total records
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('createdAt')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Timestamp
                    {getSortIcon('createdAt')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('user.firstName')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    User
                    {getSortIcon('user.firstName')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('entityType')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Entity
                    {getSortIcon('entityType')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('action')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Action
                    {getSortIcon('action')}
                  </Button>
                </TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Browser</TableHead>
                <TableHead className="w-[50px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No audit logs found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {log.user.firstName} {log.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {log.user.email}
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {log.user.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {log.entityType.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {log.entityId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-medium", getActionColor(log.action))}>
                        {log.action.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate text-sm">
                        {formatChanges(log.changes)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ipAddress || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatUserAgent(log.userAgent)}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Audit Log Details</DialogTitle>
                          </DialogHeader>
                          {selectedLog && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Basic Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>Timestamp:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</div>
                                    <div><strong>User:</strong> {selectedLog.user.firstName} {selectedLog.user.lastName}</div>
                                    <div><strong>Email:</strong> {selectedLog.user.email}</div>
                                    <div><strong>Role:</strong> <Badge variant="outline">{selectedLog.user.role}</Badge></div>
                                    <div><strong>Entity Type:</strong> {selectedLog.entityType}</div>
                                    <div><strong>Entity ID:</strong> <code className="bg-muted px-1 rounded">{selectedLog.entityId}</code></div>
                                    <div><strong>Action:</strong> <Badge className={getActionColor(selectedLog.action)}>{selectedLog.action}</Badge></div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Technical Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>IP Address:</strong> <code className="bg-muted px-1 rounded">{selectedLog.ipAddress || 'N/A'}</code></div>
                                    <div><strong>User Agent:</strong> <code className="bg-muted px-1 rounded text-xs break-all">{selectedLog.userAgent || 'N/A'}</code></div>
                                  </div>
                                </div>
                              </div>
                              
                              {selectedLog.changes && (
                                <div>
                                  <h4 className="font-semibold mb-2">Changes</h4>
                                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                                    {JSON.stringify(selectedLog.changes, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {selectedLog.metadata && (
                                <div>
                                  <h4 className="font-semibold mb-2">Metadata</h4>
                                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                                    {JSON.stringify(selectedLog.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * (filters.limit || 50)) + 1} to{' '}
              {Math.min(currentPage * (filters.limit || 50), total)} of {total.toLocaleString()} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-1">
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}