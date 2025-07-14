'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UnitStatus } from "@prisma/client";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus,
  Hash,
  Ruler,
  DollarSign,
  Building2,
  CheckCircle2,
  Loader2,
  Home,
  FileText,
  MapPin,
  Check,
  ChevronsUpDown,
  Calculator,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import { unitSchema } from "@/lib/utils/validation";
import { createUnit } from "@/actions/units";
import { getPropertyTitles } from "@/actions/property-titles";
import { cn } from "@/lib/utils";
import z from "zod";

// Updated schema for multiple floors
const floorItemSchema = z.object({
  floorType: z.string().min(1, "Floor type is required"),
  area: z.number(),
  rate: z.number(),
});

const extendedUnitSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required"),
  status: z.nativeEnum(UnitStatus),
  propertyTitleId: z.string().optional(),
  floors: z.array(floorItemSchema).min(1, "At least one floor must be added"),
});

type UnitFormValues = z.infer<typeof extendedUnitSchema>;
type FloorItem = z.infer<typeof floorItemSchema>;

interface PropertyTitle {
  id: string;
  titleNo: string;
  lotNo: string;
  lotArea: number;
  registeredOwner: string;
  isEncumbered: boolean;
  encumbranceDetails: string;
}

interface AddUnitDialogProps {
  propertyId: string;
}

const floorOptions = [
  { value: "GROUND_FLOOR", label: "Ground Floor", icon: "🏢", short: "GF" },
  { value: "MEZZANINE", label: "Mezzanine", icon: "🏗️", short: "MZ" },
  { value: "SECOND_FLOOR", label: "Second Floor", icon: "🏬", short: "2F" },
  { value: "THIRD_FLOOR", label: "Third Floor", icon: "🏭", short: "3F" },
  { value: "ROOF_TOP", label: "Roof Top", icon: "🏔️", short: "RT" },
];

const statusConfig = {
  [UnitStatus.VACANT]: {
    label: "Vacant",
    variant: "default" as const,
    icon: "🟢",
  },
  [UnitStatus.OCCUPIED]: {
    label: "Occupied",
    variant: "secondary" as const,
    icon: "🔵",
  },
  [UnitStatus.MAINTENANCE]: {
    label: "Maintenance",
    variant: "destructive" as const,
    icon: "🟠",
  },
  [UnitStatus.RESERVED]: {
    label: "Reserved",
    variant: "outline" as const,
    icon: "🟣",
  },
};

