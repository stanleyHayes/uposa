import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction, RequestHandler } from 'express';

const storage = multer.memoryStorage();

/**
 * Magic-byte (file-signature) validation. The MIME type sent by the client is
 * trivially spoofable, so after multer parses the upload we verify the actual
 * bytes match a real allowed format. Files are in memory (memoryStorage), so
 * `buffer` is available here.
 */
const FILE_SIGNATURES: Array<{ type: string; bytes: number[]; verify?: (b: Buffer) => boolean }> = [
  { type: 'jpeg', bytes: [0xff, 0xd8, 0xff] },
  { type: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: 'gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  // RIFF....WEBP — "WEBP" must appear at offset 8
  { type: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], verify: (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
  { type: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
];

function hasAllowedSignature(buffer: Buffer): boolean {
  return FILE_SIGNATURES.some((sig) => {
    if (sig.bytes.some((byte, i) => buffer[i] !== byte)) return false;
    return sig.verify ? sig.verify(buffer) : true;
  });
}

function collectFiles(req: Request): Express.Multer.File[] {
  const files: Express.Multer.File[] = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);
  else if (req.files) for (const key of Object.keys(req.files)) files.push(...(req.files as Record<string, Express.Multer.File[]>)[key]);
  return files;
}

export function verifyFileSignature(req: Request, res: Response, next: NextFunction): void {
  for (const file of collectFiles(req)) {
    if (!file.buffer || !hasAllowedSignature(file.buffer)) {
      res.status(400).json({ success: false, message: 'Uploaded file content does not match an allowed file type' });
      return;
    }
  }
  next();
}

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

// Each helper returns [multer parser, signature verifier]. Express flattens
// arrays of handlers, so existing `router.post(..., uploadSingle('x'), ...)`
// call sites pick up the magic-byte check automatically.
export const uploadSingle = (fieldName: string): RequestHandler[] => [uploadMiddleware.single(fieldName), verifyFileSignature];
export const uploadMultiple = (fieldName: string, maxCount = 10): RequestHandler[] => [uploadMiddleware.array(fieldName, maxCount), verifyFileSignature];
export const uploadDocument = (fieldName: string): RequestHandler[] => [documentUploadMiddleware.single(fieldName), verifyFileSignature];
