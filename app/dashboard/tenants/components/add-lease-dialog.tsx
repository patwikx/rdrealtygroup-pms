'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LeaseStatus } from "@prisma/client";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import { leaseSchema } from "@/lib/utils/validation";
import { TenantWithRelations } from "@/types";
import { z } from "zod";
import { getAvailableUnits } from "@/actions/units";
import { createLease } from "@/actions/lease";
import { Decimal } from "@prisma/client/runtime/library";
import { toast } from "sonner";
type LeaseFormValues = z.infer<typeof leaseSchema>;

interface AddLeaseDialogProps {
  tenant: TenantWithRelations;
  availableUnits: {
    id: string;
    unitNumber: string;
    property: {
      id: string;
      propertyName: string;
    };
  }[];
  onLeaseCreated: (lease: any) => void;
}

export function AddLeaseDialog({ tenant, onLeaseCreated }: AddLeaseDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [availableUnits, setAvailableUnits] = useState<Array<{
    id: string;
    unitNumber: string;
    rentAmount: number;  // Changed from Decimal to number
    property: {
      id: string;
      propertyName: string;
    };
  }>>([]);

  const form = useForm<LeaseFormValues>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      status: LeaseStatus.ACTIVE,
    },
  });

  useEffect(() => {
    if (open) {
      getAvailableUnits().then(units => 
        setAvailableUnits(units.map(unit => ({
          id: unit.id,
          unitNumber: unit.unitNumber,
          rentAmount: parseFloat(unit.rentAmount.toString()),  // Convert to number
          property: {
            id: unit.property.id,
            propertyName: unit.property.propertyName
          }
        })))
      );
    }
  }, [open]);

   // Watch for unit selection changes
   const selectedUnitId = form.watch("unitId");
   useEffect(() => {
     if (selectedUnitId) {
       const selectedUnit = availableUnits.find(unit => unit.id === selectedUnitId);
       if (selectedUnit) {
         form.setValue("rentAmount", parseFloat(selectedUnit.rentAmount.toString()));
       }
     }
   }, [selectedUnitId, availableUnits, form]);

  const { execute: submitForm, loading: isSubmitting } = useAsync(
    async (data: LeaseFormValues) => {
      try {
        const formData = new FormData();
        formData.append("tenantId", tenant.id);
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });

        const newLease = await createLease(formData);
        toast.success("Lease has been created successfully.");
        setOpen(false);
        form.reset();
        onLeaseCreated(newLease);
        router.refresh();
      } catch (error) {
        toast.error("Failed to create lease. Please try again.");
      }
    },
    {
      showSuccessToast: false,
      showErrorToast: false,
    }
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Lease
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Lease</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitForm)} className="space-y-4">
            <FormField
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property/Unit</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
  {availableUnits.length > 0 ? (
    availableUnits.map((unit) => (
      <SelectItem key={unit.id} value={unit.id}>
        {unit.property.propertyName} - {unit.unitNumber}
      </SelectItem>
    ))
  ) : (
    <SelectItem value="no-units" disabled>
      No available spaces
    </SelectItem>
  )}
</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
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
                            date < new Date()
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
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
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
                            date < (form.getValues("startDate") || new Date())
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rent (₱)</FormLabel>
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
              <FormField
                control={form.control}
                name="securityDeposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Deposit (₱)</FormLabel>
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
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(LeaseStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                {isSubmitting ? "Creating..." : "Create Lease"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}