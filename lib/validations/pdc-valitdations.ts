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