import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import type {
  ApiResponse, AuthResponse, PaginatedResponse, LoginCredentials,
  Member, Event, EventRsvp, News, Due, Project, Donation,
  Job, JobApplication, MentorshipRequest,
  ForumPost, ForumComment, Poll, Election, ContactMessage,
  PaymentMethod,
} from './types';

const TOKEN_KEY = 'uposa_alumni_token';
const REFRESH_TOKEN_KEY = 'uposa_alumni_refresh_token';

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
  'http://localhost:5000/api';

export const client = axios.create({
  baseURL: apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh queue: only one refresh in flight; queue concurrent 401s.
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

async function clearAuthAndRedirect() {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
  ]);
  try {
    router.replace('/(auth)/login');
  } catch {
    // router may not be ready at boot
  }
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
  headers?: AxiosRequestConfig['headers'];
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    const accessToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (!refreshToken || !accessToken) {
      if (accessToken) await clearAuthAndRedirect();
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }
          if (original.headers) {
            (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
          } else {
            original.headers = { Authorization: `Bearer ${newToken}` } as AxiosRequestConfig['headers'];
          }
          resolve(client(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshRes = await axios.post<ApiResponse<{ token: string; refreshToken: string }>>(
        `${apiUrl}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      const data = refreshRes.data?.data;
      const newToken = data?.token;
      const newRefreshToken = data?.refreshToken;
      if (!newToken) throw new Error('No token returned from refresh');

      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      if (newRefreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }
      flushQueue(newToken);

      if (original.headers) {
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
      } else {
        original.headers = { Authorization: `Bearer ${newToken}` } as AxiosRequestConfig['headers'];
      }
      return client(original);
    } catch (refreshErr) {
      flushQueue(null);
      await clearAuthAndRedirect();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// -------- Auth --------
export const authApi = {
  login: (data: LoginCredentials) =>
    client.post<AuthResponse>('/auth/login', data),
  me: () =>
    client.get<ApiResponse<Member>>('/auth/me'),
  forgotPassword: (email: string) =>
    client.post<ApiResponse>('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    client.post<ApiResponse>('/auth/reset-password', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.put<ApiResponse>('/auth/change-password', data),
  logout: () =>
    client.post<ApiResponse>('/auth/logout'),
};

// -------- Members --------
export const membersApi = {
  directory: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Member>>('/members/directory', { params }),
  getById: (id: string) =>
    client.get<ApiResponse<Member>>(`/members/${id}`),
  updateProfile: (data: Partial<Member>) =>
    client.put<ApiResponse<Member>>('/members/profile', data),
  myDues: () =>
    client.get<ApiResponse<Due[]>>('/members/my/dues'),
};

// -------- Events --------
export const eventsApi = {
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Event>>('/events', { params }),
  upcoming: () =>
    client.get<ApiResponse<Event[]>>('/events/upcoming'),
  getBySlug: (slug: string) =>
    client.get<ApiResponse<Event>>(`/events/${slug}`),
  rsvp: (id: string, data: Partial<EventRsvp>) =>
    client.post<ApiResponse>(`/events/${id}/rsvp`, data),
};

// -------- News --------
export const newsApi = {
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<News>>('/news', { params }),
  getBySlug: (slug: string) =>
    client.get<ApiResponse<News>>(`/news/${slug}`),
};

// -------- Dues --------
export const duesApi = {
  my: () =>
    client.get<ApiResponse<Due[]>>('/dues/my'),
  summary: () =>
    client.get<ApiResponse<{
      totalDues: number;
      totalPaid: number;
      totalPending: number;
      totalOverdue: number;
    }>>('/dues/my/summary'),
};

// -------- Forum --------
export const forumApi = {
  posts: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<ForumPost>>('/forum/posts', { params }),
  getBySlug: (slug: string) =>
    client.get<ApiResponse<ForumPost>>(`/forum/posts/${slug}`),
  create: (data: { title: string; content: string; category: string }) =>
    client.post<ApiResponse<ForumPost>>('/forum/posts', data),
  addComment: (postId: string, data: { content: string; parentId?: string }) =>
    client.post<ApiResponse<ForumComment>>(`/forum/posts/${postId}/comments`, data),
};

// -------- Polls --------
export const pollsApi = {
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Poll>>('/polls', { params }),
  getById: (id: string) =>
    client.get<ApiResponse<Poll>>(`/polls/${id}`),
  vote: (id: string, selectedOptions: number[]) =>
    client.post<ApiResponse>(`/polls/${id}/vote`, { selectedOptions }),
};

// -------- Elections --------
export const electionsApi = {
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Election>>('/elections', { params }),
  getById: (id: string) =>
    client.get<ApiResponse<Election>>(`/elections/${id}`),
  vote: (id: string, candidateId: string) =>
    client.post<ApiResponse>(`/elections/${id}/vote`, { candidateId }),
};

// -------- Jobs --------
export const jobsApi = {
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Job>>('/jobs', { params }),
  getById: (id: string) =>
    client.get<ApiResponse<Job>>(`/jobs/${id}`),
  apply: (jobId: string, data: { coverLetter?: string; resumeUrl?: string }) =>
    client.post<ApiResponse<JobApplication>>(`/jobs/${jobId}/apply`, data),
};

// -------- Mentorship --------
export const mentorshipApi = {
  mentors: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Member>>('/mentorship/mentors', { params }),
  request: (data: { mentorId: string; message?: string }) =>
    client.post<ApiResponse<MentorshipRequest>>('/mentorship/request', data),
  myRequests: () =>
    client.get<ApiResponse<MentorshipRequest[]>>('/mentorship/my/requests'),
};

// -------- Donations --------
export const donationsApi = {
  create: (data: Partial<Donation>) =>
    client.post<ApiResponse<Donation>>('/donations', data),
  my: () =>
    client.get<ApiResponse<Donation[]>>('/donations/my'),
};

// -------- Projects --------
export const projectsApi = {
  list: (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Project>>('/projects', { params }),
  ongoing: () =>
    client.get<ApiResponse<Project[]>>('/projects/ongoing'),
  getBySlug: (slug: string) =>
    client.get<ApiResponse<Project>>(`/projects/${slug}`),
};

// -------- Contact --------
export const contactApi = {
  send: (data: ContactMessage) =>
    client.post<ApiResponse>('/contact', data),
};

// -------- Payment Methods --------
export const paymentMethodsApi = {
  list: () =>
    client.get<ApiResponse<PaymentMethod[]>>('/payment-methods'),
};

// -------- Payments --------
export const paymentsApi = {
  initialize: (data: {
    provider: string;
    purpose: string;
    amount: number;
    currency: string;
    email: string;
    name?: string;
    donationId?: string;
    dueId?: string;
    callbackUrl?: string;
  }) =>
    client.post<ApiResponse<{
      paymentId: string;
      reference: string;
      authorizationUrl: string;
      provider: string;
      amount: number;
      platformFee: number;
      totalAmount: number;
    }>>('/payments/initialize', data),
  status: (reference: string) =>
    client.get<ApiResponse>(`/payments/status/${reference}`),
  platformFeePreview: (amount: number) =>
    client.get<ApiResponse<{ amount: number; platformFee: number; totalAmount: number; percent: number; fixed: number; enabled: boolean }>>(`/payments/platform-fee?amount=${amount}`),
};

export { TOKEN_KEY, REFRESH_TOKEN_KEY };
