'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload } from "lucide-react";
import { importPropertiesFromCSV } from "@/actions/property";

export function CSVImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }

      setFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const [headers, ...rows] = text.split('\n').map(row => row.trim()).filter(Boolean);
          
          if (!headers) {
            toast.error('The CSV file appears to be empty');
            setFile(null);
            return;
          }

          const headerArray = headers.split(',').map(h => h.trim());
          const requiredHeaders = [
        "propertyName",
        "propertyCode",
        "leasableArea",
        "address",
        "propertyType"
          ];

          const missingHeaders = requiredHeaders.filter(h => !headerArray.includes(h));
          if (missingHeaders.length > 0) {
            toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
            setFile(null);
            return;
          }

          const data = rows
            .filter(row => row.length > 0)
            .map(row => {
              const values = row.split(',').map(v => v.trim());
              return headerArray.reduce((obj, header, i) => {
                obj[header] = values[i];
                return obj;
              }, {} as any);
            });

          if (data.length === 0) {
            toast.error('No data found in the CSV file');
            setFile(null);
            return;
          }

          setPreview(data.slice(0, 5));
          toast.success('CSV file loaded successfully');
        } catch (error) {
          console.error('CSV parsing error:', error);
          toast.error('Failed to parse CSV file. Please check the format');
          setFile(null);
          setPreview([]);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read the file');
        setFile(null);
        setPreview([]);
      };

      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await importPropertiesFromCSV(formData);
      toast.success('Properties imported successfully');
      router.refresh();
      setFile(null);
      setPreview([]);
    } catch (error: any) {
      if (error.message.includes('duplicate property codes')) {
        toast.error('Import partially completed', {
          description: error.message,
          duration: 5000,
        });
      } else {
        toast.error('Failed to import properties', {
          description: 'Please check your CSV file and try again',
        });
      }
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    try {
      const headers = [
        "propertyName",
        "propertyCode",
        "leasableArea",
        "address",
        "propertyType"
      ].join(',');
      
      const blob = new Blob([headers], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'property-import-template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Import Properties from CSV</h3>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file containing property details for bulk import.
            </p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="flex-1"
          />
          <Button 
            onClick={handleImport} 
            disabled={!file || isLoading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isLoading ? "Importing..." : "Import"}
          </Button>
        </div>

        {preview.length > 0 && (
          <div className="space-y-4">
            <Alert>
              <AlertTitle>Preview</AlertTitle>
              <AlertDescription>
                Showing first 5 rows of the CSV file
              </AlertDescription>
            </Alert>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(preview[0]).map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row).map((value, j) => (
                        <TableCell key={j}>{String(value)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
