import { PaymentProviderInterface } from './payment.types';
import { PaystackProvider } from './paystack.provider';
import { StripeProvider } from './stripe.provider';
import { CryptoProvider } from './crypto.provider';

const providers: Record<string, PaymentProviderInterface> = {
  PAYSTACK: new PaystackProvider(),
  STRIPE: new StripeProvider(),
  CRYPTO: new CryptoProvider(),
};

export function getPaymentProvider(name: string): PaymentProviderInterface {
  const provider = providers[name.toUpperCase()];
  if (!provider) {
    throw Object.assign(new Error(`Payment provider "${name}" is not supported`), { statusCode: 400 });
  }
  return provider;
}

export function getAllProviderNames(): string[] {
  return Object.keys(providers);
}
