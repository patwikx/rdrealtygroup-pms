import { Client } from 'minio';

// MinIO client configuration
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 's3-api.rdrealty.com.ph',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
});

// Bucket name for documents
export const DOCUMENTS_BUCKET = process.env.MINIO_DOCUMENTS_BUCKET || 'pms-bucket';

// Initialize bucket if it doesn't exist (now creates a private bucket)
export async function initializeBucket() {
  try {
    const exists = await minioClient.bucketExists(DOCUMENTS_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(DOCUMENTS_BUCKET);
      console.log(`Bucket ${DOCUMENTS_BUCKET} created successfully.`);
    }
  } catch (error) {
    console.error('Error initializing MinIO bucket:', error);
  }
}

// Generate a unique filename
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const ext = originalName.split('.').pop();
  return `${timestamp}-${randomStr}.${ext}`;
}

/**
 * Generates a secure, temporary URL to access a private file.
 * @param fileName The name of the object in the bucket.
 * @returns A promise that resolves to the pre-signed URL string.
 */
export async function generatePresignedUrl(fileName: string): Promise<string> {
  try {
    // Set the expiration time for the URL (e.g., 5 minutes from now)
    const expiryInSeconds = 5 * 60;

    const url = await minioClient.presignedGetObject(
      DOCUMENTS_BUCKET,
      fileName,
      expiryInSeconds
    );
    return url;
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    throw new Error('Could not generate URL for the requested file.');
  }
}