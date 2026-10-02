import { describe, it, expect } from 'vitest';
import multer from 'multer';

import { detectFileType, verifyImageSignature, verifyFileSignature } from '../../src/middleware/upload.middleware';
import { errorMiddleware, multerErrorMessage } from '../../src/middleware/error.middleware';
import { env } from '../../src/config/env';
import { toUploadError, uploadToCloudinary } from '../../src/utils/cloudinary.utils';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
const PDF = Buffer.from('%PDF-1.7\n...');
const heif = (brand: string) => Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x18]), Buffer.from(`ftyp${brand}`, 'latin1'), Buffer.alloc(8)]);

function runMiddleware(mw: typeof verifyFileSignature, buffer: Buffer) {
  let status = 0;
  let nexted = false;
  const req = { file: { buffer } } as never;
  const res = {
    status(s: number) { status = s; return this; },
    json() { return this; },
  } as never;
  mw(req, res, () => { nexted = true; });
  return { status, nexted };
}

function runErrorMiddleware(err: Error) {
  let status = 0;
  let body: Record<string, unknown> = {};
  const req = { method: 'POST', originalUrl: '/test' } as never;
  const res = {
    status(s: number) { status = s; return this; },
    json(b: Record<string, unknown>) { body = b; return this; },
  } as never;
  errorMiddleware(err, req, res, () => undefined);
  return { status, body };
}

describe('detectFileType', () => {
  it('recognises the common image formats and PDF', () => {
    expect(detectFileType(PNG)).toBe('png');
    expect(detectFileType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
    expect(detectFileType(Buffer.from('GIF89a'))).toBe('gif');
    expect(detectFileType(Buffer.from('RIFF\x00\x00\x00\x00WEBP', 'latin1'))).toBe('webp');
    expect(detectFileType(PDF)).toBe('pdf');
  });

  it('recognises HEIC/HEIF by the ftyp brand', () => {
    for (const brand of ['heic', 'heix', 'hevc', 'mif1', 'msf1', 'heif']) {
      expect(detectFileType(heif(brand))).toBe('heic');
    }
  });

  it('rejects other ISO-BMFF files (e.g. MP4) and junk', () => {
    expect(detectFileType(heif('isom'))).toBeNull();
    expect(detectFileType(Buffer.from('<html><script>'))).toBeNull();
    expect(detectFileType(undefined)).toBeNull();
  });
});

describe('verifyImageSignature', () => {
  it('accepts HEIC uploads', () => {
    expect(runMiddleware(verifyImageSignature, heif('heic')).nexted).toBe(true);
  });

  it('rejects a PDF on an image route, while the document verifier accepts it', () => {
    expect(runMiddleware(verifyImageSignature, PDF)).toEqual({ status: 400, nexted: false });
    expect(runMiddleware(verifyFileSignature, PDF).nexted).toBe(true);
  });
});

describe('upload error → HTTP status mapping', () => {
  it('maps multer size errors to a friendly 400', () => {
    const r = runErrorMiddleware(new multer.MulterError('LIMIT_FILE_SIZE', 'image'));
    expect(r.status).toBe(400);
    expect(r.body.message).toBe('Image is too large (max 10MB)');
    expect(multerErrorMessage('LIMIT_FILE_SIZE', 'document')).toBe('File is too large (max 15MB)');
  });

  it('returns 400 (not 500) for a fileFilter type rejection', () => {
    const r = runErrorMiddleware(Object.assign(new Error('Unsupported image type. Use JPEG, PNG, WEBP, GIF or HEIC.'), { statusCode: 400 }));
    expect(r.status).toBe(400);
    expect(r.body.message).toMatch(/Unsupported image type/);
  });

  it('wraps Cloudinary plain-object errors as a 502 with the upstream reason', () => {
    const err = toUploadError({ message: 'Invalid image file', http_code: 400 });
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(502);
    expect(runErrorMiddleware(err)).toEqual({ status: 502, body: { success: false, message: 'Image upload failed: Invalid image file' } });
  });

  it('rejects with 503 when Cloudinary is not configured', async () => {
    const saved = env.CLOUDINARY_CLOUD_NAME;
    env.CLOUDINARY_CLOUD_NAME = '';
    try {
      await expect(uploadToCloudinary({ buffer: PNG } as Express.Multer.File, 'test')).rejects.toMatchObject({
        statusCode: 503,
        message: 'Image uploads are not configured on the server',
      });
    } finally {
      env.CLOUDINARY_CLOUD_NAME = saved;
    }
  });
});
