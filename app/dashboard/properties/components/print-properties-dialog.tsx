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
import { Printer, FileText, Loader2, Sparkles, Palette } from 'lucide-react';
import { PropertyWithRelations } from '@/types';
import { toast } from 'sonner';
import { 
  generatePrintData, 
  generateMultiplePropertiesPrintData, 
  printDocument 
} from '@/lib/data/print-properties-utils';

interface PropertyPrintDialogProps {
  properties: PropertyWithRelations[];
}

export function PropertyPrintDialog({ properties }: PropertyPrintDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printType, setPrintType] = useState<'all' | 'selected'>('all');
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

  const handlePrint = async () => {
    if (printType === 'selected' && selectedProperties.length === 0) {
      toast.error('Please select at least one property to print');
      return;
    }

    try {
      setIsPrinting(true);
      
      let printData;
      let title = '';

      if (printType === 'all') {
        printData = await generateMultiplePropertiesPrintData(properties);
        title = `All Properties Report (${properties.length} Properties)`;
      } else {
        const selectedPropertiesData = properties.filter(p => selectedProperties.includes(p.id));
        
        if (selectedPropertiesData.length === 1) {
          // Single property - detailed print
          printData = await generatePrintData(selectedPropertiesData[0]);
          title = `${selectedPropertiesData[0].propertyName} - Detailed Report`;
        } else {
          // Multiple selected properties
          printData = await generateMultiplePropertiesPrintData(selectedPropertiesData);
          title = `Selected Properties Report (${selectedPropertiesData.length} Properties)`;
        }
      }

      // Generate and print the document
      printDocument(printData, title);
      
      toast.success(
        `🖨️ Print document prepared successfully! Your browser's print dialog should open shortly.`,
        {
          duration: 4000,
        }
      );
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to prepare print document. Please check your popup blocker settings.');
      console.error('Print error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200a hover:text-green-800"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Properties
        
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-green-600" />
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
            Print Property Reports
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={printType}
            onValueChange={(value) => setPrintType(value as 'all' | 'selected')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="all" id="print-all" />
              <Label htmlFor="print-all" className="font-medium text-slate-700 cursor-pointer flex-1">
                Print All Properties ({properties.length} properties)
                <div className="text-xs text-slate-500 mt-1">
                  Comprehensive report with all property details
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="selected" id="print-selected" />
              <Label htmlFor="print-selected" className="font-medium text-slate-700 cursor-pointer flex-1">
                Print Selected Properties
                <div className="text-xs text-slate-500 mt-1">
                  Choose specific properties for detailed reports
                </div>
              </Label>
            </div>
          </RadioGroup>

          {printType === 'selected' && (
            <div className="space-y-4 border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-green-900">Select Properties</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-print"
                    checked={selectedProperties.length === properties.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all-print" className="text-sm text-green-700 cursor-pointer">
                    Select All
                  </Label>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {properties.map((property) => (
                  <div key={property.id} className="flex items-center space-x-2 p-2 rounded bg-white border border-green-100 hover:border-green-200 transition-colors">
                    <Checkbox
                      id={`print-${property.id}`}
                      checked={selectedProperties.includes(property.id)}
                      onCheckedChange={(checked) => 
                        handlePropertySelection(property.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`print-${property.id}`} 
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
                <div className="text-sm text-green-700 bg-white border border-green-200 rounded p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    <span className="font-medium">
                      {selectedProperties.length} of {properties.length} properties selected
                    </span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {selectedProperties.length === 1 
                      ? 'Single property report will include all detailed sections'
                      : 'Multiple properties report will include individual sections for each property'
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
            onClick={handlePrint}
            disabled={isPrinting}
            className="min-w-[160px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
          >
            {isPrinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Print...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}