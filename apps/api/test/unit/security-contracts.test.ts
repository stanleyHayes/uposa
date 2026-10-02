import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

import { parseQueryFirstValue } from '../../src/utils/query-parser.utils';
import { emailMatch, normalizeEmail } from '../../src/utils/search.utils';
import { emailField } from '../../src/modules/auth/auth.validation';
import { compileOriginPattern } from '../../src/config/cors';
import {
  issuedBeforePasswordChange,
  signMemberToken,
  signMemberRefreshToken,
  signAdminToken,
} from '../../src/utils/jwt.utils';
import { mapPaystackStatus } from '../../src/providers/paystack.provider';
import { mapStripeSession } from '../../src/providers/stripe.provider';
import { mapCoinbaseStatus } from '../../src/providers/crypto.provider';
import { hmacHexMatches, webhookPayload } from '../../src/utils/crypto.utils';
import { authenticateSocketToken } from '../../src/config/socket';
import { toPublicPaymentView } from '../../src/modules/payments/payments.service';
import { updateProfileSchema } from '../../src/modules/members/members.validation';
import { memberOrAdminMiddleware } from '../../src/middleware/auth.middleware';
import { installFakeAccounts, restoreRepos } from './fake-repos';

// Auth now also checks the live account, so these suites run against in-memory accounts.
const MEMBER_ID = '507f1f77bcf86cd799439011';
const ADMIN_ID = '507f1f77bcf86cd799439022';
function withLiveAccounts() {
  beforeEach(() => {
    installFakeAccounts(
      [{ id: MEMBER_ID, membershipStatus: 'ACTIVE' }],
      [{ id: ADMIN_ID, isActive: true, role: 'MODERATOR' }],
    );
  });
  afterEach(restoreRepos);
}

describe('parseQueryFirstValue (Express query parser)', () => {
  it('collapses repeated keys to the first value', () => {
    expect(parseQueryFirstValue('status=a&status=b&search=x')).toEqual({ status: 'a', search: 'x' });
  });

  it('parses like the default otherwise (decoding, empty values, no nesting)', () => {
    expect(parseQueryFirstValue('q=hello%20world&flag=&a[b]=1')).toEqual({ q: 'hello world', flag: '', 'a[b]': '1' });
    expect(parseQueryFirstValue('')).toEqual({});
  });
});

describe('email normalisation', () => {
  it('trims and lowercases through the auth schema field', () => {
    expect(emailField.parse('  Kofi.Mensah@Mail.COM ')).toBe('kofi.mensah@mail.com');
    expect(normalizeEmail(' A@B.Co ')).toBe('a@b.co');
  });

  it('builds an anchored, escaped, case-insensitive matcher', () => {
    const m = emailMatch('A.b+c@x.com');
    const re = new RegExp(m.$regex, m.$options);
    expect(m.$regex).toBe('^a\\.b\\+c@x\\.com$');
    expect(re.test('A.B+C@X.COM')).toBe(true); // legacy mixed-case row still matches
    expect(re.test('aXb+c@x.com')).toBe(false); // "." is literal
    expect(re.test('prefix-a.b+c@x.com')).toBe(false); // anchored
  });
});

describe('compileOriginPattern', () => {
  it('anchors patterns to the whole origin', () => {
    const re = compileOriginPattern('https://[a-z0-9-]+\\.uposa\\.org');
    expect(re.test('https://admin.uposa.org')).toBe(true);
    expect(re.test('https://admin.uposa.org.evil.com')).toBe(false);
    expect(re.test('https://evil.com/?https://admin.uposa.org')).toBe(false);
  });

  it('keeps alternations inside the anchors', () => {
    const re = compileOriginPattern('https://a\\.com|https://b\\.com');
    expect(re.test('https://b.com')).toBe(true);
    expect(re.test('https://a.com.evil.net')).toBe(false);
  });
});

describe('issuedBeforePasswordChange', () => {
  const changedAt = new Date('2026-10-01T12:00:00.500Z');
  const sec = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

  it('revokes tokens issued before the change', () => {
    expect(issuedBeforePasswordChange(sec('2026-10-01T11:59:59Z'), changedAt)).toBe(true);
  });

  it('keeps tokens issued in the same second or later (iat has 1s precision)', () => {
    expect(issuedBeforePasswordChange(sec('2026-10-01T12:00:00Z'), changedAt)).toBe(false);
    expect(issuedBeforePasswordChange(sec('2026-10-01T12:05:00Z'), changedAt)).toBe(false);
  });

  it('never revokes when the password was never changed', () => {
    expect(issuedBeforePasswordChange(1, null)).toBe(false);
    expect(issuedBeforePasswordChange(1, undefined)).toBe(false);
  });
});

