'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { TenantStatus } from "@prisma/client";
import { tenantSchema } from "@/lib/utils/validation";
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
import { createTenant } from "@/actions/tenants";
import { User, Building2, AlertCircle, Upload, UserPlus, Badge } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TenantCSVImport } from "./tenants-csv-import";

type TenantFormValues = z.infer<typeof tenantSchema>;

const defaultValues: Partial<TenantFormValues> = {
  status: TenantStatus.ACTIVE,
};

export function TenantForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("form");

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues,
  });

  const { execute: submitForm, loading: isSubmitting } = useAsync(
    async (data: TenantFormValues) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      await createTenant(formData);
      router.push("/dashboard/tenants");
      router.refresh();
    },
    {
      onSuccess: () => {
        toast.success("Tenant has been created successfully.");
      },
      onError: (error) => {
        toast.error(error.message || "Something went wrong. Please try again.");
      },
    }
  );

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
      {/* Header Section */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
          <TabsTrigger 
            value="form" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Single Tenant
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
                <User className="h-6 w-6 text-slate-600" />
                Tenant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(submitForm)} className="space-y-8">
                  {/* Basic Information Section */}
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="bpCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">
                              BP Code <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter BP code" 
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
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">
                              Status <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white border-slate-200">
                                {Object.values(TenantStatus).map((status) => (
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
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">
                              First Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter first name" 
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
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">
                              Last Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter last name" 
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
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">
                              Email <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter email address" 
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
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">
                              Phone <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter phone number" 
                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Company Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Company Information</h3>
                    </div>
                    <Separator className="bg-slate-200" />
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">
                              Company Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter company name" 
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
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">Business Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter business name" 
                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Emergency Contact Section */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Emergency Contact</h3>
                    </div>
                    <Separator className="bg-slate-200" />
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="emergencyContactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">Contact Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter contact name" 
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
                        name="emergencyContactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">Contact Phone</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter contact phone" 
                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard/tenants")}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? "Creating..." : "Create Tenant"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <TenantCSVImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}