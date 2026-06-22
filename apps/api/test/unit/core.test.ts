import { describe, it, expect } from 'vitest';

import { calculatePlatformFee } from '../../src/modules/payments/payments.service';
import { encrypt, decrypt } from '../../src/utils/crypto.utils';
import { signMemberToken, verifyMemberToken } from '../../src/utils/jwt.utils';
import { AppError, NotFoundError } from '../../src/utils/errors';
import { verifyFileSignature } from '../../src/middleware/upload.middleware';
import { loginSchema } from '../../src/modules/auth/auth.validation';

describe('calculatePlatformFee', () => {
  it('adds the percent fee on top so the payer covers it', () => {
    const r = calculatePlatformFee(120, { percent: 1, fixed: 0, enabled: true });
    expect(r.platformFee).toBe(1.2);
    expect(r.totalAmount).toBe(121.2);
  });

  it('combines percent + fixed', () => {
    const r = calculatePlatformFee(1000, { percent: 1, fixed: 5, enabled: true });
    expect(r.platformFee).toBe(15);
    expect(r.totalAmount).toBe(1015);
  });

  it('returns the original amount when disabled', () => {
    const r = calculatePlatformFee(100, { percent: 1, fixed: 0, enabled: false });
    expect(r.platformFee).toBe(0);
    expect(r.totalAmount).toBe(100);
  });
});

describe('crypto.utils', () => {
  it('round-trips encrypt/decrypt', () => {
    const secret = 'sk_live_super_secret_value';
    expect(decrypt(encrypt(secret))).toBe(secret);
  });

  it('uses a random IV (ciphertext differs each call)', () => {
    expect(encrypt('same input')).not.toBe(encrypt('same input'));
  });
});

describe('jwt.utils', () => {
  it('signs and verifies a member token, stamping the MEMBER role', () => {
    const token = signMemberToken({ id: 'user-1', email: 'a@b.com' });
    const payload = verifyMemberToken(token);
    expect(payload.id).toBe('user-1');
    expect(payload.role).toBe('MEMBER');
  });

  it('rejects a malformed token', () => {
    expect(() => verifyMemberToken('not.a.valid.token')).toThrow();
  });
});

describe('AppError hierarchy', () => {
  it('carries an HTTP status code', () => {
    expect(new AppError('boom', 503).statusCode).toBe(503);
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new NotFoundError()).toBeInstanceOf(AppError);
  });
});

describe('verifyFileSignature middleware', () => {
  function run(buffer: Buffer) {
    let status = 0;
    let nexted = false;
    const req = { file: { buffer } } as never;
    const res = {
      status(s: number) { status = s; return this; },
      json() { return this; },
    } as never;
    verifyFileSignature(req, res, () => { nexted = true; });
    return { status, nexted };
  }

  it('accepts a real PNG magic-byte signature', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    expect(run(png).nexted).toBe(true);
  });

  it('rejects a spoofed upload (text masquerading as an image)', () => {
    const result = run(Buffer.from('this is definitely not an image'));
    expect(result.nexted).toBe(false);
    expect(result.status).toBe(400);
  });
});

describe('auth loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ body: { email: 'a@b.com', password: 'secret123' } }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(loginSchema.safeParse({ body: { email: 'not-an-email', password: 'secret123' } }).success).toBe(false);
  });
});
