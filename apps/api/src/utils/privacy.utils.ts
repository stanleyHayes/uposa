/**
 * Ghana Data Protection Act 2012 (Act 843) helpers: consent records, effective
 * preferences, the member "view" (no secrets) and account anonymisation.
 */
import type { IMemberConsents } from '../models';

/** Version of the Terms of Use and Privacy Policy a member accepts at registration. */
export const POLICY_VERSION = '2026-10-02';

export interface MemberPreferences {
  marketingOptIn: boolean;
  directoryOptIn: boolean;
}

/**
 * Effective preferences. Accounts created before consents existed have none:
 * they stay listed in the directory (legitimate interest — they can opt out)
 * but get no marketing (that needs an explicit opt-in).
 */
export function effectivePreferences(consents?: IMemberConsents | null): MemberPreferences {
  return {
    marketingOptIn: consents?.marketingOptIn ?? false,
    directoryOptIn: consents?.directoryOptIn ?? true,
  };
}

/** Mongo filter for "effective directoryOptIn is true" (missing/null counts as opted in). */
export const DIRECTORY_VISIBLE_FILTER = { 'consents.directoryOptIn': { $ne: false } };

/** Mongo filter for members who explicitly opted in to marketing (legacy accounts are excluded). */
export const MARKETING_OPT_IN_FILTER = { 'consents.marketingOptIn': true };

export function buildRegistrationConsents(
  choices: { marketingOptIn?: boolean; directoryOptIn?: boolean },
  now: Date = new Date(),
): IMemberConsents {
  return {
    termsAcceptedAt: now,
    termsVersion: POLICY_VERSION,
    privacyVersion: POLICY_VERSION,
    adultConfirmedAt: now,
    marketingOptIn: choices.marketingOptIn ?? false,
    marketingUpdatedAt: now,
    directoryOptIn: choices.directoryOptIn ?? false,
    directoryUpdatedAt: now,
  };
}

/** Dotted $set for a preferences change (works on accounts with no consents yet). */
export function buildPreferencesUpdate(
  changes: { marketingOptIn?: boolean; directoryOptIn?: boolean },
  now: Date = new Date(),
): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  if (changes.marketingOptIn !== undefined) {
    update['consents.marketingOptIn'] = changes.marketingOptIn;
    update['consents.marketingUpdatedAt'] = now;
  }
  if (changes.directoryOptIn !== undefined) {
    update['consents.directoryOptIn'] = changes.directoryOptIn;
    update['consents.directoryUpdatedAt'] = now;
  }
  return update;
}

/** Credential/token fields that must never leave the API. */
export const MEMBER_SECRET_FIELDS = [
  'password',
  'verificationToken',
  'verificationTokenHash',
  'resetToken',
  'resetTokenHash',
  'resetTokenExpiry',
] as const;

/** Mongoose projection excluding the secret fields. */
export const SAFE_MEMBER_PROJECTION = MEMBER_SECRET_FIELDS.map((f) => `-${f}`).join(' ');

/** A member record without secrets, plus effective `preferences`. */
export function toMemberView<T extends object>(member: T): Omit<T, (typeof MEMBER_SECRET_FIELDS)[number]> & { preferences: MemberPreferences } {
  const safe: Record<string, unknown> = { ...(member as Record<string, unknown>) };
  for (const field of MEMBER_SECRET_FIELDS) delete safe[field];
  return { ...safe, preferences: effectivePreferences((member as { consents?: IMemberConsents | null }).consents) } as never;
}

export const DELETED_MEMBER_NAME = 'Deleted member';
/** Payments require an email; deleted accounts' payments keep this placeholder instead. */
export const DELETED_PAYER_EMAIL = 'deleted@deleted.uposa.invalid';

export function deletedMemberEmail(id: string): string {
  return `deleted-${id}@deleted.uposa.invalid`;
}

/**
 * Field map that anonymises a member who deletes their account. The record is
 * kept (dues/donations/payments reference it for accounting; forum content
 * shows "Deleted member") but every personal field is cleared. The password is
 * replaced separately with a hash of random bytes.
 */
export function buildAnonymizedMemberUpdate(id: string, now: Date = new Date()): Record<string, unknown> {
  const cleared = [
    'gender', 'dateOfBirth', 'maritalStatus', 'photoUrl',
    'mobileNumber', 'altPhoneNumber', 'residentialAddress', 'city', 'region', 'country',
    'yearGroup', 'programme', 'house', 'employmentType', 'occupation', 'organization',
    'emergencyContactNumber', 'emergencyRelationship', 'nextOfKinName', 'nextOfKinContact', 'nextOfKinRelationship',
    'mentorBio', 'willingToVolunteer', 'rejectionReason',
    'verificationToken', 'verificationTokenHash', 'resetToken', 'resetTokenHash', 'resetTokenExpiry',
  ];
  return {
    fullName: DELETED_MEMBER_NAME,
    email: deletedMemberEmail(id),
    ...Object.fromEntries(cleared.map((field) => [field, null])),
    areaOfExpertise: [],
    preferredContributions: [],
    isAvailableAsMentor: false,
    isWhatsAppMember: false,
    isVerified: false,
    isApproved: false,
    membershipStatus: 'DELETED',
    deletedAt: now,
    passwordChangedAt: now,
    // Keep the record of what was accepted (lawful basis for past processing); stop all optional processing.
    'consents.marketingOptIn': false,
    'consents.marketingUpdatedAt': now,
    'consents.directoryOptIn': false,
    'consents.directoryUpdatedAt': now,
  };
}

/** Cloudinary public_id from a delivery URL (…/upload/v123/uposa/members/abc.jpg → uposa/members/abc). */
export function cloudinaryPublicIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname !== 'res.cloudinary.com') return null;
    const match = pathname.match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(uposa\/.+)$/);
    if (!match) return null;
    return decodeURIComponent(match[1]).replace(/\.[a-z0-9]+$/i, '');
  } catch {
    return null;
  }
}
