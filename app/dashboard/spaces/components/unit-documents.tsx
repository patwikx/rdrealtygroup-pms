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
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { getUnitDocuments } from "@/lib/data/units-get";
import { AddUnitDocumentDialog } from "./spaces-upload-document-dialog";

// It's good practice to define the shape of your data
interface Document {
  id: string;
  name: string;
  description?: string | null; // Optional or nullable
  fileUrl: string;
  documentType: string;
  createdAt: Date | string;
  uploadedBy: {
    firstName: string;
    lastName: string;
  };
}

interface UnitDocumentsProps {
  unitId: string;
  propertyId?: string;
}

export function UnitDocuments({ unitId, propertyId }: UnitDocumentsProps) {
  // 1. State to hold documents and loading status
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fetch data on the client side when the component mounts or unitId changes
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const data = await getUnitDocuments(unitId);
        setDocuments(data);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
        // Optionally, set an error state here to show in the UI
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [unitId]); // Re-run the effect if unitId changes

  // 3. Function to handle successful document upload
  const handleDocumentUploaded = (newDocument: Document) => {
    setDocuments(prevDocuments => [newDocument, ...prevDocuments]);
  };

  // 4. Function to refresh documents list (optional, for cases where you want to re-fetch)
  const refreshDocuments = async () => {
    try {
      const data = await getUnitDocuments(unitId);
      setDocuments(data);
    } catch (error) {
      console.error("Failed to refresh documents:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {/* Pass the callback function to the dialog */}
        <AddUnitDocumentDialog 
          unitId={unitId} 
          propertyId={propertyId}
          onDocumentUploaded={handleDocumentUploaded}
          onRefresh={refreshDocuments}
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
            {/* 3. Conditional rendering for loading state */}
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading documents...
                </TableCell>
              </TableRow>
            ) : documents.length > 0 ? (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {doc.description || "No description provided"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {doc.documentType.toLowerCase().replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>
                    {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                  </TableCell>
                  <TableCell>{format(new Date(doc.createdAt), "PPP")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Download ${doc.name}`}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
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