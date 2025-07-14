'use client'

import { Lease } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeaseHistoryProps {
  leases: (Lease & {
    tenant: {
      firstName: string | null;
      lastName: string | null;
      company: string
      businessName: string
    };
  })[];
}

const statusColorMap = {
  ACTIVE: "bg-green-500",
  PENDING: "bg-yellow-500",
  TERMINATED: "bg-red-500",
  EXPIRED: "bg-gray-500",
};

export function LeaseHistory({ leases }: LeaseHistoryProps) {
  const getTenantName = (tenant: { firstName: string | null; lastName: string | null }) => {
    const firstName = tenant.firstName || "";
    const lastName = tenant.lastName || "";
    return `${firstName} ${lastName}`.trim() || "Unknown Tenant";
  };

  const handleExportLeasesCSV = () => {
    const csvData = leases.map(lease => ({
      'Tenant': getTenantName(lease.tenant),
      'Start Date': format(lease.startDate, "PPP"),
      'End Date': format(lease.endDate, "PPP"),
      'Rent Amount': Number(lease.totalRentAmount).toFixed(2),
      'Status': lease.status
    }));

    const headers = Object.keys(csvData[0]);
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => {
        const value = row[header as keyof typeof row];
        return `"${value}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filename = `lease_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Lease History</h3>
        <Button
          variant="outline"
          onClick={handleExportLeasesCSV}
          disabled={!leases.length}
        >
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Rent Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leases.map((lease) => (
              <TableRow key={lease.id}>
                <TableCell>
                  {lease.tenant.company}
                </TableCell>
                <TableCell>{format(lease.startDate, "PPP")}</TableCell>
                <TableCell>{format(lease.endDate, "PPP")}</TableCell>
                <TableCell>{formatCurrency(Number(lease.totalRentAmount))}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${statusColorMap[lease.status]} text-white`}
                  >
                    {lease.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {leases.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No lease history found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}