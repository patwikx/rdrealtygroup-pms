import { z } from "zod";
import { 
  PropertyType, 
  UnitStatus, 
  TenantStatus,
  LeaseStatus,
  MaintenanceCategory,
  Priority,
  MaintenanceStatus,
  PaymentType,
  PaymentMethod,
  PaymentStatus,
  DocumentType,
  UtilityType,
  NotificationType,
  NotificationPriority
} from "@prisma/client";

export const propertySchema = z.object({
  propertyCode: z.string().min(1, "Property code is required"),
  propertyName: z.string().min(1, "Property name is required"),
  leasableArea: z.number().positive("Leasable area must be positive"),
  address: z.string().min(1, "Address is required"),
  propertyType: z.nativeEnum(PropertyType),
});

export const propertyTitleSchema = z.object({
  titleNo: z.string().min(1, "Title number is required"),
  lotNo: z.string().min(1, "Lot number is required"),
  lotArea: z.coerce.number().positive("Lot area must be greater than 0"),
  registeredOwner: z.string().min(1, "Registered owner is required"),
  isEncumbered: z.boolean().default(false),
  encumbranceDetails: z.string().optional(),
}).refine((data) => {
  if (data.isEncumbered && !data.encumbranceDetails) {
    return false;
  }
  return true;
}, {
  message: "Encumbrance details are required when property is encumbered",
  path: ["encumbranceDetails"],
});

export const unitSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required"),
  unitArea: z.number().positive("Unit area must be positive"),
  unitRate: z.number().positive("Unit rate must be positive"),
  rentAmount: z.number().positive("Rent amount must be positive"),
  status: z.nativeEnum(UnitStatus),
});

export const tenantSchema = z.object({
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

export const leaseSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  rentAmount: z.number().positive("Rent amount must be positive"),
  securityDeposit: z.number().positive("Security deposit must be positive"),
  status: z.nativeEnum(LeaseStatus),
  unitId: z.string()
});

export const maintenanceRequestSchema = z.object({
  category: z.nativeEnum(MaintenanceCategory),
  priority: z.nativeEnum(Priority),
  description: z.string().min(1, "Description is required"),
  status: z.nativeEnum(MaintenanceStatus),
});

export const paymentSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
  paymentType: z.nativeEnum(PaymentType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentStatus: z.nativeEnum(PaymentStatus),
  paymentDate: z.date(),
});

export const documentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  description: z.string().optional(),
  documentType: z.nativeEnum(DocumentType),
  fileUrl: z.string().url("Invalid file URL"),
});

export const utilitySchema = z.object({
  utilityType: z.nativeEnum(UtilityType),
  provider: z.string().min(1, "Provider is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  meterNumber: z.string().optional(),
});

export const notificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.nativeEnum(NotificationType),
  priority: z.nativeEnum(NotificationPriority),
  actionUrl: z.string().url().optional(),
});