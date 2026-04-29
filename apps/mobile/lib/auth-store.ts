import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Member } from './types';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, authApi } from './api';

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
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (token && userJson) {
        const user = JSON.parse(userJson) as Member;
        set({ token, refreshToken, user, isAuthenticated: true });
        // Refresh in background
        authApi
          .me()
          .then((res) => {
            const fresh = res.data.data;
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
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    ];
    if (refreshToken) {
      writes.push(AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken));
    } else {
      writes.push(AsyncStorage.removeItem(REFRESH_TOKEN_KEY));
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

  logout: async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  },
}));
