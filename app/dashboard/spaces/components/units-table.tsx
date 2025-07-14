"use client";

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
import { formatCurrency } from "@/lib/utils";
import { MoreHorizontal, Eye, Edit, Trash } from "lucide-react";
import { UnitStatus, FloorType } from "@prisma/client";
import { DataTableToolbar } from "./units-toolbar";
import Link from "next/link";
import { DataTablePagination } from "./data-table-pagination";

const statusColorMap: Record<UnitStatus, string> = {
  VACANT: "bg-green-500",
  OCCUPIED: "bg-blue-500",
  MAINTENANCE: "bg-red-500",
  RESERVED: "bg-purple-500",
};

const floorTypeDisplayMap: Record<FloorType, string> = {
  GROUND_FLOOR: "Ground Floor",
  MEZZANINE: "Mezzanine",
  SECOND_FLOOR: "Second Floor",
  THIRD_FLOOR: "Third Floor",
  ROOF_TOP: "Rooftop",
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
  // Helper function to check if unit has a specific floor type
  const hasFloorType = (unit: UnitWithFloors, floorType: FloorType) => {
    return unit.unitFloors.some(floor => floor.floorType === floorType);
  };

  // Helper function to get floor details for a specific floor type
  const getFloorDetails = (unit: UnitWithFloors, floorType: FloorType) => {
    return unit.unitFloors.find(floor => floor.floorType === floorType);
  };

  // Helper function to calculate average rate across all floors
  const getAverageRate = (unit: UnitWithFloors) => {
    if (unit.unitFloors.length === 0) return 0;
    const totalRate = unit.unitFloors.reduce((sum, floor) => sum + floor.rate, 0);
    return totalRate / unit.unitFloors.length;
  };

 return (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <DataTableToolbar units={units} />
    </div>
    <div className="rounded-md border">
      <Table>
        <TableHeader>
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
          {units.map((unit) => (
            <TableRow key={unit.id}>
              <TableCell className="font-medium text-center">{unit.unitNumber}</TableCell>
              <TableCell>{unit.property.propertyName}</TableCell>
              
              {/* Ground Floor */}
              <TableCell>
                {hasFloorType(unit, FloorType.GROUND_FLOOR) ? (
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                    {getFloorDetails(unit, FloorType.GROUND_FLOOR)?.area.toLocaleString()} sqm
                  </Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </TableCell>

              {/* Mezzanine */}
              <TableCell>
                {hasFloorType(unit, FloorType.MEZZANINE) ? (
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                    {getFloorDetails(unit, FloorType.MEZZANINE)?.area.toLocaleString()} sqm
                  </Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </TableCell>

              {/* Second Floor */}
              <TableCell>
                {hasFloorType(unit, FloorType.SECOND_FLOOR) ? (
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                    {getFloorDetails(unit, FloorType.SECOND_FLOOR)?.area.toLocaleString()} sqm
                  </Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </TableCell>

              {/* Third Floor */}
              <TableCell>
                {hasFloorType(unit, FloorType.THIRD_FLOOR) ? (
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                    {getFloorDetails(unit, FloorType.THIRD_FLOOR)?.area.toLocaleString()} sqm
                  </Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </TableCell>

              {/* Rooftop */}
              <TableCell>
                {hasFloorType(unit, FloorType.ROOF_TOP) ? (
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                    {getFloorDetails(unit, FloorType.ROOF_TOP)?.area.toLocaleString()} sqm
                  </Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </TableCell>
              
              <TableCell className="text-center">{unit.totalArea.toLocaleString()}</TableCell>
              <TableCell>{formatCurrency(getAverageRate(unit))}</TableCell>
              <TableCell className="text-semibold font-semibold">{formatCurrency(unit.totalRent)}</TableCell>

              <TableCell>
                <Badge
                  variant="secondary"
                  className={`${statusColorMap[unit.status]} text-white`}
                >
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
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </Link>
                    <Link href={`/dashboard/spaces/${unit.id}/edit`}>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Space
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="text-destructive">
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Space
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    <DataTablePagination />
  </div>
);
}