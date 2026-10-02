import { describe, it, expect, afterEach } from 'vitest';
import crypto from 'crypto';

import { registerSchema } from '../../src/modules/auth/auth.validation';
import {
  POLICY_VERSION,
  effectivePreferences,
  buildRegistrationConsents,
  buildPreferencesUpdate,
  buildAnonymizedMemberUpdate,
  deletedMemberEmail,
  toMemberView,
  cloudinaryPublicIdFromUrl,
} from '../../src/utils/privacy.utils';
import {
  isMemberSessionValid,
  isAdminSessionValid,
  getMemberSessionState,
  invalidateMemberSession,
  invalidateAdminSession,
  isAdminTokenLive,
} from '../../src/utils/session-state.utils';
import { resolveMember } from '../../src/middleware/auth.middleware';
import { signMemberToken } from '../../src/utils/jwt.utils';
import { hashToken, tokenLookupFilters } from '../../src/utils/crypto.utils';
import { verifyEmailToken, resetPassword } from '../../src/modules/auth/auth.service';
import { maskEmail } from '../../src/utils/search.utils';
import { mergeMarketingRecipients } from '../../src/modules/newsletter/newsletter.service';
import { isValidUnsubscribeToken, newsletterUnsubscribeToken, newsletterUnsubscribeUrl } from '../../src/utils/email.utils';
import { installFakeAccounts, restoreRepos } from './fake-repos';

const MEMBER_ID = '507f1f77bcf86cd799439011';
const ADMIN_ID = '507f1f77bcf86cd799439022';
const sec = (d: Date) => Math.floor(d.getTime() / 1000);

afterEach(restoreRepos);

describe('registration consent validation (multipart-safe)', () => {
  const base = { fullName: 'Ama Owusu', email: 'Ama@Example.com', password: 'password123' };
  const issues = (body: Record<string, unknown>) => {
    const r = registerSchema.safeParse({ body });
    return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  };

  it('requires acceptTerms and confirmAdult with the contract messages', () => {
    expect(issues(base)).toEqual([
      'body.acceptTerms: You must accept the Terms and Privacy Policy',
      'body.confirmAdult: You must confirm you are 18 or older',
    ]);
    expect(issues({ ...base, acceptTerms: true, confirmAdult: false })).toEqual(['body.confirmAdult: You must confirm you are 18 or older']);
    expect(issues({ ...base, acceptTerms: 'false', confirmAdult: 'true' })).toEqual(['body.acceptTerms: You must accept the Terms and Privacy Policy']);
  });

  it("coerces multipart 'true'/'false' strings and defaults the opt-ins to false", () => {
    const parsed = registerSchema.parse({ body: { ...base, acceptTerms: 'true', confirmAdult: 'true', marketingOptIn: 'true' } }).body;
    expect(parsed).toMatchObject({ acceptTerms: true, confirmAdult: true, marketingOptIn: true, directoryOptIn: false, email: 'ama@example.com' });
  });

  it('builds the stored consent record with the current policy version', () => {
    const now = new Date('2026-10-02T10:00:00Z');
    expect(buildRegistrationConsents({ marketingOptIn: true }, now)).toEqual({
      termsAcceptedAt: now, termsVersion: POLICY_VERSION, privacyVersion: POLICY_VERSION, adultConfirmedAt: now,
      marketingOptIn: true, marketingUpdatedAt: now, directoryOptIn: false, directoryUpdatedAt: now,
    });
    expect(POLICY_VERSION).toBe('2026-10-02');
  });
});

describe('effective preferences', () => {
  it('treats pre-consent accounts as directory opt-in and marketing opt-out', () => {
    expect(effectivePreferences(undefined)).toEqual({ marketingOptIn: false, directoryOptIn: true });
    expect(effectivePreferences(null)).toEqual({ marketingOptIn: false, directoryOptIn: true });
    expect(effectivePreferences({})).toEqual({ marketingOptIn: false, directoryOptIn: true });
  });

  it('honours explicit choices', () => {
    expect(effectivePreferences({ marketingOptIn: true, directoryOptIn: false })).toEqual({ marketingOptIn: true, directoryOptIn: false });
  });

  it('timestamps only the preferences that changed', () => {
    const now = new Date();
    expect(buildPreferencesUpdate({ directoryOptIn: false }, now)).toEqual({ 'consents.directoryOptIn': false, 'consents.directoryUpdatedAt': now });
    expect(buildPreferencesUpdate({}, now)).toEqual({});
  });

  it('member view strips credentials/tokens and adds effective preferences', () => {
    const view = toMemberView({
      id: MEMBER_ID, fullName: 'Ama', password: 'hash', verificationToken: 't', verificationTokenHash: 'h',
      resetToken: 'r', resetTokenHash: 'rh', resetTokenExpiry: new Date(), consents: { marketingOptIn: true },
    });
    expect(view).toEqual({ id: MEMBER_ID, fullName: 'Ama', consents: { marketingOptIn: true }, preferences: { marketingOptIn: true, directoryOptIn: true } });
  });
});

