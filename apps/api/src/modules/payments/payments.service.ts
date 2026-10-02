import { escapeRegex } from '../../utils/search.utils';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { getRepos } from '../../repositories';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { isCorsOriginAllowed } from '../../config/cors';
import { getPaymentProvider } from '../../providers/payment.registry';
import { WebhookEvent } from '../../providers/payment.types';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { InitializePaymentInput } from './payments.validation';

function generateReference(): string {
  return `UPOSA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

// Convert amount to smallest currency unit (pesewas, kobo, cents)
function toSmallestUnit(amount: number, currency: string): number {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND'];
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) return Math.round(amount);
  return Math.round(amount * 100);
}

/**
 * A provider-confirmed payment only counts if it charged at least what we asked
 * for, in the same currency (">=" because some Paystack setups add the fee on top).
 */
export function isExpectedAmount(
  payment: { totalAmount: number; currency: string },
  paid: { amount: number; currency: string },
): boolean {
  return String(paid.currency).toUpperCase() === String(payment.currency).toUpperCase()
    && Number(paid.amount) >= toSmallestUnit(payment.totalAmount, payment.currency);
}

// Clients hold our generated reference; legacy rows only have providerRef / _id.
function referenceFilter(reference: string) {
  return {
    $or: [
      { reference },
      { providerRef: reference },
      ...(mongoose.Types.ObjectId.isValid(reference) ? [{ _id: reference }] : []),
    ],
  };
}

// ── Platform Fee ───────────────────────────────────────────

interface PlatformFeeConfig {
  percent: number;
  fixed: number;
  enabled: boolean;
}

async function getPlatformFeeConfig(): Promise<PlatformFeeConfig> {
  const { siteConfig } = getRepos();
  const [percentRaw, fixedRaw, enabledRaw] = await Promise.all([
    siteConfig.findOne({ key: 'PAYMENT_PLATFORM_FEE_PERCENT' }),
    siteConfig.findOne({ key: 'PAYMENT_PLATFORM_FEE_FIXED' }),
    siteConfig.findOne({ key: 'PAYMENT_PLATFORM_FEE_ENABLED' }),
  ]);

  return {
    percent: Number(percentRaw?.value ?? 0),
    fixed: Number(fixedRaw?.value ?? 0),
    enabled: String(enabledRaw?.value ?? 'true') === 'true',
  };
}

export function calculatePlatformFee(amount: number, config: PlatformFeeConfig): { platformFee: number; totalAmount: number } {
  if (!config.enabled || (config.percent <= 0 && config.fixed <= 0)) {
    return { platformFee: 0, totalAmount: amount };
  }
  const platformFee = Math.round((amount * (config.percent / 100) + config.fixed) * 100) / 100;
  const totalAmount = Math.round((amount + platformFee) * 100) / 100;
  return { platformFee, totalAmount };
}

export async function getPlatformFeePreview(amount: number) {
  const config = await getPlatformFeeConfig();
  const { platformFee, totalAmount } = calculatePlatformFee(amount, config);
  return {
    amount,
    platformFee,
    totalAmount,
    percent: config.percent,
    fixed: config.fixed,
    enabled: config.enabled,
  };
}

// ── Payment Initialization ─────────────────────────────────

export async function initializePayment(data: InitializePaymentInput, memberId?: string) {
  const { payments, paymentMethods, donations, dues } = getRepos();

  // Check the provider is enabled
  const method = await paymentMethods.findOne({ provider: data.provider });
  if (!method || !method.isEnabled) {
    throw Object.assign(new Error(`${data.provider} payment is not currently available`), { statusCode: 400 });
  }

  // Validate the linked record exists
  if (data.purpose === 'DONATION') {
    if (!data.donationId) throw Object.assign(new Error('Donation payment requires a linked donation'), { statusCode: 400 });
    const donation = await donations.findById(data.donationId);
    if (!donation) throw Object.assign(new Error('Donation not found'), { statusCode: 404 });
    if (donation.memberId && String(donation.memberId) !== memberId) {
      throw Object.assign(new Error('Not authorized to pay this donation'), { statusCode: memberId ? 403 : 401 });
    }
    if (donation.status === 'CONFIRMED') throw Object.assign(new Error('This donation has already been paid'), { statusCode: 400 });
    if (Number(donation.amount) !== Number(data.amount) || String(donation.currency || 'GHS').toUpperCase() !== data.currency.toUpperCase()) {
      throw Object.assign(new Error('Payment amount does not match the linked donation'), { statusCode: 400 });
    }
  }
  if (data.purpose === 'DUES') {
    if (!data.dueId) throw Object.assign(new Error('Dues payment requires a linked due'), { statusCode: 400 });
    if (!memberId) throw Object.assign(new Error('Authentication is required to pay dues'), { statusCode: 401 });
    const due = await dues.findById(data.dueId);
    if (!due) throw Object.assign(new Error('Due not found'), { statusCode: 404 });
    if (String(due.memberId) !== memberId) {
      throw Object.assign(new Error('Not authorized to pay this due'), { statusCode: 403 });
    }
    if (due.status === 'PAID') throw Object.assign(new Error('This due has already been paid'), { statusCode: 400 });
    if (Number(due.amount) !== Number(data.amount)) {
      throw Object.assign(new Error('Payment amount does not match the linked due'), { statusCode: 400 });
    }
  }

  // The provider redirects the payer here after checkout — only our own sites,
  // otherwise a crafted payment link becomes an open redirect to a phishing page.
  if (data.callbackUrl && !isCorsOriginAllowed(new URL(data.callbackUrl).origin)) {
    throw Object.assign(new Error('callbackUrl must point to a UPOSA site'), { statusCode: 400 });
  }

  const reference = generateReference();
  const callbackUrl = data.callbackUrl || `${env.PAYMENT_CALLBACK_BASE_URL}/payment/callback`;

  // Calculate platform fee
  const feeConfig = await getPlatformFeeConfig();
  const { platformFee, totalAmount } = calculatePlatformFee(data.amount, feeConfig);

  const provider = getPaymentProvider(data.provider);
  const result = await provider.initialize({
    email: data.email,
    amount: toSmallestUnit(totalAmount, data.currency),
    currency: data.currency,
    reference,
    callbackUrl,
    customerName: data.name,
    // Client metadata first so it can't overwrite the server-set fields below.
    metadata: {
      ...data.metadata,
      purpose: data.purpose,
      donationId: data.donationId,
      dueId: data.dueId,
      memberId,
      originalAmount: data.amount,
      platformFee,
      totalAmount,
    },
  });

  // Store payment record
  const payment = await payments.create({
    provider: data.provider,
    purpose: data.purpose,
    amount: data.amount,
    platformFee,
    totalAmount,
    currency: data.currency,
    status: 'PENDING',
    reference,
    providerRef: result.providerRef || null,
    providerData: null,
    callbackUrl,
    donationId: data.donationId || null,
    dueId: data.dueId || null,
    memberId: memberId || null,
    payerEmail: data.email,
    payerName: data.name || null,
    metadata: data.metadata || null,
  });

  return {
    paymentId: payment.id,
    reference: result.reference,
    authorizationUrl: result.authorizationUrl,
    provider: data.provider,
    amount: data.amount,
    platformFee,
    totalAmount,
  };
}

export async function verifyPayment(reference: string) {
  const { payments } = getRepos();

  const payment = await payments.findOne(referenceFilter(reference));

  if (!payment) {
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  }

  if (payment.status === 'SUCCESS') {
    return payment;
  }

  const provider = getPaymentProvider(payment.provider);
  // Paystack/Stripe look transactions up by our reference; Coinbase by its charge code.
  const lookupRef = payment.provider === 'CRYPTO' ? payment.providerRef : payment.reference;
  const result = await provider.verify(lookupRef || reference);

  if (result.success && isExpectedAmount(payment, result)) {
    // null => a concurrent webhook/verify already finalized it.
    return (await finalizePayment(payment.id, result.providerRef, result.rawData)) ?? payments.findById(payment.id);
  }

  // Update as failed
  const updated = await payments.updateById(payment.id, { status: 'FAILED', providerData: result.rawData });
  return updated;
}

export async function handleWebhookEvent(providerName: string, event: WebhookEvent) {
  if (!event.success) return;
  const { payments } = getRepos();

  // Only truthy refs: an undefined value would serialize to null and match any
  // legacy row that lacks the field.
  const refs = [event.reference, event.providerRef].filter(Boolean);
  if (refs.length === 0) return;

  const payment = await payments.findOne({
    provider: providerName,
    $or: [
      { reference: { $in: refs } },
      { providerRef: { $in: refs } },
    ],
  });

  if (!payment || payment.status === 'SUCCESS') return;

  if (!isExpectedAmount(payment, event)) {
    logger.warn({ paymentId: payment.id, expected: payment.totalAmount, currency: payment.currency, paid: event.amount, paidCurrency: event.currency }, 'Webhook amount/currency mismatch — payment not finalized');
    return;
  }

  await finalizePayment(payment.id, event.providerRef, event.rawData);
}

async function finalizePayment(
  paymentId: string,
  providerRef: string,
  rawData: Record<string, unknown>,
) {
  const { payments, donations, projects, dues } = getRepos();

  // Conditional transition: only the call that actually flips the payment to
  // SUCCESS applies the side effects, so the client's verify racing the webhook
  // (or a webhook retry) can't credit the donation/project twice.
  const payment = await payments.updateOne(
    { _id: paymentId, status: { $ne: 'SUCCESS' } },
    { status: 'SUCCESS', providerRef, providerData: rawData },
  );
  if (!payment) return null;

  // Update the linked donation (skipped if an admin already confirmed it manually)
  if (payment.purpose === 'DONATION' && payment.donationId) {
    const donation = await donations.updateOne({ _id: String(payment.donationId), status: { $ne: 'CONFIRMED' } }, {
      status: 'CONFIRMED',
      transactionRef: providerRef,
      channel: payment.provider,
    });

    // Update project raisedAmount if linked
    if (donation?.projectId) {
      await projects.incrementById(String(donation.projectId), 'raisedAmount', donation.amount);
    }
  }

  // Update the linked due
  if (payment.purpose === 'DUES' && payment.dueId) {
    await dues.updateById(String(payment.dueId), {
      status: 'PAID',
      paidAt: new Date(),
      transactionRef: providerRef,
    });
  }

  return payment;
}

export async function getPaymentByReference(reference: string) {
  const { payments, donations, dues } = getRepos();

  const payment = await payments.findOne(referenceFilter(reference));

  if (!payment) {
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  }

  const result = payment as Record<string, any>;

  // Attach donation info
  if (payment.donationId) {
    const d = await donations.findById(String(payment.donationId), {
      projection: { id: 1, donorName: 1, amount: 1, purpose: 1 },
    });
    result.donation = d ? { id: d.id, donorName: d.donorName, amount: d.amount, purpose: d.purpose } : null;
  }

  // Attach due info
  if (payment.dueId) {
    const d = await dues.findById(String(payment.dueId), {
      projection: { id: 1, year: 1, amount: 1 },
    });
    result.due = d ? { id: d.id, year: d.year, amount: d.amount } : null;
  }

  return result;
}

export async function adminListPayments(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, provider, purpose, search } = query;
  const { payments, members, donations, dues } = getRepos();

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();
  if (provider) where.provider = provider.toUpperCase();
  if (purpose) where.purpose = purpose.toUpperCase();
  if (search) {
    where.$or = [
      { payerEmail: { $regex: escapeRegex(search), $options: 'i' } },
      { payerName: { $regex: escapeRegex(search), $options: 'i' } },
      { providerRef: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  const [rawData, total] = await Promise.all([
    payments.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    payments.count(where),
  ]);

  // Attach member, donation, due info
  const memberIds = [...new Set(rawData.map(d => d.memberId).filter(Boolean))];
  const donationIds = [...new Set(rawData.map(d => d.donationId).filter(Boolean))];
  const dueIds = [...new Set(rawData.map(d => d.dueId).filter(Boolean))];

  const [memberDocs, donationDocs, dueDocs] = await Promise.all([
    memberIds.length > 0
      ? members.findMany({ _id: { $in: memberIds } }, { projection: { id: 1, fullName: 1, email: 1 } })
      : [],
    donationIds.length > 0
      ? donations.findMany({ _id: { $in: donationIds } }, { projection: { id: 1, donorName: 1, purpose: 1 } })
      : [],
    dueIds.length > 0
      ? dues.findMany({ _id: { $in: dueIds } }, { projection: { id: 1, year: 1 } })
      : [],
  ]);

  const memberMap = new Map(memberDocs.map(m => [String(m.id), { id: m.id, fullName: m.fullName, email: m.email }]));
  const donationMap = new Map(donationDocs.map(d => [String(d.id), { id: d.id, donorName: d.donorName, purpose: d.purpose }]));
  const dueMap = new Map(dueDocs.map(d => [String(d.id), { id: d.id, year: d.year }]));

  const data = rawData.map(p => ({
    ...p,
    member: p.memberId ? memberMap.get(String(p.memberId)) || null : null,
    donation: p.donationId ? donationMap.get(String(p.donationId)) || null : null,
    due: p.dueId ? dueMap.get(String(p.dueId)) || null : null,
  }));

  return { data, meta: buildPaginationMeta(page, limit, total) };
}
