/**
 * Member self-service privacy rights (Ghana Data Protection Act 2012, Act 843;
 * Apple/Google account-deletion requirements): consent preferences, data
 * export (right of access) and account deletion (right to erasure).
 */
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getRepos } from '../../repositories';
import { logger } from '../../config/logger';
import { emailMatch } from '../../utils/search.utils';
import { deleteFromCloudinary } from '../../utils/cloudinary.utils';
import { invalidateMemberSession } from '../../utils/session-state.utils';
import { deactivateSubscriptionsFor } from '../newsletter/newsletter.service';
import {
  buildAnonymizedMemberUpdate,
  buildPreferencesUpdate,
  cloudinaryPublicIdFromUrl,
  effectivePreferences,
  MemberPreferences,
  POLICY_VERSION,
  toMemberView,
  DELETED_MEMBER_NAME,
  DELETED_PAYER_EMAIL,
} from '../../utils/privacy.utils';

async function getLiveMember(memberId: string) {
  const member = await getRepos().members.findById(memberId);
  if (!member || member.membershipStatus === 'DELETED') {
    throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  }
  return member;
}

export async function updateMyPreferences(
  memberId: string,
  changes: { marketingOptIn?: boolean; directoryOptIn?: boolean },
): Promise<MemberPreferences> {
  const member = await getLiveMember(memberId);
  const update = buildPreferencesUpdate(changes);
  if (Object.keys(update).length === 0) return effectivePreferences(member.consents);

  const result = await getRepos().members.updateById(memberId, update);
  // An opt-out applies everywhere, including a newsletter signup made with the same email.
  if (changes.marketingOptIn === false) await deactivateSubscriptionsFor(member.email);
  return effectivePreferences(result?.consents);
}

/** Everything we hold about the member, as one JSON document (right of access). */
export async function exportMyData(memberId: string) {
  const repos = getRepos();
  const member = await getLiveMember(memberId);
  const byEmail = emailMatch(member.email);

  const [
    dues, donations, payments, eventRsvps, asMentor, asMentee,
    jobPostings, jobApplications, forumPosts, forumComments, pollVotes, electionVotes, newsletter,
  ] = await Promise.all([
    repos.dues.findMany({ memberId }, { sort: { year: -1 } }),
    repos.donations.findMany({ memberId }, { sort: { createdAt: -1 } }),
    // providerData is the payment processor's raw payload, not information about the member.
    repos.payments.findMany({ memberId }, { projection: '-providerData', sort: { createdAt: -1 } }),
    repos.eventRsvps.findMany({ $or: [{ memberId }, { email: byEmail }] }, { sort: { createdAt: -1 } }),
    repos.mentorshipRequests.findMany({ mentorId: memberId }, { sort: { createdAt: -1 } }),
    repos.mentorshipRequests.findMany({ menteeId: memberId }, { sort: { createdAt: -1 } }),
    repos.jobs.findMany({ postedById: memberId }, { sort: { createdAt: -1 } }),
    repos.jobApplications.findMany({ applicantId: memberId }, { sort: { createdAt: -1 } }),
    repos.forumPosts.findMany({ authorId: memberId }, { sort: { createdAt: -1 } }),
    repos.forumComments.findMany({ authorId: memberId }, { sort: { createdAt: -1 } }),
    repos.pollVotes.findMany({ memberId }, { sort: { createdAt: -1 } }),
    repos.electionVotes.findMany({ voterId: memberId }, { sort: { createdAt: -1 } }),
    repos.newsletterSubscriptions.findOne({ email: byEmail }),
  ]);

  const [polls, elections] = await Promise.all([
    pollVotes.length ? repos.polls.findMany({ _id: { $in: pollVotes.map((v) => v.pollId) } }, { projection: 'question options' }) : [],
    electionVotes.length ? repos.elections.findMany({ _id: { $in: electionVotes.map((v) => v.electionId) } }, { projection: 'title position' }) : [],
  ]);
  const pollMap = new Map(polls.map((p) => [String(p.id), p]));
  const electionMap = new Map(elections.map((e) => [String(e.id), e]));

  return {
    generatedAt: new Date().toISOString(),
    policyVersion: POLICY_VERSION,
    profile: toMemberView(member),
    consents: member.consents ?? null,
    dues,
    donations,
    payments,
    eventRsvps,
    mentorshipRequests: { asMentor, asMentee },
    jobPostings,
    jobApplications,
    forumPosts,
    forumComments,
    // Poll choices are the member's own data.
    pollVotes: pollVotes.map((v) => {
      const poll = pollMap.get(String(v.pollId));
      const options = (poll?.options as Array<{ id: number; text: string }> | undefined) ?? [];
      return {
        pollId: v.pollId,
        question: poll?.question ?? null,
        selectedOptions: v.selectedOptions,
        selectedOptionTexts: v.selectedOptions.map((id) => options.find((o) => o.id === id)?.text ?? null),
        votedAt: v.createdAt,
      };
    }),
    // Secret ballot: which elections they voted in, never who they voted for.
    electionParticipation: electionVotes.map((v) => {
      const election = electionMap.get(String(v.electionId));
      return { electionId: v.electionId, title: election?.title ?? null, position: election?.position ?? null, votedAt: v.createdAt };
    }),
    newsletterSubscription: newsletter
      ? { email: newsletter.email, isActive: newsletter.isActive, subscribedAt: newsletter.subscribedAt }
      : null,
  };
}

