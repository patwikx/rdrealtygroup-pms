'use client';

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LeaseStatus } from "@prisma/client";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon, Plus, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { TenantWithRelations } from "@/types";
import { z } from "zod";
import { getAvailableUnits } from "@/actions/units";
import { createMultiUnitLease } from "@/actions/lease";
import { toast } from "sonner";

// Updated schema for multi-unit lease
const multiUnitLeaseSchema = z.object({
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  securityDeposit: z.number().positive(),
  status: z.nativeEnum(LeaseStatus),
  units: z.array(z.object({
    unitId: z.string().min(1, "Unit is required"),
    rentAmount: z.number(),
  })).min(1, "At least one unit is required"),
});

type MultiUnitLeaseFormValues = z.infer<typeof multiUnitLeaseSchema>;

interface AddLeaseDialogProps {
  tenant: TenantWithRelations;
  onLeaseCreated: (lease: any) => void;
}

interface UnitOption {
  id: string;
  unitNumber: string;
  totalRent: number;
  property: {
    id: string;
    propertyName: string;
  };
}

export function AddLeaseDialog({ tenant, onLeaseCreated }: AddLeaseDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [availableUnits, setAvailableUnits] = useState<UnitOption[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  
  // State for manual date input strings
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");


  const form = useForm<MultiUnitLeaseFormValues>({
    resolver: zodResolver(multiUnitLeaseSchema),
    defaultValues: {
      status: LeaseStatus.ACTIVE,
      units: [{ unitId: '', rentAmount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "units",
  });

  const watchedUnits = form.watch("units");
  const watchedStartDate = form.watch("startDate");

  // Sync form state back to input state when a date is picked
  useEffect(() => {
    if (watchedStartDate) {
      setStartDateInput(format(watchedStartDate, "MM/dd/yyyy"));
    }
  }, [watchedStartDate]);


  // Calculate total rent
  const totalRent = watchedUnits.reduce((sum, unit) => sum + (unit.rentAmount || 0), 0);

  useEffect(() => {
    if (open) {
      getAvailableUnits().then(units => {
        setAvailableUnits(units.map(unit => ({
          id: unit.id,
          unitNumber: unit.unitNumber,
          totalRent: parseFloat(unit.totalRent.toString()),
          property: {
            id: unit.property.id,
            propertyName: unit.property.propertyName
          }
        })));
      });
    }
  }, [open]);

  // Update selected units when form changes
  useEffect(() => {
    const newSelectedUnits = new Set(
      watchedUnits.map(unit => unit.unitId).filter(Boolean)
    );
    setSelectedUnits(newSelectedUnits);
  }, [watchedUnits]);

  const handleUnitChange = (index: number, unitId: string) => {
    const selectedUnit = availableUnits.find(unit => unit.id === unitId);
    if (selectedUnit) {
      form.setValue(`units.${index}.unitId`, unitId);
      form.setValue(`units.${index}.rentAmount`, selectedUnit.totalRent);
    }
  };

  const addUnit = () => {
    append({ unitId: '', rentAmount: 0 });
  };

  const removeUnit = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const getAvailableUnitsForSelect = (currentIndex: number) => {
    const currentUnitId = watchedUnits[currentIndex]?.unitId;
    return availableUnits.filter(unit =>
      !selectedUnits.has(unit.id) || unit.id === currentUnitId
    );
  };

  const { execute: submitForm, loading: isSubmitting } = useAsync(
    async (data: MultiUnitLeaseFormValues) => {
      try {
        const formData = new FormData();
        formData.append("tenantId", tenant.id);
        formData.append("startDate", data.startDate.toISOString());
        formData.append("endDate", data.endDate.toISOString());
        formData.append("securityDeposit", data.securityDeposit.toString());
        formData.append("status", data.status);
        formData.append("totalRentAmount", totalRent.toString());
        formData.append("units", JSON.stringify(data.units));

        const newLease = await createMultiUnitLease(formData);
        toast.success("Multi-unit lease has been created successfully.");
        setOpen(false);
        form.reset();
        setSelectedUnits(new Set());
        setStartDateInput("");
        setEndDateInput("");
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

  const handleDialogClose = () => {
    setOpen(false);
    form.reset();
    setSelectedUnits(new Set());
    setStartDateInput("");
    setEndDateInput("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Lease
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <div className="bg-white">
          <DialogHeader className="px-6 py-4 border-b border-gray-100">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Add New Space Lease
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Configure lease details and select spaces for the tenant {tenant.company}.
            </p>
          </DialogHeader>

          <div className="px-6 py-4 max-h-[75vh] overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submitForm)} className="space-y-6">
                {/* Basic Information Grid */}
                <div className="grid grid-cols-5 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                         <FormLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                           Start Date
                         </FormLabel>
                        <div className="flex gap-2">
                           <FormControl>
                             <Input
                               placeholder="MM/DD/YYYY"
                               value={field.value ? format(field.value, "MM/dd/yyyy") : startDateInput}
                               onChange={(e) => {
                                 let value = e.target.value.replace(/[^\d]/g, '');
                                 if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
                                 if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5, 9)}`;
                                 setStartDateInput(value);

                                 if (value.length === 10) {
                                  const parsedDate = parse(value, 'MM/dd/yyyy', new Date());
                                  if (!isNaN(parsedDate.getTime())) {
                                    field.onChange(parsedDate);
                                  }
                                } else {
                                  field.onChange(undefined);
                                }
                               }}
                               className="h-9 bg-white"
                             />
                           </FormControl>
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="icon"
                                 className="shrink-0 h-9 w-9"
                               >
                                 <CalendarIcon className="h-4 w-4" />
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Calendar
                                 mode="single"
                                 selected={field.value}
                                 onSelect={(date) => {
                                  field.onChange(date);
                                  setStartDateInput(date ? format(date, "MM/dd/yyyy") : "");
                                 }}
                                 disabled={(date) => date < new Date("1900-01-01")}
                                 initialFocus
                               />
                             </PopoverContent>
                           </Popover>
                         </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                         <FormLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                           End Date
                         </FormLabel>
                        <div className="flex gap-2">
                           <FormControl>
                             <Input
                               placeholder="MM/DD/YYYY"
                               value={field.value ? format(field.value, "MM/dd/yyyy") : endDateInput}
                               onChange={(e) => {
                                 let value = e.target.value.replace(/[^\d]/g, '');
                                 if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
                                 if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5, 9)}`;
                                 setEndDateInput(value);

                                 if (value.length === 10) {
                                  const parsedDate = parse(value, 'MM/dd/yyyy', new Date());
                                  if (!isNaN(parsedDate.getTime())) {
                                    field.onChange(parsedDate);
                                  }
                                } else {
                                   field.onChange(undefined);
                                 }
                               }}
                               className="h-9 bg-white"
                             />
                           </FormControl>
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="icon"
                                 className="shrink-0 h-9 w-9"
                               >
                                 <CalendarIcon className="h-4 w-4" />
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Calendar
                                 mode="single"
                                 selected={field.value}
                                 onSelect={(date) => {
                                  field.onChange(date)
                                  setEndDateInput(date ? format(date, "MM/dd/yyyy") : "");
                                }}
                                 disabled={(date) =>
                                  date < (form.getValues("startDate") || new Date())
                                }
                                 initialFocus
                               />
                             </PopoverContent>
                           </Popover>
                         </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Status
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 bg-white">
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

                  <FormField
                    control={form.control}
                    name="securityDeposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Security Deposit
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="h-9 bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Total Rent
                    </FormLabel>
                    <div className="h-9 px-3 mt-2 bg-gray-50 border border-gray-200 rounded-md flex items-center text-sm font-medium text-gray-900">
                      ₱{totalRent.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Units Configuration */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Lease details</h3>
                      <p className="text-xs text-gray-500">Add space with individual rates</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addUnit}
                      disabled={availableUnits.length <= selectedUnits.size}
                      className="h-8 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Space
                    </Button>
                  </div>

                  {/* Units Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wide">
                        <div className="col-span-1">Space</div>
                        <div className="col-span-5">Property / Space</div>
                        <div className="col-span-3">Monthly Rent (₱)</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1"></div>
                      </div>
                    </div>

                    <div className="bg-white">
                      {fields.map((field, index) => (
                        <div key={field.id} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-1">
                              <Badge variant="outline" className="text-xs px-2 py-1">
                                {index + 1}
                              </Badge>
                            </div>

                            <div className="col-span-5">
                              <FormField
                                control={form.control}
                                name={`units.${index}.unitId`}
                                render={({ field }) => (
                                  <FormItem>
                                    <Select
                                      onValueChange={(value) => handleUnitChange(index, value)}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="h-8 text-sm bg-white">
                                          <SelectValue placeholder="Select unit..." />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {getAvailableUnitsForSelect(index).length > 0 ? (
                                          getAvailableUnitsForSelect(index).map((unit) => (
                                            <SelectItem key={unit.id} value={unit.id}>
                                              {unit.property.propertyName} - {unit.unitNumber}
                                            </SelectItem>
                                          ))
                                        ) : (
                                          <SelectItem value="no-units" disabled>
                                            No available units
                                          </SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-3">
                              <FormField
                                control={form.control}
                                name={`units.${index}.rentAmount`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        className="h-8 text-sm bg-white"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-2">
                              <Badge variant="secondary" className="text-xs">
                                {watchedUnits[index]?.unitId ? 'Selected' : 'Pending'}
                              </Badge>
                            </div>

                            <div className="col-span-1">
                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeUnit(index)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {availableUnits.length <= selectedUnits.size && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      No more units available to add
                    </p>
                  )}
                </div>
              </form>
            </Form>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleDialogClose}
              disabled={isSubmitting}
              className="px-4 py-2 h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || fields.length === 0}
              onClick={form.handleSubmit(submitForm)}
              className="px-4 py-2 h-9 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Creating..." : "Create Lease"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
