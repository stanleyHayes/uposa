import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { SubscribeInput } from './newsletter.validation';

export async function subscribe(data: SubscribeInput) {
  const { newsletterSubscriptions } = getRepos();

  const existing = await newsletterSubscriptions.findOne({ email: data.email });
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
