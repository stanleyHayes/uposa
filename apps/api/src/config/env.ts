import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_ADMIN_SECRET: requireEnv('JWT_ADMIN_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:5173',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  // Resend
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'UPOSA <noreply@uposa.org>',

  // Paystack
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || '',
  PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET || '',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Crypto (Coinbase Commerce or similar)
  CRYPTO_API_KEY: process.env.CRYPTO_API_KEY || '',
  CRYPTO_WEBHOOK_SECRET: process.env.CRYPTO_WEBHOOK_SECRET || '',

  // Payment
  PAYMENT_CALLBACK_BASE_URL: process.env.PAYMENT_CALLBACK_BASE_URL || 'http://localhost:3000',

  // Encryption for payment credentials stored in DB.
  // In production, this MUST be set to a 32-byte secret — never fall back to the dev value,
  // because credentials encrypted with the dev key would be decryptable from the source tree.
  CREDENTIALS_ENCRYPTION_KEY:
    process.env.NODE_ENV === 'production'
      ? requireEnv('CREDENTIALS_ENCRYPTION_KEY')
      : process.env.CREDENTIALS_ENCRYPTION_KEY || 'dev-uposa-creds-encrypt-key-32c!',
};
