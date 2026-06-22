import { getRepos } from '../../repositories';
import { encryptCredentials, decryptCredentials } from '../../utils/crypto.utils';
import { CreatePaymentMethodInput, UpdatePaymentMethodInput } from './payment-methods.validation';

// Strip encrypted credentials from public-facing responses
function stripCredentials(method: Record<string, any>) {
  const { credentials, ...rest } = method;
  // Indicate whether credentials are configured (without exposing them)
  return { ...rest, hasCredentials: !!credentials && Object.keys(credentials).length > 0 };
}

export async function listPaymentMethods(enabledOnly = false) {
  const { paymentMethods } = getRepos();
  const where = enabledOnly ? { isEnabled: true } : {};
  const data = await paymentMethods.findMany(where, { sort: { displayName: 1 } });
  return data.map(stripCredentials);
}

export async function getPaymentMethod(id: string) {
  const { paymentMethods } = getRepos();
  const method = await paymentMethods.findById(id);
  if (!method) throw Object.assign(new Error('Payment method not found'), { statusCode: 404 });
  return stripCredentials(method);
}

export async function getPaymentMethodByProvider(provider: string) {
  const { paymentMethods } = getRepos();
  const method = await paymentMethods.findOne({ provider });
  return method || null;
}

// Get decrypted credentials for a provider (used internally by payment providers)
export async function getProviderCredentials(provider: string): Promise<Record<string, string>> {
  const { paymentMethods } = getRepos();
  const method = await paymentMethods.findOne({ provider });
  if (!method?.credentials || Object.keys(method.credentials).length === 0) {
    return {};
  }
  return decryptCredentials(method.credentials);
}

export async function createPaymentMethod(data: CreatePaymentMethodInput) {
  const { paymentMethods } = getRepos();

  const existing = await paymentMethods.findOne({ provider: data.provider });
  if (existing) {
    throw Object.assign(new Error(`Payment method for ${data.provider} already exists`), { statusCode: 409 });
  }

  const doc = await paymentMethods.create({
    provider: data.provider,
    displayName: data.displayName,
    description: data.description || null,
    isEnabled: data.isEnabled ?? false,
    supportedCurrencies: data.supportedCurrencies,
    countries: data.countries,
    credentials: data.credentials ? encryptCredentials(data.credentials) : null,
    config: data.config || null,
  });

  return stripCredentials(doc);
}

export async function updatePaymentMethod(id: string, data: UpdatePaymentMethodInput) {
  const { paymentMethods } = getRepos();

  const method = await paymentMethods.findById(id);
  if (!method) throw Object.assign(new Error('Payment method not found'), { statusCode: 404 });

  const updates: Record<string, unknown> = {};
  if (data.displayName !== undefined) updates.displayName = data.displayName;
  if (data.description !== undefined) updates.description = data.description;
  if (data.isEnabled !== undefined) updates.isEnabled = data.isEnabled;
  if (data.supportedCurrencies !== undefined) updates.supportedCurrencies = data.supportedCurrencies;
  if (data.countries !== undefined) updates.countries = data.countries;
  if (data.config !== undefined) updates.config = data.config;
  // Encrypt credentials if provided
  if (data.credentials !== undefined) {
    updates.credentials = encryptCredentials(data.credentials);
  }

  const updated = await paymentMethods.updateById(id, updates);
  return stripCredentials(updated!);
}

export async function togglePaymentMethod(id: string, isEnabled: boolean) {
  const { paymentMethods } = getRepos();

  const method = await paymentMethods.findById(id);
  if (!method) throw Object.assign(new Error('Payment method not found'), { statusCode: 404 });

  const updated = await paymentMethods.updateById(id, { isEnabled });
  return stripCredentials(updated!);
}

export async function deletePaymentMethod(id: string) {
  const { paymentMethods } = getRepos();

  const method = await paymentMethods.findById(id);
  if (!method) throw Object.assign(new Error('Payment method not found'), { statusCode: 404 });

  await paymentMethods.deleteById(id);
  return stripCredentials(method);
}

export async function seedDefaultPaymentMethods() {
  const { paymentMethods } = getRepos();

  const count = await paymentMethods.count();
  if (count > 0) return;

  await paymentMethods.createMany([
    {
      provider: 'PAYSTACK',
      displayName: 'Paystack',
      description: 'Pay with Mobile Money, Bank Transfer, or Card (Ghana & Nigeria)',
      isEnabled: false,
      supportedCurrencies: ['GHS', 'NGN'],
      countries: ['GH', 'NG'],
      credentials: null,
      config: null,
    },
    {
      provider: 'STRIPE',
      displayName: 'Stripe',
      description: 'Pay with Card (International)',
      isEnabled: false,
      supportedCurrencies: ['USD', 'GBP', 'EUR'],
      countries: ['*'],
      credentials: null,
      config: null,
    },
    {
      provider: 'CRYPTO',
      displayName: 'Cryptocurrency',
      description: 'Pay with Bitcoin, Ethereum, USDC, and other cryptocurrencies',
      isEnabled: false,
      supportedCurrencies: ['BTC', 'ETH', 'USDC', 'USD', 'GHS'],
      countries: ['*'],
      credentials: null,
      config: null,
    },
  ]);
}