export function AddUnitDialog({ propertyId }: AddUnitDialogProps) {
  const [open, setOpen] = useState(false);
  const [propertyTitles, setPropertyTitles] = useState<PropertyTitle[]>([]);
  const [titleComboboxOpen, setTitleComboboxOpen] = useState(false);
  
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(extendedUnitSchema),
    defaultValues: {
      status: UnitStatus.VACANT,
      floors: [{ floorType: "", area: 0, rate: 0 }],
      propertyTitleId: undefined,
    },
  });

  const { execute: fetchPropertyTitles, loading: isLoadingTitles } = useAsync(
    async () => {
      try {
        const titles = await getPropertyTitles(propertyId);
        setPropertyTitles(
          titles.map((t) => ({
            ...t,
            encumbranceDetails: t.encumbranceDetails ?? "",
          }))
        );
      } catch (error) {
        console.error('Error fetching property titles:', error);
        toast.error('Failed to load property titles');
      }
    }
  );

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && propertyTitles.length === 0) {
      fetchPropertyTitles();
    }
  };

  const { execute: submitForm, loading: isSubmitting } = useAsync(
    async (data: UnitFormValues) => {
      try {
        const formData = new FormData();
        formData.append("propertyId", propertyId);
        formData.append("unitNumber", data.unitNumber);
        formData.append("status", data.status);
        
        if (data.propertyTitleId) {
          formData.append("propertyTitleId", data.propertyTitleId);
        }

        formData.append("floors", JSON.stringify(data.floors));

        const totalArea = data.floors.reduce((sum, floor) => sum + floor.area, 0);
        const totalRent = data.floors.reduce((sum, floor) => sum + (floor.area * floor.rate), 0);
        
        formData.append("totalArea", totalArea.toString());
        formData.append("totalRent", totalRent.toString());

        await createUnit(formData);
        setOpen(false);
        form.reset();
        toast.success("Space created successfully");
      } catch (error) {
        toast.error("Failed to create space. Please try again.");
      }
    }
  );

  const watchedFloors = form.watch("floors");
  const selectedTitleId = form.watch("propertyTitleId");

  const totalArea = watchedFloors.reduce((sum, floor) => sum + (floor.area || 0), 0);
  const totalRent = watchedFloors.reduce((sum, floor) => sum + ((floor.area || 0) * (floor.rate || 0)), 0);

  const selectedTitle = propertyTitles.find(title => title.id === selectedTitleId);

  const getAvailableFloorOptions = (currentIndex: number) => {
    const selectedFloorTypes = watchedFloors
      .map((floor, index) => index !== currentIndex ? floor.floorType : null)
      .filter(Boolean);
    
    return floorOptions.filter(option => !selectedFloorTypes.includes(option.value));
  };

  const addFloor = () => {
    const currentFloors = form.getValues("floors");
    form.setValue("floors", [...currentFloors, { floorType: "", area: 0, rate: 0 }]);
  };

  const removeFloor = (index: number) => {
    const currentFloors = form.getValues("floors");
    if (currentFloors.length > 1) {
      form.setValue("floors", currentFloors.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="shadow-sm hover:shadow-md transition-all duration-200">
          <Plus className="h-4 w-4 mr-2" />
          Add Space
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg text-center font-semibold">Add New Rental Space</DialogTitle>
              <p className="text-sm text-center text-muted-foreground">
                Configure space details and floor-specific rates
              </p>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitForm)} className="space-y-5">
            {/* Basic Information */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="unitNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Space Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A-101" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Status
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs">{config.icon}</span>
                              <span>{config.label}</span>
                            </div>
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
                name="propertyTitleId"
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-2">
                    <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Property Title (optional)
                    </FormLabel>
                    <Popover open={titleComboboxOpen} onOpenChange={setTitleComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-9 justify-between text-sm",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoadingTitles}
                          >
                            {isLoadingTitles ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Loading...
                              </div>
                            ) : selectedTitle ? (
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-medium">{selectedTitle.titleNo}</span>
                                {selectedTitle.isEncumbered && (
                                  <Badge variant="secondary" className="text-xs px-1">
                                    Encumbered
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              "Select title..."
                            )}
                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search titles..." className="h-8" />
                          <CommandList className="max-h-[180px]">
                            <CommandEmpty className="py-4 text-center text-sm">
                              No titles found.
                            </CommandEmpty>
                            <CommandGroup>
                              {field.value && (
                                <CommandItem
                                  onSelect={() => {
                                    field.onChange(undefined);
                                    setTitleComboboxOpen(false);
                                  }}
                                  className="text-sm"
                                >
                                  Clear selection
                                </CommandItem>
                              )}
                              {propertyTitles.map((title) => (
                                <CommandItem
                                  key={title.id}
                                  onSelect={() => {
                                    field.onChange(title.id);
                                    setTitleComboboxOpen(false);
                                  }}
                                  className="text-sm"
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <Check
                                      className={cn(
                                        "h-3 w-3",
                                        field.value === title.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{title.titleNo}</span>
                                        {title.isEncumbered && (
                                          <Badge variant="secondary" className="text-xs px-1">
                                            Enc.
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        Lot {title.lotNo} • {title.lotArea.toLocaleString()} sqm
                                      </div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Floor Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Floor Configuration</h3>
                  <p className="text-xs text-muted-foreground">
                    Add floors with individual rates and areas
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFloor}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Floor
                </Button>
              </div>

              <div className="space-y-3">
                {watchedFloors.map((floor, index) => {
                  const availableOptions = getAvailableFloorOptions(index);
                  const selectedFloorOption = floorOptions.find(opt => opt.value === floor.floorType);
                  const floorRent = (floor.area || 0) * (floor.rate || 0);
                  
                  return (
                    <div
                      key={index}
                      className="border rounded-lg p-3 bg-muted/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {selectedFloorOption && (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              {selectedFloorOption.short}
                            </Badge>
                          )}
                          <span className="text-sm font-medium">
                            {selectedFloorOption ? selectedFloorOption.label : `Floor ${index + 1}`}
                          </span>
                        </div>
                        {watchedFloors.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFloor(index)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <FormField
                          control={form.control}
                          name={`floors.${index}.floorType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Floor Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="text-xs">
                                      <div className="flex items-center gap-2">
                                        <span>{option.icon}</span>
                                        <span>{option.label}</span>
                                      </div>
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
                          name={`floors.${index}.area`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Area (sqm)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="h-8 text-xs"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`floors.${index}.rate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Rate (₱/sqm)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="h-8 text-xs"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-1 mt-1">
                          <FormLabel className="text-xs">Floor Rent</FormLabel>
                          <div className={cn(
                            "h-8 px-2 border rounded-md bg-background text-xs font-mono flex items-center",
                            floorRent > 0 && "text-green-700 bg-green-50 border-green-200"
                          )}>
                            ₱{floorRent.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <FormField
                  control={form.control}
                  name="floors"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

{/* Summary */}
{totalArea > 0 && (
  <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg p-4 border">
    <div className="flex items-center gap-2 mb-3">
      <TrendingUp className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-medium">Space Summary</h3>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="text-center">
        <div className="text-xl font-bold text-primary">{totalArea.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">Total Area (sqm)</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-green-600">₱{totalRent.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">Monthly Rent</div>
      </div>
    </div>

    {watchedFloors.length > 1 && (
      <div className="pt-3 border-t border-white/50">
        <div className="text-xs font-medium mb-2">Breakdown:</div>
        <div className="space-y-1">
          {watchedFloors.map((floor, index) => {
            const floorOption = floorOptions.find(f => f.value === floor.floorType);
            if (!floorOption || !floor.area || !floor.rate) return null;

            const floorRent = floor.area * floor.rate;
            return (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs px-1 py-0">{floorOption.short}</Badge>
                  {floorOption.label}
                </span>
                <span className="font-mono">{`${floor.area} × ₱${floor.rate} = ₱${floorRent.toLocaleString()}`}</span>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
)}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || totalArea === 0}
                className="h-9 min-w-[100px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-2" />
                    Create Space
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}