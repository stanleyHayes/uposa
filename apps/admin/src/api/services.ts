import client from './client'

// Generic response types
interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

interface PaginatedResponse<T = unknown> {
  success: boolean
  data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

type Params = Record<string, string | number | boolean | undefined>

export type AIWritingAction =
  | 'formalize'
  | 'summarize'
  | 'make_casual'
  | 'expand'
  | 'fix_grammar'
  | 'create_from_prompt'
  | 'improve_clarity'
  | 'generate_title'
  | 'generate_message'
  | 'translate'

export interface AIWritingRequest {
  action: AIWritingAction
  text?: string
  fullText?: string
  prompt?: string
  language?: string
  fieldContext?: string
  contentType?: 'plain' | 'markdown'
}

export interface AIWritingResult {
  output: string
  action: AIWritingAction
  model: string
  usage: {
    limit: number
    remaining: number
    resetAt: string
  }
}

// Auth
export const adminAuthApi = {
  login: (data: { email: string; password: string }) =>
    client.post<ApiResponse<{ token: string; refreshToken: string; admin: unknown }>>('/auth/admin/login', data),
  me: () =>
    client.get<ApiResponse>('/auth/me'),
  logout: () =>
    client.post<ApiResponse>('/auth/logout'),
}

// Executives
export const adminExecutivesApi = {
  list: (params?: Params) =>
    client.get<PaginatedResponse>('/admin/executives', { params }),
  getById: (id: string) =>
    client.get<ApiResponse>(`/admin/executives/${id}`),
  create: (data: FormData) =>
    client.post<ApiResponse>('/admin/executives', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    client.put<ApiResponse>(`/admin/executives/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/admin/executives/${id}`),
}

// Dashboard
export const adminDashboardApi = {
  stats: () =>
    client.get<ApiResponse>('/admin/dashboard/stats'),
}

// AI Writing Assistant
export const adminAiApi = {
  write: (data: AIWritingRequest) =>
    client.post<ApiResponse<AIWritingResult>>('/admin/ai/writing', data),
}

// Admin Management
export const adminUsersApi = {
  list: (params?: Params) =>
    client.get<PaginatedResponse>('/admin/admins', { params }),
  create: (data: { fullName: string; email: string; password: string; role?: string }) =>
    client.post<ApiResponse>('/admin/admins', data),
  update: (id: string, data: { fullName?: string; email?: string; role?: string; isActive?: boolean }) =>
    client.put<ApiResponse>(`/admin/admins/${id}`, data),
  deactivate: (id: string) =>
    client.delete<ApiResponse>(`/admin/admins/${id}`),
}

// Members / Alumni
export const adminMembersApi = {
  list: (params?: Params) =>
    client.get<PaginatedResponse>('/admin/members', { params }),
  getById: (id: string) =>
    client.get<ApiResponse>(`/admin/members/${id}`),
  approve: (id: string) =>
    client.put<ApiResponse>(`/admin/members/${id}/approve`),
  suspend: (id: string) =>
    client.put<ApiResponse>(`/admin/members/${id}/suspend`),
  changeStatus: (id: string, status: string) =>
    client.put<ApiResponse>(`/admin/members/${id}/status`, { status }),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/admin/members/${id}`),
  directory: (params?: Params) =>
    client.get<PaginatedResponse>('/members/directory', { params }),
}

// Events
export const adminEventsApi = {
  list: (params?: Params) =>
    client.get<PaginatedResponse>('/events', { params }),
  upcoming: () =>
    client.get<ApiResponse>('/events/upcoming'),
  past: () =>
    client.get<ApiResponse>('/events/past'),
  getBySlug: (slug: string) =>
    client.get<ApiResponse>(`/events/${slug}`),
  create: (data: FormData) =>
    client.post<ApiResponse>('/events/admin', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData | Record<string, unknown>) =>
    client.put<ApiResponse>(`/events/admin/${id}`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/events/admin/${id}`),
  getRsvps: (id: string, params?: Params) =>
    client.get<PaginatedResponse>(`/events/admin/${id}/rsvps`, { params }),
}

// Projects
export const adminProjectsApi = {
  list: (params?: Params) =>
    client.get<PaginatedResponse>('/projects', { params }),
  ongoing: () =>
    client.get<ApiResponse>('/projects/ongoing'),
  completed: () =>
    client.get<ApiResponse>('/projects/completed'),
  getBySlug: (slug: string) =>
    client.get<ApiResponse>(`/projects/${slug}`),
  create: (data: FormData) =>
    client.post<ApiResponse>('/projects/admin', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData | Record<string, unknown>) =>
    client.put<ApiResponse>(`/projects/admin/${id}`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/projects/admin/${id}`),
}

// News
export const adminNewsApi = {
  list: (params?: Params) =>
    client.get<PaginatedResponse>('/news/admin', { params }),
  getById: (id: string) =>
    client.get<ApiResponse>(`/news/admin/${id}`),
  getBySlug: (slug: string) =>
    client.get<ApiResponse>(`/news/${slug}`),
  create: (data: FormData) =>
    client.post<ApiResponse>('/news/admin', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData | Record<string, unknown>) =>
    client.put<ApiResponse>(`/news/admin/${id}`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/news/admin/${id}`),
}

// Donations
export const adminDonationsApi = {
  summary: () =>
    client.get<ApiResponse>('/donations/admin/summary'),
  list: (params?: Params) =>
    client.get<PaginatedResponse>('/donations/admin', { params }),
  confirm: (id: string) =>
    client.put<ApiResponse>(`/donations/admin/${id}/confirm`),
}

// Dues
export const adminDuesApi = {
  list: (params?: Params) =>
    client.get<PaginatedResponse>('/dues/admin', { params }),
  create: (data: { memberId: string; amount: number; year: number; notes?: string }) =>
    client.post<ApiResponse>('/dues/admin', data),
  markPaid: (id: string, data: { transactionRef?: string; notes?: string }) =>
    client.put<ApiResponse>(`/dues/admin/${id}/mark-paid`, data),
  bulkCreate: (data: { amount: number; year: number; notes?: string }) =>
    client.post<ApiResponse>('/dues/admin/bulk', data),
}

// Jobs
export const adminJobsApi = {
  listAll: (params?: Params) =>
    client.get<PaginatedResponse>('/jobs/admin/all', { params }),
  listPending: (params?: Params) =>
    client.get<PaginatedResponse>('/jobs/admin/pending', { params }),
  approve: (id: string) =>
    client.put<ApiResponse>(`/jobs/admin/${id}/approve`),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/jobs/admin/${id}`),
  getApplications: (jobId: string, params?: Params) =>
    client.get<PaginatedResponse>(`/jobs/admin/${jobId}/applications`, { params }),
  updateApplicationStatus: (applicationId: string, data: { status: string; notes?: string }) =>
    client.put<ApiResponse>(`/jobs/admin/applications/${applicationId}/status`, data),
}

// Mentorship
export const adminMentorshipApi = {
  listRequests: (params?: Params) =>
    client.get<PaginatedResponse>('/mentorship/admin/requests', { params }),
  listMentors: (params?: Params) =>
    client.get<PaginatedResponse>('/mentorship/admin/mentors', { params }),
  deleteRequest: (id: string) =>
    client.delete<ApiResponse>(`/mentorship/admin/requests/${id}`),
}

// Forum
export const adminForumApi = {
  listPosts: (params?: Params) =>
    client.get<PaginatedResponse>('/forum/admin/posts', { params }),
  updatePost: (id: string, data: { title?: string; content?: string; category?: string }) =>
    client.put<ApiResponse>(`/forum/admin/posts/${id}`, data),
  togglePin: (id: string) =>
    client.put<ApiResponse>(`/forum/admin/posts/${id}/pin`),
  toggleLock: (id: string) =>
    client.put<ApiResponse>(`/forum/admin/posts/${id}/lock`),
  deletePost: (id: string) =>
    client.delete<ApiResponse>(`/forum/admin/posts/${id}`),
  deleteComment: (id: string) =>
    client.delete<ApiResponse>(`/forum/admin/comments/${id}`),
}

// Polls
export const adminPollsApi = {
  listAll: (params?: Params) =>
    client.get<PaginatedResponse>('/polls/admin/all', { params }),
  create: (data: { question: string; description?: string; options: { id: number; text: string }[]; allowMultiple?: boolean; endsAt?: string }) =>
    client.post<ApiResponse>('/polls/admin', data),
  update: (id: string, data: { question?: string; description?: string; endsAt?: string }) =>
    client.put<ApiResponse>(`/polls/admin/${id}`, data),
  close: (id: string) =>
    client.put<ApiResponse>(`/polls/admin/${id}/close`),
  getResults: (id: string) =>
    client.get<ApiResponse>(`/polls/admin/${id}/results`),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/polls/admin/${id}`),
}

