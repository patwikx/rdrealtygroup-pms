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

interface AddPropertyTaxDialogProps {
  propertyId: string;
  users: User[];
  currentUserId: string;
}

export function AddPropertyTaxDialog({ propertyId, users, currentUserId }: AddPropertyTaxDialogProps) {
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
        formData.append("propertyId", propertyId);
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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Property Tax
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Property Tax Record</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitForm)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="2000" 
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
                    <FormLabel>Tax Declaration No.</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                  <FormLabel>Tax Amount (₱)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-4">
              <FormField
                control={form.control}
                name="isAnnual"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
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
                    <FormLabel className="font-normal">Annual</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isQuarterly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            form.setValue("isAnnual", false);
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Quarterly</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {watchIsQuarterly && (
              <FormField
                control={form.control}
                name="whatQuarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quarter</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quarter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
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
                    <PopoverContent className="w-auto p-0" align="start">
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

            <FormField
              control={form.control}
              name="processedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processed By</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Tax Record"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}