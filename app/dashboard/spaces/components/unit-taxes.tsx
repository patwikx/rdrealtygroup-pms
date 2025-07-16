'use client'

import { useEffect, useState } from 'react';
import { UnitTax } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Receipt, Download } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { updateUnitTaxStatus } from "@/lib/data/unit-tax";
import { AddUnitTaxDialog } from "./add-unit-tax-modal";
import { User } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";

interface UnitTaxesProps {
  taxes?: UnitTax[];
  unitId: string;
  unitNumber: string;
}

export function UnitTaxes({ taxes = [], unitId, unitNumber }: UnitTaxesProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersData, sessionData] = await Promise.all([
          fetch('/api/users').then(res => {
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
          }),
          fetch('/api/auth/session').then(res => {
            if (!res.ok) throw new Error('Failed to fetch session');
            return res.json();
          })
        ]);
        setUsers(usersData);
        setCurrentUserId(sessionData.user.id);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load required data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tax Year</TableHead>
                <TableHead>Tax Dec. No.</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Annually?</TableHead>
                <TableHead>Quarterly?</TableHead>
                <TableHead>Quarter</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed By</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (id: string, currentStatus: boolean) => {
    try {
      const currentUser = users.find(u => u.id === currentUserId);
      const userFullName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Unknown user';
      
      await updateUnitTaxStatus(id, !currentStatus);
      toast.success(`Tax status updated by ${userFullName}`);
    } catch (error) {
      toast.error("Failed to update tax status");
    }
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return "-";
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  };

  const handleExportCSV = () => {
    // Format the data for CSV
    const csvData = taxes.map(tax => ({
      'Tax Year': tax.taxYear,
      'Tax Declaration No.': tax.taxDecNo,
      'Amount': Number(tax.taxAmount).toFixed(2),
      'Annual': tax.isAnnual ? 'Yes' : 'No',
      'Quarterly': tax.isQuarterly ? 'Yes' : 'No',
      'Quarter': tax.whatQuarter || '-',
      'Due Date': format(tax.dueDate, "PPP"),
      'Status': tax.isPaid ? 'Paid' : 'Unpaid',
      'Processed By': getUserName(tax.processedBy),
      'Remarks': tax.remarks || '-',
      'Payment Date': tax.paidDate ? format(tax.paidDate, "PPP") : '-'
    }));

    // Convert to CSV string
    const headers = Object.keys(csvData[0]);
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => {
        const value = row[header as keyof typeof row];
        return `"${value}"`;
      }).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filename = `space_${unitNumber}_rpt_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Real Property Taxes</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!taxes.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
          <AddUnitTaxDialog unitId={unitId} users={users} currentUserId={currentUserId} />
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tax Year</TableHead>
              <TableHead>Tax Dec. No.</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Annually?</TableHead>
              <TableHead>Quarterly?</TableHead>
              <TableHead>Quarter</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processed By</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxes.map((tax) => (
              <TableRow key={tax.id}>
                <TableCell>{tax.taxYear}</TableCell>
                <TableCell className="font-mono">{tax.taxDecNo}</TableCell>
                <TableCell>{formatCurrency(Number(tax.taxAmount))}</TableCell>
                <TableCell>{tax.isAnnual ? "Yes" : "No"}</TableCell>
                <TableCell>{tax.isQuarterly ? "Yes" : "No"}</TableCell>
                <TableCell>{tax.whatQuarter}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(tax.dueDate, "PPP")}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={tax.isPaid ? "success" : "destructive"}
                    className={tax.isPaid ? "bg-green-500" : "bg-red-500"}
                  >
                    {tax.isPaid ? "Paid" : "Unpaid"}
                  </Badge>
                </TableCell>
                <TableCell>{getUserName(tax.processedBy)}</TableCell>
                <TableCell>{tax.remarks || "-"}</TableCell>
                <TableCell>
                  {tax.paidDate ? (
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      {format(tax.paidDate, "PPP")}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(tax.id, tax.isPaid)}
                  >
                    Mark as {tax.isPaid ? "Unpaid" : "Paid"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!taxes || taxes.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="text-center text-muted-foreground h-24"
                >
                  No tax records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}