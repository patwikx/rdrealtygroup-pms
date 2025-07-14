'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PropertyType } from "@prisma/client";
import { propertySchema } from "@/lib/utils/validation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsync } from "@/hooks/use-async";
import { toast } from "sonner";
import { z } from "zod";
import { createProperty } from "@/actions/property";
import { Building2, Upload, Home, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PropertyCSVImport } from "./property-csv-import";

type PropertyFormValues = z.infer<typeof propertySchema>;

const defaultValues: Partial<PropertyFormValues> = {
  propertyType: PropertyType.RESIDENTIAL,
};

export function PropertyForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("form");

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues,
  });

  const { execute: submitForm, loading: isSubmitting } = useAsync(
    async (data: PropertyFormValues) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      await createProperty(formData);
      router.push("/dashboard/properties");
      router.refresh();
    },
    {
      onSuccess: () => {
        toast.success("Property has been created successfully.");
      },
      onError: (error) => {
        toast.error(error.message || "Something went wrong. Please try again.");
      },
    }
  );

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
          <TabsTrigger
            value="form"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Single Property
          </TabsTrigger>
          <TabsTrigger
            value="import"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <Home className="h-6 w-6 text-slate-600" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(submitForm)} className="space-y-8">
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="propertyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">
                              Property Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter property name"
                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="propertyCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">
                              Property Code <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter property code"
                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="leasableArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">
                              Leasable Area (sqm) <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter leasable area"
                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
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
                        name="propertyType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">
                              Property Type <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                                  <SelectValue placeholder="Select property type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white border-slate-200">
                                {Object.values(PropertyType).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type.charAt(0) + type.slice(1).toLowerCase()}
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

                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Address Information</h3>
                    </div>
                    <Separator className="bg-slate-200" />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">
                            Address <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter complete address"
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard/properties")}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? "Creating..." : "Create Property"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <PropertyCSVImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}