/**
 * Delete (anonymise) the member's account after re-checking their password.
 * The member record stays — dues, donations and payments reference it for
 * accounting, and forum posts/comments show "Deleted member" — but every
 * personal field is cleared and the old email is released.
 */
export async function deleteMyAccount(memberId: string, password: string) {
  const repos = getRepos();
  const member = await getLiveMember(memberId);

  const ok = await bcrypt.compare(password, member.password);
  if (!ok) throw Object.assign(new Error('Incorrect password'), { statusCode: 401 });

  const oldEmail = member.email;
  const oldPhotoUrl = member.photoUrl;
  const unusablePassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

  const anonymised = await repos.members.updateOne(
    { _id: memberId, membershipStatus: { $ne: 'DELETED' } },
    { ...buildAnonymizedMemberUpdate(memberId), password: unusablePassword },
  );
  if (!anonymised) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  invalidateMemberSession(memberId); // every open session ends on its next request

  // Personal data held in related records.
  const ownJobIds = (await repos.jobs.findMany({ postedById: memberId }, { projection: '_id' })).map((j) => j.id);
  await Promise.all([
    repos.jobApplications.deleteMany({
      $or: [{ applicantId: memberId }, ...(ownJobIds.length ? [{ jobId: { $in: ownJobIds } }] : [])],
    }),
    repos.jobs.deleteMany({ postedById: memberId }),
    repos.mentorshipRequests.deleteMany({ $or: [{ mentorId: memberId }, { menteeId: memberId }] }),
    repos.newsletterSubscriptions.deleteMany({ email: emailMatch(oldEmail) }),
    repos.eventRsvps.deleteMany({ $or: [{ memberId }, { email: emailMatch(oldEmail) }] }),
    // Financial records stay for accounting, but no longer identify the person:
    // amounts, references and dates remain; names, emails and the processor's
    // raw payload (which holds customer details) are cleared.
    repos.donations.updateMany(
      { $or: [{ memberId }, { donorEmail: emailMatch(oldEmail) }] },
      { donorName: DELETED_MEMBER_NAME, donorEmail: null },
    ),
    repos.payments.updateMany(
      { $or: [{ memberId }, { payerEmail: emailMatch(oldEmail) }] },
      { payerName: DELETED_MEMBER_NAME, payerEmail: DELETED_PAYER_EMAIL, providerData: null },
    ),
  ]);

  // Best effort: the account is already anonymised even if the CDN call fails.
  const publicId = cloudinaryPublicIdFromUrl(oldPhotoUrl);
  if (publicId) {
    deleteFromCloudinary(publicId).catch((err: unknown) =>
      logger.warn({ memberId, err: (err as Error)?.message }, 'Could not delete deleted member\'s photo from Cloudinary'));
  }

  return { message: 'Your account has been deleted' };
}
