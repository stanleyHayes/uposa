import mongoose, { Schema, Model } from 'mongoose';

// ── Schema-wide toJSON transform ──
const toJSONOptions = {
  virtuals: true,
  versionKey: false,
  transform: (_: unknown, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
};

// ═══════════════════════════════════════════════════════════
//  ENUMS
// ═══════════════════════════════════════════════════════════

export const Gender = ['MALE', 'FEMALE', 'OTHER'] as const;
export const MaritalStatus = ['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED'] as const;
export const Programme = ['GENERAL_ARTS', 'BUSINESS', 'HOME_ECONOMICS', 'VISUAL_ARTS', 'SCIENCE'] as const;
export const House = ['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA'] as const;
export const EmploymentType = ['RETIRED', 'STUDENT', 'UNEMPLOYED', 'SELF_EMPLOYED', 'GOVERNMENT_WORKER', 'PRIVATE_WORKER'] as const;
export const WillingnessToVolunteer = ['YES', 'NO', 'MAYBE'] as const;
export const MembershipStatus = ['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'] as const;
export const AdminRole = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] as const;
export const EventStatus = ['UPCOMING', 'ONGOING', 'PAST', 'CANCELLED'] as const;
export const ProjectStatus = ['ONGOING', 'COMPLETED', 'PAUSED'] as const;
export const NewsCategory = ['ANNOUNCEMENT', 'BLOG', 'REPORT', 'MEETING_SUMMARY'] as const;
export const DonationChannel = ['MOMO', 'BANK', 'PAYPAL', 'PAYSTACK', 'STRIPE', 'CRYPTO', 'CASH', 'OTHER'] as const;
export const PaymentProvider = ['PAYSTACK', 'STRIPE', 'CRYPTO'] as const;
export const PaymentStatusEnum = ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'] as const;
export const PaymentPurpose = ['DONATION', 'DUES'] as const;
export const DonationStatus = ['PENDING', 'CONFIRMED', 'FAILED'] as const;
export const DueStatus = ['PAID', 'PENDING', 'OVERDUE'] as const;
export const JobType = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER', 'INTERNSHIP'] as const;
export const MentorshipStatusEnum = ['PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED'] as const;
export const ForumCategory = ['GENERAL', 'ANNOUNCEMENTS', 'CAREERS', 'EDUCATION', 'WELFARE'] as const;
export const PollStatus = ['ACTIVE', 'CLOSED'] as const;
export const ElectionStatus = ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export const ApplicationStatus = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED'] as const;

// ═══════════════════════════════════════════════════════════
//  INTERFACES
// ═══════════════════════════════════════════════════════════

