import { Client } from 'minio';

// MinIO client configuration
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
});

// Bucket name for documents
export const DOCUMENTS_BUCKET = process.env.MINIO_DOCUMENTS_BUCKET || 'documents';

// Initialize bucket if it doesn't exist
export async function initializeBucket() {
  try {
    const exists = await minioClient.bucketExists(DOCUMENTS_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(DOCUMENTS_BUCKET);
      
      // Set bucket policy to allow public read access (adjust as needed)
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${DOCUMENTS_BUCKET}/*`],
          },
        ],
      };
      
      await minioClient.setBucketPolicy(DOCUMENTS_BUCKET, JSON.stringify(policy));
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

// Get the public URL for a file
export function getFileUrl(fileName: string): string {
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || '9000';
  const useSSL = process.env.MINIO_USE_SSL === 'true';
  const protocol = useSSL ? 'https' : 'http';
  const portStr = (useSSL && port === '443') || (!useSSL && port === '80') ? '' : `:${port}`;
  
  return `${protocol}://${endpoint}${portStr}/${DOCUMENTS_BUCKET}/${fileName}`;
}