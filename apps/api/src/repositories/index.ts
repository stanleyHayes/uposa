import mongoose from 'mongoose';
import { IRepository, MongooseRepository } from './base';
import {
  Member, Admin, Event, EventRsvp, Project, News,
  Donation, Due, Job, JobApplication, MentorshipRequest,
  ForumPost, ForumComment, Poll, PollVote,
  Election, ElectionVote, ContactMessage, GalleryCategory, GalleryItem,
  SchoolLeader, Executive, SiteConfig, YearGroupRep, PaymentMethod, Payment,
  TranscriptRequest, NewsletterSubscription, AdminNotification,
  IMember, IAdmin, IEvent, IEventRsvp, IProject, INews,
  IDonation, IDue, IJob, IJobApplication, IMentorshipRequest,
  IForumPost, IForumComment, IPoll, IPollVote,
  IElection, IElectionVote, IContactMessage, IGalleryCategory, IGalleryItem,
  ISchoolLeader, IExecutive, ISiteConfig, IYearGroupRep, IPaymentMethod, IPayment,
  ITranscriptRequest, INewsletterSubscription, IAdminNotification,
} from '../models';

// ═══════════════════════════════════════════════════════════
//  REPOSITORY CONTAINER TYPE
// ═══════════════════════════════════════════════════════════

export interface Repositories {
  members: IRepository<IMember>;
  admins: IRepository<IAdmin>;
  events: IRepository<IEvent>;
  eventRsvps: IRepository<IEventRsvp>;
  projects: IRepository<IProject>;
  news: IRepository<INews>;
  donations: IRepository<IDonation>;
  dues: IRepository<IDue>;
  jobs: IRepository<IJob>;
  jobApplications: IRepository<IJobApplication>;
  mentorshipRequests: IRepository<IMentorshipRequest>;
  forumPosts: IRepository<IForumPost>;
  forumComments: IRepository<IForumComment>;
  polls: IRepository<IPoll>;
  pollVotes: IRepository<IPollVote>;
  elections: IRepository<IElection>;
  electionVotes: IRepository<IElectionVote>;
  contactMessages: IRepository<IContactMessage>;
  galleryCategories: IRepository<IGalleryCategory>;
  galleryItems: IRepository<IGalleryItem>;
  schoolLeaders: IRepository<ISchoolLeader>;
  executives: IRepository<IExecutive>;
  siteConfig: IRepository<ISiteConfig>;
  yearGroupReps: IRepository<IYearGroupRep>;
  paymentMethods: IRepository<IPaymentMethod>;
  payments: IRepository<IPayment>;
  transcriptRequests: IRepository<ITranscriptRequest>;
  newsletterSubscriptions: IRepository<INewsletterSubscription>;
  adminNotifications: IRepository<IAdminNotification>;
}

// ═══════════════════════════════════════════════════════════
//  SINGLETON + OVERRIDE
// ═══════════════════════════════════════════════════════════

let instance: Repositories | null = null;

function createMongooseRepositories(): Repositories {
  return {
    members: new MongooseRepository(Member),
    admins: new MongooseRepository(Admin),
    events: new MongooseRepository(Event),
    eventRsvps: new MongooseRepository(EventRsvp),
    projects: new MongooseRepository(Project),
    news: new MongooseRepository(News),
    donations: new MongooseRepository(Donation),
    dues: new MongooseRepository(Due),
    jobs: new MongooseRepository(Job),
    jobApplications: new MongooseRepository(JobApplication),
    mentorshipRequests: new MongooseRepository(MentorshipRequest),
    forumPosts: new MongooseRepository(ForumPost),
    forumComments: new MongooseRepository(ForumComment),
    polls: new MongooseRepository(Poll),
    pollVotes: new MongooseRepository(PollVote),
    elections: new MongooseRepository(Election),
    electionVotes: new MongooseRepository(ElectionVote),
    contactMessages: new MongooseRepository(ContactMessage),
    galleryCategories: new MongooseRepository(GalleryCategory),
    galleryItems: new MongooseRepository(GalleryItem),
    schoolLeaders: new MongooseRepository(SchoolLeader),
    executives: new MongooseRepository(Executive),
    siteConfig: new MongooseRepository(SiteConfig),
    yearGroupReps: new MongooseRepository(YearGroupRep),
    paymentMethods: new MongooseRepository(PaymentMethod),
    payments: new MongooseRepository(Payment),
    transcriptRequests: new MongooseRepository(TranscriptRequest),
    newsletterSubscriptions: new MongooseRepository(NewsletterSubscription),
    adminNotifications: new MongooseRepository(AdminNotification),
  };
}

/** Get the repository container (lazy-initialized) */
export function getRepos(): Repositories {
  if (!instance) {
    instance = createMongooseRepositories();
  }
  return instance;
}

/** Override the repository container (for testing or swapping providers) */
export function setRepos(repos: Repositories): void {
  instance = repos;
}

/** Reset to default Mongoose repositories */
export function resetRepos(): void {
  instance = null;
}

/** Start a transaction session (Mongoose/MongoDB) */
export async function withTransaction<R>(fn: (session: any) => Promise<R>): Promise<R> {
  const session = await mongoose.startSession();
  try {
    let result: R;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
}

// Re-export for convenience
export { IRepository, FindOptions } from './base';
