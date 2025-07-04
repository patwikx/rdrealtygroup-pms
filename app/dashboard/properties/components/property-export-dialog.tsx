'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, FileSpreadsheet, Loader2, Sparkles, Palette } from 'lucide-react';
import { PropertyWithRelations } from '@/types';
import { toast } from 'sonner';
import { exportToExcel } from '@/lib/data/excel-export-properties-utils';
import { exportAllPropertiesDataEnhanced, exportPropertyDataEnhanced } from '@/actions/export-properties';

interface PropertyExportDialogProps {
  properties: PropertyWithRelations[];
}

export function PropertyExportDialog({ properties }: PropertyExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'all' | 'selected'>('all');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  const handlePropertySelection = (propertyId: string, checked: boolean) => {
    if (checked) {
      setSelectedProperties(prev => [...prev, propertyId]);
    } else {
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProperties(properties.map(p => p.id));
    } else {
      setSelectedProperties([]);
    }
  };

  const formatPropertyName = (name: string): string => {
    return name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
  };

  const handleExport = async () => {
    if (exportType === 'selected' && selectedProperties.length === 0) {
      toast.error('Please select at least one property to export');
      return;
    }

    try {
      setIsExporting(true);
      let worksheets: any[] = [];
      let filename = '';

      if (exportType === 'all') {
        worksheets = await exportAllPropertiesDataEnhanced(properties);
        const timestamp = new Date().toISOString().split('T')[0];
        filename = `All-Properties-Export-${timestamp}.xlsx`;
      } else {
        const selectedPropertiesData = properties.filter(p => selectedProperties.includes(p.id));
        
        if (selectedPropertiesData.length === 1) {
          // Single property - create detailed worksheets for that property
          worksheets = await exportPropertyDataEnhanced(selectedPropertiesData[0]);
          const timestamp = new Date().toISOString().split('T')[0];
          const propertyName = formatPropertyName(selectedPropertiesData[0].propertyName);
          filename = `${propertyName}-Export-${timestamp}.xlsx`;
        } else {
          // Multiple properties - create enhanced export for selected properties
          worksheets = await exportAllPropertiesDataEnhanced(selectedPropertiesData);
          const timestamp = new Date().toISOString().split('T')[0];
          filename = `Selected-Properties-Export-${timestamp}.xlsx`;
        }
      }

      if (worksheets.length === 0) {
        toast.error('No data available to export');
        return;
      }

      // Use the enhanced export function with beautiful formatting
      exportToExcel(worksheets, filename);
      
      toast.success(
        `🎉 Beautiful Excel export completed! Downloaded ${worksheets.length} professionally formatted worksheets.`,
        {
          duration: 4000,
        }
      );
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to export properties data');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:text-blue-800"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Properties
          
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
            Export Property Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={exportType}
            onValueChange={(value) => setExportType(value as 'all' | 'selected')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="font-medium text-slate-700 cursor-pointer flex-1">
                Export All Properties ({properties.length} properties)
                <div className="text-xs text-slate-500 mt-1">
                  Comprehensive export with consolidated data sheets
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="selected" id="selected" />
              <Label htmlFor="selected" className="font-medium text-slate-700 cursor-pointer flex-1">
                Export Selected Properties
                <div className="text-xs text-slate-500 mt-1">
                  Choose specific properties for detailed export
                </div>
              </Label>
            </div>
          </RadioGroup>

          {exportType === 'selected' && (
            <div className="space-y-4 border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-blue-900">Select Properties</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedProperties.length === properties.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm text-blue-700 cursor-pointer">
                    Select All
                  </Label>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {properties.map((property) => (
                  <div key={property.id} className="flex items-center space-x-2 p-2 rounded bg-white border border-blue-100 hover:border-blue-200 transition-colors">
                    <Checkbox
                      id={property.id}
                      checked={selectedProperties.includes(property.id)}
                      onCheckedChange={(checked) => 
                        handlePropertySelection(property.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={property.id} 
                      className="text-sm text-slate-700 cursor-pointer flex-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{property.propertyName}</span>
                        <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                          {property.propertyCode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {property.propertyType} • {property.units.length} units
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
              
              {selectedProperties.length > 0 && (
                <div className="text-sm text-blue-700 bg-white border border-blue-200 rounded p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">
                      {selectedProperties.length} of {properties.length} properties selected
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {selectedProperties.length === 1 
                      ? 'Single property export will include detailed worksheets for all data types'
                      : 'Multiple properties export will include consolidated summary sheets'
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="min-w-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}