"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  FileText, 
  Calendar, 
  Plus, 
  Trash2, 
  Building, 
  Phone, 
  UserCheck, 
  DollarSign,
  AlertTriangle,
  Eye,
  Receipt,
  CreditCard,
  FileCheck,
  AlertCircle,
  Clock,
  XCircle,
  CheckCircle,
  Edit3,
  User2,
  Check,
  ChevronsUpDown,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { createTenantNotice, getTenants } from "@/actions/tenant-notice";
import { cn } from "@/lib/utils";

interface Tenant {
  id: string;
  bpCode: string;
  firstName: string | null;
  lastName: string | null;
  company: string;
  businessName: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

const NOTICE_STATUSES = [
  { value: "PAST_DUE", label: "PAST DUE", icon: AlertCircle, color: "text-red-500" },
  { value: "OVERDUE", label: "OVERDUE", icon: XCircle, color: "text-red-600" },
  { value: "CRITICAL", label: "CRITICAL", icon: AlertTriangle, color: "text-red-700" },
  { value: "PENDING", label: "PENDING", icon: Clock, color: "text-yellow-500" },
  { value: "UNPAID", label: "UNPAID", icon: CreditCard, color: "text-orange-500" },
  { value: "CUSTOM", label: "Custom (Enter manually)", icon: Edit3, color: "text-blue-500" }
];

const ITEM_TYPES = [
  { value: "space_rental", label: "Space Rental", icon: Building },
  { value: "bir_forms", label: "BIR 2307 Forms", icon: FileCheck },
  { value: "utilities", label: "Utilities", icon: Receipt },
  { value: "other", label: "Other Charges", icon: DollarSign}
];

export default function CreateNoticePage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSignatories, setShowSignatories] = useState(false);
  const [openTenantCombobox, setOpenTenantCombobox] = useState(false);
  const [formData, setFormData] = useState({
    tenantId: "",
    noticeType: "FIRST_NOTICE",
    forYear: new Date().getFullYear().toString(),
    primarySignatory: "DARYLL JOY ENRIQUEZ",
    primaryTitle: "Credit and Collection Officer",
    primaryContact: "+63998 585 0879",
    secondarySignatory: "C.A.B. LAGUINDAM",
    secondaryTitle: "AVP - Finance/Controller"
  });

  const [items, setItems] = useState<Array<{
    description: string;
    itemType: string;
    status: string;
    customStatus: string;
    amount: string;
    months: string[];
  }>>([
    { 
      description: "", 
      itemType: "space_rental",
      status: "PAST_DUE", 
      customStatus: "", 
      amount: "",
      months: [MONTHS[new Date().getMonth()]] // Default to current month
    }
  ]);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const tenantsData = await getTenants();
      setTenants(tenantsData);
    } catch (error) {
      toast.error("Failed to load tenants");
    }
  };

  const addItem = () => {
    setItems([...items, { 
      description: "", 
      itemType: "space_rental",
      status: "PAST_DUE", 
      customStatus: "", 
      amount: "",
      months: [MONTHS[new Date().getMonth()]] // Default to current month
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string | string[] | boolean) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

  // Helper function to format month ranges
  const formatMonthRange = (months: string[]) => {
    if (months.length <= 1) return months[0] || MONTHS[new Date().getMonth()];
    
    // Sort months by their index in MONTHS array
    const sortedMonths = months.sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
    
    // Check if months are consecutive
    const monthIndices = sortedMonths.map(month => MONTHS.indexOf(month));
    const isConsecutive = monthIndices.every((index, i) => 
      i === 0 || index === monthIndices[i - 1] + 1
    );
    
    if (isConsecutive && months.length > 2) {
      return `${sortedMonths[0]} — ${sortedMonths[sortedMonths.length - 1]}`;
    } else if (months.length === 2) {
      return `${sortedMonths[0]} — ${sortedMonths[1]}`;
    } else {
      return sortedMonths.join(', ');
    }
  };

  // Function to get signature image based on signatory name (same as detail page)
  const getSignatureImage = (signatoryName: string) => {
    const normalizedName = signatoryName.toLowerCase().replace(/\s+/g, '');
    
    // Check for common variations of the names
    if (normalizedName.includes('daryll') || normalizedName.includes('daryl')) {
      return '/DJE.png'; // Adjust filename as needed
    } else if (normalizedName.includes('laguindam') || normalizedName.includes('cab') || normalizedName.includes('c.a.b')) {
      return '/CABL.png'; // Adjust filename as needed
    }
    
    return null; // No signature found
  };

  // Get selected tenant for preview
  const selectedTenant = tenants.find(t => t.id === formData.tenantId);

  // Calculate total amount for preview
  const totalAmount = items.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    return sum + amount;
  }, 0);

  // Preview helper functions (same as detail page)
  const getNoticeTitle = (type: string) => {
    if (type === "FINAL_NOTICE") {
      return "FINAL NOTICE AND WARNING";
    }
    return type === "FIRST_NOTICE" ? "First Notice of Collection" : "Second Notice of Collection";
  };

  const getNoticeContent = (type: string) => {
    const formattedAmount = `₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    if (type === "FINAL_NOTICE") {
      return {
        beforeAmount: "Our records show that to date, we have not yet received the full payment of your outstanding balance amounting to ",
        amount: formattedAmount,
        afterAmount: ", despite repeated demands. Below listed are the details of your unsettled account:"
      };
    }
    
    return {
      beforeAmount: "This is to remind you of your unsettled accounts with RD Realty Development Corporation amounting to ",
      amount: formattedAmount,
      afterAmount: ". Below listed are the details to wit:"
    };
  };

  const getFinalNoticeWarning = () => {
    return {
      beforeWarning: "This is a ",
      warning: "WARNING",
      afterWarning: " for you to settle your balance immediately from the receipt of this notice. We are letting you know that this is your last and final opportunity to negotiate with the company concerning your outstanding obligations. We hope that this time, you will settle to avoid any inconvenience in the future."
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenantId) {
      toast.error("Please select a tenant");
      return;
    }

    // Validate items
    const validItems = items.filter(item => {
      const hasDescription = item.description.trim();
      const hasAmount = item.amount && parseFloat(item.amount) > 0;
      const hasValidStatus = item.status !== "CUSTOM" || (item.status === "CUSTOM" && item.customStatus.trim());
      return hasDescription && hasAmount && hasValidStatus;
    });
    
    if (validItems.length === 0) {
      toast.error("Please add at least one valid item with description, amount, and status");
      return;
    }

    // Check for custom status validation
    const invalidCustomItems = items.filter(item => 
      item.status === "CUSTOM" && !item.customStatus.trim()
    );
    
    if (invalidCustomItems.length > 0) {
      toast.error("Please enter custom status for all items marked as 'Custom'");
      return;
    }

    setLoading(true);
    try {
      const newNotice = await createTenantNotice({
        ...formData,
        items: validItems.map(item => ({
          description: item.description,
          status: item.status === "CUSTOM" ? item.customStatus : item.status,
          amount: parseFloat(item.amount),
          months: formatMonthRange(item.months)
        })),
        forYear: parseInt(formData.forYear)
      });
      
      toast.success("Notice created successfully!");
      
      // Redirect to the newly created notice's detail page
      if (newNotice && newNotice.id) {
        router.push(`/dashboard/tenant-notice/${newNotice.id}`);
      } else {
        // Fallback to list page if no ID is returned
        router.push("/dashboard/tenant-notice");
      }
    } catch (error) {
      toast.error("Failed to create notice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0.25in;
            size: 8.5in 11in;
          }
          /* Print spacing adjustments */
          .print-area {
            padding: 0.1in 0.15in !important;
          }
          /* Force colors to print */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Ensure yellow background prints */
          .print-yellow {
            background-color: #fef08a !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Ensure red text prints */
          .print-red {
            color: #dc2626 !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Ensure blue text prints */
          .print-blue {
            color: #2563eb !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Ensure light blue text prints */
          .print-light-blue {
            color: #60a5fa !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Ensure navy blue text prints */
          .print-navy-blue {
            color: #1e3a8a !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Signature styling for print */
          .signature-container {
            position: relative;
          }
          .signature-image {
            position: absolute;
            top: -20px;
            left: 0;
            z-index: 1;
          }
          .signature-image-secondary {
            position: absolute;
            top: -22px;
            left: 0;
            z-index: 1;
          }
          .signatory-name {
            position: relative;
            z-index: 2;
          }
        }
        
        /* Custom text justification styles */
        .text-justify-full {
          text-align: justify;
          text-justify: inter-word;
          hyphens: auto;
          -webkit-hyphens: auto;
          -ms-hyphens: auto;
        }
        
        .text-justify-full:after {
          content: "";
          display: inline-block;
          width: 100%;
        }

        /* Signature styling for screen (preview) */
        .signature-container {
          position: relative;
        }
        .signature-image {
          position: absolute;
          top: -20px;
          left: 0;
          z-index: 1;
        }
        .signature-image-secondary {
          position: absolute;
          top: -22px;
          left: 0;
          z-index: 1;
        }
        .signatory-name {
          position: relative;
          z-index: 2;
        }
      `}</style>
      
      <div className="container mx-auto py-6">
        <div className="flex gap-6">
          {/* Form Section - Left Side */}
          <div className="w-1/2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Create Tenant Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {/* Tenant Selection with Combobox */}
                        <div className="space-y-1.5">
                          <Label htmlFor="tenant" className="flex items-center gap-2 text-sm font-medium">
                            <User2 className="h-4 w-4 text-gray-600" />
                            Select Tenant <span className="text-red-500">*</span>
                          </Label>
                          <Popover open={openTenantCombobox} onOpenChange={setOpenTenantCombobox}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openTenantCombobox}
                                className="w-full justify-between h-11"
                              >
                                {formData.tenantId
                                  ? (() => {
                                      const tenant = tenants.find((t) => t.id === formData.tenantId);
                                      return tenant ? `${tenant.bpCode} — ${tenant.businessName}` : "Select tenant...";
                                    })()
                                  : "Select tenant..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput 
                                  placeholder="Search tenant..." 
                                  className="h-9" 
                                />
                                <CommandEmpty>No tenant found.</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-y-auto">
                                  {tenants.map((tenant) => (
                                    <CommandItem
                                      key={tenant.id}
                                      value={`${tenant.bpCode} ${tenant.businessName} ${tenant.firstName || ''} ${tenant.lastName || ''} ${tenant.company}`}
                                      onSelect={() => {
                                        setFormData({ ...formData, tenantId: tenant.id });
                                        setOpenTenantCombobox(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.tenantId === tenant.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{tenant.bpCode} — {tenant.businessName}</span>
                                        {(tenant.firstName || tenant.lastName) && (
                                          <span className="text-sm text-gray-500">
                                            {[tenant.firstName, tenant.lastName].filter(Boolean).join(' ')}
                                          </span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Notice Type */}
                          <div className="space-y-1.5">
                            <Label htmlFor="noticeType" className="flex items-center gap-2 text-sm font-medium">
                              <FileText className="h-4 w-4 text-gray-600" />
                              Notice Type
                            </Label>
                            <Select
                              value={formData.noticeType}
                              onValueChange={(value) => setFormData({ ...formData, noticeType: value })}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FIRST_NOTICE">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    First Notice
                                  </div>
                                </SelectItem>
                                <SelectItem value="SECOND_NOTICE">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    Second Notice
                                  </div>
                                </SelectItem>
                                <SelectItem value="FINAL_NOTICE">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    <span className="text-red-600 font-medium">Final Notice</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Year */}
                          <div className="space-y-1.5">
                            <Label htmlFor="forYear" className="flex items-center gap-2 text-sm font-medium">
                              <Calendar className="h-4 w-4 text-gray-600" />
                              For Year
                            </Label>
                            <Select
                              value={formData.forYear}
                              onValueChange={(value) => setFormData({ ...formData, forYear: value })}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {YEARS.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notice Items Section */}
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Notice Items</h3>
                        <Button 
                          type="button" 
                          onClick={addItem} 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300"
                        >
                          <Plus className="h-4 w-4" />
                          Add Item
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {items.map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                {(() => {
                                  const itemType = ITEM_TYPES.find(type => type.value === item.itemType);
                                  const IconComponent = itemType?.icon;
                                  return IconComponent ? <IconComponent className="h-4 w-4 text-gray-600" /> : null;
                                })()}
                                Item {index + 1}
                              </h4>
                              {items.length > 1 && (
                                <Button 
                                  type="button" 
                                  onClick={() => removeItem(index)} 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 hover:border-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                              {/* First Row: Item Type and Description */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="flex items-center gap-2 text-sm font-medium">
                                    <FileText className="h-4 w-4 text-gray-600" />
                                    Item Type
                                  </Label>
                                  <Select
                                    value={item.itemType}
                                    onValueChange={(value) => {
                                      // Get the selected type object
                                      const selectedType = ITEM_TYPES.find(type => type.value === value);

                                      // Create a new items array with the updated item
                                      const updatedItems = items.map((i, idx) => {
                                        if (idx === index) {
                                          return {
                                            ...i,
                                            itemType: value,
                                            // Automatically set description based on the selected label
                                            description: selectedType ? selectedType.label : i.description,
                                          };
                                        }
                                        return i;
                                      });
                                      setItems(updatedItems);
                                    }}
                                  >
                                    <SelectTrigger className="h-11">
                                      <SelectValue placeholder="Select item type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ITEM_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          <div className="flex items-center gap-2">
                                            <type.icon className="h-4 w-4 text-gray-600" />
                                            {type.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="flex items-center gap-2 text-sm font-medium">
                                    <Edit3 className="h-4 w-4 text-gray-600" />
                                    Description <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    className="h-11"
                                    value={item.description}
                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                    placeholder="Enter item description..."
                                  />
                                </div>
                              </div>

                              {/* Second Row: Months and Amount */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="h-4 w-4 text-gray-600" />
                                    Month(s) <span className="text-red-500">*</span>
                                  </Label>
                                  <Select>
                                    <SelectTrigger className="h-11">
                                      <SelectValue placeholder={
                                        item.months.length === 0 
                                          ? "Select months..." 
                                          : `${item.months.length} month${item.months.length > 1 ? 's' : ''} selected`
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {MONTHS.map((month) => (
                                        <div
                                          key={month}
                                          className="flex items-center space-x-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100 rounded-sm"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            const currentMonths = item.months || [];
                                            if (currentMonths.includes(month)) {
                                              updateItem(index, 'months', currentMonths.filter(m => m !== month));
                                            } else {
                                              updateItem(index, 'months', [...currentMonths, month]);
                                            }
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={item.months.includes(month)}
                                            onChange={() => {}} // Handled by parent onClick
                                            className="rounded"
                                          />
                                          <span className="text-sm">{month}</span>
                                        </div>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="flex items-center gap-2 text-sm font-medium">
                                    <span className="text-gray-600 font-semibold text-sm">₱</span>
                                    Amount <span className="text-red-500">*</span>
                                  </Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      className="h-11 pl-8"
                                      value={item.amount}
                                      onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Third Row: Status */}
                              <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="flex items-center gap-2 text-sm font-medium">
                                    <AlertCircle className="h-4 w-4 text-gray-600" />
                                    Payment Status
                                  </Label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <Select
                                      value={item.status}
                                      onValueChange={(value) => updateItem(index, 'status', value)}
                                    >
                                      <SelectTrigger className="h-11">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {NOTICE_STATUSES.map((status) => {
                                          const IconComponent = status.icon;
                                          return (
                                            <SelectItem key={status.value} value={status.value}>
                                              <div className="flex items-center gap-2">
                                                <IconComponent className={`h-4 w-4 ${status.color}`} />
                                                {status.label}
                                              </div>
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>

                                    {/* Custom Status Input */}
                                    {item.status === "CUSTOM" && (
                                      <Input
                                        className="h-11"
                                        value={item.customStatus}
                                        onChange={(e) => updateItem(index, 'customStatus', e.target.value)}
                                        placeholder="Enter custom status..."
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Signatories Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Signatories
                      </h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowSignatories(!showSignatories)}
                        className="hover:bg-blue-50"
                      >
                        {showSignatories ? 'Hide' : 'Edit'} Signatories
                      </Button>
                    </div>
                    
                    {showSignatories && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-8">
                          {/* Primary Signatory */}
                          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                            <h4 className="font-medium text-blue-900 flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              Credit & Collection Officer
                            </h4>
                            
                            <div className="grid grid-cols-1 gap-3">
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-700">Full Name</Label>
                                <Input
                                  className="h-10"
                                  value={formData.primarySignatory}
                                  onChange={(e) => setFormData({ ...formData, primarySignatory: e.target.value })}
                                  placeholder="Enter full name..."
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-700">Job Title</Label>
                                  <Input
                                    className="h-10"
                                    value={formData.primaryTitle}
                                    onChange={(e) => setFormData({ ...formData, primaryTitle: e.target.value })}
                                    placeholder="Enter job title..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-700">Contact Number</Label>
                                  <Input
                                    className="h-10"
                                    value={formData.primaryContact}
                                    onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })}
                                    placeholder="Enter contact number..."
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Secondary Signatory */}
                          <div className="bg-green-50 rounded-lg p-4 space-y-4">
                            <h4 className="font-medium text-green-900 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              AVP - Finance/Controller
                            </h4>
                            
                            <div className="grid grid-cols-1 gap-3">
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-700">Full Name</Label>
                                <Input
                                  className="h-10"
                                  value={formData.secondarySignatory}
                                  onChange={(e) => setFormData({ ...formData, secondarySignatory: e.target.value })}
                                  placeholder="Enter full name..."
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-700">Job Title</Label>
                                <Input
                                  className="h-10"
                                  value={formData.secondaryTitle}
                                  onChange={(e) => setFormData({ ...formData, secondaryTitle: e.target.value })}
                                  placeholder="Enter job title..."
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="px-6 bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        "Create Notice"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section - Right Side */}
          <div className="w-[1000px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="print-area max-w-4xl mx-auto bg-white print:shadow-none print:max-w-none print:mx-0">
                  <div className="p-8 print:p-1 print:pt-6">
                    {/* Header with embedded content */}
                    <div className="flex justify-between items-start mb-6">
                      {/* Left side - Date, Company, and Content */}
                      <div className="flex-1 print:pl-0">
                        {/* Date and Company Info */}
                        <div className="text-sm mb-3">{new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: '2-digit' 
                        })}</div>
                        <div className="font-bold text-lg mb-1">
                          {selectedTenant ? selectedTenant.businessName.toUpperCase() : 'SELECT TENANT'}
                        </div>
                        <div className="text-sm mb-6">General Santos City</div>
                        
                        {/* Title - now positioned at the same level as Philippines */}
                        <div className="text-center mb-4 mt-16">
                          <h2 className="text-base font-bold underline ml-48">
                            {getNoticeTitle(formData.noticeType)}
                          </h2>
                        </div>
                        
                        {/* Salutation */}
                        <div className="mt-6">
                          <p className="text-sm">Dear Sir/Ma&apos;am:</p>
                        </div>
                      </div>
                      
                      {/* Right side - Company Header */}
                      <div className="text-right mr-[-20px] mt-[-30px] print:pr-1">
                        <div className="mb-1 flex items-center justify-center">
                          <Image 
                            src='/rdrdc.png' 
                            alt="RD Realty Development Corporation Logo" 
                            width={80}
                            height={80}
                            className="object-contain"
                            unoptimized={true}
                            onError={(e) => {
                              console.error('Logo failed to load:', e);
                            }}
                          />
                        </div>
                        <div className="text-sm font-bold mb-1 text-center">RD Realty Development Corporation</div>
                        <div className="border-b border-gray-400 mb-1"></div>
                        <div className="text-xs text-gray-500 leading-tight text-left">
                          Cagampang Ext., Santiago Subdivision<br />
                          Brgy. Bula, General Santos City 9500<br />
                          Philippines<br />
                          Tel +6383 552 4435<br />
                          Fax +6383 301 2386<br />
                          www.rdrealty.ph
                        </div>
                        <div className="border-b border-gray-400 mt-1"></div>
                      </div>
                    </div>

                    {/* Content - Full Width Outside Flex Container */}
                    <div className="leading-normal text-sm" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                      <p style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                        {getNoticeContent(formData.noticeType).beforeAmount}
                        <span className="font-bold underline">
                          {getNoticeContent(formData.noticeType).amount}
                        </span>
                        {getNoticeContent(formData.noticeType).afterAmount}
                      </p>
                    </div>

                    {/* Amount Table */}
                    <div className="mb-3 mt-3">
                      <table className="w-full border-collapse">
                        <tbody>
                          {items.filter(item => item.description || item.amount).map((item, index) => {
                            const displayStatus = item.status === "CUSTOM" ? item.customStatus : item.status.replace('_', ' ');
                            const displayMonths = formatMonthRange(item.months);
                            
                            return (
                              <tr key={index} className="border-b border-black">
                                <td className="px-1 py-1 font-semibold text-xs">{item.description || 'Description'}</td>
                                <td className="px-1 py-1 font-semibold text-center text-xs">{displayStatus}</td>
                                <td className="px-1 py-1 font-semibold text-center text-xs">{displayMonths} {formData.forYear}</td>
                                <td className="px-1 py-1 font-semibold text-right text-xs">₱{(parseFloat(item.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-yellow-200 print-yellow border-b border-black">
                            <td className="px-1 py-1 font-bold text-xs" colSpan={3}>Total Outstanding Balance</td>
                            <td className="px-1 py-1 font-bold text-right text-xs">₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Second paragraph for first/second notices */}
                    {formData.noticeType !== "FINAL_NOTICE" && (
                      <div className="mb-3 text-justify-full leading-normal text-sm" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                        <p style={{ textAlign: 'justify', textJustify: 'inter-word' }}>We kindly request that you make immediate payment to prevent the imposition of interest and penalty charges. If you have any questions or concerns about your account, please don&apos;t hesitate to reach out to us. Your prompt attention to this matter is greatly appreciated. Thank you.</p>
                      </div>
                    )}

                    {/* Final notice warning - appears after table */}
                    {formData.noticeType === "FINAL_NOTICE" && (
                      <div className="mb-3 text-justify-full leading-normal text-xs" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                        <p style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                          {getFinalNoticeWarning().beforeWarning}
                          <span className="font-bold">
                            {getFinalNoticeWarning().warning}
                          </span>
                          {getFinalNoticeWarning().afterWarning}
                        </p>
                      </div>
                    )}

                    {/* Closing */}
                    <div className="mb-6">
                      <p className="text-sm">Very truly yours,</p>
                    </div>

                    {/* Signatories with E-Signatures */}
                    <div className="mb-4">
                      {/* Primary Signatory */}
                      <div className="mb-4 signature-container">
                        {getSignatureImage(formData.primarySignatory) && (
                          <Image 
                            src={getSignatureImage(formData.primarySignatory)!}
                            alt={`${formData.primarySignatory} signature`}
                            width={80}
                            height={25}
                            className="signature-image mt-[-50px] ml-6 object-contain"
                            unoptimized={true}
                            onError={(e) => {
                              console.error('Primary signature failed to load:', e);
                            }}
                          />
                        )}
                        <div className="font-bold underline text-xs signatory-name">{formData.primarySignatory}</div>
                        <div className="text-xs">{formData.primaryTitle}</div>
                        <div className="text-xs">Mobile: {formData.primaryContact}</div>
                      </div>
                      
                      <div className="mb-1">
                        <div className="text-xs">Noted By:</div>
                      </div>
                      
                      {/* Secondary Signatory */}
                      <div className="mt-4 signature-container">
                        {getSignatureImage(formData.secondarySignatory) && (
                          <Image 
                            src={getSignatureImage(formData.secondarySignatory)!}
                            alt={`${formData.secondarySignatory} signature`}
                            width={150}
                            height={70}
                            className="signature-image-secondary mt-[-20px] ml-[-15px] object-contain"
                            unoptimized={true}
                            onError={(e) => {
                              console.error('Secondary signature failed to load:', e);
                            }}
                          />
                        )}
                        <div className="font-bold underline text-xs signatory-name">{formData.secondarySignatory}</div>
                        <div className="text-xs">{formData.secondaryTitle}</div>
                      </div>
                    </div>

                    {/* Received Section */}
                    <div className="mb-3">
                      <div className="flex justify-between items-end">
                        <div className="flex-1 mr-4">
                          <div className="text-xs">Received by: ____________________</div>
                          <div className="text-center text-[10px] mt-1">Printed Name/ Signature/ CP No.</div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-xs">____________________</div>
                          <div className="text-[10px] mt-1">Date/Time</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-10 text-[10px] text-red-500 print-red leading-tight">
                      <p className="font-semibold">NOTE: PLEASE SUBMIT BIR FORM 2307 SO WE CAN DEDUCT IT FROM YOUR ACCOUNT.</p>
                      <p className="text-blue-400 print-light-blue">Should payment have been made thru the bank, kindly send proof of payment to <span className="underline text-blue-900 print-navy-blue">collectiongroup@rdrealty.com.ph</span></p>
                      <p className="italic text-blue-900 print-navy-blue">Thank you!</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}