'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TitleMovementStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { updateTitleMovementStatus } from "@/actions/title-movement";

interface UpdateTitleStatusDialogProps {
  titleMovementId: string;
  currentStatus: TitleMovementStatus;
}

export function UpdateTitleStatusDialog({
  titleMovementId,
  currentStatus,
}: UpdateTitleStatusDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(status: TitleMovementStatus) {
    setIsSubmitting(true);

    try {
      const result = await updateTitleMovementStatus(
        titleMovementId,
        status,
        status === "RETURNED" ? new Date() : undefined
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Title movement status updated successfully");
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update title movement status");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Update Status
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Title Movement Status</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Select
            defaultValue={currentStatus}
            onValueChange={(value) => onSubmit(value as TitleMovementStatus)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TitleMovementStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isSubmitting && (
            <div className="flex items-center justify-center mt-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Updating status...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}