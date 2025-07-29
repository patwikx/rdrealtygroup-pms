'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TenantWithRelations } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash, Plus, Download, FileText, Building2, User, Mail, AlertCircle, Calendar, Phone, Loader2, Eye, Receipt, Search, Filter, ChevronDown, X } from "lucide-react";
import { formatDate, formatPhoneNumber, formatCurrency } from "@/lib/utils/format";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { MaintenanceStatus, TenantStatus, DocumentType } from "@prisma/client";
import type { User as PrismaUser } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { deleteTenant, updateTenant, getTenantById } from "@/actions/tenants";
import { AddLeaseDialog } from "./add-lease-dialog";
import { TerminateLeaseDialog } from "./terminate-lease-dialog";
import { EditLeaseDialog } from "./edit-lease-dialog";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from 'zod';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { toast } from "sonner";
import { AddTenantDocumentDialog } from "./tenants-upload-dialog";
import { DownloadDocumentButton } from "@/components/download-file-button";

export const revalidate = 0;

// Form schema for editing tenant details
const tenantFormSchema = z.object({
  bpCode: z.string().min(1, "BP code is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  company: z.string().min(1, "Company name is required"),
  businessName: z.string().optional(),
  status: z.nativeEnum(TenantStatus),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

type TenantFormValues = z.infer<typeof tenantFormSchema>;

interface TenantDetailsProps {
  tenant: TenantWithRelations;
  users?: PrismaUser[];
  currentUserId?: string;
}

// Document Type Filter Component
const DocumentTypeFilter = ({
  selectedTypes,
  onSelectionChange,
}: {
  selectedTypes: DocumentType[];
  onSelectionChange: (types: DocumentType[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const allDocumentTypes = Object.values(DocumentType);

  const handleTypeToggle = (type: DocumentType) => {
    const newSelection = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => onSelectionChange(allDocumentTypes);
  const handleClearAll = () => onSelectionChange([]);

  const selectedCount = selectedTypes.length;
  const totalCount = allDocumentTypes.length;
  

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200">
          <Filter className="h-4 w-4 mr-2" />
          Filter by Type
          {selectedCount > 0 && selectedCount < totalCount && (
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 text-xs">
              {selectedCount}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-white border-slate-200 shadow-lg" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900">Filter by Type</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={selectedCount === totalCount}
                className="h-8 text-xs hover:bg-blue-50 hover:text-blue-700"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={selectedCount === 0}
                className="h-8 text-xs hover:bg-slate-100"
              >
                Clear
              </Button>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-3">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {allDocumentTypes.map((type) => (
                <div key={type} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-50 transition-colors">
                  <Checkbox
                    id={`doc-type-${type}`}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => handleTypeToggle(type)}
                    className="border-slate-300"
                  />
                  <label
                    htmlFor={`doc-type-${type}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    <div className="font-medium text-slate-900 capitalize">{type.toLowerCase().replace(/_/g, ' ')}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {selectedCount > 0 && (
            <div className="border-t border-slate-200 pt-3">
              <p className="text-xs text-slate-600">
                {selectedCount} of {totalCount} types selected
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function TenantDetails({ tenant: initialTenant, users = [], currentUserId }: TenantDetailsProps) {
  const [tenant, setTenant] = useState(initialTenant);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<DocumentType[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      ...initialTenant,
      firstName: initialTenant.firstName || "",
      lastName: initialTenant.lastName || "",
      emergencyContactName: initialTenant.emergencyContactName || "",
      emergencyContactPhone: initialTenant.emergencyContactPhone || "",
    },
  });

 useEffect(() => {
    const selectedId = searchParams.get('selected');
    if (selectedId && selectedId !== tenant.id) {
      getTenantById(selectedId)
        .then(data => {
          if (data) {
            setTenant(data);
            // **FIXED**: Coalesce null values to empty strings on form reset
            form.reset({
              ...data,
              firstName: data.firstName ?? "",
              lastName: data.lastName ?? "",
              businessName: data.businessName ?? "",
              emergencyContactName: data.emergencyContactName ?? "",
              emergencyContactPhone: data.emergencyContactPhone ?? "",
            });
          }
        })
        .catch(error => {
          console.error('Error fetching tenant:', error);
        });
    }
  }, [searchParams, form, tenant.id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    await toast.promise(deleteTenant(tenant.id), {
      loading: 'Deleting tenant...',
      success: 'Tenant deleted successfully',
      error: (err) => err.message || 'Failed to delete tenant'
    });
    router.push("/dashboard/tenants");
    setIsDeleting(false);
  };

  const handleUpdate = async (values: TenantFormValues) => {
    setIsUpdating(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value != null) formData.append(key, value.toString());
    });

    await toast.promise(updateTenant(tenant.id, formData), {
      loading: 'Updating tenant...',
      success: (updatedTenant) => {
        setTenant(prev => ({ ...prev, ...updatedTenant }));
        setIsEditing(false);
        form.reset({
          bpCode: updatedTenant.bpCode,
          firstName: updatedTenant.firstName || "",
          lastName: updatedTenant.lastName || "",
          email: updatedTenant.email,
          phone: updatedTenant.phone,
          company: updatedTenant.company,
          status: updatedTenant.status,
          businessName: updatedTenant.businessName ?? "",
          emergencyContactName: updatedTenant.emergencyContactName ?? "",
          emergencyContactPhone: updatedTenant.emergencyContactPhone ?? "",
        });
        return 'Tenant updated successfully';
      },
      error: (err) => err.message || 'Failed to update tenant'
    });
    setIsUpdating(false);
  };

  const activeLeases = tenant.leases.filter(lease => lease.status === "ACTIVE" || lease.status === "PENDING");
  const openMaintenanceRequests = tenant.maintenanceRequests.filter(request => request.status !== "COMPLETED" && request.status !== "CANCELLED");
  
  // Calculate total rent amount from all active leases
  const totalRentAmount = activeLeases.reduce((sum, lease) => sum + lease.totalRentAmount, 0);

  // Filter documents based on search query and document type
  const filteredDocuments = tenant.documents.filter((doc) => {
    const matchesSearch = documentSearchQuery === '' || 
      doc.name.toLowerCase().includes(documentSearchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(documentSearchQuery.toLowerCase()));
    
    const matchesType = selectedDocumentTypes.length === 0 || selectedDocumentTypes.includes(doc.documentType);
    
    return matchesSearch && matchesType;
  });

  // Helper function to handle secure file downloads
const handleFileDownload = async (fileUrl: string, fileName: string) => {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to download file');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download file');
  }
};

const handleDocumentAdded = (newDocument: any) => {
  setTenant(prev => ({
    ...prev,
    documents: [...prev.documents, newDocument],
  }));
  // Optionally reset the filters to ensure the new document is visible
  setDocumentSearchQuery('');
  setSelectedDocumentTypes([]);
};

  const handleLeaseCreated = (newLease: any) => setTenant(prev => ({ ...prev, leases: [...prev.leases, newLease] }));
  const handleLeaseTerminated = (leaseId: string) => setTenant(prev => ({ ...prev, leases: prev.leases.map(lease => lease.id === leaseId ? { ...lease, status: "TERMINATED" } : lease) }));

  const handleExportLeases = () => {
    const headers = [
      "Lease ID",
      "Units",
      "Start Date",
      "End Date",
      "Total Rent Amount",
      "Security Deposit",
      "Status",
      "Termination Date",
      "Termination Reason"
    ];

    const csvData = tenant.leases.map(lease => {
      const unitsList = lease.leaseUnits.map(lu => 
        `${lu.unit.property.propertyName} - ${lu.unit.unitNumber} (₱${lu.rentAmount})`
      ).join('; ');
      
      return [
        lease.id,
        unitsList,
        formatDate(lease.startDate),
        formatDate(lease.endDate),
        lease.totalRentAmount.toString(),
        lease.securityDeposit.toString(),
        lease.status,
        lease.terminationDate ? formatDate(lease.terminationDate) : '',
        lease.terminationReason || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leases_${tenant.firstName}_${tenant.lastName}_${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getUploaderName = (uploadedById: string) => {
    if (!users || users.length === 0) {
      return `User (${uploadedById.slice(-8)})`;
    }
    
    const user = users.find(u => u.id === uploadedById);
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    // Fallback: show partial ID instead of "Unknown User"
    return `User (${uploadedById.slice(-8)})`;
  };

  const handleExportDocumentsCSV = () => {
    const csvData = filteredDocuments.map(doc => ({
      'Name': doc.name,
      'Description': doc.description || '-',
      'Type': doc.documentType,
      'Uploaded By': getUploaderName(doc.uploadedById),
      'Uploaded Date': formatDate(doc.createdAt),
      'File URL': doc.fileUrl,
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
    const filename = `tenant_${tenant.firstName}_${tenant.lastName}_documents_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-4">
            {/* Main tenant info */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {tenant.company}
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-xs bg-slate-50 border-slate-300">
                  {tenant.bpCode}
                </Badge>
                <Badge 
                  variant={tenant.status === "ACTIVE" ? "default" : "secondary"} 
                  className={tenant.status === "ACTIVE" ? "bg-green-100 text-green-800 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"}
                >
                  {tenant.status}
                </Badge>
              </div>
            </div>
            
            {/* Tenant details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <Mail className="h-5 w-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{tenant.email}</p>
                  <p className="text-xs text-slate-500">Email Address</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <Phone className="h-5 w-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{formatPhoneNumber(tenant.phone)}</p>
                  <p className="text-xs text-slate-500">Phone Number</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <Building2 className="h-5 w-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{tenant.company}</p>
                  <p className="text-xs text-slate-500">Company</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-3 ml-6">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white border-slate-200">
                <DialogHeader className="pb-4 border-b border-slate-100">
                  <DialogTitle className="text-xl font-semibold text-slate-900">Edit Tenant Profile</DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Update tenant information and preferences. All fields marked with * are required.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-6">
                    {/* Basic Information Section */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-slate-600" />
                        <h3 className="text-lg font-medium text-slate-900">Basic Information</h3>
                      </div>
                      <Separator className="bg-slate-200" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="bpCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700">
                                  BP Code <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter BP code" className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700">
                                  First Name <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter first name" className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700">
                                  Status <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-white border-slate-200">
                                    {Object.values(TenantStatus).map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {status.charAt(0) + status.slice(1).toLowerCase()}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700">
                                  Last Name <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter last name" className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-slate-600" />
                        <h3 className="text-lg font-medium text-slate-900">Contact Information</h3>
                      </div>
                      <Separator className="bg-slate-200" />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700">
                                Email <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter email address" className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700">
                                Phone <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter phone number" className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Company Information Section */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5 text-slate-600" />
                        <h3 className="text-lg font-medium text-slate-900">Company Information</h3>
                      </div>
                      <Separator className="bg-slate-200" />
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">
                              Company Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Enter company name" className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">Business Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter business name" className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Emergency Contact Section */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-slate-600" />
                        <h3 className="text-lg font-medium text-slate-900">Emergency Contact</h3>
                      </div>
                      <Separator className="bg-slate-200" />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="emergencyContactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700">Emergency Contact Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter emergency contact name" className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="emergencyContactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700">Emergency Contact Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter emergency contact phone" className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={isUpdating}
                        className="border-slate-300 hover:bg-slate-50"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isUpdating}
                        className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 border-red-300 hover:border-red-400 hover:bg-red-50 text-red-600 transition-all duration-200">
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white border-slate-200">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-slate-900">Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600">
                    This action cannot be undone. This will permanently delete tenant
                    &quot;{tenant.firstName} {tenant.lastName}&quot; and all their associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-slate-300 hover:bg-slate-50">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 min-w-[120px] mt-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Tenant'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">Overview</TabsTrigger>
          <TabsTrigger value="leases" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Leases 
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {activeLeases.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Documents 
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {tenant.documents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Maintenance 
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {openMaintenanceRequests.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900">Active Leases</CardTitle>
                <Building2 className="h-5 w-5 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{activeLeases.length}</div>
                <p className="text-xs text-slate-700 mt-1">Current active contracts</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900">Open Requests</CardTitle>
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{openMaintenanceRequests.length}</div>
                <p className="text-xs text-slate-700 mt-1">Pending maintenance</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900">Monthly Revenue</CardTitle>
                <Receipt className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalRentAmount.toString())}</div>
                <p className="text-xs text-slate-700 mt-1">From active leases</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900">Total Documents</CardTitle>
                <FileText className="h-5 w-5 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{tenant.documents.length}</div>
                <p className="text-xs text-slate-700 mt-1">Uploaded files</p>
              </CardContent>
            </Card>
          </div>

          {/* Tenant Information Card */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <User className="h-6 w-6 text-slate-600" />
                Tenant Information
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Comprehensive tenant details and contact information
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-6">
                {/* Basic Information */}
                <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-lg border border-slate-200/60">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {tenant.firstName} {tenant.lastName}
                      <Badge 
                        variant={tenant.status === "ACTIVE" ? "default" : "secondary"}
                        className={tenant.status === "ACTIVE" ? "ml-2 bg-green-100 text-green-800 border-green-200" : "ml-2 bg-slate-100 text-slate-600 border-slate-200"}
                      >
                        {tenant.status}
                      </Badge>
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      BP Code: <span className="font-mono">{tenant.bpCode}</span>
                    </p>
                  </div>
                </div>

                {/* Contact Information Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Contact Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100 transition-colors">
                        <Mail className="h-5 w-5 text-slate-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{tenant.email}</p>
                          <p className="text-xs text-slate-500">Primary Email</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100 transition-colors">
                        <Phone className="h-5 w-5 text-slate-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{formatPhoneNumber(tenant.phone)}</p>
                          <p className="text-xs text-slate-500">Primary Phone</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100 transition-colors">
                        <Building2 className="h-5 w-5 text-slate-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{tenant.company}</p>
                          <p className="text-xs text-slate-500">Company</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Additional Information
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertCircle className="h-5 w-5 text-slate-600" />
                          <p className="text-sm font-medium text-slate-900">Emergency Contact</p>
                        </div>
                        {tenant.emergencyContactName && tenant.emergencyContactPhone ? (
                          <div className="ml-8 space-y-1">
                            <p className="text-sm text-slate-900">{tenant.emergencyContactName}</p>
                            <p className="text-sm text-slate-600">
                              {formatPhoneNumber(tenant.emergencyContactPhone)}
                            </p>
                          </div>
                        ) : (
                          <p className="ml-8 text-sm text-slate-500">Not provided</p>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="h-5 w-5 text-slate-600" />
                          <p className="text-sm font-medium text-slate-900">Account Created</p>
                        </div>
                        <p className="ml-8 text-sm text-slate-600">
                          {formatDate(tenant.createdAt)}
                        </p>
                      </div>
                      {tenant.businessName && (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                          <div className="flex items-center gap-3 mb-2">
                            <Building2 className="h-5 w-5 text-slate-600" />
                            <p className="text-sm font-medium text-slate-900">Business Name</p>
                          </div>
                          <p className="ml-8 text-sm text-slate-600">{tenant.businessName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leases" className="space-y-6">
          <div className="flex justify-between items-center bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Lease Agreements</h3>
              <p className="text-sm text-slate-600 mt-1">
                Manage and track all lease agreements
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleExportLeases}
                disabled={!tenant.leases.length}
                className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
              <AddLeaseDialog 
                tenant={tenant}
                onLeaseCreated={handleLeaseCreated}
              />
            </div>
          </div>
          
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Units</TableHead>
                    <TableHead className="font-semibold text-slate-700">Start Date</TableHead>
                    <TableHead className="font-semibold text-slate-700">End Date</TableHead>
                    <TableHead className="font-semibold text-slate-700">Total Rent</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenant.leases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Building2 className="h-8 w-8 text-slate-300" />
                          <span>No lease records found</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tenant.leases.map((lease) => (
                      <TableRow key={lease.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <TableCell>
                          <div className="space-y-1">
                            {lease.leaseUnits.map((leaseUnit, index) => (
                              <div key={leaseUnit.id} className="flex flex-col">
                                <span className="font-medium text-slate-900">
                                  {leaseUnit.unit.property.propertyName}
                                </span>
                                <span className="text-sm text-slate-600">
                                  Unit {leaseUnit.unit.unitNumber} - {formatCurrency(leaseUnit.rentAmount.toString())}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-900">{formatDate(lease.startDate)}</TableCell>
                        <TableCell className="text-slate-900">{formatDate(lease.endDate)}</TableCell>
                        <TableCell className="font-semibold text-slate-900">{formatCurrency(lease.totalRentAmount.toString())}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={lease.status === "ACTIVE" ? "default" : lease.status === "TERMINATED" ? "secondary" : "default"}
                            className={
                              lease.status === "ACTIVE" ? "bg-green-100 text-green-800 border-green-200" :
                              lease.status === "TERMINATED" ? "bg-slate-100 text-slate-600 border-slate-200" :
                              "bg-amber-100 text-amber-800 border-amber-200"
                            }
                          >
                            {lease.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {lease.status === "ACTIVE" && (
                              <TerminateLeaseDialog 
                                lease={lease} 
                                onLeaseTerminated={handleLeaseTerminated}
                              />
                            )}
                            <EditLeaseDialog lease={lease} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="flex justify-between items-center bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Maintenance Requests</h3>
              <p className="text-sm text-slate-600 mt-1">
                Track and manage maintenance requests
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
          
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Property/Space</TableHead>
                    <TableHead className="font-semibold text-slate-700">Category</TableHead>
                    <TableHead className="font-semibold text-slate-700">Priority</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Created</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenant.maintenanceRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-8 w-8 text-slate-300" />
                          <span>No maintenance records found</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tenant.maintenanceRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{request.unit.property.propertyName}</span>
                            <span className="text-sm text-slate-600">Unit {request.unit.unitNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-900">{request.category}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              request.priority === "HIGH" ? "destructive" :
                              request.priority === "MEDIUM" ? "default" :
                              "secondary"
                            }
                            className={
                              request.priority === "HIGH" ? "bg-red-100 text-red-800 border-red-200" :
                              request.priority === "MEDIUM" ? "bg-amber-100 text-amber-800 border-amber-200" :
                              "bg-slate-100 text-slate-600 border-slate-200"
                            }
                          >
                            {request.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              request.status === "COMPLETED" ? "default" :
                              request.status === "IN_PROGRESS" ? "default" :
                              "secondary"
                            }
                            className={
                              request.status === "COMPLETED" ? "bg-green-100 text-green-800 border-green-200" :
                              request.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-800 border-amber-200" :
                              "bg-slate-100 text-slate-600 border-slate-200"
                            }
                          >
                            {request.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">{formatDate(request.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="flex justify-between items-center bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Documents</h3>
              <p className="text-sm text-slate-600 mt-1">
                Manage tenant documents and files
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleExportDocumentsCSV}
                disabled={!filteredDocuments.length}
                className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
           
                <AddTenantDocumentDialog
                  tenantId={tenant.id}
                  
                />
             
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex w-full sm:w-auto">
            <div className="relative mr-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search documents by name or description..."
                value={documentSearchQuery}
                onChange={(e) => setDocumentSearchQuery(e.target.value)}
                className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 w-full sm:w-[400px]"
              />
            </div>
            <div className="w-full sm:w-auto">
              <DocumentTypeFilter
                selectedTypes={selectedDocumentTypes}
                onSelectionChange={setSelectedDocumentTypes}
              />
            </div>
          </div>

          {/* Filter Status Display */}
          {(documentSearchQuery || selectedDocumentTypes.length > 0) && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Search className="h-4 w-4 text-slate-600" />
                  <div className="text-sm text-slate-600">
                    Showing {filteredDocuments.length} of {tenant.documents.length} documents
                    {documentSearchQuery && (
                      <span className="ml-1">
                        matching &quot;<span className="font-medium">{documentSearchQuery}</span>&quot;
                      </span>
                    )}
                    {selectedDocumentTypes.length > 0 && (
                      <span className="ml-1">
                        {documentSearchQuery ? 'and' : 'with'} {selectedDocumentTypes.length} selected type{selectedDocumentTypes.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                {(documentSearchQuery || selectedDocumentTypes.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDocumentSearchQuery('');
                      setSelectedDocumentTypes([]);
                    }}
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
              {selectedDocumentTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedDocumentTypes.map(type => (
                    <Badge key={type} variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                      {type.toLowerCase().replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">File Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Description</TableHead>
                    <TableHead className="font-semibold text-slate-700">Type</TableHead>
                    <TableHead className="font-semibold text-slate-700">Uploaded By</TableHead>
                    <TableHead className="font-semibold text-slate-700">Uploaded</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-slate-300" />
                          {tenant.documents.length === 0 ? (
                            <span>No documents found</span>
                          ) : (
                            <span>No documents match your search criteria</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <TableCell className="font-semibold text-slate-900">{doc.name}</TableCell>
                        <TableCell className="text-slate-900">
                          {doc.description ? (
                            <span className="capitalize">{doc.description}</span>
                          ) : (
                            <span className="text-slate-400 italic">No description</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {doc.documentType.toLowerCase().replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-900">
                          {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                        </TableCell>
                        <TableCell className="text-slate-600">{formatDate(doc.createdAt)}</TableCell>
<TableCell className="text-right">
  {/*
  <Button 
    variant="ghost" 
    size="sm" 
    className="hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
    onClick={() => handleFileDownload(doc.fileUrl, doc.name)}
    title={`Download ${doc.name}`}
  >
    <Download className="h-4 w-4" />
  </Button>
  */}

                          <DownloadDocumentButton
                           fileName={doc.fileUrl} 
                            docName={doc.name} 

                          />
</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}