'use client'

import { useState, useEffect } from "react";
import { Unit, UnitFloor, FloorType } from "@prisma/client";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateUnitAndFloors } from "@/actions/new-units-update"; // Corrected import path

// Define a more specific type for the unit prop, including its floors
interface EditUnitDialogProps {
  unit: Unit & { unitFloors: UnitFloor[] };
}

// Define a type for the floor state to allow for partial data during editing
type EditableFloor = Partial<UnitFloor> & { tempId?: string };

// Define the shape of the floor data that the server action expects
type FloorData = {
    floorType: FloorType;
    area: number;
    rate: number;
    rent: number;
};

export function EditUnitDialog({ unit }: EditUnitDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State to manage the list of floors in the dialog
  const [floors, setFloors] = useState<EditableFloor[]>(
    // Add a temporary ID to each floor for key prop and manipulation
    unit.unitFloors.map(f => ({ ...f, tempId: f.id }))
  );

  // State to hold the calculated total area and rent
  const [totals, setTotals] = useState({ totalArea: 0, totalRent: 0 });
  const router = useRouter();

  // Recalculate totals whenever the floors state changes
  useEffect(() => {
    let totalArea = 0;
    let totalRent = 0;

    floors.forEach(floor => {
        const area = Number(floor.area) || 0;
        const rate = Number(floor.rate) || 0;
        totalArea += area;
        totalRent += area * rate;
    });
    
    setTotals({ totalArea, totalRent });
  }, [floors]);


  // Handler to update a specific floor's data
  const handleFloorChange = (index: number, field: keyof UnitFloor, value: string | number | FloorType) => {
    const newFloors = [...floors];
    const floorToUpdate = { ...newFloors[index], [field]: value };

    // Recalculate rent if area or rate changes
    if (field === 'area' || field === 'rate') {
      const area = Number(field === 'area' ? value : floorToUpdate.area) || 0;
      const rate = Number(field === 'rate' ? value : floorToUpdate.rate) || 0;
      floorToUpdate.rent = area * rate;
    }

    newFloors[index] = floorToUpdate;
    setFloors(newFloors);
  };

  // Handler to add a new empty floor
  const addFloor = () => {
    setFloors([
      ...floors,
      {
        tempId: `new-${Date.now()}`, // Unique temporary ID for the new floor
        floorType: FloorType.GROUND_FLOOR,
        area: 0,
        rate: 0,
        rent: 0,
      },
    ]);
  };

  // Handler to remove a floor
  const removeFloor = (index: number) => {
    const newFloors = floors.filter((_, i) => i !== index);
    setFloors(newFloors);
  };

  // Form submission handler
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    // Prepare floor data for submission, ensuring it matches the FloorData type
    const floorsToSubmit: FloorData[] = floors
      .filter(f => f.floorType != null) // Ensure floorType is not null or undefined
      .map(f => ({
        floorType: f.floorType!, // Use non-null assertion because we just filtered
        area: Number(f.area) || 0,
        rate: Number(f.rate) || 0,
        rent: (Number(f.area) || 0) * (Number(f.rate) || 0),
      }));

    // Optional: Add a validation check to ensure no floors were lost in filtering
    if (floorsToSubmit.length !== floors.length) {
        toast.error("A floor is missing its type. Please select a floor type for all items.");
        setIsLoading(false);
        return;
    }

    try {
      await updateUnitAndFloors(unit.id, floorsToSubmit);
      toast.success("Unit updated successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update unit.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Edit className="mr-2 h-4 w-4" />
          Edit Space
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Space {unit.unitNumber}</DialogTitle>
          <DialogDescription>
            Manage the floors for this unit. Total area and rent will be updated automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Floors</h3>
            <div className="space-y-4">
              {floors.map((floor, index) => (
                <div key={floor.tempId} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg relative">
                   <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 text-red-500 hover:text-red-700"
                      onClick={() => removeFloor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  <div className="space-y-2">
                    <Label>Floor Type</Label>
                    <Select
                      value={floor.floorType}
                      onValueChange={(value: FloorType) => handleFloorChange(index, 'floorType', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select floor" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(FloorType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Area (sqm)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={floor.area || ''}
                      onChange={(e) => handleFloorChange(index, 'area', e.target.value)}
                      placeholder="e.g., 50.5"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rate (per sqm)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={floor.rate || ''}
                      onChange={(e) => handleFloorChange(index, 'rate', e.target.value)}
                      placeholder="e.g., 800"
                      required
                    />
                  </div>
                   <div className="space-y-2">
                    <Label>Calculated Rent</Label>
                    <Input
                      type="text"
                      value={((Number(floor.area) || 0) * (Number(floor.rate) || 0)).toFixed(2)}
                      readOnly
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={addFloor}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Floor
            </Button>
          </div>

          <div className="mt-6 p-4 border-t space-y-3">
             <div className="flex justify-between items-center font-medium">
                <Label>Total Area (sqm):</Label>
                <span className="text-lg">{totals.totalArea.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center font-medium">
                <Label>Total Rent:</Label>
                <span className="text-lg font-bold">₱{totals.totalRent.toFixed(2)}</span>
             </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
