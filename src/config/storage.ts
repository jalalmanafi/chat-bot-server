import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !BUCKET_NAME) {
  logger.warn('⚠️ Cloudflare R2 credentials not configured. File uploads will be disabled.');
}

const r2 = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY ? new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
}) : null;

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string = 'receipts'
): Promise<{ url: string; filename: string }> => {
  if (!r2 || !BUCKET_NAME) {
    throw new Error('File storage not configured');
  }

  const filename = `${folder}/${Date.now()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await r2.send(command);

  const publicUrl = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${filename}`
    : `https://${BUCKET_NAME}.r2.dev/${filename}`;

  logger.info('✅ File uploaded successfully', { filename });
  return { url: publicUrl, filename };
};

export const getFileUrl = async (filename: string): Promise<string> => {
  if (!r2 || !BUCKET_NAME) {
    throw new Error('File storage not configured');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
  });

  const url = await getSignedUrl(r2, command, { expiresIn: 3600 });
  return url;
};

export const deleteFile = async (filename: string): Promise<void> => {
  if (!r2 || !BUCKET_NAME) {
    throw new Error('File storage not configured');
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
  });

  await r2.send(command);
  logger.info('🗑️ File deleted successfully', { filename });
};