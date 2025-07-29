// app/api/download/[filename]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { minioClient, DOCUMENTS_BUCKET, generatePresignedUrl } from '@/lib/minio';
import { auth } from '@/auth'; // Assuming you use auth.js for security

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // --- SECURITY CHECK ---
    // Ensure the user is authenticated before allowing a download link to be generated.
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = params;
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Generate the secure, temporary download link from MinIO
    const presignedUrl = await generatePresignedUrl(filename);
    
    // Return the URL in a JSON object, as the client expects
    return NextResponse.json({ url: presignedUrl });

  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    
    // Check for specific MinIO errors if needed
    if (error instanceof Error && (error as any).code === 'NoSuchKey') {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to generate download link' },
      { status: 500 }
    );
  }
}