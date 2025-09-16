"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Plus, 
  Eye, 
  CheckCircle, 
  Trash2, 
  Check, 
  ChevronsUpDown,
  FileText,
  Clock,
  DollarSign,
  AlertTriangle,
  Building2,
  Calendar,
  User,
  TrendingUp,
  Activity,
  Filter
} from "lucide-react";
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
import { cn } from "@/lib/utils";

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

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, description, icon, color, bgColor }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          <div className={cn("p-3 rounded-full", bgColor)}>
            <div className={cn("h-5 w-5", color)}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantComboboxOpen, setTenantComboboxOpen] = useState(false);
  const [filters, setFilters] = useState({
    tenantId: "all",
    status: "all",
    isSettled: "all"
  });

  const loadData = useCallback(async () => {
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
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const totalNotices = notices.length;
    const activeNotices = notices.filter(notice => !notice.isSettled).length;
    const settledNotices = notices.filter(notice => notice.isSettled).length;
    const totalAmount = notices.reduce((sum, notice) => sum + notice.totalAmount, 0);
    const criticalNotices = notices.filter(notice => 
      notice.items?.some(item => item.status === "CRITICAL") && !notice.isSettled
    ).length;

    return {
      total: totalNotices,
      active: activeNotices,
      settled: settledNotices,
      totalAmount,
      critical: criticalNotices,
    };
  }, [notices]);

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
    const configs = {
      FIRST_NOTICE: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
      SECOND_NOTICE: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
      FINAL_NOTICE: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" }
    };
    
    const config = configs[type as keyof typeof configs] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
    
    return (
      <Badge className={cn("font-medium border", config.bg, config.text, config.border)}>
        {number === 1 ? "1st" : number === 2 ? "2nd" : "Final"} Notice
      </Badge>
    );
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline" className="bg-gray-50 text-gray-600">N/A</Badge>;
    
    const configs = {
      PAST_DUE: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
      OVERDUE: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
      CRITICAL: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" }
    };
    
    const config = configs[status as keyof typeof configs] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
    
    return (
      <Badge className={cn("font-medium border", config.bg, config.text, config.border)}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const selectedTenant = tenants.find(tenant => tenant.id === filters.tenantId);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Tenant Notices
            </h1>
            <p className="text-sm text-gray-600 mt-1">Manage and track tenant payment notices</p>
          </div>
          <Button 
            onClick={() => router.push("/dashboard/tenant-notice/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Notice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 bg-white border-b">
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            title="Total Notices"
            value={stats.total}
            description="All notices issued"
            icon={<FileText />}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            title="Active Notices"
            value={stats.active}
            description="Pending settlement"
            icon={<Clock />}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
          <StatCard
            title="Settled Notices"
            value={stats.settled}
            description="Successfully resolved"
            icon={<CheckCircle />}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            title="Total Amount"
            value={`₱${stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            description="Outstanding amount"
            icon={<DollarSign />}
            color="text-purple-600"
            bgColor="bg-purple-100"
          />
          <StatCard
            title="Critical Notices"
            value={stats.critical}
            description="Require attention"
            icon={<AlertTriangle />}
            color="text-red-600"
            bgColor="bg-red-100"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Filters */}
        <div className="w-60 bg-white border-r p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Filters</h2>
            </div>

            {/* Tenant Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Tenant
              </label>
              <Popover open={tenantComboboxOpen} onOpenChange={setTenantComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={tenantComboboxOpen}
                    className="w-full justify-between"
                  >
                    {selectedTenant
                      ? `${selectedTenant.businessName}`
                      : "All Tenants"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search tenants..." className="h-9" />
                    <CommandEmpty>No tenant found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setFilters({ ...filters, tenantId: "all" });
                          setTenantComboboxOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.tenantId === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All Tenants
                      </CommandItem>
                      {tenants.map((tenant) => (
                        <CommandItem
                          key={tenant.id}
                          value={`${tenant.businessName} ${tenant.bpCode}`}
                          onSelect={() => {
                            setFilters({ ...filters, tenantId: tenant.id });
                            setTenantComboboxOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.tenantId === tenant.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div>
                            <div className="font-medium">{tenant.businessName}</div>
                            <div className="text-xs text-gray-500">{tenant.bpCode}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Status
              </label>
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

            {/* Settlement Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Settlement
              </label>
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

            {/* Quick Actions */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-red-600 hover:bg-red-50"
                  onClick={() => setFilters({ ...filters, isSettled: "false", status: "CRITICAL" })}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Critical Notices
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-orange-600 hover:bg-orange-50"
                  onClick={() => setFilters({ tenantId: "all", status: "all", isSettled: "false" })}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  All Active
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-green-600 hover:bg-green-50"
                  onClick={() => setFilters({ tenantId: "all", status: "all", isSettled: "true" })}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  All Settled
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Table */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-gray-900 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Tenant
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notice Type
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Amount
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">Description</TableHead>
                  <TableHead className="font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Status
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Period
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Issued
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Settlement
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600">Loading notices...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : notices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-gray-500">
                        <FileText className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                        <p className="text-sm">No notices found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  notices.map((notice) => (
                    <TableRow key={notice.id} className="hover:bg-gray-50">
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{notice.tenant.businessName}</div>
                            <div className="text-xs text-gray-500">{notice.tenant.bpCode}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {getNoticeTypeBadge(notice.noticeType, notice.noticeNumber)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 py-3">
                        ₱{notice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="py-3 max-w-xs">
                        <div className="truncate text-gray-700 text-sm" title={notice.items?.map(item => item.description).join(', ') || 'N/A'}>
                          {notice.items?.map(item => item.description).join(', ') || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {notice.items && notice.items.length > 0 
                          ? getStatusBadge(notice.items[0].status)
                          : getStatusBadge(undefined)
                        }
                      </TableCell>
                      <TableCell className="text-gray-700 text-sm py-3">{notice.forMonth} {notice.forYear}</TableCell>
                      <TableCell className="text-gray-700 text-sm py-3">{new Date(notice.dateIssued).toLocaleDateString()}</TableCell>
                      <TableCell className="py-3">
                        {notice.isSettled ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Settled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/dashboard/tenant-notice/${notice.id}`)}
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                            title="View notice"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          
                          {!notice.isSettled && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 hover:bg-green-50"
                                  title="Settle notice"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
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
                                  <AlertDialogAction 
                                    onClick={() => handleSettleNotice(notice.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Settle Notice
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-red-50"
                                title="Delete notice"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
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
                                <AlertDialogAction 
                                  onClick={() => handleDeleteNotice(notice.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
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
          </div>
        </div>
      </div>
    </div>
  );
}