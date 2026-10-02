import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Member } from './types';
import { authApi, setSessionExpiredHandler } from './api';
import { REFRESH_TOKEN_KEY, TOKEN_KEY, getToken, removeToken, setToken } from './token-storage';

const USER_KEY = 'uposa_alumni_user';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: Member | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  hydrate: () => Promise<void>;
  login: (token: string, user: Member, refreshToken?: string) => Promise<void>;
  updateUser: (updates: Partial<Member>) => void;
  setTokens: (token: string, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrating: true,

  hydrate: async () => {
    try {
      const [token, refreshToken, userJson] = await Promise.all([
        getToken(TOKEN_KEY),
        getToken(REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (token && userJson) {
        const user = JSON.parse(userJson) as Member;
        set({ token, refreshToken, user, isAuthenticated: true });
        // Refresh in background
        authApi
          .me()
          .then((res) => {
            // /auth/me wraps the member in { type, data } — unwrap either shape.
            const payload = res.data.data as Member | { data: Member } | undefined;
            const fresh = payload && 'data' in payload ? (payload as { data: Member }).data : payload;
            if (fresh) {
              AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
              set({ user: fresh });
            }
          })
          .catch(() => {});
      }
    } finally {
      set({ isHydrating: false });
    }
  },

  login: async (token, user, refreshToken) => {
    const writes: Promise<void>[] = [
      setToken(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    ];
    if (refreshToken) {
      writes.push(setToken(REFRESH_TOKEN_KEY, refreshToken));
    } else {
      writes.push(removeToken(REFRESH_TOKEN_KEY));
    }
    await Promise.all(writes);
    set({ token, refreshToken: refreshToken ?? null, user, isAuthenticated: true });
  },

  updateUser: (updates) => {
    const current = get().user;
    if (!current) return;
    const next = { ...current, ...updates };
    AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
    set({ user: next });
  },

  // Replace the session tokens without touching the member (e.g. after a
  // password change, which revokes the previous refresh token).
  setTokens: async (token, refreshToken) => {
    await setToken(TOKEN_KEY, token);
    if (refreshToken) await setToken(REFRESH_TOKEN_KEY, refreshToken);
    set({ token, refreshToken: refreshToken ?? get().refreshToken });
  },

  logout: async () => {
    // Best-effort server sign-out; never block local sign-out on it.
    try {
      await authApi.logout();
    } catch {}
    await Promise.all([
      removeToken(TOKEN_KEY),
      removeToken(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  },
}));

// Refresh failed in the API client: tokens are already gone, drop the cached
// member and in-memory session so AuthGate routes to login.
setSessionExpiredHandler(() => {
  AsyncStorage.removeItem(USER_KEY);
  useAuthStore.setState({ token: null, refreshToken: null, user: null, isAuthenticated: false });
});
