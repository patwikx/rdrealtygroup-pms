'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UtilityType } from "@prisma/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Plus } from "lucide-react";
import { utilityAccountSchema } from "@/lib/validations/unit-utility";
import { createUtilityAccount } from "@/lib/data/unit-utility";
import { Textarea } from "@/components/ui/textarea";

interface AddUtilityModalProps {
  unitId: string;
  onSuccess?: () => void;
}

export function AddUtilityModal({ unitId, onSuccess }: AddUtilityModalProps) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(utilityAccountSchema),
    defaultValues: {
      utilityType: undefined,
      accountNumber: "",
      meterNumber: "",
      billingId: "",
      remarks: "",
    },
  });

  async function onSubmit(data: any) {
    try {
      await createUtilityAccount({
        ...data,
        unitId,
      });
      toast.success("Utility account created successfully");
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create utility account");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Utility Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Utility Account</DialogTitle>
          <DialogDescription>
            Create a new utility account for this space
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="utilityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Utility Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select utility type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(UtilityType).map((type) => (
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
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
                        <FormField
              control={form.control}
              name="billingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="meterNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meter Number (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank if no meter is installed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />            <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormDescription>
                  Leave blank if no remarks are needed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Account</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}