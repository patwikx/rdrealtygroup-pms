import { z } from "zod";
import { UnitStatus, FloorType } from "@prisma/client";

// Floor schema for the new multi-floor structure
const floorSchema = z.object({
  floorType: z.nativeEnum(FloorType),
  area: z.number().min(0.1, "Area must be greater than 0"),
  rate: z.number().min(0, "Rate must be greater than or equal to 0"),
  rent: z.number().min(0, "Rent must be greater than or equal to 0"),
});

// Updated unit schema to match new Prisma structure
export const unitSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  propertyTitleId: z.string().optional(),
  unitNumber: z.string().min(1, "Unit number is required"),
  status: z.nativeEnum(UnitStatus),
  floors: z.array(floorSchema).min(1, "At least one floor is required"),
});

// Legacy schema for backward compatibility (if needed)
export const legacyUnitSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  unitNumber: z.string().min(1, "Unit number is required"),
  unitArea: z.number().min(0.1, "Area must be greater than 0"),
  unitRate: z.number().min(0, "Rate must be greater than or equal to 0"),
  rentAmount: z.number().min(0, "Rent amount must be greater than or equal to 0"),
  status: z.nativeEnum(UnitStatus),
});

export type UnitFormData = z.infer<typeof unitSchema>;
export type LegacyUnitFormData = z.infer<typeof legacyUnitSchema>;