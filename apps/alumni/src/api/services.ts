import client from './client'
import type {
  ApiResponse, AuthResponse, PaginatedResponse, LoginCredentials,
  Member, Event, EventRsvp, Project, News, Donation, Due, Job, JobApplication,
  MentorshipRequest, ForumPost, ForumComment, Poll, Election, ContactMessage,
  PaymentMethod,
} from '../types'

// Auth
export const authApi = {
  login: (data: LoginCredentials) =>
    client.post<AuthResponse>('/auth/login', data),
  register: (data: FormData) =>
    client.post<AuthResponse>('/auth/register', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  me: () =>
    client.get<ApiResponse<Member>>('/auth/me'),
  forgotPassword: (email: string) =>
    client.post<ApiResponse>('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    client.post<ApiResponse>('/auth/reset-password', data),
  verifyEmail: (token: string) =>
    client.get<ApiResponse>(`/auth/verify-email/${token}`),
  logout: () =>
    client.post<ApiResponse>('/auth/logout'),
}

// Members
export const membersApi = {
  directory: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Member>>('/members/directory', { params }),
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Member>>('/members', { params }),
  getById: (id: string) =>
    client.get<ApiResponse<Member>>(`/members/${id}`),
  updateProfile: (data: Partial<Member>) =>
    client.put<ApiResponse<Member>>('/members/profile', data),
  uploadPhoto: (file: FormData) =>
    client.post<ApiResponse<{ photoUrl: string }>>('/members/profile/photo', file, { headers: { 'Content-Type': 'multipart/form-data' } }),
  myDues: () =>
    client.get<ApiResponse<Due[]>>('/members/my/dues'),
  myDonations: () =>
    client.get<ApiResponse<Donation[]>>('/members/my/donations'),
}

// Events
export const eventsApi = {
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Event>>('/events', { params }),
  upcoming: () =>
    client.get<ApiResponse<Event[]>>('/events/upcoming'),
  past: () =>
    client.get<ApiResponse<Event[]>>('/events/past'),
  getBySlug: (slug: string) =>
    client.get<ApiResponse<Event>>(`/events/${slug}`),
  rsvp: (id: string, data: Partial<EventRsvp>) =>
    client.post<ApiResponse>(`/events/${id}/rsvp`, data),
}

// Projects
export const projectsApi = {
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Project>>('/projects', { params }),
  ongoing: () =>
    client.get<ApiResponse<Project[]>>('/projects/ongoing'),
  completed: () =>
    client.get<ApiResponse<Project[]>>('/projects/completed'),
  getBySlug: (slug: string) =>
    client.get<ApiResponse<Project>>(`/projects/${slug}`),
}

// News
export const newsApi = {
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<News>>('/news', { params }),
  getBySlug: (slug: string) =>
    client.get<ApiResponse<News>>(`/news/${slug}`),
}

// Donations
export const donationsApi = {
  create: (data: Partial<Donation>) =>
    client.post<ApiResponse<Donation>>('/donations', data),
  my: () =>
    client.get<ApiResponse<Donation[]>>('/donations/my'),
}

// Dues
export const duesApi = {
  my: () =>
    client.get<ApiResponse<Due[]>>('/dues/my'),
  summary: () =>
    client.get<ApiResponse<{ totalDues: number; totalPaid: number; totalPending: number; totalOverdue: number }>>('/dues/my/summary'),
  pay: (dueId: string, data: { transactionRef: string; channel?: string; notes?: string }) =>
    client.post<ApiResponse<Due>>(`/dues/my/${dueId}/pay`, data),
}

// Jobs
export const jobsApi = {
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Job>>('/jobs', { params }),
  getById: (id: string) =>
    client.get<ApiResponse<Job>>(`/jobs/${id}`),
  create: (data: Partial<Job>) =>
    client.post<ApiResponse<Job>>('/jobs', data),
  apply: (jobId: string, data: { coverLetter?: string; resumeUrl?: string }) =>
    client.post<ApiResponse<JobApplication>>(`/jobs/${jobId}/apply`, data),
  myPostings: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Job>>('/jobs/my/postings', { params }),
  myApplications: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<JobApplication>>('/jobs/my/applications', { params }),
  updateMyJob: (id: string, data: Partial<Job>) =>
    client.put<ApiResponse<Job>>(`/jobs/my/${id}`, data),
  deleteMyJob: (id: string) =>
    client.delete<ApiResponse>(`/jobs/my/${id}`),
  getApplications: (jobId: string, params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<JobApplication>>(`/jobs/${jobId}/applications`, { params }),
  updateApplicationStatus: (applicationId: string, data: { status: string; notes?: string }) =>
    client.put<ApiResponse>(`/jobs/applications/${applicationId}/status`, data),
}

// Mentorship
export const mentorshipApi = {
  mentors: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Member>>('/mentorship/mentors', { params }),
  request: (data: { mentorId: string; message?: string }) =>
    client.post<ApiResponse<MentorshipRequest>>('/mentorship/request', data),
  myRequests: () =>
    client.get<ApiResponse<MentorshipRequest[]>>('/mentorship/my/requests'),
  myMentees: () =>
    client.get<ApiResponse<MentorshipRequest[]>>('/mentorship/my/mentees'),
  respond: (id: string, data: { status: 'ACCEPTED' | 'DECLINED'; mentorResponse?: string }) =>
    client.put<ApiResponse>(`/mentorship/requests/${id}/respond`, data),
  myProfile: () =>
    client.get<ApiResponse<Pick<Member, 'id' | 'fullName' | 'isAvailableAsMentor' | 'mentorBio' | 'areaOfExpertise' | 'occupation' | 'organization'>>>('/mentorship/my/profile'),
  toggleAvailability: (data: { isAvailableAsMentor: boolean; mentorBio?: string }) =>
    client.put<ApiResponse>('/mentorship/my/availability', data),
}

// Forum
export const forumApi = {
  posts: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<ForumPost>>('/forum/posts', { params }),
  getBySlug: (slug: string) =>
    client.get<ApiResponse<ForumPost>>(`/forum/posts/${slug}`),
  create: (data: { title: string; content: string; category: string }) =>
    client.post<ApiResponse<ForumPost>>('/forum/posts', data),
  update: (id: string, data: Partial<ForumPost>) =>
    client.put<ApiResponse<ForumPost>>(`/forum/posts/${id}`, data),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/forum/posts/${id}`),
  addComment: (postId: string, data: { content: string; parentId?: string }) =>
    client.post<ApiResponse<ForumComment>>(`/forum/posts/${postId}/comments`, data),
  deleteComment: (id: string) =>
    client.delete<ApiResponse>(`/forum/comments/${id}`),
}

// Polls
export const pollsApi = {
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Poll>>('/polls', { params }),
  getById: (id: string) =>
    client.get<ApiResponse<Poll>>(`/polls/${id}`),
  vote: (id: string, selectedOptions: number[]) =>
    client.post<ApiResponse>(`/polls/${id}/vote`, { selectedOptions }),
}

// Elections
export const electionsApi = {
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Election>>('/elections', { params }),
  getById: (id: string) =>
    client.get<ApiResponse<Election>>(`/elections/${id}`),
  vote: (id: string, candidateId: string) =>
    client.post<ApiResponse>(`/elections/${id}/vote`, { candidateId }),
}

// Contact
export const contactApi = {
  send: (data: ContactMessage) =>
    client.post<ApiResponse>('/contact', data),
}

// Payment Methods (public — enabled only)
export const paymentMethodsApi = {
  list: () =>
    client.get<ApiResponse<PaymentMethod[]>>('/payment-methods'),
}

// Payments
export const paymentsApi = {
  initialize: (data: { provider: string; purpose: string; amount: number; currency: string; email: string; name?: string; donationId?: string; dueId?: string; callbackUrl?: string }) =>
    client.post<ApiResponse<{ paymentId: string; reference: string; authorizationUrl: string; provider: string }>>('/payments/initialize', data),
  verify: (reference: string) =>
    client.get<ApiResponse>(`/payments/verify/${reference}`),
  status: (reference: string) =>
    client.get<ApiResponse>(`/payments/status/${reference}`),
}

// Site Config
export const siteConfigApi = {
  getSiteData: () => client.get('/public/site-data'),
  getConfig: (key: string) => client.get(`/public/config/${key}`),
}
