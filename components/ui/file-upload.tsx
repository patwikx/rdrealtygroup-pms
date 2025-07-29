'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';

// MODIFIED: This is the data that the onUploadComplete callback will provide.
interface UploadCompleteResult {
  fileName: string; // The unique key from MinIO
  name: string;     // The original, user-friendly filename
}

interface FileUploadProps {
  onUploadComplete: (result: UploadCompleteResult) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  maxSize?: number; // in MB
  accept?: string;
  className?: string;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  disabled = false,
  maxSize = 16,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif',
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (disabled) return;

    if (file.size > maxSize * 1024 * 1024) {
      onUploadError(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }
      
      // MODIFIED: Handle the new API response shape
      if (result.success && result.fileName) {
        // Pass up both the unique fileName from the API and the original name
        onUploadComplete({
          fileName: result.fileName,
          name: file.name,
        });
      } else {
        throw new Error(result.error || 'Upload failed: Invalid server response');
      }
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFileSelect(files[0]);
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragOver && !disabled ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400',
          disabled && 'opacity-50 cursor-not-allowed',
          isUploading && 'pointer-events-none'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Uploading...</p>
              <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
              <p className="text-xs text-slate-500">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-8 w-8 text-slate-400 mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Drop files here or click to browse</p>
              <p className="text-xs text-slate-500">Maximum file size: {maxSize}MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// MODIFIED: The display component only needs the file's name.
interface UploadedFileDisplayProps {
  file: { name: string };
  onRemove: () => void;
  disabled?: boolean;
}

export function UploadedFileDisplay({
  file,
  onRemove,
  disabled = false,
}: UploadedFileDisplayProps) {
  return (
    <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <FileIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
        <span className="text-sm font-medium text-green-800 truncate">
          {file.name}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={disabled}
        className="text-slate-500 hover:text-slate-700 flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}