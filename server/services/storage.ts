import { Storage } from '@google-cloud/storage';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Initialize Cloud Storage
const storage = new Storage({
  // In production, use service account key from environment
  // For local dev, uses default credentials or GOOGLE_APPLICATION_CREDENTIALS env var
  projectId: process.env.GCP_PROJECT_ID,
  ...(process.env.GCP_KEY_FILE && {
    keyFilename: process.env.GCP_KEY_FILE
  })
});

const bucketName = process.env.GCS_BUCKET_NAME || 'starstranslations-uploads';
const bucket = storage.bucket(bucketName);

export interface UploadResult {
  filename: string;
  originalFilename: string;
  url: string;
  size: number;
  mimetype: string;
}

/**
 * Upload file to Google Cloud Storage
 */
export async function uploadToCloudStorage(
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = `${folder}/${filename}`;

    // Create file in bucket
    const blob = bucket.file(filepath);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname
        }
      }
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        console.error('Upload error:', error);
        reject(new Error('Failed to upload file to Cloud Storage'));
      });

      blobStream.on('finish', async () => {
        // Make file publicly accessible
        await blob.makePublic();

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${filepath}`;

        resolve({
          filename,
          originalFilename: file.originalname,
          url: publicUrl,
          size: file.size,
          mimetype: file.mimetype
        });
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Cloud Storage upload error:', error);
    throw error;
  }
}

/**
 * Delete file from Google Cloud Storage
 */
export async function deleteFromCloudStorage(filepath: string): Promise<void> {
  try {
    await bucket.file(filepath).delete();
    console.log(`File ${filepath} deleted from Cloud Storage`);
  } catch (error) {
    console.error('Cloud Storage delete error:', error);
    throw error;
  }
}

/**
 * Get signed URL for private file access (optional, for future use)
 */
export async function getSignedUrl(filepath: string, expiresIn: number = 3600): Promise<string> {
  try {
    const [url] = await bucket.file(filepath).getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000
    });
    return url;
  } catch (error) {
    console.error('Cloud Storage signed URL error:', error);
    throw error;
  }
}

/**
 * Check if bucket exists and is accessible
 */
export async function checkBucketAccess(): Promise<boolean> {
  try {
    const [exists] = await bucket.exists();
    if (!exists) {
      console.warn(`⚠️  Bucket ${bucketName} does not exist. It will be created on first upload.`);
      return false;
    }
    console.log(`✅ Cloud Storage bucket "${bucketName}" is accessible`);
    return true;
  } catch (error) {
    console.error('❌ Cloud Storage bucket access error:', error);
    return false;
  }
}

/**
 * Create bucket if it doesn't exist (for setup)
 */
export async function createBucketIfNotExists(): Promise<void> {
  try {
    const [exists] = await bucket.exists();

    if (!exists) {
      console.log(`Creating bucket ${bucketName}...`);
      await storage.createBucket(bucketName, {
        location: process.env.GCS_BUCKET_LOCATION || 'US',
        storageClass: 'STANDARD',
        iamConfiguration: {
          uniformBucketLevelAccess: {
            enabled: true
          }
        }
      });
      console.log(`✅ Bucket ${bucketName} created successfully`);
    }
  } catch (error) {
    console.error('Error creating bucket:', error);
    throw error;
  }
}

export { storage, bucket, bucketName };
