'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import { createPropertyTax } from "@/actions/property-tax";
import { User } from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";

const propertyTaxFormSchema = z.object({
  propertyTitleId: z.string().min(1, "Property title is required"),
  taxYear: z.number().min(2000, "Valid tax year is required"),
  taxDecNo: z.string().min(1, "Tax declaration number is required"),
  taxAmount: z.number().positive("Tax amount must be positive"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  isAnnual: z.boolean().default(false),
  isQuarterly: z.boolean().default(false),
  whatQuarter: z.string().optional(),
  processedBy: z.string().optional(),
  remarks: z.string().optional(),
});

type PropertyTaxFormValues = z.infer<typeof propertyTaxFormSchema>;

interface PropertyTitle {
  id: string;
  titleNo: string;
  lotNo: string;
  registeredOwner: string;
}

interface AddPropertyTaxDialogProps {
  propertyTitles: PropertyTitle[];
  users: User[];
  currentUserId: string;
}

export function AddPropertyTaxDialog({ propertyTitles, users, currentUserId }: AddPropertyTaxDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<PropertyTaxFormValues>({
    resolver: zodResolver(propertyTaxFormSchema),
    defaultValues: {
      taxYear: new Date().getFullYear(),
      isAnnual: false,
      isQuarterly: false,
    },
  });

  const { execute: submitForm, loading: isSubmitting } = useAsync(
    async (data: PropertyTaxFormValues) => {
      try {
        const formData = new FormData();
        formData.append("propertyTitleId", data.propertyTitleId);
        formData.append("taxYear", data.taxYear.toString());
        formData.append("taxDecNo", data.taxDecNo);
        formData.append("taxAmount", data.taxAmount.toString());
        formData.append("dueDate", data.dueDate.toISOString());
        formData.append("isAnnual", data.isAnnual.toString());
        formData.append("isQuarterly", data.isQuarterly.toString());
        if (data.whatQuarter) {
          formData.append("whatQuarter", data.whatQuarter);
        }
        if (data.processedBy) {
          formData.append("processedBy", data.processedBy);
        }
        if (data.remarks) {
          formData.append("remarks", data.remarks);
        }
        formData.append("markedAsPaidBy", currentUserId);

        await createPropertyTax(formData);
        toast.success("Property tax record has been added successfully");
        setOpen(false);
        form.reset();
      } catch (error) {
        toast.error("Failed to add property tax record");
      }
    }
  );

  const watchIsQuarterly = form.watch("isQuarterly");
  const watchIsAnnual = form.watch("isAnnual");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Property Tax
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto bg-white border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900">Add Property Tax Record</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitForm)} className="space-y-4">
            {/* Property Title - Full Width */}
            <FormField
              control={form.control}
              name="propertyTitleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Property Title</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Select property title" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-slate-200">
                      {propertyTitles.map((title) => (
                        <SelectItem key={title.id} value={title.id}>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{title.registeredOwner} — {title.titleNo} - Lot {title.lotNo}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tax Details - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="taxYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Tax Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="2000"
                            className="h-9 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxDecNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Tax Dec. No.</FormLabel>
                        <FormControl>
                          <Input 
                            className="h-9 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">Tax Amount (₱)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="h-9 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-medium text-slate-700">Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full h-9 pl-3 text-left font-normal border-slate-300 focus:border-blue-500 focus:ring-blue-500/20",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border-slate-200" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                {/* Payment Type */}
                <div className="space-y-3">
                  <FormLabel className="text-sm font-medium text-slate-700">Payment Type</FormLabel>
                  <div className="flex flex-col space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <FormField
                      control={form.control}
                      name="isAnnual"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  form.setValue("isQuarterly", false);
                                  form.setValue("whatQuarter", undefined);
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium text-slate-700">Annual Payment</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isQuarterly"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  form.setValue("isAnnual", false);
                                } else {
                                  form.setValue("whatQuarter", undefined);
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium text-slate-700">Quarterly Payment</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {watchIsQuarterly && (
                  <FormField
                    control={form.control}
                    name="whatQuarter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Quarter</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                              <SelectValue placeholder="Select quarter" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="1st Quarter">1st Quarter</SelectItem>
                            <SelectItem value="2nd Quarter">2nd Quarter</SelectItem>
                            <SelectItem value="3rd Quarter">3rd Quarter</SelectItem>
                            <SelectItem value="4th Quarter">4th Quarter</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="processedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">Processed By</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                            <SelectValue placeholder="Select user (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-slate-200">
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Remarks - Full Width */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Remarks</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional remarks or notes..."
                      className="resize-none h-16 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                }}
                disabled={isSubmitting}
                className="px-4 py-2 h-9 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2 h-9 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Adding..." : "Add Record"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}