describe('provider verify status mapping', () => {
  it('Paystack: only failed/abandoned/reversed are definitive failures', () => {
    expect(mapPaystackStatus('success')).toBe('success');
    for (const s of ['failed', 'abandoned', 'reversed']) expect(mapPaystackStatus(s)).toBe('failed');
    for (const s of ['ongoing', 'pending', 'processing', 'queued', undefined]) expect(mapPaystackStatus(s)).toBe('pending');
  });

  it('Stripe: paid → success, expired → failed, open/unpaid → pending', () => {
    expect(mapStripeSession({ status: 'complete', payment_status: 'paid' })).toBe('success');
    expect(mapStripeSession({ status: 'expired', payment_status: 'unpaid' })).toBe('failed');
    expect(mapStripeSession({ status: 'open', payment_status: 'unpaid' })).toBe('pending');
  });

  it('Coinbase: COMPLETED/RESOLVED success, EXPIRED/CANCELED failed, others pending', () => {
    expect(mapCoinbaseStatus('COMPLETED')).toBe('success');
    expect(mapCoinbaseStatus('RESOLVED')).toBe('success');
    expect(mapCoinbaseStatus('EXPIRED')).toBe('failed');
    expect(mapCoinbaseStatus('CANCELED')).toBe('failed');
    expect(mapCoinbaseStatus('PENDING')).toBe('pending');
    expect(mapCoinbaseStatus('UNRESOLVED')).toBe('pending');
  });
});

describe('webhook HMAC verification', () => {
  const raw = Buffer.from('{"event":"charge.success","data":{"amount":1000}}');
  const sign = (secret: string, alg: 'sha256' | 'sha512') => crypto.createHmac(alg, secret).update(raw).digest('hex');

  it('verifies over the raw bytes with any configured secret', () => {
    expect(hmacHexMatches('sha512', [undefined, 'sk_live_x'], raw, sign('sk_live_x', 'sha512'))).toBe(true);
    expect(hmacHexMatches('sha512', ['whsec', 'sk_live_x'], raw, sign('sk_live_x', 'sha512'))).toBe(true);
  });

  it('rejects wrong secrets, tampered bodies and unconfigured secrets', () => {
    expect(hmacHexMatches('sha256', ['other'], raw, sign('secret', 'sha256'))).toBe(false);
    expect(hmacHexMatches('sha256', ['secret'], Buffer.from('{}'), sign('secret', 'sha256'))).toBe(false);
    expect(hmacHexMatches('sha256', ['', undefined], raw, crypto.createHmac('sha256', '').update(raw).digest('hex'))).toBe(false);
  });

  it('uses raw bytes when captured, else re-serialised JSON', () => {
    expect(webhookPayload(raw)).toBe(raw);
    expect(webhookPayload({ a: 1 })).toBe('{"a":1}');
  });
});

describe('authenticateSocketToken', () => {
  withLiveAccounts();

  it('accepts member and admin ACCESS tokens for live accounts', async () => {
    expect((await authenticateSocketToken(signMemberToken({ id: MEMBER_ID, email: 'm@x.com' })))?.user?.id).toBe(MEMBER_ID);
    expect((await authenticateSocketToken(`Bearer ${signAdminToken({ id: ADMIN_ID, email: 'a@x.com', role: 'MODERATOR' })}`))?.admin?.id).toBe(ADMIN_ID);
  });

  it('rejects refresh tokens, garbage, missing tokens and unknown accounts', async () => {
    expect(await authenticateSocketToken(signMemberRefreshToken({ id: MEMBER_ID, email: 'm@x.com' }))).toBeNull();
    expect(await authenticateSocketToken('not-a-jwt')).toBeNull();
    expect(await authenticateSocketToken(undefined)).toBeNull();
    expect(await authenticateSocketToken(signMemberToken({ id: '507f1f77bcf86cd799439099', email: 'x@x.com' }))).toBeNull();
  });
});

describe('toPublicPaymentView', () => {
  it('returns only what a payer needs', () => {
    const view = toPublicPaymentView({
      reference: 'UPOSA-1-ab', providerRef: 'pi_1', status: 'PENDING', amount: 100, currency: 'GHS', purpose: 'DONATION',
      payerName: 'Ama', payerEmail: 'ama@x.com', memberId: 'm1', metadata: { x: 1 }, providerData: {},
    } as never);
    expect(view).toEqual({ reference: 'UPOSA-1-ab', status: 'PENDING', amount: 100, currency: 'GHS', purpose: 'DONATION' });
  });
});

describe('profile update clearing', () => {
  it("turns '' / null into null and leaves omitted fields out", () => {
    const body = updateProfileSchema.parse({ body: { city: '', occupation: null, gender: '', fullName: 'Ama Owusu' } }).body;
    expect(body).toEqual({ city: null, occupation: null, gender: null, fullName: 'Ama Owusu' });
    expect('country' in body).toBe(false);
  });
});

describe('memberOrAdminMiddleware', () => {
  withLiveAccounts();

  async function run(authorization?: string) {
    let status = 0;
    let nexted = false;
    const req = { headers: { authorization }, cookies: {} } as { headers: object; cookies: object; user?: { id: string }; admin?: { id: string } };
    const res = { status(s: number) { status = s; return this; }, json() { return this; } };
    await memberOrAdminMiddleware(req as never, res as never, () => { nexted = true; });
    return { status, nexted, req };
  }

  it('accepts a member or an admin access token', async () => {
    expect((await run(`Bearer ${signMemberToken({ id: MEMBER_ID, email: 'm@x.com' })}`)).req.user?.id).toBe(MEMBER_ID);
    expect((await run(`Bearer ${signAdminToken({ id: ADMIN_ID, email: 'a@x.com', role: 'MODERATOR' })}`)).req.admin?.id).toBe(ADMIN_ID);
  });

  it('401s without a valid token', async () => {
    expect(await run()).toMatchObject({ status: 401, nexted: false });
    expect(await run('Bearer junk')).toMatchObject({ status: 401, nexted: false });
  });
});
