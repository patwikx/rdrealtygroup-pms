"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Printer, Loader2 } from 'lucide-react';
import { AuditLogWithUser, AuditLogFilters } from '@/types/audit-log';
import { toast } from 'sonner';
import { exportAuditLogsData } from '@/lib/audit-log';
import { exportToCSV, exportToPDF } from '@/lib/audit-log-utils';

interface ExportButtonsProps {
  logs: AuditLogWithUser[];
  totalRecords: number;
  disabled?: boolean;
  filters: AuditLogFilters;
}

export function ExportButtons({ 
  logs, 
  totalRecords, 
  disabled = false, 
  filters 
}: ExportButtonsProps) {
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCSVExport = async () => {
    if (exportingCSV) return;
    
    setExportingCSV(true);
    try {
      let dataToExport = logs;
      
      // If we have filters applied and there are more records than currently shown,
      // fetch all matching records for export
      if (totalRecords > logs.length) {
        const result = await exportAuditLogsData(filters);
        if (result.success && result.data) {
          dataToExport = result.data;
        } else {
          throw new Error(result.error || 'Failed to fetch export data');
        }
      }

      const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(dataToExport, filename);
      toast.success(`CSV exported successfully (${dataToExport.length} records)`);
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error('CSV export error:', error);
    } finally {
      setExportingCSV(false);
    }
  };

  const handlePDFExport = async () => {
    if (exportingPDF) return;
    
    setExportingPDF(true);
    try {
      let dataToExport = logs;
      
      // If we have filters applied and there are more records than currently shown,
      // fetch all matching records for export
      if (totalRecords > logs.length) {
        const result = await exportAuditLogsData(filters);
        if (result.success && result.data) {
          dataToExport = result.data;
        } else {
          throw new Error(result.error || 'Failed to fetch export data');
        }
      }

      exportToPDF(dataToExport);
      toast.success(`PDF export initiated (${dataToExport.length} records)`);
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
    } finally {
      setExportingPDF(false);
    }
  };

  const handlePrint = () => {
    startTransition(async () => {
      try {
        let dataToExport = logs;
        
        if (totalRecords > logs.length) {
          const result = await exportAuditLogsData(filters);
          if (result.success && result.data) {
            dataToExport = result.data;
          }
        }

        exportToPDF(dataToExport);
        toast.success('Print dialog opened');
      } catch (error) {
        toast.error('Failed to open print dialog');
        console.error('Print error:', error);
      }
    });
  };

  const isExporting = exportingCSV || exportingPDF || isPending;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCSVExport}
        disabled={disabled || logs.length === 0 || isExporting}
        className="flex items-center gap-2"
      >
        {exportingCSV ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Export CSV
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handlePDFExport}
        disabled={disabled || logs.length === 0 || isExporting}
        className="flex items-center gap-2"
      >
        {exportingPDF ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Export PDF
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={disabled || logs.length === 0 || isExporting}
        className="flex items-center gap-2"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        Print
      </Button>
      
      {logs.length < totalRecords && (
        <p className="text-sm text-muted-foreground self-center ml-2">
          Showing {logs.length} of {totalRecords.toLocaleString()} records
        </p>
      )}
    </div>
  );
}