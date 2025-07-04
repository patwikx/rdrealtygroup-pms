'use client'

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from '@/lib/utils';

type OpportunityLossSummary = {
  vacantUnits: number;
  vacantArea: number;
  monthlyLoss: number;
  annualLoss: number;
};

export function OpportunityLossCard({ summary }: { summary: OpportunityLossSummary }) {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      
      // Fetch the CSV file
      const response = await fetch('/api/reports/opportunity-loss');
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a link element
      const a = document.createElement('a');
      a.href = url;
      a.download = `opportunity_loss_report_${new Date().toISOString().slice(0, 10)}.csv`;
      
      // Append the link to the body
      document.body.appendChild(a);
      
      // Click the link to start the download
      a.click();
      
      // Remove the link from the body
      document.body.removeChild(a);
      
      // Release the blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Opportunity Loss
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(summary.monthlyLoss)}/month
        </div>
        <p className="text-xs text-muted-foreground">
          {summary.vacantUnits} vacant spaces ({summary.vacantArea.toFixed(1)} sqm)
        </p>
        <div className="mt-4">
       <Button asChild className='w-full'>
          <a href="/dashboard/reports/opportunity-loss">
            View Detailed Opportunity Loss
          </a>
        </Button>
        </div>
      </CardContent>
    </Card>
  );
}