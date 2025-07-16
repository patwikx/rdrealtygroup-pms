"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { MoreHorizontal, Eye, Edit, Trash, FilterIcon } from "lucide-react";
import { UnitStatus, FloorType } from "@prisma/client";
import Link from "next/link";

const statusColorMap: Record<UnitStatus, string> = {
  VACANT: "bg-green-500",
  OCCUPIED: "bg-blue-500",
  MAINTENANCE: "bg-red-500",
  RESERVED: "bg-purple-500",
};

type UnitWithFloors = {
  id: string;
  unitNumber: string;
  totalArea: number;
  totalRent: number;
  status: UnitStatus;
  property: {
    propertyName: string;
  };
  unitFloors: {
    floorType: FloorType;
    area: number;
    rate: number;
    rent: number;
  }[];
};

interface UnitsDataTableProps {
  units: UnitWithFloors[];
}

export function UnitsDataTable({ units }: UnitsDataTableProps) {
  // --- State for Filters and Pagination ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- Filtering Logic ---
  const filteredUnits = useMemo(() => {
    let filtered = units;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (unit) =>
          unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          unit.property.propertyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((unit) => unit.status === statusFilter);
    }

    return filtered;
  }, [units, searchTerm, statusFilter]);

  // --- Pagination Logic (now based on filteredUnits) ---
  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUnits = filteredUnits.slice(startIndex, endIndex);

  // Reset to page 1 whenever filters or itemsPerPage change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };
  
  // Helper functions
  const hasFloorType = (unit: UnitWithFloors, floorType: FloorType) => {
    return unit.unitFloors.some(floor => floor.floorType === floorType);
  };
  const getFloorDetails = (unit: UnitWithFloors, floorType: FloorType) => {
    return unit.unitFloors.find(floor => floor.floorType === floorType);
  };
  const getAverageRate = (unit: UnitWithFloors) => {
    if (unit.unitFloors.length === 0) return 0;
    const totalRate = unit.unitFloors.reduce((sum, floor) => sum + floor.rate, 0);
    return totalRate / unit.unitFloors.length;
  };

  return (
    <div className="space-y-4">
      {/* --- Filter and Search Controls (Side-by-side) --- */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by space or property..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            handleFilterChange();
          }}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            handleFilterChange();
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL"><span>All Statuses</span></SelectItem>
            <SelectItem value={UnitStatus.VACANT}>Vacant</SelectItem>
            <SelectItem value={UnitStatus.OCCUPIED}>Occupied</SelectItem>
            <SelectItem value={UnitStatus.MAINTENANCE}>Maintenance</SelectItem>
            <SelectItem value={UnitStatus.RESERVED}>Reserved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
             {/* Table Headers remain the same */}
            <TableRow>
              <TableHead className="text-center">Space Number</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Ground Floor</TableHead>
              <TableHead>Mezzanine</TableHead>
              <TableHead>Second Floor</TableHead>
              <TableHead>Third Floor</TableHead>
              <TableHead>Rooftop</TableHead>
              <TableHead className="text-center">Total Area (sqm)</TableHead>
              <TableHead>Avg. Rate</TableHead>
              <TableHead>Total Rent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUnits.length > 0 ? (
              currentUnits.map((unit) => (
                <TableRow key={unit.id}>
                    {/* All TableCell data remains the same */}
                     <TableCell className="font-medium text-center">{unit.unitNumber}</TableCell>
                     <TableCell>{unit.property.propertyName}</TableCell>
                     <TableCell>
                       {hasFloorType(unit, FloorType.GROUND_FLOOR) ? (
                         <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                           {getFloorDetails(unit, FloorType.GROUND_FLOOR)?.area.toLocaleString()} sqm
                         </Badge>
                       ) : ( <Badge variant="secondary">No</Badge> )}
                     </TableCell>
                     <TableCell>
                       {hasFloorType(unit, FloorType.MEZZANINE) ? (
                         <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                           {getFloorDetails(unit, FloorType.MEZZANINE)?.area.toLocaleString()} sqm
                         </Badge>
                       ) : ( <Badge variant="secondary">No</Badge> )}
                     </TableCell>
                     <TableCell>
                       {hasFloorType(unit, FloorType.SECOND_FLOOR) ? (
                         <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                           {getFloorDetails(unit, FloorType.SECOND_FLOOR)?.area.toLocaleString()} sqm
                         </Badge>
                       ) : ( <Badge variant="secondary">No</Badge> )}
                     </TableCell>
                     <TableCell>
                       {hasFloorType(unit, FloorType.THIRD_FLOOR) ? (
                         <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                           {getFloorDetails(unit, FloorType.THIRD_FLOOR)?.area.toLocaleString()} sqm
                         </Badge>
                       ) : ( <Badge variant="secondary">No</Badge> )}
                     </TableCell>
                     <TableCell>
                       {hasFloorType(unit, FloorType.ROOF_TOP) ? (
                         <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                           {getFloorDetails(unit, FloorType.ROOF_TOP)?.area.toLocaleString()} sqm
                         </Badge>
                       ) : ( <Badge variant="secondary">No</Badge> )}
                     </TableCell>
                     <TableCell className="text-center">{unit.totalArea.toLocaleString()}</TableCell>
                     <TableCell>{formatCurrency(getAverageRate(unit))}</TableCell>
                     <TableCell className="text-semibold font-semibold">{formatCurrency(unit.totalRent)}</TableCell>
                     <TableCell>
                       <Badge variant="secondary" className={`${statusColorMap[unit.status]} text-white`}>
                         {unit.status}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" className="h-8 w-8 p-0">
                             <span className="sr-only">Open menu</span>
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuLabel>Actions</DropdownMenuLabel>
                           <Link href={`/dashboard/spaces/${unit.id}`}>
                             <DropdownMenuItem>
                               <Eye className="mr-2 h-4 w-4" /> View Details
                             </DropdownMenuItem>
                           </Link>
                           <Link href={`/dashboard/spaces/${unit.id}/edit`}>
                             <DropdownMenuItem>
                               <Edit className="mr-2 h-4 w-4" /> Edit Space
                             </DropdownMenuItem>
                           </Link>
                           <DropdownMenuItem className="text-destructive">
                             <Trash className="mr-2 h-4 w-4" /> Delete Space
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- Custom Pagination Controls (Side-by-side) --- */}
      <div className="flex items-center justify-between flex-wrap gap-4 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredUnits.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredUnits.length)} of {filteredUnits.length} results
        </div>
        <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                    {[10, 20, 30, 40, 50].map(size => (
                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="text-sm font-medium px-2">
              Page {totalPages > 0 ? currentPage : 0} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
        </div>
      </div>
    </div>
  );
}