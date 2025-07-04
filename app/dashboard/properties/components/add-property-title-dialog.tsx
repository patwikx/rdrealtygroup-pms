'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  FileText, 
  MapPin, 
  Ruler, 
  User, 
  AlertTriangle,
  Shield,
  CheckCircle2,
  Loader2,
  Building
} from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import { propertyTitleSchema } from "@/lib/utils/validation";
import { createPropertyTitle } from "@/actions/property-titles";
import { toast } from "sonner";
import z from "zod";

type PropertyTitleFormValues = z.infer<typeof propertyTitleSchema>;

interface AddPropertyTitleDialogProps {
  propertyId: string;
}

export function AddPropertyTitleDialog({ propertyId }: AddPropertyTitleDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<PropertyTitleFormValues>({
    resolver: zodResolver(propertyTitleSchema),
    defaultValues: {
      titleNo: "",
      lotNo: "",
      lotArea: 0,
      registeredOwner: "",
      isEncumbered: false,
      encumbranceDetails: "",
    },
  });

  const isEncumbered = form.watch("isEncumbered");

  const { execute: submitForm, loading: isSubmitting } = useAsync(
    async (data: PropertyTitleFormValues) => {
      try {
        const formData = new FormData();
        formData.append("propertyId", propertyId);
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });

        await createPropertyTitle(formData);
        setOpen(false);
        form.reset();
        toast.success("Property title has been created successfully");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create property title. Please try again.");
      }
    }
  );

  const handleCancel = () => {
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-sm hover:shadow-md transition-shadow">
          <Plus className="h-4 w-4 mr-2" />
          Add Property Title
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center w-full text-center">
                <DialogTitle className="text-xl font-semibold">Add New Property Title</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                    Create a new property title record with ownership details
                </p>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitForm)} className="space-y-6">
            {/* Title Information Section */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="titleNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Title Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., TCT-123456" 
                          className="focus:ring-2 focus:ring-primary/20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lotNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Lot Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Lot 1, Block 2" 
                          className="focus:ring-2 focus:ring-primary/20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Property Details Section */}
            <div className="space-y-4">

              <FormField
                control={form.control}
                name="lotArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      Lot Area (sqm)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter lot area"
                          className="focus:ring-2 focus:ring-primary/20 pr-12"
                          {...field}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          sqm
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registeredOwner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Registered Owner
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter registered owner name" 
                        className="focus:ring-2 focus:ring-primary/20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Encumbrance Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Shield className="h-4 w-4" />
                Encumbrance Status
              </div>

              <FormField
                control={form.control}
                name="isEncumbered"
                render={({ field }) => (
                  <FormItem>
                    <div className={`rounded-lg border-2 p-4 transition-colors ${
                      isEncumbered 
                        ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20' 
                        : 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <FormLabel className="text-base font-medium">
                              Property is encumbered
                            </FormLabel>
                            <Badge variant={isEncumbered ? "destructive" : "default"} className="text-xs">
                              {isEncumbered ? (
                                <>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Encumbered
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Clear
                                </>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Check this if the property has mortgages, liens, or other legal encumbrances
                          </p>
                        </div>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {isEncumbered && (
                <div className="space-y-3 pl-4 border-l-2 border-orange-200 dark:border-orange-800">
                  <FormField
                    control={form.control}
                    name="encumbranceDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                          <AlertTriangle className="h-4 w-4" />
                          Encumbrance Details
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide detailed information about the encumbrance:&#10;• Type of encumbrance (mortgage, lien, etc.)&#10;• Financial institution or creditor name&#10;• Loan amount or obligation value&#10;• Registration date&#10;• Any other relevant details"
                            className="resize-none min-h-[120px] focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[140px] shadow-sm hover:shadow-md transition-shadow"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Title
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