import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { emailMatch } from '../../utils/search.utils';
import { buildPreferencesUpdate, MARKETING_OPT_IN_FILTER } from '../../utils/privacy.utils';
import { SubscribeInput } from './newsletter.validation';

export async function subscribe(data: SubscribeInput) {
  const { newsletterSubscriptions } = getRepos();

  const existing = await newsletterSubscriptions.findOne({ email: emailMatch(data.email) });
  if (existing) {
    if (!existing.isActive) {
      await newsletterSubscriptions.updateById(existing.id, { isActive: true, subscribedAt: new Date() });
    }
    return { email: data.email, alreadySubscribed: !!existing.isActive };
  }

  await newsletterSubscriptions.create({
    email: data.email,
    isActive: true,
    subscribedAt: new Date(),
  });

  return { email: data.email, alreadySubscribed: false };
}

// Admin
export async function listSubscribers(query: Record<string, string | undefined>) {
  const { newsletterSubscriptions } = getRepos();
  const { page, limit, skip } = getPaginationParams(query);

  const filter: Record<string, unknown> = {};
  if (query.status === 'active') filter.isActive = true;
  if (query.status === 'inactive') filter.isActive = false;

  const [data, total] = await Promise.all([
    newsletterSubscriptions.findMany(filter, { sort: { subscribedAt: -1 }, skip, limit }),
    newsletterSubscriptions.count(filter),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function unsubscribe(id: string) {
  const { newsletterSubscriptions } = getRepos();
  const existing = await newsletterSubscriptions.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Subscriber not found'), { statusCode: 404 });
  }
  await newsletterSubscriptions.updateById(id, { isActive: false });
  return { message: 'Subscriber deactivated' };
}

export async function deleteSubscriber(id: string) {
  const { newsletterSubscriptions } = getRepos();
  const existing = await newsletterSubscriptions.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Subscriber not found'), { statusCode: 404 });
  }
  await newsletterSubscriptions.deleteById(id);
  return { message: 'Subscriber deleted' };
}

// ── Marketing consent ──

/**
 * Who may receive non-transactional (bulk/marketing) email: members who opted
 * in, plus active newsletter subscribers — minus anyone who is a member and
 * explicitly opted out (an in-app opt-out always wins). Lowercased and deduped.
 */
export function mergeMarketingRecipients(
  optedInMembers: Array<{ email: string }>,
  subscribers: Array<{ email: string }>,
  optedOutMembers: Array<{ email: string }>,
): string[] {
  const blocked = new Set(optedOutMembers.map((m) => m.email.trim().toLowerCase()));
  const recipients = new Set<string>();
  for (const { email } of [...optedInMembers, ...subscribers]) {
    const normalized = email.trim().toLowerCase();
    if (!blocked.has(normalized)) recipients.add(normalized);
  }
  return [...recipients];
}

export async function getMarketingRecipients(): Promise<string[]> {
  const { members, newsletterSubscriptions } = getRepos();
  const [optedIn, subscribers, optedOut] = await Promise.all([
    members.findMany({ membershipStatus: 'ACTIVE', ...MARKETING_OPT_IN_FILTER }, { projection: 'email' }),
    newsletterSubscriptions.findMany({ isActive: true }, { projection: 'email' }),
    members.findMany({ 'consents.marketingOptIn': false }, { projection: 'email' }),
  ]);
  return mergeMarketingRecipients(optedIn, subscribers, optedOut);
}

/**
 * Stop all marketing to an email address: deactivate its newsletter
 * subscription(s) and, if it belongs to a member, record marketingOptIn=false.
 */
export async function optOutOfMarketing(email: string): Promise<void> {
  const { members, newsletterSubscriptions } = getRepos();
  const match = emailMatch(email);
  const [subscriptions, accounts] = await Promise.all([
    newsletterSubscriptions.findMany({ email: match, isActive: true }),
    members.findMany({ email: match }, { projection: '_id' }),
  ]);
  await Promise.all([
    ...subscriptions.map((sub) => newsletterSubscriptions.updateById(String(sub.id), { isActive: false })),
    ...accounts.map((m) => members.updateById(String(m.id), buildPreferencesUpdate({ marketingOptIn: false }))),
  ]);
}

/** Opt-out when only the subscription (not a member preference) should change. */
export async function deactivateSubscriptionsFor(email: string): Promise<void> {
  const { newsletterSubscriptions } = getRepos();
  const subscriptions = await newsletterSubscriptions.findMany({ email: emailMatch(email), isActive: true });
  await Promise.all(subscriptions.map((sub) => newsletterSubscriptions.updateById(String(sub.id), { isActive: false })));
}