export interface IMember {
  id: string;
  fullName: string;
  gender?: string;
  dateOfBirth?: Date;
  maritalStatus?: string;
  photoUrl?: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  mobileNumber?: string;
  altPhoneNumber?: string;
  residentialAddress?: string;
  city?: string;
  region?: string;
  country?: string;
  yearGroup?: number;
  programme?: string;
  house?: string;
  employmentType?: string;
  occupation?: string;
  organization?: string;
  areaOfExpertise: string[];
  emergencyContactNumber?: string;
  emergencyRelationship?: string;
  nextOfKinName?: string;
  nextOfKinContact?: string;
  nextOfKinRelationship?: string;
  isAvailableAsMentor: boolean;
  mentorBio?: string;
  isWhatsAppMember: boolean;
  willingToVolunteer?: string;
  preferredContributions: string[];
  membershipStatus: string;
  isApproved: boolean;
  approvedAt?: Date;
  consentGiven: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdmin { id: string;
  fullName: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEvent { id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string;
  date: Date;
  endDate?: Date;
  location?: string;
  rsvpLink?: string;
  status: string;
  isFeatured: boolean;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventRsvp { id: string;
  eventId: mongoose.Types.ObjectId;
  memberId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
}

export interface IProjectMilestone {
  title: string;
  description?: string;
  date?: Date;
  completed: boolean;
}

export interface IProject { id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  imageUrl?: string;
  gallery: string[];
  milestones: IProjectMilestone[];
  goalAmount: number;
  raisedAmount: number;
  status: string;
  isFeatured: boolean;
  startDate?: Date;
  endDate?: Date;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface INews { id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  category: string;
  authorName?: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt?: Date;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDonation { id: string;
  memberId?: mongoose.Types.ObjectId;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  channel: string;
  purpose?: string;
  transactionRef?: string;
  projectId?: mongoose.Types.ObjectId;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDue { id: string;
  memberId: mongoose.Types.ObjectId;
  amount: number;
  year: number;
  status: string;
  transactionRef?: string;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJob { id: string;
  title: string;
  description: string;
  company: string;
  location?: string;
  jobType: string;
  contactEmail?: string;
  externalUrl?: string;
  postedById: mongoose.Types.ObjectId;
  isApproved: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobApplication { id: string;
  jobId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  coverLetter?: string;
  resumeUrl?: string;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMentorshipRequest { id: string;
  mentorId: mongoose.Types.ObjectId;
  menteeId: mongoose.Types.ObjectId;
  status: string;
  message?: string;
  mentorResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IForumPost { id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  authorId: mongoose.Types.ObjectId;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IForumComment { id: string;
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPoll { id: string;
  question: string;
  description?: string;
  options: unknown;
  allowMultiple: boolean;
  createdById: mongoose.Types.ObjectId;
  status: string;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPollVote { id: string;
  pollId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  selectedOptions: number[];
  createdAt: Date;
}

export interface IElection { id: string;
  title: string;
  description?: string;
  position: string;
  candidates: unknown;
  status: string;
  startDate: Date;
  endDate: Date;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IElectionVote { id: string;
  electionId: mongoose.Types.ObjectId;
  candidateId: string;
  voterId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IContactMessage { id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  repliedAt?: Date;
  createdAt: Date;
}

export interface IGalleryCategory { id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGalleryItem { id: string;
  title: string;
  caption?: string;
  description?: string;
  imageUrl: string;
  category?: string;
  categoryId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ISchoolLeader { id: string;
  name: string;
  position: string;
  photoUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExecutive { id: string;
  name: string;
  position: string;
  classOf: string;
  email?: string;
  phone?: string;
  bio?: string;
  photoUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISiteConfig { id: string;
  key: string;
  value: unknown;
  updatedAt: Date;
}

export interface IYearGroupRep { id: string;
  year: string;
  name: string;
  contact?: string;
  email?: string;
  order: number;
}

export interface IPaymentMethod { id: string;
  provider: string;
  displayName: string;
  description?: string;
  isEnabled: boolean;
  supportedCurrencies: string[];
  countries: string[];
  config?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment { id: string;
  provider: string;
  purpose: string;
  amount: number;
  platformFee: number;
  totalAmount: number;
  currency: string;
  status: string;
  providerRef?: string;
  providerData?: unknown;
  callbackUrl?: string;
  donationId?: mongoose.Types.ObjectId;
  dueId?: mongoose.Types.ObjectId;
  memberId?: mongoose.Types.ObjectId;
  payerEmail: string;
  payerName?: string;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════
//  SCHEMAS & MODELS
// ═══════════════════════════════════════════════════════════

// ── Member ──
const MemberSchema = new Schema<IMember>(
  {
    fullName: { type: String, required: true },
    gender: { type: String, enum: Gender },
    dateOfBirth: { type: Date },
    maritalStatus: { type: String, enum: MaritalStatus },
    photoUrl: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    mobileNumber: { type: String },
    altPhoneNumber: { type: String },
    residentialAddress: { type: String },
    city: { type: String },
    region: { type: String },
    country: { type: String },
    yearGroup: { type: Number },
    programme: { type: String, enum: Programme },
    house: { type: String, enum: House },
    employmentType: { type: String, enum: EmploymentType },
    occupation: { type: String },
    organization: { type: String },
    areaOfExpertise: { type: [String], default: [] },
    emergencyContactNumber: { type: String },
    emergencyRelationship: { type: String },
    nextOfKinName: { type: String },
    nextOfKinContact: { type: String },
    nextOfKinRelationship: { type: String },
    isAvailableAsMentor: { type: Boolean, default: false },
    mentorBio: { type: String },
    isWhatsAppMember: { type: Boolean, default: false },
    willingToVolunteer: { type: String, enum: WillingnessToVolunteer },
    preferredContributions: { type: [String], default: [] },
    membershipStatus: { type: String, enum: MembershipStatus, default: 'PENDING' },
    isApproved: { type: Boolean, default: false },
    approvedAt: { type: Date },
    consentGiven: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'members', toJSON: toJSONOptions },
);

export const Member: Model<IMember> = mongoose.models.Member || mongoose.model<IMember>('Member', MemberSchema);

// ── Admin ──
const AdminSchema = new Schema<IAdmin>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: AdminRole, default: 'ADMIN' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'admins', toJSON: toJSONOptions },
);

export const Admin: Model<IAdmin> = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);

// ── Event ──
const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    date: { type: Date, required: true },
    endDate: { type: Date },
    location: { type: String },
    rsvpLink: { type: String },
    status: { type: String, enum: EventStatus, default: 'UPCOMING' },
    isFeatured: { type: Boolean, default: false },
    createdById: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true, collection: 'events', toJSON: toJSONOptions },
);

export const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

// ── EventRsvp ──
const EventRsvpSchema = new Schema<IEventRsvp>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'event_rsvps', toJSON: toJSONOptions },
);

export const EventRsvp: Model<IEventRsvp> = mongoose.models.EventRsvp || mongoose.model<IEventRsvp>('EventRsvp', EventRsvpSchema);

// ── Project ──
const ProjectMilestoneSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date },
    completed: { type: Boolean, default: false },
  },
  { _id: false },
);

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    content: { type: String },
    imageUrl: { type: String },
    gallery: { type: [String], default: [] },
    milestones: { type: [ProjectMilestoneSchema], default: [] },
    goalAmount: { type: Number, default: 0 },
    raisedAmount: { type: Number, default: 0 },
    status: { type: String, enum: ProjectStatus, default: 'ONGOING' },
    isFeatured: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
    createdById: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true, collection: 'projects', toJSON: toJSONOptions },
);

export const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

// ── News ──
const NewsSchema = new Schema<INews>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    imageUrl: { type: String },
    category: { type: String, enum: NewsCategory, default: 'ANNOUNCEMENT' },
    authorName: { type: String },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    createdById: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true, collection: 'news', toJSON: toJSONOptions },
);

export const News: Model<INews> = mongoose.models.News || mongoose.model<INews>('News', NewsSchema);

// ── Donation ──
const DonationSchema = new Schema<IDonation>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    donorName: { type: String, required: true },
    donorEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'GHS' },
    channel: { type: String, enum: DonationChannel, default: 'CASH' },
    purpose: { type: String },
    transactionRef: { type: String },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    status: { type: String, enum: DonationStatus, default: 'PENDING' },
    notes: { type: String },
  },
  { timestamps: true, collection: 'donations', toJSON: toJSONOptions },
);

export const Donation: Model<IDonation> = mongoose.models.Donation || mongoose.model<IDonation>('Donation', DonationSchema);

// ── Due ──
const DueSchema = new Schema<IDue>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true },
    year: { type: Number, required: true },
    status: { type: String, enum: DueStatus, default: 'PENDING' },
    transactionRef: { type: String },
    paidAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true, collection: 'dues', toJSON: toJSONOptions },
);

export const Due: Model<IDue> = mongoose.models.Due || mongoose.model<IDue>('Due', DueSchema);

// ── Job ──
const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    jobType: { type: String, enum: JobType, default: 'FULL_TIME' },
    contactEmail: { type: String },
    externalUrl: { type: String },
    postedById: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    isApproved: { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  { timestamps: true, collection: 'jobs', toJSON: toJSONOptions },
);

export const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);

