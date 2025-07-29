'use client';

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { getUnitDocuments } from "@/lib/data/units-get";
import { AddUnitDocumentDialog } from "./spaces-upload-document-dialog";
import { DownloadDocumentButton } from "@/components/download-file-button";
// MODIFIED: Import the new download button


// MODIFIED: The Document type now uses fileName
interface Document {
  id: string;
  name: string;
  description?: string | null;
  fileUrl: string; // Changed from fileUrl
  documentType: string;
  createdAt: Date | string;
  uploadedBy: {
    firstName: string | null;
    lastName: string | null;
  };
}

interface UnitDocumentsProps {
  unitId: string;
  propertyId?: string;
}

export function UnitDocuments({ unitId, propertyId }: UnitDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await getUnitDocuments(unitId);
      setDocuments(data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [unitId]);

  // This function optimistically adds the new document to the UI
  const handleDocumentUploaded = (newDocument: Document) => {
    setDocuments(prevDocuments => [newDocument, ...prevDocuments]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddUnitDocumentDialog 
          unitId={unitId} 
          propertyId={propertyId}
          onDocumentUploaded={handleDocumentUploaded}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-1/4">Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Loading documents...
                </TableCell>
              </TableRow>
            ) : documents.length > 0 ? (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {doc.description || "No description"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {doc.documentType.toLowerCase().replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>
                    {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                  </TableCell>
                  <TableCell>{format(new Date(doc.createdAt), "PPP")}</TableCell>
                  <TableCell>
                    {/* MODIFIED: Use the new secure download button */}
                    <DownloadDocumentButton 
                      fileName={doc.fileUrl} 
                      docName={doc.name} 
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No documents found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}