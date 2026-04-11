import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

function imageFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed'));
  }
}

function documentFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'));
  }
}

export const uploadMiddleware = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const documentUploadMiddleware = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB for PDFs
  },
});

export const uploadSingle = (fieldName: string) => uploadMiddleware.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount = 10) =>
  uploadMiddleware.array(fieldName, maxCount);
export const uploadDocument = (fieldName: string) => documentUploadMiddleware.single(fieldName);
