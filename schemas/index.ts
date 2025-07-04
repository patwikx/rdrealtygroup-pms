import * as z from "zod";
import { PaymentStatus, PaymentType, UserRole } from "@prisma/client";


export const SettingsSchema = z.object({
  name: z.optional(z.string()),
  isTwoFactorEnabled: z.optional(z.boolean()),
  role: z.enum([UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER, UserRole.TENANT]),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(6)),
  newPassword: z.optional(z.string().min(6)),
})
  .refine((data) => {
    if (data.password && !data.newPassword) {
      return false;
    }

    return true;
  }, {
    message: "New password is required!",
    path: ["newPassword"]
  })
  .refine((data) => {
    if (data.newPassword && !data.password) {
      return false;
    }

    return true;
  }, {
    message: "Password is required!",
    path: ["password"]
  })

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters required",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  code: z.optional(z.string()),
});

export const RegisterUserSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  firstName: z.string().min(1, {
    message: "First Name is required",
  }),
  lastName: z.string().min(1, {
    message: "Last Name is required",
  }),
  address: z.string().optional(),
  contactNo: z.string().optional(),
  role: z.enum([UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER, UserRole.TENANT, UserRole.ACCTG, UserRole.TREASURY, UserRole.STOCKROOM, UserRole.PURCHASER, UserRole.OWNER]).optional(),
});

export const unitTaxSchema = z.object({
  taxYear: z.number().min(2000, "Invalid tax year"),
  taxDecNo: z.string().min(1, "Tax declaration number is required"),
  taxAmount: z.string().or(z.number()).pipe(
    z.coerce.number().positive("Amount must be greater than 0")
  ),
  dueDate: z.string().min(1, "Due date is required"),
  isAnnual: z.boolean().default(false),
  isQuarterly: z.boolean().default(false),
  whatQuarter: z.string().optional(),
  processedBy: z.string().optional(),
  remarks: z.string().optional(),
});

