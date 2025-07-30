import { z } from "zod"

export const createPDCSchema = z.object({
  refNo: z.string().min(1, "Reference number is required"),
  bankName: z.string().min(1, "Bank name is required"),
  dueDate: z.string().min(1, "Due date is required"),
  checkNo: z.string().min(1, "Check number is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  remarks: z.string().optional(),
  bpCode: z.string().min(1, "Business partner code is required"),
})

export const updatePDCStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["Open", "Deposited", "RETURNED", "Bounced", "Cancelled"]),
})

export type CreatePDCInput = z.infer<typeof createPDCSchema>
export type UpdatePDCStatusInput = z.infer<typeof updatePDCStatusSchema>

// NEW SCHEMA FOR THE EDIT FORM
export const updatePDCSchema = z.object({
  id: z.string().min(1),
  refNo: z.string().min(1, "Reference number is required."),
  bankName: z.string().min(1, "Bank name is required."),
  checkNo: z.string().min(1, "Check number is required."),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  docDate: z.date({ required_error: "Document date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  remarks: z.string().optional(),
})

export type UpdatePDCInput = z.infer<typeof updatePDCSchema>
