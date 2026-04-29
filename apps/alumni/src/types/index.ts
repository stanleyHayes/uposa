// Enums matching Prisma schema
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'SEPARATED' | 'DIVORCED' | 'WIDOWED'
export type Programme = 'GENERAL_ARTS' | 'BUSINESS' | 'HOME_ECONOMICS' | 'VISUAL_ARTS' | 'SCIENCE'
export type House = 'ACKAH' | 'DENSU' | 'TANO' | 'NKRUMAH' | 'PRA' | 'VOLTA'
export type EmploymentType = 'RETIRED' | 'STUDENT' | 'UNEMPLOYED' | 'SELF_EMPLOYED' | 'GOVERNMENT_WORKER' | 'PRIVATE_WORKER'
export type WillingnessToVolunteer = 'YES' | 'NO' | 'MAYBE'
export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
export type EventStatus = 'UPCOMING' | 'ONGOING' | 'PAST' | 'CANCELLED'
export type ProjectStatus = 'ONGOING' | 'COMPLETED' | 'PAUSED'
export type NewsCategory = 'ANNOUNCEMENT' | 'BLOG' | 'REPORT' | 'MEETING_SUMMARY'
export type DonationChannel = 'MOMO' | 'BANK' | 'PAYPAL' | 'PAYSTACK' | 'STRIPE' | 'CRYPTO' | 'CASH' | 'OTHER'
export type PaymentProvider = 'PAYSTACK' | 'STRIPE' | 'CRYPTO'
export type DonationStatus = 'PENDING' | 'CONFIRMED' | 'FAILED'
export type DueStatus = 'PAID' | 'PENDING' | 'OVERDUE'
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'VOLUNTEER' | 'INTERNSHIP'
export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'REJECTED'
export type MentorshipRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED'
export type ForumCategory = 'GENERAL' | 'ANNOUNCEMENTS' | 'CAREERS' | 'EDUCATION' | 'WELFARE'
export type PollStatus = 'ACTIVE' | 'CLOSED'
export type ElectionStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

