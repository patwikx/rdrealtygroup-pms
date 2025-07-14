'use client';

import { UnitStatus, FloorType } from "@prisma/client";
import { EditUnitDialog } from "./edit-unit-dialog";
import { DeleteUnitDialog } from "./delete-unit-dialog";

type UnitWithFloors = {
  id: string;
  unitNumber: string;
  totalArea: number;
  totalRent: number;
  status: UnitStatus;
  propertyId: string;
  propertyTitleId: string | null;
  createdAt: Date;
  updatedAt: Date;
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

interface UnitActionsProps {
  unit: UnitWithFloors;
}

export function UnitActions({ unit }: UnitActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <EditUnitDialog unit={unit} />
      <DeleteUnitDialog unit={unit} />
    </div>
  );
}