// ── JobApplication ──
const JobApplicationSchema = new Schema<IJobApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    applicantId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    coverLetter: { type: String },
    resumeUrl: { type: String },
    status: { type: String, enum: ApplicationStatus, default: 'PENDING' },
    notes: { type: String },
  },
  { timestamps: true, collection: 'job_applications', toJSON: toJSONOptions },
);

JobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

export const JobApplication: Model<IJobApplication> = mongoose.models.JobApplication || mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);

// ── MentorshipRequest ──
const MentorshipRequestSchema = new Schema<IMentorshipRequest>(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    menteeId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    status: { type: String, enum: MentorshipStatusEnum, default: 'PENDING' },
    message: { type: String },
    mentorResponse: { type: String },
  },
  { timestamps: true, collection: 'mentorship_requests', toJSON: toJSONOptions },
);

export const MentorshipRequest: Model<IMentorshipRequest> = mongoose.models.MentorshipRequest || mongoose.model<IMentorshipRequest>('MentorshipRequest', MentorshipRequestSchema);

// ── ForumPost ──
const ForumPostSchema = new Schema<IForumPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    category: { type: String, enum: ForumCategory, default: 'GENERAL' },
    authorId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    viewCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'forum_posts', toJSON: toJSONOptions },
);

export const ForumPost: Model<IForumPost> = mongoose.models.ForumPost || mongoose.model<IForumPost>('ForumPost', ForumPostSchema);