describe('account anonymisation field map', () => {
  const now = new Date('2026-10-02T12:00:00Z');
  const update = buildAnonymizedMemberUpdate(MEMBER_ID, now);

  it('replaces identity and releases the email', () => {
    expect(update.fullName).toBe('Deleted member');
    expect(update.email).toBe(`deleted-${MEMBER_ID}@deleted.uposa.invalid`);
    expect(deletedMemberEmail(MEMBER_ID)).toBe(update.email);
    expect(update).toMatchObject({ membershipStatus: 'DELETED', deletedAt: now, passwordChangedAt: now, isApproved: false });
  });

  it('nulls every personal field and clears tokens', () => {
    for (const field of [
      'mobileNumber', 'altPhoneNumber', 'residentialAddress', 'city', 'region', 'country', 'organization', 'occupation',
      'mentorBio', 'dateOfBirth', 'photoUrl', 'nextOfKinName', 'nextOfKinContact', 'emergencyContactNumber',
      'yearGroup', 'house', 'verificationToken', 'verificationTokenHash', 'resetToken', 'resetTokenHash',
    ]) {
      expect(update[field], field).toBeNull();
    }
    expect(update).toMatchObject({ areaOfExpertise: [], preferredContributions: [], isAvailableAsMentor: false });
    expect(update).toMatchObject({ 'consents.marketingOptIn': false, 'consents.directoryOptIn': false });
    expect('password' in update).toBe(false); // replaced separately with a random hash
  });

  it('derives the Cloudinary public id for best-effort photo deletion', () => {
    expect(cloudinaryPublicIdFromUrl('https://res.cloudinary.com/demo/image/upload/v1712345678/uposa/members/abc123.jpg')).toBe('uposa/members/abc123');
    expect(cloudinaryPublicIdFromUrl('https://res.cloudinary.com/demo/image/upload/c_fill,w_200/v1/uposa/members/x.webp')).toBe('uposa/members/x');
    expect(cloudinaryPublicIdFromUrl('https://example.com/a.jpg')).toBeNull();
    expect(cloudinaryPublicIdFromUrl(null)).toBeNull();
  });
});

describe('live session checks (revocation)', () => {
  const changedAt = new Date('2026-10-02T12:00:00Z');

  it('member: rejects suspended/inactive/deleted/missing accounts and tokens older than a password change', () => {
    expect(isMemberSessionValid({ membershipStatus: 'ACTIVE' }, 1)).toBe(true);
    for (const status of ['SUSPENDED', 'INACTIVE', 'DELETED']) expect(isMemberSessionValid({ membershipStatus: status }, 1)).toBe(false);
    expect(isMemberSessionValid(null, 1)).toBe(false);
    expect(isMemberSessionValid({ membershipStatus: 'ACTIVE', passwordChangedAt: changedAt }, sec(changedAt) - 60)).toBe(false);
    expect(isMemberSessionValid({ membershipStatus: 'ACTIVE', passwordChangedAt: changedAt }, sec(changedAt))).toBe(true);
  });

  it('admin: rejects inactive/missing accounts, stale passwords and stale roles', () => {
    expect(isAdminSessionValid({ isActive: true, role: 'ADMIN' }, 1, 'ADMIN')).toBe(true);
    expect(isAdminSessionValid({ isActive: false, role: 'ADMIN' }, 1, 'ADMIN')).toBe(false);
    expect(isAdminSessionValid(null, 1, 'ADMIN')).toBe(false);
    expect(isAdminSessionValid({ isActive: true, role: 'MODERATOR' }, 1, 'ADMIN')).toBe(false);
    expect(isAdminSessionValid({ isActive: true, role: 'ADMIN', passwordChangedAt: changedAt }, sec(changedAt) - 1, 'ADMIN')).toBe(false);
  });

  it('caches account state for ~30s and re-reads after invalidation', async () => {
    const { members } = installFakeAccounts([{ id: MEMBER_ID, membershipStatus: 'ACTIVE' }]);
    const t0 = Date.now();
    await getMemberSessionState(MEMBER_ID, t0);
    await getMemberSessionState(MEMBER_ID, t0 + 10_000);
    expect(members.calls.findById).toBe(1); // served from cache

    await getMemberSessionState(MEMBER_ID, t0 + 31_000);
    expect(members.calls.findById).toBe(2); // TTL expired

    invalidateMemberSession(MEMBER_ID);
    await getMemberSessionState(MEMBER_ID, t0 + 32_000);
    expect(members.calls.findById).toBe(3); // invalidated
  });

  it('a suspension revokes an existing access token immediately once invalidated', async () => {
    const { members } = installFakeAccounts([{ id: MEMBER_ID, membershipStatus: 'ACTIVE' }]);
    const token = signMemberToken({ id: MEMBER_ID, email: 'm@x.com' });
    expect((await resolveMember(token))?.id).toBe(MEMBER_ID);

    members.docs[0].membershipStatus = 'SUSPENDED';
    expect(await resolveMember(token)).not.toBeNull(); // cached (would expire within 30s)…
    invalidateMemberSession(MEMBER_ID);
    expect(await resolveMember(token)).toBeNull(); // …but suspendMember() invalidates, so it's immediate
  });

  it('admin deactivation applies after invalidation', async () => {
    const { admins } = installFakeAccounts([], [{ id: ADMIN_ID, isActive: true, role: 'ADMIN' }]);
    const payload = { id: ADMIN_ID, role: 'ADMIN', iat: sec(new Date()) };
    expect(await isAdminTokenLive(payload)).toBe(true);
    admins.docs[0].isActive = false;
    invalidateAdminSession(ADMIN_ID);
    expect(await isAdminTokenLive(payload)).toBe(false);
  });
});