// Elections
export const adminElectionsApi = {
  listAll: (params?: Params) =>
    client.get<PaginatedResponse>('/elections/admin/all', { params }),
  create: (data: { title: string; description?: string; position: string; candidates: { id: string; name: string; memberId?: string; bio?: string; photoUrl?: string }[]; startDate: string; endDate: string }) =>
    client.post<ApiResponse>('/elections/admin', data),
  update: (id: string, data: { title?: string; description?: string; startDate?: string; endDate?: string }) =>
    client.put<ApiResponse>(`/elections/admin/${id}`, data),
  changeStatus: (id: string, status: string) =>
    client.put<ApiResponse>(`/elections/admin/${id}/status`, { status }),
  getResults: (id: string) =>
    client.get<ApiResponse>(`/elections/admin/${id}/results`),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/elections/admin/${id}`),
}

// Payment Methods (admin)
export const adminPaymentMethodsApi = {
  list: () =>
    client.get<ApiResponse>('/payment-methods/admin'),
  getById: (id: string) =>
    client.get<ApiResponse>(`/payment-methods/admin/${id}`),
  create: (data: { provider: string; displayName: string; description?: string; isEnabled?: boolean; supportedCurrencies: string[]; countries: string[]; credentials?: Record<string, string>; config?: Record<string, unknown> }) =>
    client.post<ApiResponse>('/payment-methods/admin', data),
  update: (id: string, data: { displayName?: string; description?: string; isEnabled?: boolean; supportedCurrencies?: string[]; countries?: string[]; credentials?: Record<string, string>; config?: Record<string, unknown> }) =>
    client.put<ApiResponse>(`/payment-methods/admin/${id}`, data),
  toggle: (id: string, isEnabled: boolean) =>
    client.patch<ApiResponse>(`/payment-methods/admin/${id}/toggle`, { isEnabled }),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/payment-methods/admin/${id}`),
}

