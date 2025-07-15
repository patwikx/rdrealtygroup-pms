'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloudIcon } from "lucide-react";
import { createDocument } from "@/actions/document";
import { DocumentType } from "@prisma/client";
import { FileUpload, UploadedFileDisplay } from "@/components/ui/file-upload";
import { useCurrentUser } from "@/hooks/use-current-user";

// Define the type for the uploaded file
type UploadedFile = {
  url: string;
  name: string;
};

interface AddTenantDocumentDialogProps {
  tenantId: string;
}

export function AddTenantDocumentDialog({
  tenantId,
}: AddTenantDocumentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [description, setDescription] = useState("");
  const router = useRouter();

  const currentUserId = useCurrentUser();

  const handleUploadComplete = (file: UploadedFile) => {
    setUploadedFile(file);
  };

  const handleUploadError = (error: string) => {
    toast.error(`Upload failed: ${error}`);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!uploadedFile) {
      toast.error("Please upload a file first.");
      return;
    }

    setIsSaving(true);

    try {
      await toast.promise(
        createDocument({
          name: uploadedFile.name,
          fileUrl: uploadedFile.url,
          documentType,
          tenantId, // Pass tenantId here
          propertyId: '', // Pass empty or null if not applicable
          uploadedById: currentUserId?.id || '', // Ensure currentUserId is defined
          description,
        }),
        {
          loading: "Saving document...",
          success: () => {
            router.refresh();
            setIsOpen(false);
            setUploadedFile(null);
            setDescription("");
            setDocumentType(DocumentType.OTHER);
            return "Document saved successfully!";
          },
          error: (err) => `Failed to save: ${err.message}`,
        }
      );
    } catch (error) {
      // The toast promise handles displaying the error
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open && !isSaving) {
      // Reset form state when dialog closes
      setUploadedFile(null);
      setDescription("");
      setDocumentType(DocumentType.OTHER);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
          onClick={() => setIsOpen(true)}
        >
          <UploadCloudIcon className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            Upload Tenant Document
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium text-slate-700">Document File</Label>
              {uploadedFile ? (
                <UploadedFileDisplay
                  file={uploadedFile}
                  onRemove={handleRemoveFile}
                  disabled={isSaving}
                />
              ) : (
                <FileUpload
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  disabled={isSaving}
                  maxSize={16}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType" className="font-medium text-slate-700">
                Document Type
              </Label>
              <Select
                name="documentType"
                value={documentType}
                onValueChange={(value) => setDocumentType(value as DocumentType)}
                disabled={isSaving}
              >
                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {Object.values(DocumentType).map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type.toLowerCase().replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="font-medium text-slate-700">
                Description (Optional)
              </Label>
              <Input
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Signed Lease Agreement"
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                disabled={isSaving}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogClose(false)}
              className="border-slate-300 hover:bg-slate-50"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !uploadedFile}
              className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Document"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}