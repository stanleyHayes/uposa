import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  // Ensure 32-byte key by hashing whatever string was provided
  return crypto.createHash('sha256').update(env.CREDENTIALS_ENCRYPTION_KEY).digest();
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decrypt(encryptedText: string): string {
  const [ivB64, authTagB64, cipherB64] = encryptedText.split(':');
  if (!ivB64 || !authTagB64 || !cipherB64) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(cipherB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

// Encrypt a credentials object (all values become encrypted strings)
export function encryptCredentials(creds: Record<string, string>): Record<string, string> {
  const encrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(creds)) {
    encrypted[key] = value ? encrypt(value) : '';
  }
  return encrypted;
}

// Decrypt a credentials object
export function decryptCredentials(creds: Record<string, string>): Record<string, string> {
  const decrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(creds)) {
    decrypted[key] = value ? decrypt(value) : '';
  }
  return decrypted;
}
