import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

/**
 * Raw environment schema. Required secrets must be present; everything else has
 * a safe default. Validation runs once at import — a misconfigured environment
 * fails fast with a clear message instead of surfacing as a runtime error later.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_ADMIN_SECRET: z.string().min(1, 'JWT_ADMIN_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  ADMIN_URL: z.string().default('http://localhost:5173'),
  ALLOWED_ORIGINS: z.string().default(''),
  ALLOWED_ORIGIN_PATTERNS: z.string().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  RESEND_API_KEY: z.string().default(''),
  FROM_EMAIL: z.string().default('UPOSA <noreply@uposa.org>'),
  PAYSTACK_SECRET_KEY: z.string().default(''),
  PAYSTACK_PUBLIC_KEY: z.string().default(''),
  PAYSTACK_WEBHOOK_SECRET: z.string().default(''),
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_PUBLIC_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  CRYPTO_API_KEY: z.string().default(''),
  CRYPTO_WEBHOOK_SECRET: z.string().default(''),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().default('gpt-5.5'),
  AI_WRITING_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(30),
  PAYMENT_CALLBACK_BASE_URL: z.string().default('http://localhost:3000'),
  // Required in production (credentials encrypted with the dev key would be
  // decryptable from the source tree); optional in dev/test with a fallback.
  CREDENTIALS_ENCRYPTION_KEY: isProd
    ? z.string().min(1, 'CREDENTIALS_ENCRYPTION_KEY is required in production')
    : z.string().default('dev-uposa-creds-encrypt-key-32c!'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console -- the logger isn't safe to import before env is validated
  console.error(`\n✗ Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const e = parsed.data;
const toList = (value: string) => value.split(',').map((s) => s.trim()).filter(Boolean);

export const env = {
  NODE_ENV: e.NODE_ENV,
  PORT: e.PORT,
  DATABASE_URL: e.DATABASE_URL,
  JWT_SECRET: e.JWT_SECRET,
  JWT_ADMIN_SECRET: e.JWT_ADMIN_SECRET,
  JWT_EXPIRES_IN: e.JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: e.JWT_REFRESH_EXPIRES_IN,
  CLIENT_URL: e.CLIENT_URL,
  ADMIN_URL: e.ADMIN_URL,
  ALLOWED_ORIGINS: toList(e.ALLOWED_ORIGINS),
  ALLOWED_ORIGIN_PATTERNS: toList(e.ALLOWED_ORIGIN_PATTERNS),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: e.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: e.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: e.CLOUDINARY_API_SECRET,

  // Resend
  RESEND_API_KEY: e.RESEND_API_KEY,
  FROM_EMAIL: e.FROM_EMAIL,

  // Paystack
  PAYSTACK_SECRET_KEY: e.PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY: e.PAYSTACK_PUBLIC_KEY,
  PAYSTACK_WEBHOOK_SECRET: e.PAYSTACK_WEBHOOK_SECRET,

  // Stripe
  STRIPE_SECRET_KEY: e.STRIPE_SECRET_KEY,
  STRIPE_PUBLIC_KEY: e.STRIPE_PUBLIC_KEY,
  STRIPE_WEBHOOK_SECRET: e.STRIPE_WEBHOOK_SECRET,

  // Crypto (Coinbase Commerce or similar)
  CRYPTO_API_KEY: e.CRYPTO_API_KEY,
  CRYPTO_WEBHOOK_SECRET: e.CRYPTO_WEBHOOK_SECRET,

  // OpenAI
  OPENAI_API_KEY: e.OPENAI_API_KEY,
  OPENAI_MODEL: e.OPENAI_MODEL,
  AI_WRITING_LIMIT_PER_HOUR: e.AI_WRITING_LIMIT_PER_HOUR,

  // Payment
  PAYMENT_CALLBACK_BASE_URL: e.PAYMENT_CALLBACK_BASE_URL,

  // Encryption for payment credentials stored in DB.
  CREDENTIALS_ENCRYPTION_KEY: e.CREDENTIALS_ENCRYPTION_KEY,
};
