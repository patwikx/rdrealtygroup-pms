"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getTenantNotices, getTenants, settleNotice, deleteNotice } from "@/actions/tenant-notice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Notice {
  id: string;
  noticeType: string;
  noticeNumber: number;
  totalAmount: number;
  forMonth: string;
  forYear: number;
  dateIssued: Date;
  isSettled: boolean;
  settledDate: Date | null;
  tenant: {
    id: string;
    bpCode: string;
    businessName: string;
    company: string;
  };
  createdBy: {
    firstName: string;
    lastName: string;
  };
  items?: Array<{
    id: string;
    description: string;
    status: string;
    amount: number;
  }>;
}

interface Tenant {
  id: string;
  bpCode: string;
  businessName: string;
}

export default function TenantNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tenantId: "all",
    status: "all",
    isSettled: "all"
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [noticesData, tenantsData] = await Promise.all([
        getTenantNotices({
          tenantId: filters.tenantId === "all" ? undefined : filters.tenantId,
          status: filters.status === "all" ? undefined : filters.status,
          isSettled: filters.isSettled === "all" ? undefined : filters.isSettled === "true"
        }),
        getTenants()
      ]);
      
      setNotices(noticesData as Notice[]);
      setTenants(tenantsData);
    } catch (error) {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  const handleSettleNotice = async (noticeId: string) => {
    try {
      await settleNotice(noticeId, "Manual Settlement");
      toast.success("Notice settled successfully!");
      loadData();
    } catch (error) {
      toast.error("Failed to settle notice");
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      await deleteNotice(noticeId);
      toast.success("Notice deleted successfully!");
      loadData();
    } catch (error) {
      toast.error("Failed to delete notice");
    }
  };

  const getNoticeTypeBadge = (type: string, number: number) => {
    const colors = {
      FIRST_NOTICE: "bg-blue-100 text-blue-800",
      SECOND_NOTICE: "bg-yellow-100 text-yellow-800",
      FINAL_NOTICE: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {number === 1 ? "1st" : number === 2 ? "2nd" : "Final"} Notice
      </Badge>
    );
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge className="bg-gray-100 text-gray-800">N/A</Badge>;
    
    const colors = {
      PAST_DUE: "bg-orange-100 text-orange-800",
      OVERDUE: "bg-red-100 text-red-800",
      CRITICAL: "bg-red-200 text-red-900"
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tenant Notices</h1>
        <Button onClick={() => router.push("/dashboard/tenant-notice/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Notice
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select
                value={filters.tenantId}
                onValueChange={(value) => setFilters({ ...filters, tenantId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.businessName} ({tenant.bpCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PAST_DUE">Past Due</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select
                value={filters.isSettled}
                onValueChange={(value) => setFilters({ ...filters, isSettled: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Notices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Notices</SelectItem>
                  <SelectItem value="false">Active Notices</SelectItem>
                  <SelectItem value="true">Settled Notices</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Notice Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>For Period</TableHead>
                <TableHead>Date Issued</TableHead>
                <TableHead>Settled</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading notices...
                  </TableCell>
                </TableRow>
              ) : notices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No notices found
                  </TableCell>
                </TableRow>
              ) : (
                notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{notice.tenant.businessName}</div>
                        <div className="text-sm text-gray-500">{notice.tenant.bpCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getNoticeTypeBadge(notice.noticeType, notice.noticeNumber)}
                    </TableCell>
                    <TableCell>₱{notice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {notice.items?.map(item => item.description).join(', ') || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {notice.items && notice.items.length > 0 
                        ? getStatusBadge(notice.items[0].status)
                        : getStatusBadge(undefined)
                      }
                    </TableCell>
                    <TableCell>{notice.forMonth} {notice.forYear}</TableCell>
                    <TableCell>{new Date(notice.dateIssued).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {notice.isSettled ? (
                        <Badge className="bg-green-100 text-green-800">Settled</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/tenant-notice/${notice.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {!notice.isSettled && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-green-600">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Settle Notice</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to mark this notice as settled? This will reset the notice count for this tenant.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleSettleNotice(notice.id)}>
                                  Settle Notice
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Notice</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this notice? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteNotice(notice.id)}>
                                Delete Notice
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}