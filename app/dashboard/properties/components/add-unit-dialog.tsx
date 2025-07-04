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
import { toast } from "sonner";
import {
  Plus,
  Hash,
  Ruler,
  DollarSign,
  Building,
  CheckCircle2,
  Loader2,
  Home,
  FileText,
  MapPin,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import { unitSchema } from "@/lib/utils/validation";
import { createUnit } from "@/actions/units";
import { getPropertyTitles } from "@/actions/property-titles";
import { cn } from "@/lib/utils";
import z from "zod";

const extendedUnitSchema = unitSchema.extend({
  floor: z.string().min(1, "Floor location is required"),
  propertyTitleId: z.string().optional(),
});

type UnitFormValues = z.infer<typeof extendedUnitSchema>;

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
  { value: "isFirstFloor", label: "Ground Floor", icon: "🏢" },
  { value: "isSecondFloor", label: "Second Floor", icon: "🏬" },
  { value: "isThirdFloor", label: "Third Floor", icon: "🏭" },
  { value: "isRoofTop", label: "Roof Top", icon: "🏔️" },
  { value: "isMezzanine", label: "Mezzanine", icon: "🏗️" },
];

const statusConfig = {
  [UnitStatus.VACANT]: {
    label: "Vacant",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800",
    icon: "🟢",
  },
  [UnitStatus.OCCUPIED]: {
    label: "Occupied",
    color: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800",
    icon: "🔵",
  },
  [UnitStatus.MAINTENANCE]: {
    label: "Under Maintenance",
    color: "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800",
    icon: "🟠",
  },
  [UnitStatus.RESERVED]: {
    label: "Reserved",
    color: "text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950 dark:border-purple-800",
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
      floor: "",
      unitArea: 0,
      unitRate: 0,
      rentAmount: 0,
      propertyTitleId: undefined,
    },
  });

  // Use useAsync for fetching property titles
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

  // Handle dialog open - fetch titles when needed
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
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });

        // Set the correct boolean flag for the selected floor
        const selectedFloor = floorOptions.find(opt => opt.value === data.floor);
        if (selectedFloor) {
            formData.append(selectedFloor.value, "true");
        }

        await createUnit(formData);
        setOpen(false);
        form.reset();
        toast.success("Space has been created successfully");
      } catch (error) {
        toast.error("Failed to create space. Please try again.");
      }
    }
  );

  const calculateRentAmount = (area: number, rate: number) => {
    const rentAmount = area * rate;
    form.setValue("rentAmount", rentAmount);
  };

  const watchedArea = form.watch("unitArea");
  const watchedRate = form.watch("unitRate");
  const watchedRent = form.watch("rentAmount");
  const selectedTitleId = form.watch("propertyTitleId");

  // Find the selected title for display
  const selectedTitle = propertyTitles.find(title => title.id === selectedTitleId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="shadow-sm hover:shadow-md transition-all duration-200">
          <Plus className="h-4 w-4 mr-2" />
          Add Space
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col items-center text-center">
            <div className="bg-primary/10 p-3 rounded-full">
                <Home className="h-6 w-6 text-primary" />
            </div>
          <DialogTitle className="text-xl font-semibold">
            Add New Rental Space
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Enter the details of the new space below.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitForm)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Property Title Selection with Command */}
              <FormField
                control={form.control}
                name="propertyTitleId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      Property Title
                    </FormLabel>
                    <Popover open={titleComboboxOpen} onOpenChange={setTitleComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-between h-10 px-3 py-2 text-sm",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoadingTitles}
                            onClick={() => setTitleComboboxOpen(!titleComboboxOpen)}
                          >
                            {isLoadingTitles ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading titles...
                              </div>
                            ) : selectedTitle ? (
                              <div className="flex items-center gap-2 truncate">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="font-medium">{selectedTitle.titleNo}</span>
                                {selectedTitle.isEncumbered && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded flex-shrink-0">
                                    Encumbered
                                  </span>
                                )}
                              </div>
                            ) : (
                              "Select property title..."
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command className="w-full">
                          <CommandInput 
                            placeholder="Search property titles..." 
                            className="h-9"
                          />
                          <CommandList className="max-h-[200px]">
                            <CommandEmpty className="py-6 text-center text-sm">
                              {propertyTitles.length === 0 && !isLoadingTitles
                                ? "No property titles found."
                                : "No titles match your search."}
                            </CommandEmpty>
                            <CommandGroup>
                              {/* Option to clear selection */}
                              {field.value && (
                                <CommandItem
                                  onSelect={() => {
                                    field.onChange(undefined);
                                    setTitleComboboxOpen(false);
                                  }}
                                  className="hover:bg-muted cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-4 w-4" />
                                    <span>Clear selection</span>
                                  </div>
                                </CommandItem>
                              )}
                              {propertyTitles.map((title) => (
                                <CommandItem
                                  key={title.id}
                                  onSelect={() => {
                                    field.onChange(title.id);
                                    setTitleComboboxOpen(false);
                                  }}
                                  className="cursor-pointer hover:bg-accent"
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <Check
                                      className={cn(
                                        "h-4 w-4",
                                        field.value === title.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="font-medium truncate text-foreground">{title.titleNo}</span>
                                        {title.isEncumbered && (
                                          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded flex-shrink-0">
                                            Encumbered
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-foreground ml-5 truncate">
                                        Lot {title.lotNo} • {title.lotArea.toLocaleString()} sqm • {title.registeredOwner}
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

              {/* Unit Number */}
              <FormField
                control={form.control}
                name="unitNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5" />
                      Space Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A-101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Floor Location */}
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5" />
                      Floor
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select floor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {floorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
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

              {/* Area */}
              <FormField
                control={form.control}
                name="unitArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Ruler className="h-3.5 w-3.5" />
                      Area (sqm)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          const area = parseFloat(e.target.value);
                          field.onChange(area);
                          const rate = form.getValues("unitRate");
                          if (rate) calculateRentAmount(area, rate);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rate */}
              <FormField
                control={form.control}
                name="unitRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate (₱/sqm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          const rate = parseFloat(e.target.value);
                          field.onChange(rate);
                          const area = form.getValues("unitArea");
                          if (area) calculateRentAmount(area, rate);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Status
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <span>{config.icon}</span>
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
            </div>

            {/* Monthly Rent */}
            <FormField
              control={form.control}
              name="rentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5" />
                    Monthly Rent (₱)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        className={cn(
                          "font-mono text-lg transition-all duration-200",
                          watchedRent > 0 &&
                            "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-400"
                        )}
                        {...field}
                        disabled
                      />
                      {watchedRent > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  {watchedArea && watchedRate ? (
                    <p className="text-xs text-muted-foreground">
                      {watchedArea} sqm × ₱{watchedRate} = ₱
                      {(watchedArea * watchedRate).toLocaleString()}
                    </p>
                  ) : <p className="text-xs text-muted-foreground">Calculated automatically</p>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
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