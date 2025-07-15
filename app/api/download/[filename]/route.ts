import { NextRequest, NextResponse } from 'next/server';
import { minioClient, DOCUMENTS_BUCKET } from '@/lib/minio';
import { Buffer } from 'buffer'; // Ensure Buffer is explicitly imported

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Get the file from MinIO
    const fileStream = await minioClient.getObject(DOCUMENTS_BUCKET, filename);
    
    // Get file info to determine content type and other metadata
    const fileInfo = await minioClient.statObject(DOCUMENTS_BUCKET, filename);
    
    // --- FIX ---
    // Declare chunks as an array of Uint8Array to resolve the type conflict.
    // Node.js Buffers are instances of Uint8Array, so this is type-safe.
    const chunks: Uint8Array[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Get original filename from metadata or use the stored filename
    const originalFilename = fileInfo.metaData?.['original-filename'] || filename;
    
    // Create response with the file's buffer
    const response = new NextResponse(buffer);
    
    // Set appropriate headers for a file download
    response.headers.set('Content-Type', fileInfo.metaData?.['content-type'] || 'application/octet-stream');
    response.headers.set('Content-Disposition', `attachment; filename="${originalFilename}"`);
    response.headers.set('Content-Length', buffer.length.toString());
    
    return response;
  } catch (error) {
    console.error('Error downloading file:', error);
    
    // Check if the error is a MinIO/S3 'Not Found' error
    if (error instanceof Error && (error as any).code === 'NoSuchKey') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Generic error for any other issues
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
