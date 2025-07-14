'use client';

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UnitStatus, FloorType } from "@prisma/client";
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
import { Badge } from "@/components/ui/badge";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { unitSchema } from "@/lib/validations/unit-page-validation";
import { toast } from "sonner";
import z from "zod";
import { getProperties, getPropertyTitles, updateUnit } from "@/lib/data/units-get";

type UnitFormValues = z.infer<typeof unitSchema>;

type UnitWithFloors = {
  id: string;
  unitNumber: string;
  totalArea: number;
  totalRent: number;
  status: UnitStatus;
  propertyId: string;
  propertyTitleId: string | null;
  property: {
    propertyName: string;
  };
  unitFloors: {
    floorType: FloorType;
    area: number;
    rate: number;
    rent: number;
  }[];
};

interface EditUnitDialogProps {
  unit: UnitWithFloors;
}

const floorTypeDisplayMap: Record<FloorType, string> = {
  GROUND_FLOOR: "Ground Floor",
  MEZZANINE: "Mezzanine",
  SECOND_FLOOR: "Second Floor",
  THIRD_FLOOR: "Third Floor",
  ROOF_TOP: "Rooftop",
};

export function EditUnitDialog({ unit }: EditUnitDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Array<{ id: string; propertyName: string }>>([]);
  const [propertyTitles, setPropertyTitles] = useState<Array<{ id: string; titleNo: string; lotNo: string }>>([]);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      propertyId: unit.propertyId,
      propertyTitleId: unit.propertyTitleId || undefined,
      unitNumber: unit.unitNumber,
      status: unit.status,
      floors: unit.unitFloors.map(floor => ({
        floorType: floor.floorType,
        area: floor.area,
        rate: floor.rate,
        rent: floor.rent,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "floors",
  });

  // Load properties and property titles
  useEffect(() => {
    const loadData = async () => {
      try {
        const [propertiesData, titlesData] = await Promise.all([
          getProperties(),
          getPropertyTitles(unit.propertyId),
        ]);
        setProperties(propertiesData);
        setPropertyTitles(titlesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load form data');
      }
    };

    if (open) {
      loadData();
    }
  }, [open, unit.propertyId]);

  // Watch property changes to update property titles
  const watchedPropertyId = form.watch("propertyId");
  useEffect(() => {
    if (watchedPropertyId && watchedPropertyId !== unit.propertyId) {
      getPropertyTitles(watchedPropertyId).then(setPropertyTitles);
      form.setValue("propertyTitleId", undefined);
    }
  }, [watchedPropertyId, unit.propertyId, form]);

  const calculateRent = (area: number, rate: number) => {
    return area * rate;
  };

  const addFloor = () => {
    append({
      floorType: FloorType.GROUND_FLOOR,
      area: 0,
      rate: 0,
      rent: 0,
    });
  };

  const onSubmit = async (data: UnitFormValues) => {
    setIsSubmitting(true);
    try {
      await updateUnit(unit.id, data);
      toast.success("Unit updated successfully");
      setOpen(false);
    } catch (error) {
      console.error('Error updating unit:', error);
      toast.error("Failed to update unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Unit {unit.unitNumber}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.propertyName}
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
                  <FormItem>
                    <FormLabel>Property Title (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property title" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No specific title</SelectItem>
                        {propertyTitles.map((title) => (
                          <SelectItem key={title.id} value={title.id}>
                            {title.titleNo} - Lot {title.lotNo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unitNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter unit number" {...field} />
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(UnitStatus).map((status) => (
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
              </div>
            </div>

            {/* Floor Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Floor Configuration</h3>
                <Button type="button" variant="outline" size="sm" onClick={addFloor}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Floor
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Floor {index + 1}</Badge>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name={`floors.${index}.floorType`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Floor Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select floor type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(FloorType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {floorTypeDisplayMap[type]}
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
                          <FormLabel>Area (sqm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                const area = parseFloat(e.target.value) || 0;
                                field.onChange(area);
                                const rate = form.getValues(`floors.${index}.rate`);
                                const rent = calculateRent(area, rate);
                                form.setValue(`floors.${index}.rent`, rent);
                              }}
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
                          <FormLabel>Rate (₱/sqm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                const rate = parseFloat(e.target.value) || 0;
                                field.onChange(rate);
                                const area = form.getValues(`floors.${index}.area`);
                                const rent = calculateRent(area, rate);
                                form.setValue(`floors.${index}.rent`, rent);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`floors.${index}.rent`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rent (₱)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              disabled
                              className="bg-muted"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No floors configured. Add at least one floor to continue.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || fields.length === 0}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}