// Models
export interface Member {
  id: string
  fullName: string
  gender?: Gender
  dateOfBirth?: string
  maritalStatus?: MaritalStatus
  photoUrl?: string
  email: string
  isVerified: boolean
  mobileNumber?: string
  altPhoneNumber?: string
  residentialAddress?: string
  city?: string
  region?: string
  country?: string
  yearGroup?: number
  programme?: Programme
  house?: House
  employmentType?: EmploymentType
  occupation?: string
  organization?: string
  areaOfExpertise: string[]
  emergencyContactNumber?: string
  emergencyRelationship?: string
  nextOfKinName?: string
  nextOfKinContact?: string
  nextOfKinRelationship?: string
  isAvailableAsMentor: boolean
  mentorBio?: string
  isWhatsAppMember: boolean
  willingToVolunteer?: WillingnessToVolunteer
  preferredContributions: string[]
  membershipStatus: MembershipStatus
  isApproved: boolean
  approvedAt?: string
  consentGiven: boolean
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  title: string
  slug: string
  description: string
  imageUrl?: string
  date: string
  endDate?: string
  location?: string
  rsvpLink?: string
  status: EventStatus
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export interface EventRsvp {
  id: string
  eventId: string
  memberId?: string
  name: string
  email: string
  phone?: string
  createdAt: string
}

export interface ProjectMilestone {
  title: string
  description?: string
  date?: string
  completed: boolean
}

export interface Project {
  id: string
  title: string
  slug: string
  description: string
  content?: string
  imageUrl?: string
  gallery?: string[]
  milestones?: ProjectMilestone[]
  goalAmount: number
  raisedAmount: number
  status: ProjectStatus
  isFeatured: boolean
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

export interface News {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  imageUrl?: string
  category: NewsCategory
  authorName?: string
  isFeatured: boolean
  isPublished: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Donation {
  id: string
  memberId?: string
  donorName: string
  donorEmail: string
  amount: number
  currency: string
  channel: DonationChannel
  purpose?: string
  transactionRef?: string
  projectId?: string
  project?: Project
  status: DonationStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Due {
  id: string
  memberId: string
  amount: number
  year: number
  status: DueStatus
  transactionRef?: string
  paidAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  title: string
  description: string
  company: string
  location?: string
  jobType: JobType
  contactEmail?: string
  externalUrl?: string
  postedById: string
  postedBy?: Pick<Member, 'id' | 'fullName' | 'photoUrl'>
  isApproved: boolean
  expiresAt?: string
  createdAt: string
  updatedAt: string
  applications?: JobApplication[]
}

export interface JobApplication {
  id: string
  jobId: string
  applicantId: string
  applicant?: Pick<Member, 'id' | 'fullName' | 'photoUrl' | 'email'>
  coverLetter?: string
  resumeUrl?: string
  status: ApplicationStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MentorshipRequest {
  id: string
  mentorId: string
  mentor?: Pick<Member, 'id' | 'fullName' | 'photoUrl' | 'occupation' | 'organization' | 'areaOfExpertise' | 'mentorBio'>
  menteeId: string
  mentee?: Pick<Member, 'id' | 'fullName' | 'photoUrl'>
  status: MentorshipRequestStatus
  message?: string
  mentorResponse?: string
  createdAt: string
  updatedAt: string
}

export interface ForumPost {
  id: string
  title: string
  slug: string
  content: string
  category: ForumCategory
  authorId: string
  author?: Pick<Member, 'id' | 'fullName' | 'photoUrl'>
  viewCount: number
  isPinned: boolean
  isLocked: boolean
  createdAt: string
  updatedAt: string
  comments?: ForumComment[]
  _count?: { comments: number }
}

export interface ForumComment {
  id: string
  postId: string
  authorId: string
  author?: Pick<Member, 'id' | 'fullName' | 'photoUrl'>
  content: string
  parentId?: string
  createdAt: string
  updatedAt: string
}

export interface PollOption {
  id: number
  text: string
  votes: number
}

export interface Poll {
  id: string
  question: string
  description?: string
  options: PollOption[]
  allowMultiple: boolean
  status: PollStatus
  endsAt?: string
  createdAt: string
  updatedAt: string
  hasVoted?: boolean
  myVote?: number[]
}

export interface ElectionCandidate {
  id: string
  name: string
  manifesto?: string
  photoUrl?: string
  votes?: number
}

export interface Election {
  id: string
  title: string
  description?: string
  position: string
  candidates: ElectionCandidate[]
  status: ElectionStatus
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  hasVoted?: boolean
  myVote?: string
}

export interface ContactMessage {
  name: string
  email: string
  subject: string
  message: string
}

export interface PaymentMethod {
  id: string
  provider: PaymentProvider
  displayName: string
  description?: string
  isEnabled: boolean
  supportedCurrencies: string[]
  countries: string[]
  hasCredentials: boolean
  config?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// Gallery
export interface GalleryCategory {
  id: string
  name: string
  description?: string | null
  coverImageUrl?: string | null
  order?: number
  imageCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface GalleryItem {
  id: string
  title: string
  caption?: string | null
  description?: string | null
  imageUrl: string
  category?: string | null
  categoryId?: string | null
  createdAt: string
  updatedAt?: string
}

// Executives
export interface Executive {
  id: string
  name: string
  position: string
  classOf: string
  email?: string | null
  phone?: string | null
  bio?: string | null
  photoUrl?: string | null
  order?: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

// School Leaders
export interface SchoolLeader {
  id: string
  name: string
  position: string
  photoUrl?: string | null
  order?: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

// Year Group Reps — backend returns Record<year, Array<{name, contact?, email?}>>
export interface YearGroupRep {
  name: string
  contact?: string | null
  email?: string | null
}

export type YearGroupRepsByYear = Record<string, YearGroupRep[]>

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  fullName: string
  email: string
  password: string
  gender?: Gender
  dateOfBirth?: string
  mobileNumber?: string
  yearGroup?: number
  programme?: Programme
  house?: House
  consentGiven: boolean
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    token: string
    refreshToken?: string
    member: Member
  }
}