// ── ForumComment ──
const ForumCommentSchema = new Schema<IForumComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'ForumPost', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    content: { type: String, required: true },
    parentId: { type: String },
  },
  { timestamps: true, collection: 'forum_comments', toJSON: toJSONOptions },
);

export const ForumComment: Model<IForumComment> = mongoose.models.ForumComment || mongoose.model<IForumComment>('ForumComment', ForumCommentSchema);

// ── Poll ──
const PollSchema = new Schema<IPoll>(
  {
    question: { type: String, required: true },
    description: { type: String },
    options: { type: Schema.Types.Mixed, required: true },
    allowMultiple: { type: Boolean, default: false },
    createdById: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    status: { type: String, enum: PollStatus, default: 'ACTIVE' },
    endsAt: { type: Date },
  },
  { timestamps: true, collection: 'polls', toJSON: toJSONOptions },
);

export const Poll: Model<IPoll> = mongoose.models.Poll || mongoose.model<IPoll>('Poll', PollSchema);

// ── PollVote ──
const PollVoteSchema = new Schema<IPollVote>(
  {
    pollId: { type: Schema.Types.ObjectId, ref: 'Poll', required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    selectedOptions: { type: [Number], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'poll_votes', toJSON: toJSONOptions },
);

PollVoteSchema.index({ pollId: 1, memberId: 1 }, { unique: true });

export const PollVote: Model<IPollVote> = mongoose.models.PollVote || mongoose.model<IPollVote>('PollVote', PollVoteSchema);

// ── Election ──
const ElectionSchema = new Schema<IElection>(
  {
    title: { type: String, required: true },
    description: { type: String },
    position: { type: String, required: true },
    candidates: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ElectionStatus, default: 'UPCOMING' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdById: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true, collection: 'elections', toJSON: toJSONOptions },
);

export const Election: Model<IElection> = mongoose.models.Election || mongoose.model<IElection>('Election', ElectionSchema);

// ── ElectionVote ──
const ElectionVoteSchema = new Schema<IElectionVote>(
  {
    electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
    candidateId: { type: String, required: true },
    voterId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'election_votes', toJSON: toJSONOptions },
);

ElectionVoteSchema.index({ electionId: 1, voterId: 1 }, { unique: true });

export const ElectionVote: Model<IElectionVote> = mongoose.models.ElectionVote || mongoose.model<IElectionVote>('ElectionVote', ElectionVoteSchema);

// ── ContactMessage ──
const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    repliedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'contact_messages', toJSON: toJSONOptions },
);

export const ContactMessage: Model<IContactMessage> = mongoose.models.ContactMessage || mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);

// ── GalleryCategory ──
const GalleryCategorySchema = new Schema<IGalleryCategory>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    coverImageUrl: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'gallery_categories', toJSON: toJSONOptions },
);

export const GalleryCategory: Model<IGalleryCategory> = mongoose.models.GalleryCategory || mongoose.model<IGalleryCategory>('GalleryCategory', GalleryCategorySchema);

// ── GalleryItem ──
const GalleryItemSchema = new Schema<IGalleryItem>(
  {
    title: { type: String, required: true },
    caption: { type: String },
    description: { type: String },
    imageUrl: { type: String, required: true },
    category: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'GalleryCategory' },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    createdById: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'gallery_items', toJSON: toJSONOptions },
);

export const GalleryItem: Model<IGalleryItem> = mongoose.models.GalleryItem || mongoose.model<IGalleryItem>('GalleryItem', GalleryItemSchema);

// ── SchoolLeader ──
const SchoolLeaderSchema = new Schema<ISchoolLeader>(
  {
    name: { type: String, required: true },
    position: { type: String, required: true },
    photoUrl: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'school_leaders', toJSON: toJSONOptions },
);

export const SchoolLeader: Model<ISchoolLeader> = mongoose.models.SchoolLeader || mongoose.model<ISchoolLeader>('SchoolLeader', SchoolLeaderSchema);

