'use client';
import { useState, useMemo } from "react"; // Added useMemo
import { useRouter } from "next/navigation";
import { PropertyWithRelations } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Added CardFooter
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash, Download, FileText, Building2, Droplets, Power, Eye, Receipt, Calendar, MapPin, Loader2, Map, Filter, X, ChevronDown, Search, FilterIcon, ChevronLeft, ChevronRight } from 'lucide-react'; // Added ChevronLeft, ChevronRight
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { PropertyType, UtilityType, TitleMovementStatus, FloorType, DocumentType } from "@prisma/client";
import type { User as PrismaUser } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { deleteProperty, updateProperty } from "@/actions/property";
import { AddUnitDialog } from "./add-unit-dialog";
import { AddUtilityDialog } from "./add-utility-dialog";
import { AddPropertyTaxDialog } from "./add-property-tax-dialog";
import { toast } from "sonner";
import { updatePropertyTaxStatus, updateUtilityStatus, deletePropertyTax } from "@/actions/property-tax";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import Link from "next/link";

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
import { TitleMovementDialog } from "./title-movement-dialog";
import { UpdateTitleStatusDialog } from "./update-title-movement-dialog";
import { deletePropertyTitle } from "@/actions/property-titles";
import { AddPropertyTitleDialog } from "./add-property-title-dialog";
import { AddDocumentDialog } from "./upload-document-dialog";

// Reusable Pagination Component
const ITEMS_PER_PAGE = 10;

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="flex items-center justify-between">
       <div className="text-sm text-slate-600 mr-2">
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-slate-300 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm font-medium text-slate-700">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-slate-300 hover:bg-slate-50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};


interface PropertyDetailsProps {
  property: PropertyWithRelations;
  currentUserId: string;
  users: PrismaUser[];
}