describe('one-time token hashing with legacy fallback', () => {
  it('stores sha256 hashes and looks up hash first, then legacy plaintext', () => {
    expect(hashToken('abc')).toBe(crypto.createHash('sha256').update('abc').digest('hex'));
    const extra = { resetTokenExpiry: { $gt: new Date(0) } };
    expect(tokenLookupFilters('abc', 'resetTokenHash', 'resetToken', extra)).toEqual([
      { ...extra, resetTokenHash: hashToken('abc') },
      { ...extra, resetToken: 'abc' },
    ]);
  });

  it('verifies email with a new (hashed) token and with a legacy plaintext token', async () => {
    const { members } = installFakeAccounts([
      { id: 'm-new', verificationTokenHash: hashToken('new-token'), verificationToken: null, isVerified: false },
      { id: 'm-old', verificationToken: 'legacy-token', isVerified: false },
    ]);
    await verifyEmailToken('new-token');
    await verifyEmailToken('legacy-token');
    expect(members.docs.map((d) => d.isVerified)).toEqual([true, true]);
    expect(members.docs.every((d) => d.verificationToken === null && d.verificationTokenHash === null)).toBe(true);
    await expect(verifyEmailToken('new-token')).rejects.toMatchObject({ statusCode: 400 }); // single use
  });

  it('resets a password with a legacy token until it expires, then rejects it', async () => {
    const future = new Date(Date.now() + 60_000);
    const { members } = installFakeAccounts([
      { id: MEMBER_ID, resetToken: 'legacy-reset', resetTokenExpiry: future, password: 'old', membershipStatus: 'ACTIVE' },
    ]);
    await resetPassword({ token: 'legacy-reset', password: 'new-password-1' });
    expect(members.docs[0]).toMatchObject({ resetToken: null, resetTokenHash: null, resetTokenExpiry: null });
    expect(members.docs[0].passwordChangedAt).toBeInstanceOf(Date);

    members.docs[0].resetTokenHash = hashToken('expired');
    members.docs[0].resetTokenExpiry = new Date(Date.now() - 1000);
    await expect(resetPassword({ token: 'expired', password: 'another-pass' })).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('marketing email guardrails', () => {
  it('merges opted-in members and subscribers, honouring explicit member opt-outs', () => {
    expect(mergeMarketingRecipients(
      [{ email: 'Ama@x.com' }],
      [{ email: 'ama@x.com' }, { email: 'kofi@x.com' }, { email: 'Esi@x.com' }],
      [{ email: 'esi@X.com' }],
    )).toEqual(['ama@x.com', 'kofi@x.com']);
  });

  it('signs unsubscribe links so they cannot be forged', () => {
    const token = newsletterUnsubscribeToken('Ama@X.com ');
    expect(isValidUnsubscribeToken('ama@x.com', token)).toBe(true);
    expect(isValidUnsubscribeToken('kofi@x.com', token)).toBe(false);
    expect(isValidUnsubscribeToken('ama@x.com', 'forged')).toBe(false);
    expect(newsletterUnsubscribeUrl('ama@x.com')).toMatch(/\/api\/newsletter\/unsubscribe\?email=ama%40x\.com&token=[0-9a-f]{64}$/);
  });

  it('masks emails in duplicate reports', () => {
    expect(maskEmail('john.doe@gmail.com')).toBe('j***@gmail.com');
    expect(maskEmail('bad')).toBe('***');
  });
});
