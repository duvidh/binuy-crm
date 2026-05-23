import { create } from 'zustand';
import { api, setAccessToken } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    set({ user: res.data.user });
  },

  logout: async () => {
    await api.post('/auth/logout').catch(() => {});
    setAccessToken(null);
    set({ user: null });
  },

  // Try to restore a session via the refresh-token cookie on app load.
  bootstrap: async () => {
    try {
      const res = await api.post('/auth/refresh');
      setAccessToken(res.data.accessToken);
      set({ user: res.data.user });
    } catch {
      setAccessToken(null);
      set({ user: null });
    } finally {
      set({ initialized: true });
    }
  },

  hasRole: (...roles) => {
    const role = get().user?.role;
    return !!role && (roles.length === 0 || roles.includes(role));
  },
}));

// Force logout when the API client signals an unrecoverable 401.
window.addEventListener('auth:logout', () => {
  setAccessToken(null);
  useAuth.setState({ user: null });
});