// Title Filter Component (No changes needed here)
const TitleFilter = ({
  titles,
  selectedTitleIds,
  onSelectionChange
}: {
  titles: Array<{ id: string; titleNo: string; lotNo: string }>;
  selectedTitleIds: string[];
  onSelectionChange: (titleIds: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTitleToggle = (titleId: string) => {
    if (selectedTitleIds.includes(titleId)) {
      onSelectionChange(selectedTitleIds.filter(id => id !== titleId));
    } else {
      onSelectionChange([...selectedTitleIds, titleId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(titles.map(title => title.id));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const selectedCount = selectedTitleIds.length;
  const totalCount = titles.length;
  
   return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200">
          <Filter className="h-4 w-4 mr-2" />
          Filter by Title
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
            <h4 className="font-medium text-slate-900">Filter by Title</h4>
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
              {titles.map((title) => (
                <div key={title.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-50 transition-colors">
                  <Checkbox
                    id={title.id}
                    checked={selectedTitleIds.includes(title.id)}
                    onCheckedChange={() => handleTitleToggle(title.id)}
                    className="border-slate-300"
                  />
                  <label
                    htmlFor={title.id}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    <div className="font-medium text-slate-900">{title.titleNo}</div>
                    <div className="text-xs text-slate-500">Lot {title.lotNo}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {selectedCount > 0 && (
            <div className="border-t border-slate-200 pt-3">
              <p className="text-xs text-slate-600">
                {selectedCount} of {totalCount} titles selected
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};


// Floor type display helper
const getFloorTypeDisplay = (floorType: FloorType) => {
  const floorConfig = {
    [FloorType.GROUND_FLOOR]: { label: "Ground Floor", short: "GF", icon: "🏢" },
    [FloorType.MEZZANINE]: { label: "Mezzanine", short: "MZ", icon: "🏗️" },
    [FloorType.SECOND_FLOOR]: { label: "2nd Floor", short: "2F", icon: "🏬" },
    [FloorType.THIRD_FLOOR]: { label: "3rd Floor", short: "3F", icon: "🏭" },
    [FloorType.ROOF_TOP]: { label: "Roof Top", short: "RT", icon: "🏔️" },
  };
  
  return floorConfig[floorType] || { label: floorType, short: floorType.slice(0, 2), icon: "🏢" };
};

export function PropertyDetails({ property, currentUserId, users }: PropertyDetailsProps) {
  // State for editing and confirmation dialogs
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  // Pagination states for each table
  const [titlesPage, setTitlesPage] = useState(1);
  const [unitsPage, setUnitsPage] = useState(1);
  const [taxesPage, setTaxesPage] = useState(1);
  const [documentsPage, setDocumentsPage] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);
  const [utilitiesPage, setUtilitiesPage] = useState(1);
 
  // Filters state for Taxes table
  const [selectedTitleIds, setSelectedTitleIds] = useState<string[]>(
    property.titles?.map(title => title.id) || []
  );
  
  // Filters state for Documents table
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('all');
  
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await toast.promise(deleteProperty(property.id), {
        loading: 'Deleting property...',
        success: 'Property deleted successfully',
        error: 'Failed to delete property'
      });
      router.push("/dashboard/properties");
    } catch (error) {
      // Error is handled by toast
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    setPendingFormData(formData);
  };

  const handleConfirmUpdate = async () => {
    if (!pendingFormData) return;
    
    try {
      setIsUpdating(true);
      await toast.promise(updateProperty(property.id, pendingFormData), {
        loading: 'Updating property...',
        success: () => {
          setIsEditing(false);
          setPendingFormData(null);
          return 'Property updated successfully';
        },
        error: 'Failed to update property'
      });
    } catch (error) {
      // Error is handled by toast
      toast.error('Failed to update property');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTaxStatusChange = async (taxId: string, currentStatus: boolean) => {
    try {
      await toast.promise(
        updatePropertyTaxStatus(taxId, !currentStatus),
        {
          loading: 'Updating tax status...',
          success: 'Tax status updated successfully',
          error: 'Failed to update tax status'
        }
      );
      router.refresh();
    } catch (error) {
      // Error is handled by toast
    }
  };

  const handleDeletePropertyTax = async (taxId: string) => {
    try {
      await toast.promise(
        deletePropertyTax(taxId),
        {
          loading: 'Deleting property tax...',
          success: 'Property tax deleted successfully',
          error: 'Failed to delete property tax'
        }
      );
      router.refresh();
    } catch (error) {
      // Error is handled by toast
    }
  };

  const handleUtilityStatusChange = async (id: string, currentStatus: boolean) => {
    try {
      await toast.promise(
        updateUtilityStatus(id, !currentStatus),
        {
          loading: 'Updating utility status...',
          success: 'Utility status updated successfully',
          error: 'Failed to update utility status'
        }
      );
      router.refresh();
    } catch (error) {
      // Error is handled by toast
    }
  };

  const handleDeletePropertyTitle = async (titleId: string) => {
    try {
      await toast.promise(
        deletePropertyTitle(titleId, property.id),
        {
          loading: 'Deleting property title...',
          success: 'Property title deleted successfully',
          error: 'Failed to delete property title'
        }
      );
      router.refresh();
    } catch (error) {
      // Error is handled by toast
    }
  };

  // Calculate occupancy based on new totalArea field
  const occupiedUnitArea = property.units
    .filter(unit => unit.status === 'OCCUPIED')
    .reduce((sum, unit) => sum + Number(unit.totalArea), 0);
  const leasableArea = Number(property.leasableArea);
  const occupancyRate = leasableArea > 0
    ? (occupiedUnitArea / leasableArea) * 100
    : 0;

  // Calculate total rent from new totalRent field
  const totalRentAmount = property.units.reduce((sum, unit) => sum + Number(unit.totalRent), 0);

  // Calculate total lot area from property titles
  const totalLotArea = property.titles?.reduce((sum, title) => sum + Number(title.lotArea), 0) || 0;

  

  // Get all property taxes from all titles
  const allPropertyTaxes = property.titles?.flatMap(title => 
    title.propertyTaxes?.map(tax => ({
      ...tax,
      titleInfo: title
    })) || []
  ) || [];

  // Filter property taxes based on selected titles
  const filteredPropertyTaxes = allPropertyTaxes.filter(tax => 
    selectedTitleIds.includes(tax.titleInfo.id)
  );

  // Calculate tax statistics based on filtered data
  const totalTaxAmount = filteredPropertyTaxes.reduce((sum, tax) => sum + Number(tax.taxAmount), 0);
  const paidTaxes = filteredPropertyTaxes.filter(tax => tax.isPaid);
  const unpaidTaxes = filteredPropertyTaxes.filter(tax => !tax.isPaid);
  const paidTaxAmount = paidTaxes.reduce((sum, tax) => sum + Number(tax.taxAmount), 0);
  const unpaidTaxAmount = unpaidTaxes.reduce((sum, tax) => sum + Number(tax.taxAmount), 0);

  // Filter documents based on search query and document type
  const filteredDocuments = property.documents.filter((doc) => {
    const matchesSearch = documentSearchQuery === '' || 
      doc.name.toLowerCase().includes(documentSearchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(documentSearchQuery.toLowerCase()));
    
    const matchesType = selectedDocumentType === 'all' || doc.documentType === selectedDocumentType;
    
    return matchesSearch && matchesType;
  });


   // Paginating Titles
  const totalTitlesPages = Math.ceil((property.titles?.length || 0) / ITEMS_PER_PAGE);
  const paginatedTitles = property.titles?.slice((titlesPage - 1) * ITEMS_PER_PAGE, titlesPage * ITEMS_PER_PAGE);

  // Paginating Units
  const totalUnitsPages = Math.ceil(property.units.length / ITEMS_PER_PAGE);
  const paginatedUnits = property.units.slice((unitsPage - 1) * ITEMS_PER_PAGE, unitsPage * ITEMS_PER_PAGE);

  // Paginating Filtered Taxes
  const totalTaxesPages = Math.ceil(filteredPropertyTaxes.length / ITEMS_PER_PAGE);
  const paginatedTaxes = filteredPropertyTaxes.slice((taxesPage - 1) * ITEMS_PER_PAGE, taxesPage * ITEMS_PER_PAGE);
  
  // Paginating Filtered Documents
  const totalDocumentsPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const paginatedDocuments = filteredDocuments.slice((documentsPage - 1) * ITEMS_PER_PAGE, documentsPage * ITEMS_PER_PAGE);
  
  // Paginating Title Movements
  const totalMovementsPages = Math.ceil((property.titleMovements?.length || 0) / ITEMS_PER_PAGE);
  const paginatedMovements = property.titleMovements?.slice((movementsPage - 1) * ITEMS_PER_PAGE, movementsPage * ITEMS_PER_PAGE);

  // Paginating Utilities
  const totalUtilitiesPages = Math.ceil(property.utilities.length / ITEMS_PER_PAGE);
  const paginatedUtilities = property.utilities.slice((utilitiesPage - 1) * ITEMS_PER_PAGE, utilitiesPage * ITEMS_PER_PAGE);
  
  // --- End of Data Filtering and Pagination Logic ---
  

  // Get unique document types for the filter dropdown
  const documentTypes = Array.from(new Set(property.documents.map(doc => doc.documentType)));

  const handleExportTitlesCSV = () => {
    const csvData = property.titles.map(title => ({
      'Title No.': title.titleNo,
      'Lot No.': title.lotNo,
      'Lot Area (sqm)': title.lotArea.toString(),
      'Registered Owner': title.registeredOwner,
      'Encumbered': title.isEncumbered ? 'Yes' : 'No',
      'Encumbrance Details': title.encumbranceDetails || '-',
      'Created': formatDate(title.createdAt),
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
    const filename = `property_${property.propertyName}_titles_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportUnitsCSV = () => {
    const csvData = property.units.map(unit => {
      // Create floor breakdown for CSV
      const floorBreakdown = unit.unitFloors?.map(floor => {
        const floorDisplay = getFloorTypeDisplay(floor.floorType);
        return `${floorDisplay.label}: ${floor.area}sqm @ ₱${floor.rate}/sqm = ₱${floor.rent}`;
      }).join('; ') || 'No floor data';

      return {
        'Title No.': unit.propertyTitle?.titleNo || '-',
        'Space Number': unit.unitNumber,
        'Total Area (sqm)': unit.totalArea.toString(),
        'Total Rent': Number(unit.totalRent).toFixed(2),
        'Floor Breakdown': floorBreakdown,
        'Status': unit.status,
      };
    });

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
    const filename = `property_${property.propertyName}_spaces_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportUtilitiesCSV = () => {
    const csvData = property.utilities.map(utility => ({
      'Type': utility.utilityType,
      'Provider': utility.provider,
      'Account Number': utility.accountNumber,
      'Meter Number': utility.meterNumber || '-',
      'Status': utility.isActive ? 'Active' : 'Inactive'
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
    const filename = `property_${property.propertyName}_utilities_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTaxesCSV = () => {
    const csvData = filteredPropertyTaxes.map(tax => ({
      'Property Title': tax.titleInfo.titleNo,
      'Lot No.': tax.titleInfo.lotNo,
      'Tax Year': tax.taxYear.toString(),
      'Tax Declaration No.': tax.TaxDecNo,
      'Tax Amount': Number(tax.taxAmount).toFixed(2),
      'Payment Type': tax.isAnnual ? 'Annual' : tax.isQuarterly ? `Quarterly (${tax.whatQuarter || ''})` : 'Other',
      'Due Date': formatDate(tax.dueDate),
      'Status': tax.isPaid ? 'Paid' : 'Unpaid',
      'Payment Date': tax.paidDate ? formatDate(tax.paidDate) : '-',
      'Processed By': tax.processedBy ? (users.find(u => u.id === tax.processedBy)?.firstName + ' ' + users.find(u => u.id === tax.processedBy)?.lastName) : '-',
      'Remarks': tax.remarks || '-',
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
    const filename = `property_${property.propertyName}_taxes_filtered_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDocumentsCSV = () => {
    const csvData = filteredDocuments.map(doc => ({
      'Name': doc.name,
      'Description': doc.description || '-',
      'Type': doc.documentType,
      'Uploaded By': users.find(u => u.id === doc.uploadedById)?.firstName + ' ' + users.find(u => u.id === doc.uploadedById)?.lastName,
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
    const filename = `property_${property.propertyName}_documents_${new Date().toISOString().split('T')[0]}.csv`;
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
            {/* Main property info */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {property.propertyName}
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-xs bg-slate-50 border-slate-300">
                  {property.propertyCode}
                </Badge>
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {property.propertyType.charAt(0) + property.propertyType.slice(1).toLowerCase()}
                </Badge>
              </div>
            </div>
            
            {/* Property details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <MapPin className="h-5 w-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{property.address}</p>
                  <p className="text-xs text-slate-500">Property Address</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <Building2 className="h-5 w-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{property.leasableArea.toString()} sqm</p>
                  <p className="text-xs text-slate-500">Leasable Area</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <Calendar className="h-5 w-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{formatDate(property.createdAt)}</p>
                  <p className="text-xs text-slate-500">Date Created</p>
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
              <DialogContent className="sm:max-w-[500px] bg-white border-slate-200">
                <DialogHeader className="pb-4 border-b border-slate-100">
                  <DialogTitle className="text-xl font-semibold text-slate-900">Edit Property</DialogTitle>
                </DialogHeader>
                <form action={handleUpdate} className="space-y-6">
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="propertyName" className="text-right font-medium text-slate-700">
                        Name
                      </Label>
                      <Input
                        id="propertyName"
                        name="propertyName"
                        defaultValue={property.propertyName}
                        className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="propertyCode" className="text-right font-medium text-slate-700">
                        Code
                      </Label>
                      <Input
                        id="propertyCode"
                        name="propertyCode"
                        defaultValue={property.propertyCode}
                        className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="leasableArea" className="text-right font-medium text-slate-700">
                        Area (sqm)
                      </Label>
                      <Input
                        id="leasableArea"
                        name="leasableArea"
                        type="number"
                        step="0.01"
                        defaultValue={property.leasableArea.toString()}
                        className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="address" className="text-right font-medium text-slate-700">
                        Address
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        defaultValue={property.address}
                        className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="propertyType" className="text-right font-medium text-slate-700">
                        Type
                      </Label>
                      <Select name="propertyType" defaultValue={property.propertyType}>
                        <SelectTrigger className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                          {Object.values(PropertyType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0) + type.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          type="submit" 
                          disabled={isUpdating}
                          className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Save Changes
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white border-slate-200">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-slate-900">Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-600">
                            This action will update the property details. Are you sure you want to continue?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-slate-300 hover:bg-slate-50">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleConfirmUpdate}
                            disabled={isUpdating}
                            className="min-w-[120px] mt-2 bg-blue-600 hover:bg-blue-700"
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Confirm Save'
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </form>
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
                    This action cannot be undone. This will permanently delete the property
                    &quot;{property.propertyName}&quot; and all its associated data.
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
                      'Delete Property'
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
          <TabsTrigger value="propertyTitles" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Property titles 
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {property.titles?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="units" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Spaces 
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {property.units.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="taxes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Real Property Taxes
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {allPropertyTaxes.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Documents 
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {property.documents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="title" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Title History 
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {property.titleMovements?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="utilities" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Utilities 
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
              {property.utilities.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900">Leasable Area</CardTitle>
                <Building2 className="h-5 w-5 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {property.leasableArea.toString()} sqm
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900">Total Lot Area</CardTitle>
                <Map className="h-5 w-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {totalLotArea} sqm
                </div>
                <p className="text-xs text-slate-700 mt-1">
                  From {property.titles?.length || 0} title{property.titles?.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900">Total Titles</CardTitle>
                <Building2 className="h-5 w-5 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{property.titles.length}</div>
                <p className="text-xs text-slate-700 mt-1">
                  {property.units.length} spaces created
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900">Occupancy Rate</CardTitle>
                <Building2 className="h-5 w-5 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{Math.round(occupancyRate)}%</div>
                <Progress value={occupancyRate} className="mt-3 h-2 bg-slate-200" />
                <p className="text-xs text-slate-700 mt-2">
                  {occupiedUnitArea} / {Number(property.leasableArea)} sqm occupied
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900">Total Revenue</CardTitle>
                <Building2 className="h-5 w-5 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalRentAmount)}
                </div>
                <p className="text-xs text-slate-700 mt-1">
                  Monthly potential
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tax Overview Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-green-800">Total Tax Records</CardTitle>
                <Receipt className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{allPropertyTaxes.length}</div>
                <p className="text-xs text-green-700 mt-1">
                  Across {property.titles?.length || 0} property titles
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-blue-800">Paid Taxes</CardTitle>
                <Receipt className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{formatCurrency(paidTaxAmount)}</div>
                <p className="text-xs text-blue-700 mt-1">
                  {paidTaxes.length} of {allPropertyTaxes.length} records
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-amber-800">Outstanding Taxes</CardTitle>
                <Receipt className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">{formatCurrency(unpaidTaxAmount)}</div>
                <p className="text-xs text-amber-700 mt-1">
                  {unpaidTaxes.length} records pending
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Utility Accounts Card */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <Power className="h-6 w-6 text-slate-600" />
                Utility Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-6 md:grid-cols-3">
                {Object.values(UtilityType).map((type) => {
                  const account = property.utilities.find(u => u.utilityType === type);
                  return (
                    <div key={type} className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 hover:bg-slate-50 transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {type === 'WATER' && <Droplets className="h-5 w-5 text-blue-600" />}
                          {type === 'ELECTRICITY' && <Power className="h-5 w-5 text-yellow-600" />}
                          {type === 'OTHERS' && <QuestionMarkCircledIcon className="h-5 w-5 text-slate-600" />}
                          <h4 className="font-semibold text-slate-900">{type.charAt(0) + type.slice(1).toLowerCase()}</h4>
                        </div>
                        <Badge variant={account?.isActive ? "default" : "secondary"} className={account?.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"}>
                          {account ? (account.isActive ? "Active" : "Inactive") : "Not Set"}
                        </Badge>
                      </div>
                      {account ? (
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-white border border-slate-200">
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Provider</p>
                            <p className="font-semibold text-slate-900 mt-1">{account.provider}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-white border border-slate-200">
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Account Number</p>
                            <p className="font-mono text-slate-900 mt-1 text-sm">{account.accountNumber}</p>
                          </div>
                          {account.meterNumber && (
                            <div className="p-3 rounded-lg bg-white border border-slate-200">
                              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Meter Number</p>
                              <p className="font-mono text-slate-900 mt-1 text-sm">{account.meterNumber}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                              {type === 'WATER' && <Droplets className="h-6 w-6 text-slate-400" />}
                              {type === 'ELECTRICITY' && <Power className="h-6 w-6 text-slate-400" />}
                              {type === 'OTHERS' && <QuestionMarkCircledIcon className="h-6 w-6 text-slate-400" />}
                            </div>
                            <p className="text-sm text-slate-500">No account configured</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="propertyTitles" className="space-y-6">
          <div className="flex justify-between items-center bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Property Titles</h3>
              <p className="text-sm text-slate-600 mt-1">
                Manage property titles and land documentation
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleExportTitlesCSV}
                disabled={!property.titles?.length}
                className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
              <AddPropertyTitleDialog propertyId={property.id} />
            </div>
          </div>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Title No.</TableHead>
                    <TableHead className="font-semibold text-slate-700">Lot No.</TableHead>
                    <TableHead className="font-semibold text-slate-700">Lot Area (sqm)</TableHead>
                    <TableHead className="font-semibold text-slate-700">Registered Owner</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tax Records</TableHead>
                    <TableHead className="font-semibold text-slate-700">Encumbered</TableHead>
                    <TableHead className="font-semibold text-slate-700">Created</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!paginatedTitles?.length ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-slate-300" />
                          <span>No property titles found</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTitles.map((title) => (
                      <TableRow key={title.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <TableCell className="font-mono text-slate-900">{title.titleNo}</TableCell>
                        <TableCell className="text-slate-900">{title.lotNo}</TableCell>
                        <TableCell className="text-slate-900">{title.lotArea.toString()} sqm</TableCell>
                        <TableCell className="text-slate-900">{title.registeredOwner}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {title.propertyTaxes?.length || 0} tax records
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={title.isEncumbered ? "destructive" : "default"} className={title.isEncumbered ? "bg-red-100 text-red-800 border-red-200" : "bg-green-100 text-green-800 border-green-200"}>
                              {title.isEncumbered ? "Yes" : "No"}
                            </Badge>
                            {title.isEncumbered && title.encumbranceDetails && (
                              <div className="text-xs text-slate-600 max-w-[200px] truncate">
                                {title.encumbranceDetails}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{formatDate(title.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-red-50 hover:text-red-600 transition-colors duration-150">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-slate-200">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-900">Delete Property Title</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-600">
                                  Are you sure you want to delete title &quot;{title.titleNo}&quot;? This will also delete all associated tax records. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-slate-300 hover:bg-slate-50">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePropertyTitle(title.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {/* Add CardFooter for pagination controls */}
            <CardFooter className="p-4 border-t border-slate-200">
              <PaginationControls
                currentPage={titlesPage}
                totalPages={totalTitlesPages}
                onPageChange={setTitlesPage}
                totalItems={property.titles?.length || 0}
              />
            </CardFooter>
          </Card>
        </TabsContent>

<TabsContent value="units" className="space-y-6">
  <div className="flex justify-between items-center bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
    <div>
      <h3 className="text-xl font-semibold text-slate-900">Spaces</h3>
      <p className="text-sm text-slate-600 mt-1">
        Manage spaces within this property.
      </p>
    </div>

    {/* ===== Floor Type Legend Start ===== */}
    <div className="hidden lg:flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600 flex-1 mx-4">
      {Object.values(FloorType).map((type) => {
        const { label, short } = getFloorTypeDisplay(type);
        return (
          <div key={type}>
            {label} = <span className="font-mono font-semibold">{short}</span>
          </div>
        );
      })}
    </div>
    {/* ===== Floor Type Legend End ===== */}
    
    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={handleExportUnitsCSV}
        disabled={!property.units.length}
        className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
      >
        <Download className="h-4 w-4 mr-2" />
        Export to CSV
      </Button>
      <AddUnitDialog propertyId={property.id} />
    </div>
  </div>
  <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Title No.</TableHead>
                    <TableHead className="font-semibold text-slate-700">Space Number</TableHead>
                    <TableHead className="font-semibold text-slate-700">Floor Area & Rate</TableHead>
                    <TableHead className="font-semibold text-slate-700">Total Area (sqm)</TableHead>
                    <TableHead className="font-semibold text-slate-700">Total Rent</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700">{/*Actions*/}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUnits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Building2 className="h-8 w-8 text-slate-300" />
                          <span>No space records found</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUnits.map((unit) => (
                      <TableRow key={unit.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <TableCell className="font-semibold text-slate-900">
                          {unit.propertyTitle?.titleNo || '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">{unit.unitNumber}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {unit.unitFloors?.map((floor) => {
                              const floorDisplay = getFloorTypeDisplay(floor.floorType);
                              return (
                                <Badge 
                                  key={floor.id} 
                                  variant="outline" 
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                  title={`${floorDisplay.label}: ${floor.area}sqm @ ₱${floor.rate}/sqm = ₱${floor.rent}`}
                                >
                                  {floorDisplay.short} ({floor.area} sqm)
                                  <span className="text-xs text-slate-500">{formatCurrency(floor.rate)}</span>
                                </Badge>
                              );
                            }) || (
                              <span className="text-slate-400 text-xs italic">No floor data</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-900">{unit.totalArea.toString()}</TableCell>
                        <TableCell className="font-semibold text-slate-900">{formatCurrency(Number(unit.totalRent))}</TableCell>

                        <TableCell>
                          <Badge 
                            variant={unit.status === "OCCUPIED" ? "default" : "secondary"}
                            className={unit.status === "OCCUPIED" ? "bg-green-100 text-green-800 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"}
                          >
                            {unit.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/spaces/${unit.id}`}>
                            <Button variant='outline' className="border-slate-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-200">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
                    <CardFooter className="p-4 border-t border-slate-200">
              <PaginationControls
                currentPage={unitsPage}
                totalPages={totalUnitsPages}
                onPageChange={setUnitsPage}
                totalItems={property.units.length}
              />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="utilities" className="space-y-8">
          <div className="flex justify-between items-center bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Utility Accounts</h3>
              <p className="text-sm text-slate-600 mt-1">
                Manage utility accounts and meters for this property
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleExportUtilitiesCSV}
                disabled={!property.utilities.length}
                className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
              <AddUtilityDialog propertyId={property.id} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {Object.values(UtilityType).map((type) => {
              const account = property.utilities.find(u => u.utilityType === type);
              return (
                <div key={type} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      {type === 'WATER' && <Droplets className="h-5 w-5 text-blue-600" />}
                      {type === 'ELECTRICITY' && <Power className="h-5 w-5 text-yellow-600" />}
                      {type === 'OTHERS' && <QuestionMarkCircledIcon className="h-5 w-5 text-slate-600" />}
                      <h4 className="font-semibold text-slate-900">{type.charAt(0) + type.slice(1).toLowerCase()}</h4>
                    </div>
                    <Badge variant={account?.isActive ? "default" : "secondary"} className={account?.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"}>
                      {account?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {account ? (
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Provider</p>
                        <p className="font-semibold text-slate-900 mt-1">{account.provider}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Account Number</p>
                        <p className="font-mono text-slate-900 mt-1">{account.accountNumber}</p>
                      </div>
                      {account.meterNumber && (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Meter Number</p>
                          <p className="font-mono text-slate-900 mt-1">{account.meterNumber}</p>
                        </div>
                      )}
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
                          onClick={() => handleUtilityStatusChange(account.id, account.isActive)}
                        >
                          Mark as {account.isActive ? "Inactive" : "Active"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          {type === 'WATER' && <Droplets className="h-6 w-6 text-slate-400" />}
                          {type === 'ELECTRICITY' && <Power className="h-6 w-6 text-slate-400" />}
                          {type === 'OTHERS' && <QuestionMarkCircledIcon className="h-6 w-6 text-slate-400" />}
                        </div>
                        <p className="text-sm text-slate-500">No account configured</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Type</TableHead>
                  <TableHead className="font-semibold text-slate-700">Provider</TableHead>
                  <TableHead className="font-semibold text-slate-700">Account Number</TableHead>
                  <TableHead className="font-semibold text-slate-700">Meter Number</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUtilities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Power className="h-8 w-8 text-slate-300" />
                        <span>No utility records found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUtilities.map((utility) => (
                    <TableRow key={utility.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {utility.utilityType === 'WATER' && <Droplets className="h-4 w-4 text-blue-600" />}
                          {utility.utilityType === 'ELECTRICITY' && <Power className="h-4 w-4 text-yellow-600" />}
                          {utility.utilityType === UtilityType.OTHERS && <QuestionMarkCircledIcon className="h-4 w-4 text-slate-600" />}
                          <span className="font-medium text-slate-900">{utility.utilityType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-900">{utility.provider}</TableCell>
                      <TableCell className="font-mono text-slate-900">{utility.accountNumber}</TableCell>
                      <TableCell className="font-mono text-slate-900">{utility.meterNumber || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={utility.isActive ? "default" : "secondary"} className={utility.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"}>
                          {utility.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                          onClick={() => handleUtilityStatusChange(utility.id, utility.isActive)}
                        >
                          {utility.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
      <div className="p-4 border-t border-slate-200">
               <PaginationControls
                  currentPage={utilitiesPage}
                  totalPages={totalUtilitiesPages}
                  onPageChange={setUtilitiesPage}
                  totalItems={property.utilities.length}
                />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-6">
          <div className="flex justify-between items-center bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Real Property Taxes</h3>
              <p className="text-sm text-slate-600 mt-1">
                Tax records organized by property title
              </p>
            </div>
            <div className="flex gap-3">
              <TitleFilter
                titles={property.titles || []}
                selectedTitleIds={selectedTitleIds}
                onSelectionChange={setSelectedTitleIds}
              />
              <Button
                variant="outline"
                onClick={handleExportTaxesCSV}
                disabled={!filteredPropertyTaxes.length}
                className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Filtered
              </Button>
              <AddPropertyTaxDialog 
                propertyTitles={property.titles || []} 
                users={users} 
                currentUserId={currentUserId} 
              />
            </div>
          </div>

          {/* Filter Status Display */}
          {selectedTitleIds.length > 0 && selectedTitleIds.length < (property.titles?.length || 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Showing {paginatedTaxes.length} tax records from {selectedTitleIds.length} selected titles
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {property.titles
                        ?.filter(title => selectedTitleIds.includes(title.id))
                        .map(title => (
                          <Badge key={title.id} variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                            {title.titleNo}
                          </Badge>
                        ))
                      }
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTitleIds(property.titles?.map(title => title.id) || [])}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filter
                </Button>
              </div>
            </div>
          )}
          
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Property Title</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tax Year</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tax Declaration No.</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tax Amount</TableHead>
                    <TableHead className="font-semibold text-slate-700">Payment Type</TableHead>
                    <TableHead className="font-semibold text-slate-700">Due Date</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Processed By</TableHead>
                    <TableHead className="font-semibold text-slate-700">Remarks</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTaxes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Receipt className="h-8 w-8 text-slate-300" />
                          <span>
                            {selectedTitleIds.length === 0 
                              ? "No tax records found" 
                              : "No tax records found for selected titles"
                            }
                          </span>
                          {allPropertyTaxes.length === 0 && (
                            <p className="text-xs text-slate-400 mt-1">
                              Add property titles first, then add tax records for each title
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTaxes.map((tax) => (
                      <TableRow key={tax.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{tax.titleInfo.titleNo}</span>
                            <span className="text-xs text-slate-500">Lot {tax.titleInfo.lotNo}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">{tax.taxYear}</TableCell>
                        <TableCell className="font-mono text-slate-900">{tax.TaxDecNo}</TableCell>
                        <TableCell className="font-semibold text-slate-900">{formatCurrency(Number(tax.taxAmount))}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                            {tax.isAnnual ? 'Annual' : tax.isQuarterly ? `Q${tax.whatQuarter?.slice(0, 1) || ''}` : 'Other'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-900">{formatDate(tax.dueDate)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={tax.isPaid ? "default" : "secondary"} 
                            className={tax.isPaid ? "bg-green-100 text-green-800 border-green-200" : "bg-amber-100 text-amber-800 border-amber-200"}
                          >
                            {tax.isPaid ? "Paid" : "Unpaid"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {tax.processedBy ? (
                            users.find(u => u.id === tax.processedBy)?.firstName + ' ' + users.find(u => u.id === tax.processedBy)?.lastName
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-[200px] truncate">{tax.remarks || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={tax.isPaid ? "hover:bg-amber-50 hover:text-amber-700" : "hover:bg-green-50 hover:text-green-700"}
                              onClick={() => handleTaxStatusChange(tax.id, tax.isPaid)}
                            >
                              Mark as {tax.isPaid ? "Unpaid" : "Paid"}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="hover:bg-red-50 hover:text-red-600 transition-colors duration-150">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white border-slate-200">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-slate-900">Delete Tax Record</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-600">
                                    Are you sure you want to delete this tax record for {tax.titleInfo.titleNo} ({tax.taxYear})? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-slate-300 hover:bg-slate-50">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePropertyTax(tax.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
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
            <CardFooter className="p-4 border-t border-slate-200">
              <PaginationControls
                currentPage={taxesPage}
                totalPages={totalTaxesPages}
                onPageChange={setTaxesPage}
                totalItems={filteredPropertyTaxes.length}
              />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="flex justify-between items-center bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Documents</h3>
              <p className="text-sm text-slate-600 mt-1">
                Manage property documents and files
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
              <AddDocumentDialog
                propertyId={property.id}
                currentUserId={currentUserId}
              />
            </div>
          </div>

          {/* Search and Filter Controls */}
   
            <div className="flex sm:flex-row gap-4 items-center">
              <div className="w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search documents by name or description..."
                    value={documentSearchQuery}
                    onChange={(e) => setDocumentSearchQuery(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 w-full sm:w-[400px]"
                  />
                </div>
              </div>
              <div className="w-full sm:w-64">
                <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                  <SelectTrigger className="focus:border-blue-500 focus:ring-blue-500/20 w-full">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all">
  <div className="flex items-center">
    <FilterIcon className="h-4 w-4 mr-2" />
    <span>All Types</span>
  </div>
</SelectItem>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.toLowerCase().charAt(0).toUpperCase() + type.toLowerCase().slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Status Display */}
            {(documentSearchQuery || selectedDocumentType !== 'all') && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Search className="h-4 w-4 text-slate-600" />
                    <div className="text-sm text-slate-600">
                      Showing {filteredDocuments.length} of {property.documents.length} documents
                      {documentSearchQuery && (
                        <span className="ml-1">
                          matching &quot;<span className="font-medium">{documentSearchQuery}</span>&quot;
                        </span>
                      )}
                      {selectedDocumentType !== 'all' && (
                        <span className="ml-1">
                          {documentSearchQuery ? 'and' : 'with'} type &quot;<span className="font-medium">{selectedDocumentType.toLowerCase()}</span>&quot;
                        </span>
                      )}
                    </div>
                  </div>
                  {(documentSearchQuery || selectedDocumentType !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDocumentSearchQuery('');
                        setSelectedDocumentType('all');
                      }}
                      className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear filters
                    </Button>
                  )}
                </div>
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
                  {paginatedDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-slate-300" />
                          {property.documents.length === 0 ? (
                            <span>No documents found</span>
                          ) : (
                            <span>No documents match your search criteria</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDocuments.map((doc) => (
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
                            {doc.documentType.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-900">
                          {users.find(u => u.id === doc.uploadedById)?.firstName}{' '}
                          {users.find(u => u.id === doc.uploadedById)?.lastName}
                        </TableCell>
                        <TableCell className="text-slate-600">{formatDate(doc.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={doc.name}
                            title={`Download ${doc.name}`}
                          >
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
                      <CardFooter className="p-4 border-t border-slate-200">
              <PaginationControls
                currentPage={documentsPage}
                totalPages={totalDocumentsPages}
                onPageChange={setDocumentsPage}
                totalItems={filteredDocuments.length}
              />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="title" className="space-y-6">
          <div className="flex justify-between items-center bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Title History & Encumbrances</h3>
              <p className="text-sm text-slate-600 mt-1">
                Track title history and manage property encumbrances
              </p>
            </div>
            <TitleMovementDialog propertyId={property.id} currentUserId={currentUserId} />
          </div>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Date</TableHead>
                    <TableHead className="font-semibold text-slate-700">Location</TableHead>
                    <TableHead className="font-semibold text-slate-700">Purpose</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Requested By</TableHead>
                    <TableHead className="font-semibold text-slate-700">Return Date</TableHead>
                    <TableHead className="font-semibold text-slate-700">Remarks</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMovements?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-slate-300" />
                          <span>No title movements recorded</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMovements?.map((movement) => (
                      <TableRow key={movement.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <TableCell className="text-slate-900">{formatDate(movement.requestDate)}</TableCell>
                        <TableCell className="text-slate-900">{movement.location}</TableCell>
                        <TableCell className="text-slate-900">{movement.purpose}</TableCell>
                        <TableCell>
                          <Badge variant={movement.status === 'RETURNED' ? 'default' : 'secondary'} className={movement.status === 'RETURNED' ? "bg-green-100 text-green-800 border-green-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
                            {movement.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-900">
                          {users.find(user => user.id === movement.requestedBy)?.firstName || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {movement.returnDate ? formatDate(movement.returnDate) : '-'}
                        </TableCell>
                        <TableCell className="text-slate-600">{movement.remarks || '-'}</TableCell>
                        <TableCell className="text-right">
                          <UpdateTitleStatusDialog
                            titleMovementId={movement.id}  
                            
                            currentStatus={movement.status as TitleMovementStatus}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
                         <CardFooter className="p-4 border-t border-slate-200">
              <PaginationControls
                currentPage={movementsPage}
                totalPages={totalMovementsPages}
                onPageChange={setMovementsPage}
                totalItems={property.titleMovements?.length || 0}
              />
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}