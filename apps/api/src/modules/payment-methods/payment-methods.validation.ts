import { z } from 'zod';

// Credentials schema per provider
const paystackCredentialsSchema = z.object({
  secretKey: z.string().min(1, 'Secret key is required'),
  publicKey: z.string().min(1, 'Public key is required'),
  webhookSecret: z.string().optional(),
});

const stripeCredentialsSchema = z.object({
  secretKey: z.string().min(1, 'Secret key is required'),
  publicKey: z.string().min(1, 'Public key is required'),
  webhookSecret: z.string().optional(),
});

const cryptoCredentialsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  webhookSecret: z.string().optional(),
});

export const createPaymentMethodSchema = z.object({
  body: z.object({
    provider: z.enum(['PAYSTACK', 'STRIPE', 'CRYPTO']),
    displayName: z.string().min(1, 'Display name is required'),
    description: z.string().optional(),
    isEnabled: z.boolean().optional(),
    supportedCurrencies: z.array(z.string()).min(1, 'At least one currency required'),
    countries: z.array(z.string()).min(1, 'At least one country required'),
    credentials: z.record(z.string(), z.string()).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const updatePaymentMethodSchema = z.object({
  body: z.object({
    displayName: z.string().min(1).optional(),
    description: z.string().optional(),
    isEnabled: z.boolean().optional(),
    supportedCurrencies: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
    credentials: z.record(z.string(), z.string()).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const togglePaymentMethodSchema = z.object({
  body: z.object({
    isEnabled: z.boolean(),
  }),
});

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>['body'];
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>['body'];
export type TogglePaymentMethodInput = z.infer<typeof togglePaymentMethodSchema>['body'];
