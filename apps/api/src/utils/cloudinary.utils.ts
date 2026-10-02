import crypto from 'crypto';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { detectFileType } from '../middleware/upload.middleware';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

if (!isCloudinaryConfigured() && env.NODE_ENV !== 'test') {
  logger.warn('CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are not set — uploads will fail with 503');
}

/**
 * Cloudinary rejects with a plain object ({ message, http_code }) rather than an
 * Error with a statusCode, which the error middleware would turn into an opaque
 * 500. Wrap it as an operational 502 that names the upstream reason.
 */
export function toUploadError(error: unknown, label = 'Image upload failed'): Error & { statusCode: number } {
  const reason = (error as { message?: string } | undefined)?.message || 'unknown error';
  return Object.assign(new Error(`${label}: ${reason}`), { statusCode: 502 });
}

async function uploadBuffer(buffer: Buffer, options: UploadApiOptions, label?: string): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw Object.assign(new Error('Image uploads are not configured on the server'), { statusCode: 503 });
  }
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        logger.error({ err: error }, 'Cloudinary upload failed');
        reject(toUploadError(error, label));
      } else if (result) {
        resolve(result.secure_url);
      } else {
        reject(toUploadError({ message: 'Cloudinary returned no result' }, label));
      }
    });
    uploadStream.end(buffer);
  });
}

export async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  return uploadBuffer(file.buffer, {
    folder: `uposa/${folder}`,
    resource_type: 'image',
    // Most browsers can't display HEIC/HEIF — store a JPEG rendition instead.
    ...(detectFileType(file.buffer) === 'heic' ? { format: 'jpg' } : {}),
  });
}

/**
 * PDFs go up as `raw` (Cloudinary restricts PDF delivery for the image type);
 * images reuse the image path. The type comes from the magic bytes, never the
 * client-supplied filename. Returns the absolute secure_url.
 */
export async function uploadDocumentToCloudinary(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  const type = detectFileType(file.buffer);
  if (type === 'pdf') {
    return uploadBuffer(file.buffer, {
      folder: `uposa/${folder}`,
      resource_type: 'raw',
      // Raw assets are served by extension, so keep `.pdf` in the public_id.
      public_id: `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.pdf`,
    }, 'Document upload failed');
  }
  if (type) return uploadToCloudinary(file, folder);
  throw Object.assign(new Error('Uploaded file content does not match an allowed file type'), { statusCode: 400 });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