// Payments (admin)
export const adminPaymentsApi = {
  list: (params?: Params) =>
    client.get<PaginatedResponse>('/payments/admin', { params }),
}

// School Leaders
export const adminSchoolLeadersApi = {
  list: (params?: Params) =>
    client.get<PaginatedResponse>('/admin/school-leaders', { params }),
  getById: (id: string) =>
    client.get<ApiResponse>(`/admin/school-leaders/${id}`),
  create: (data: FormData) =>
    client.post<ApiResponse>('/admin/school-leaders', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    client.put<ApiResponse>(`/admin/school-leaders/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/admin/school-leaders/${id}`),
}

// Newsletter
export const adminNewsletterApi = {
  list: (params?: Params) =>
    client.get<PaginatedResponse>('/admin/newsletter', { params }),
  unsubscribe: (id: string) =>
    client.put<ApiResponse>(`/admin/newsletter/${id}/unsubscribe`),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/admin/newsletter/${id}`),
}

// Gallery
export const adminGalleryApi = {
  list: (params?: Params) =>
    client.get<ApiResponse>('/admin/gallery', { params }),
  upload: (data: FormData) =>
    client.post<ApiResponse>('/admin/gallery/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateItem: (id: string, data: { title?: string; caption?: string; description?: string }) =>
    client.put<ApiResponse>(`/admin/gallery/items/${id}`, data),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/admin/gallery/${id}`),
  bulkDelete: (ids: string[]) =>
    client.post<ApiResponse>('/admin/gallery/bulk-delete', { ids }),
  // Categories
  listCategories: () =>
    client.get<ApiResponse>('/admin/gallery/categories'),
  getCategory: (id: string) =>
    client.get<ApiResponse>(`/admin/gallery/categories/${id}`),
  createCategory: (data: FormData) =>
    client.post<ApiResponse>('/admin/gallery/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCategory: (id: string, data: FormData) =>
    client.put<ApiResponse>(`/admin/gallery/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCategory: (id: string) =>
    client.delete<ApiResponse>(`/admin/gallery/categories/${id}`),
}

// Contact
export const adminContactApi = {
  list: (params?: Params) =>
    client.get<PaginatedResponse>('/contact/admin', { params }),
  markRead: (id: string) =>
    client.put<ApiResponse>(`/contact/admin/${id}/read`),
  delete: (id: string) =>
    client.delete<ApiResponse>(`/contact/admin/${id}`),
}
