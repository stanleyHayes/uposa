export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type Programme = 'GENERAL_ARTS' | 'BUSINESS' | 'HOME_ECONOMICS' | 'VISUAL_ARTS' | 'SCIENCE';
export type House = 'ACKAH' | 'DENSU' | 'TANO' | 'NKRUMAH' | 'PRA' | 'VOLTA';
export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type EventStatus = 'UPCOMING' | 'ONGOING' | 'PAST' | 'CANCELLED';
export type ProjectStatus = 'ONGOING' | 'COMPLETED' | 'PAUSED';
export type NewsCategory = 'ANNOUNCEMENT' | 'BLOG' | 'REPORT' | 'MEETING_SUMMARY';
export type DueStatus = 'PAID' | 'PENDING' | 'OVERDUE';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'VOLUNTEER' | 'INTERNSHIP';
export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'REJECTED';
export type MentorshipRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
export type ForumCategory = 'GENERAL' | 'ANNOUNCEMENTS' | 'CAREERS' | 'EDUCATION' | 'WELFARE';
export type PollStatus = 'ACTIVE' | 'CLOSED';
export type ElectionStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type DonationChannel = 'MOMO' | 'BANK' | 'PAYPAL' | 'PAYSTACK' | 'STRIPE' | 'CRYPTO' | 'CASH' | 'OTHER';
export type PaymentProvider = 'PAYSTACK' | 'STRIPE' | 'CRYPTO';
export type DonationStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface Member {
  id: string;
  fullName: string;
  email: string;
  photoUrl?: string;
  mobileNumber?: string;
  city?: string;
  region?: string;
  country?: string;
  yearGroup?: number;
  programme?: Programme;
  house?: House;
  occupation?: string;
  organization?: string;
  areaOfExpertise?: string[];
  isAvailableAsMentor?: boolean;
  mentorBio?: string;
  membershipStatus: MembershipStatus;
  isVerified?: boolean;
  isApproved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string;
  date: string;
  endDate?: string;
  location?: string;
  rsvpLink?: string;
  status: EventStatus;
  isFeatured: boolean;
}

export interface EventRsvp {
  id?: string;
  eventId?: string;
  memberId?: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
}

export interface News {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  category: NewsCategory;
  authorName?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface Due {
  id: string;
  amount: number;
  year: number;
  status: DueStatus;
  paidAt?: string;
}

export interface ProjectMilestone {
  title: string;
  description?: string;
  date?: string;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  imageUrl?: string;
  gallery?: string[];
  milestones?: ProjectMilestone[];
  goalAmount: number;
  raisedAmount: number;
  status: ProjectStatus;
  isFeatured: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  memberId?: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  channel: DonationChannel;
  purpose?: string;
  transactionRef?: string;
  projectId?: string;
  project?: Project;
  status: DonationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  location?: string;
  jobType: JobType;
  contactEmail?: string;
  externalUrl?: string;
  postedById: string;
  postedBy?: Pick<Member, 'id' | 'fullName' | 'photoUrl'>;
  isApproved: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  applications?: JobApplication[];
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  applicant?: Pick<Member, 'id' | 'fullName' | 'photoUrl' | 'email'>;
  coverLetter?: string;
  resumeUrl?: string;
  status: ApplicationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipRequest {
  id: string;
  mentorId: string;
  mentor?: Pick<Member, 'id' | 'fullName' | 'photoUrl' | 'occupation' | 'organization' | 'areaOfExpertise' | 'mentorBio'>;
  menteeId: string;
  mentee?: Pick<Member, 'id' | 'fullName' | 'photoUrl'>;
  status: MentorshipRequestStatus;
  message?: string;
  mentorResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: ForumCategory;
  authorId: string;
  author?: Pick<Member, 'id' | 'fullName' | 'photoUrl'>;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  comments?: ForumComment[];
  _count?: { comments: number };
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  author?: Pick<Member, 'id' | 'fullName' | 'photoUrl'>;
  content: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  description?: string;
  options: PollOption[];
  allowMultiple: boolean;
  status: PollStatus;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
  hasVoted?: boolean;
  myVote?: number[];
}

export interface ElectionCandidate {
  id: string;
  name: string;
  manifesto?: string;
  photoUrl?: string;
  votes?: number;
}

export interface Election {
  id: string;
  title: string;
  description?: string;
  position: string;
  candidates: ElectionCandidate[];
  status: ElectionStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  hasVoted?: boolean;
  myVote?: string;
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface PaymentMethod {
  id: string;
  provider: PaymentProvider;
  displayName: string;
  description?: string;
  isEnabled: boolean;
  supportedCurrencies: string[];
  countries: string[];
  hasCredentials: boolean;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken?: string;
    member: Member;
  };
}
