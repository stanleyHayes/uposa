import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

import { env } from '../../src/config/env';
import { getPaginationParams } from '../../src/utils/pagination.utils';
import {
  signMemberToken,
  signMemberRefreshToken,
  signAdminToken,
  signAdminRefreshToken,
  verifyMemberToken,
  verifyMemberRefreshToken,
  verifyAdminToken,
  verifyAdminRefreshToken,
} from '../../src/utils/jwt.utils';
import { isExpectedAmount } from '../../src/modules/payments/payments.service';
import { StripeProvider } from '../../src/providers/stripe.provider';
import { escapeHtml } from '../../src/utils/email.utils';

describe('getPaginationParams', () => {
  it('falls back to defaults for non-numeric input instead of NaN (which disabled the limit)', () => {
    expect(getPaginationParams({ page: 'abc', limit: 'xyz' })).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it('clamps and computes skip', () => {
    expect(getPaginationParams({ page: '3', limit: '500' })).toEqual({ page: 3, limit: 100, skip: 200 });
    expect(getPaginationParams({})).toEqual({ page: 1, limit: 10, skip: 0 });
  });
});

describe('jwt access vs refresh separation', () => {
  const member = { id: 'm1', email: 'm@x.com' };
  const admin = { id: 'a1', email: 'a@x.com', role: 'ADMIN' as const };

  it('accepts each token type only where it belongs', () => {
    expect(verifyMemberToken(signMemberToken(member)).id).toBe('m1');
    expect(verifyMemberRefreshToken(signMemberRefreshToken(member)).id).toBe('m1');
    expect(verifyAdminToken(signAdminToken(admin)).role).toBe('ADMIN');
  });

  it('rejects a refresh token used as an access token', () => {
    expect(() => verifyMemberToken(signMemberRefreshToken(member))).toThrow();
    expect(() => verifyAdminToken(signAdminRefreshToken(admin))).toThrow();
  });

  it('rejects an access token used to refresh', () => {
    expect(() => verifyMemberRefreshToken(signMemberToken(member))).toThrow();
  });

  it('still honours long-lived refresh tokens issued before the tokenType claim', () => {
    const legacyRefresh = jwt.sign({ ...member, role: 'MEMBER' }, env.JWT_SECRET, { expiresIn: '7d' });
    const legacyAccess = jwt.sign({ ...member, role: 'MEMBER' }, env.JWT_SECRET, { expiresIn: '15m' });
    expect(verifyMemberRefreshToken(legacyRefresh).id).toBe('m1');
    expect(() => verifyMemberRefreshToken(legacyAccess)).toThrow();
  });

  it('lets admins refresh with a refresh token (including pre-tokenType ones) but not an access token', () => {
    expect(verifyAdminRefreshToken(signAdminRefreshToken(admin)).id).toBe('a1');
    expect(() => verifyAdminRefreshToken(signAdminToken(admin))).toThrow();
    const legacyRefresh = jwt.sign(admin, env.JWT_ADMIN_SECRET, { expiresIn: '7d' });
    expect(verifyAdminRefreshToken(legacyRefresh).role).toBe('ADMIN');
  });

  it('rejects a non-admin role even when signed with the admin secret', () => {
    const forged = jwt.sign({ ...member, role: 'MEMBER' }, env.JWT_ADMIN_SECRET, { expiresIn: '15m' });
    expect(() => verifyAdminToken(forged)).toThrow();
  });
});

describe('isExpectedAmount (provider-confirmed payment check)', () => {
  const payment = { totalAmount: 121.2, currency: 'GHS' };

  it('accepts the exact amount in the smallest unit, case-insensitive currency', () => {
    expect(isExpectedAmount(payment, { amount: 12120, currency: 'ghs' })).toBe(true);
  });

  it('accepts more (fees passed to the customer) but not less, nor another currency', () => {
    expect(isExpectedAmount(payment, { amount: 12300, currency: 'GHS' })).toBe(true);
    expect(isExpectedAmount(payment, { amount: 100, currency: 'GHS' })).toBe(false);
    expect(isExpectedAmount(payment, { amount: 12120, currency: 'USD' })).toBe(false);
  });
});

describe('StripeProvider.parseWebhookEvent', () => {
  it('parses the raw Buffer body the webhook route receives', () => {
    const body = Buffer.from(JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'UPOSA-1-ab', payment_status: 'paid', amount_total: 5000, currency: 'usd', payment_intent: 'pi_1' } },
    }));
    const event = new StripeProvider().parseWebhookEvent(body);
    expect(event).toMatchObject({ reference: 'UPOSA-1-ab', success: true, amount: 5000, currency: 'USD', providerRef: 'pi_1' });
  });
});

describe('escapeHtml', () => {
  it('neutralises markup injected through user-supplied names', () => {
    expect(escapeHtml('<a href="x">Claim</a>')).toBe('&lt;a href=&quot;x&quot;&gt;Claim&lt;/a&gt;');
    expect(escapeHtml(undefined)).toBe('');
  });
});
