import { minioClient, DOCUMENTS_BUCKET, generateFileName, initializeBucket } from '@/lib/minio';

export interface UploadResult {
  success: boolean;
  fileName?: string; // The function now returns the filename, not a direct URL.
  error?: string;
}

export async function uploadFileToMinio(formData: FormData): Promise<UploadResult> {
  try {
    // Initialize bucket if needed
    await initializeBucket();
    
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file size (16MB limit)
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size exceeds 16MB limit' };
    }

    // Validate file type (adjust as needed)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'File type not supported' };
    }

    // Generate unique filename
    const fileName = generateFileName(file.name);
    
    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Upload to MinIO
    await minioClient.putObject(
      DOCUMENTS_BUCKET,
      fileName,
      fileBuffer,
      file.size,
      {
        'Content-Type': file.type,
        // Using 'attachment' encourages the browser to download the file directly
        'Content-Disposition': `attachment; filename="${file.name}"`,
      }
    );

    // The function now returns the permanent filename.
    // To get a temporary download link, you'll use this filename 
    // to call `generatePresignedUrl` from your API when a user clicks a download button.
    return {
      success: true,
      fileName,
    };
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}