// ── Executive ──
const ExecutiveSchema = new Schema<IExecutive>(
  {
    name: { type: String, required: true },
    position: { type: String, required: true },
    classOf: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    bio: { type: String },
    photoUrl: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'executives', toJSON: toJSONOptions },
);

export const Executive: Model<IExecutive> = mongoose.models.Executive || mongoose.model<IExecutive>('Executive', ExecutiveSchema);

// ── SiteConfig ──
const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: 'site_config', toJSON: toJSONOptions },
);

export const SiteConfig: Model<ISiteConfig> = mongoose.models.SiteConfig || mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);

// ── YearGroupRep ──
const YearGroupRepSchema = new Schema<IYearGroupRep>(
  {
    year: { type: String, required: true },
    name: { type: String, required: true },
    contact: { type: String },
    email: { type: String },
    order: { type: Number, default: 0 },
  },
  { collection: 'year_group_reps', toJSON: toJSONOptions },
);

export const YearGroupRep: Model<IYearGroupRep> = mongoose.models.YearGroupRep || mongoose.model<IYearGroupRep>('YearGroupRep', YearGroupRepSchema);

// ── PaymentMethod ──
const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    provider: { type: String, enum: PaymentProvider, required: true, unique: true },
    displayName: { type: String, required: true },
    description: { type: String },
    isEnabled: { type: Boolean, default: false },
    supportedCurrencies: { type: [String], default: [] },
    countries: { type: [String], default: [] },
    config: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'payment_methods', toJSON: toJSONOptions },
);

export const PaymentMethod: Model<IPaymentMethod> = mongoose.models.PaymentMethod || mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema);

// ── Payment ──
const PaymentSchema = new Schema<IPayment>(
  {
    provider: { type: String, enum: PaymentProvider, required: true },
    purpose: { type: String, enum: PaymentPurpose, required: true },
    amount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'GHS' },
    status: { type: String, enum: PaymentStatusEnum, default: 'PENDING' },
    providerRef: { type: String },
    providerData: { type: Schema.Types.Mixed },
    callbackUrl: { type: String },
    donationId: { type: Schema.Types.ObjectId, ref: 'Donation' },
    dueId: { type: Schema.Types.ObjectId, ref: 'Due' },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    payerEmail: { type: String, required: true },
    payerName: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'payments', toJSON: toJSONOptions },
);

export const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

// ── TranscriptRequest ──
export interface ITranscriptRequest { id: string;
  fullName: string;
  email: string;
  phone?: string;
  yearGroup: string;
  notes?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptRequestSchema = new Schema<ITranscriptRequest>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    yearGroup: { type: String, required: true },
    notes: { type: String },
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'], default: 'PENDING' },
  },
  { timestamps: true, collection: 'transcript_requests', toJSON: toJSONOptions },
);

export const TranscriptRequest: Model<ITranscriptRequest> = mongoose.models.TranscriptRequest || mongoose.model<ITranscriptRequest>('TranscriptRequest', TranscriptRequestSchema);

// ── NewsletterSubscription ──
export interface INewsletterSubscription { id: string;
  email: string;
  subscribedAt: Date;
  isActive: boolean;
}

const NewsletterSubscriptionSchema = new Schema<INewsletterSubscription>(
  {
    email: { type: String, required: true, unique: true },
    subscribedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { collection: 'newsletter_subscriptions', toJSON: toJSONOptions },
);

export const NewsletterSubscription: Model<INewsletterSubscription> = mongoose.models.NewsletterSubscription || mongoose.model<INewsletterSubscription>('NewsletterSubscription', NewsletterSubscriptionSchema);

// ── AdminNotification ──
export type AdminNotificationType =
  | 'NEW_REGISTRATION' | 'NEW_CONTACT_MESSAGE' | 'NEW_DONATION'
  | 'NEW_TRANSCRIPT_REQUEST' | 'PENDING_JOB' | 'NEW_FORUM_POST'
  | 'NEW_MENTORSHIP_REQUEST' | 'NEW_RSVP' | 'ELECTION_STARTED'
  | 'POLL_ENDED' | 'GENERAL';

export interface IAdminNotification { id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminNotificationSchema = new Schema<IAdminNotification>(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'admin_notifications', toJSON: toJSONOptions },
);

AdminNotificationSchema.index({ isRead: 1, createdAt: -1 });

export const AdminNotification: Model<IAdminNotification> = mongoose.models.AdminNotification || mongoose.model<IAdminNotification>('AdminNotification', AdminNotificationSchema);
