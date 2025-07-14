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
import { Plus, Loader2, FileCheck, UploadCloud, Upload, UploadCloudIcon } from "lucide-react";
import { createDocument } from "@/actions/document";
import { DocumentType } from "@prisma/client";
import { UploadButton } from "@/lib/uploadthing";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useCurrentUser } from "@/hooks/use-current-user";

type UploadThingFile = {
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
  const [uploadedFile, setUploadedFile] = useState<UploadThingFile | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [description, setDescription] = useState("");
  const router = useRouter();

  const currentUserId = useCurrentUser();

  const handleUploadComplete = (res: UploadThingFile[]) => {
    if (res && res[0]) {
      setUploadedFile(res[0]);
      toast.success("File uploaded. Ready to save document details.");
    }
  };

  const handleUploadError = (error: Error) => {
    toast.error(`Upload failed: ${error.message}`);
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
            return "Document saved successfully!";
          },
          error: (err) => `Failed to save: ${err.message}`,
        }
      );
    } catch (error) {
      // Error is handled by the toast promise
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <UploadCloudIcon className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">Upload Tenant Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium text-slate-700">Document File</Label>
              {uploadedFile ? (
                <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-800 truncate">{uploadedFile.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)} className="text-slate-500 hover:text-slate-700">Change</Button>
                </div>
              ) : (
                <div className="flex flex-col items-center p-6 border-2 border-dashed border-slate-300 rounded-lg text-center bg-slate-50">
                  <UploadCloud className="h-10 w-10 text-slate-400 mb-4" />
                  <UploadButton<"documentUploader">
                    endpoint="documentUploader"
                    onClientUploadComplete={handleUploadComplete}
                    onUploadError={handleUploadError}
                    appearance={{
                      button: "bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md",
                      container: "w-full flex justify-center",
                    }}
                    content={{
                      button({ ready }) {
                        if (ready) return <div>Choose File</div>;
                        return "Getting ready...";
                      },
                      allowedContent({ ready, fileTypes, isUploading }) {
                        if (!ready) return null;
                        if (isUploading) return "Uploading..."
                        return `Drag & Drop or Click to Upload (Max 16MB)`;
                      },
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType" className="font-medium text-slate-700">Document Type</Label>
              <Select name="documentType" value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)} disabled={isSaving}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {Object.values(DocumentType).map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">{type.toLowerCase().replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="description" className="font-medium text-slate-700">Description (Optional)</Label>
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
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-slate-300 hover:bg-slate-50" disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving || !uploadedFile} className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white">
              {isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : ("Save Document")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
