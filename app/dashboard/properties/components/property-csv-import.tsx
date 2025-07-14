'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { importPropertiesFromCSV } from "@/actions/property";

// Renamed for clarity to avoid confusion with other CSV import components
export function PropertyCSVImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a valid CSV file.');
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const [headers, ...rows] = text.split('\n').map(row => row.trim()).filter(Boolean);
          
          if (!headers) {
            toast.error('The CSV file appears to be empty or invalid.');
            setFile(null);
            return;
          }

          const headerArray = headers.split(',').map(h => h.trim());
          const requiredHeaders = ["propertyName", "propertyCode", "leasableArea", "address", "propertyType"];

          const missingHeaders = requiredHeaders.filter(h => !headerArray.includes(h));
          if (missingHeaders.length > 0) {
            toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
            setFile(null);
            setPreview([]);
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
            toast.error('No data rows found in the CSV file.');
            return;
          }
          
          setPreview(data.slice(0, 5));
        } catch (error) {
          console.error('CSV parsing error:', error);
          toast.error('Failed to parse CSV file. Please check its format.');
          setFile(null);
          setPreview([]);
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read the file.');
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await importPropertiesFromCSV(formData);
      toast.success('Properties have been imported successfully.');
      router.refresh();
      setFile(null);
      setPreview([]);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error("Failed to import properties.", {
        description: error.message || "Please check your CSV file and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Import Properties from CSV
            </h3>
            <p className="text-slate-600">
              Upload a CSV file containing property details for bulk import. Download the template to ensure proper formatting.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            className="border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="flex items-center gap-3 text-slate-900">
            <Upload className="h-6 w-6 text-slate-600" />
            File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <Button 
                onClick={handleImport} 
                disabled={!file || isLoading}
                className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isLoading ? "Importing..." : "Import"}
              </Button>
            </div>

            {file && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">{file.name}</p>
                  <p className="text-xs text-green-700">File selected and ready for import</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {preview.length > 0 && (
        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Data Preview</AlertTitle>
            <AlertDescription className="text-blue-800">
              Showing first 5 rows of the CSV file. Please review the data before importing.
            </AlertDescription>
          </Alert>
          
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    {Object.keys(preview[0]).map((header) => (
                      <TableHead key={header} className="font-semibold text-slate-700">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i} className="hover:bg-slate-50 transition-colors duration-150">
                      {Object.values(row).map((value, j) => (
                        <TableCell key={j} className="text-slate-900">
                          {value as React.ReactNode}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions Section */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="flex items-center gap-3 text-slate-900">
            <FileText className="h-6 w-6 text-slate-600" />
            Import Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Required CSV Columns
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 list-none pl-0">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <strong>propertyName:</strong> The name of the property.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <strong>propertyCode:</strong> A unique code for the property.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <strong>leasableArea:</strong> The total leasable area in square meters.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <strong>address:</strong> The full address of the property.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <strong>propertyType:</strong> Must be either <strong>RESIDENTIAL</strong> or <strong>COMMERCIAL</strong>.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}