// components/download-document-button.tsx

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface DownloadDocumentButtonProps {
  fileName: string;
  docName: string; // The original name of the document for the downloaded file
}

export function DownloadDocumentButton({ fileName, docName }: DownloadDocumentButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Fetch the secure, temporary URL from your API route
      const response = await fetch(`/api/download/${fileName}`);
      
      if (!response.ok) {
        throw new Error('Could not get download link.');
      }
      
      const { url } = await response.json();

      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', docName); // This sets the name of the downloaded file
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Download failed.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleDownload} disabled={isDownloading} title={`Download ${docName}`}>
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}