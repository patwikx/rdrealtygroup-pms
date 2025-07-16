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

// Define the document type to match the parent component
interface Document {
  id: string;
  name: string;
  description?: string | null;
  fileUrl: string;
  documentType: string;
  createdAt: Date | string;
  uploadedBy: {
    firstName: string;
    lastName: string;
  };
}

interface AddUnitDocumentDialogProps {
  unitId: string;
  propertyId?: string;
  onDocumentUploaded?: (document: Document) => void;
  onRefresh?: () => void;
}

export function AddUnitDocumentDialog({
  unitId,
  propertyId,
  onDocumentUploaded,
  onRefresh,
}: AddUnitDocumentDialogProps) {
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
      const result = await createDocument({
        name: uploadedFile.name,
        fileUrl: uploadedFile.url,
        documentType,
        tenantId: '', // Pass empty for unit documents
        propertyId: propertyId || '', // Pass propertyId if available
        unitId, // Pass unitId for unit documents
        uploadedById: currentUserId?.id || '', // Ensure currentUserId is defined
        description,
      });

      // If the createDocument action returns the created document, use it
      // Otherwise, create a document object with the data we have
      const newDocument: Document = result || {
        id: Date.now().toString(), // Temporary ID if not returned
        name: uploadedFile.name,
        description,
        fileUrl: uploadedFile.url,
        documentType,
        createdAt: new Date().toISOString(),
        uploadedBy: {
          firstName: currentUserId?.firstName || 'Unknown',
          lastName: currentUserId?.lastName || 'User',
        },
      };

      // Call the callback to update the parent component's state
      if (onDocumentUploaded) {
        onDocumentUploaded(newDocument);
      } else if (onRefresh) {
        // Fallback to refreshing the list
        onRefresh();
      }

      // Show success message
      toast.success("Document saved successfully!");
      
      // Close dialog and reset form
      setIsOpen(false);
      setUploadedFile(null);
      setDescription("");
      setDocumentType(DocumentType.OTHER);
      
      // Optional: still refresh the router for other parts of the app
      router.refresh();
    } catch (error) {
      toast.error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            Upload Unit Document
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
                placeholder="E.g., Unit Inspection Report"
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