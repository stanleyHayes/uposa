import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction, RequestHandler } from 'express';

const storage = multer.memoryStorage();

/** Cloudinary's free-plan maximum image size. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
/** PDFs/documents. */
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

export type DetectedFileType = 'jpeg' | 'png' | 'gif' | 'webp' | 'heic' | 'pdf';

const IMAGE_TYPES: DetectedFileType[] = ['jpeg', 'png', 'gif', 'webp', 'heic'];

// ISO-BMFF brands used by HEIC/HEIF stills (bytes 8–11, after "ftyp" at 4–7).
const HEIF_BRANDS = ['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1', 'heif'];

/**
 * Magic-byte (file-signature) validation. The MIME type sent by the client is
 * trivially spoofable, so after multer parses the upload we verify the actual
 * bytes match a real allowed format. Files are in memory (memoryStorage), so
 * `buffer` is available here.
 */
const FILE_SIGNATURES: Array<{ type: DetectedFileType; bytes: number[]; verify?: (b: Buffer) => boolean }> = [
  { type: 'jpeg', bytes: [0xff, 0xd8, 0xff] },
  { type: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: 'gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  // RIFF....WEBP — "WEBP" must appear at offset 8
  { type: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], verify: (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
  { type: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
];

/** Identify a file from its leading bytes; null when it is not an allowed format. */
export function detectFileType(buffer: Buffer | undefined): DetectedFileType | null {
  if (!buffer) return null;
  for (const sig of FILE_SIGNATURES) {
    if (sig.bytes.some((byte, i) => buffer[i] !== byte)) continue;
    if (sig.verify && !sig.verify(buffer)) continue;
    return sig.type;
  }
  // HEIC/HEIF: "ftyp" at offset 4 followed by a HEIF brand at offset 8.
  if (buffer.length >= 12 && buffer.toString('latin1', 4, 8) === 'ftyp' && HEIF_BRANDS.includes(buffer.toString('latin1', 8, 12))) {
    return 'heic';
  }
  return null;
}

function collectFiles(req: Request): Express.Multer.File[] {
  const files: Express.Multer.File[] = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);
  else if (req.files) for (const key of Object.keys(req.files)) files.push(...(req.files as Record<string, Express.Multer.File[]>)[key]);
  return files;
}

function signatureVerifier(allowed?: DetectedFileType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const file of collectFiles(req)) {
      const type = detectFileType(file.buffer);
      if (!type || (allowed && !allowed.includes(type))) {
        res.status(400).json({ success: false, message: 'Uploaded file content does not match an allowed file type' });
        return;
      }
    }
    next();
  };
}

/** Accepts any allowed format (images + PDF). */
export const verifyFileSignature = signatureVerifier();
/** Image routes: a PDF renamed to .png is rejected here. */
export const verifyImageSignature = signatureVerifier(IMAGE_TYPES);

// fileFilter rejections are plain Errors (not MulterErrors), so they carry a
// statusCode for the error middleware — otherwise they surface as a 500.
function rejectFile(cb: FileFilterCallback, message: string): void {
  cb(Object.assign(new Error(message), { statusCode: 400 }));
}

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

function imageFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (IMAGE_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    rejectFile(cb, 'Unsupported image type. Use JPEG, PNG, WEBP, GIF or HEIC.');
  }
}

function documentFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (file.mimetype === 'application/pdf' || IMAGE_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    rejectFile(cb, 'Unsupported file type. Use PDF, JPEG, PNG, WEBP, GIF or HEIC.');
  }
}

export const uploadMiddleware = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_BYTES,
  },
});

export const documentUploadMiddleware = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_BYTES,
  },
});

// Each helper returns [multer parser, signature verifier]. Express flattens
// arrays of handlers, so existing `router.post(..., uploadSingle('x'), ...)`
// call sites pick up the magic-byte check automatically.
export const uploadSingle = (fieldName: string): RequestHandler[] => [uploadMiddleware.single(fieldName), verifyImageSignature];
export const uploadMultiple = (fieldName: string, maxCount = 10): RequestHandler[] => [uploadMiddleware.array(fieldName, maxCount), verifyImageSignature];
export const uploadDocument = (fieldName: string): RequestHandler[] => [documentUploadMiddleware.single(fieldName), verifyFileSignature];
