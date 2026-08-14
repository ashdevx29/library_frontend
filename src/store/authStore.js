import { create } from 'zustand';
import api from '../utils/api';

const TOKEN_REFRESH_THRESHOLD = 10 * 60 * 1000;

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('userInfo')) || null,
  token: localStorage.getItem('accessToken') || null,
  role: JSON.parse(localStorage.getItem('userInfo'))?.role || null,
  isAuthenticated: !!localStorage.getItem('userInfo'),
  loading: false,

  setLoading: (loading) => set({ loading }),

  login: (userData, accessToken, refreshToken) => {
    const data = { ...userData, permissions: userData.permissions || [] };
    localStorage.setItem('userInfo', JSON.stringify(data));
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    set({ user: data, token: accessToken, role: data.role, isAuthenticated: true });
    get().scheduleTokenRefresh();
  },

  updateUser: (updates) => {
    set((state) => {
      const updated = { ...state.user, ...updates };
      localStorage.setItem('userInfo', JSON.stringify(updated));
      return { user: updated };
    });
  },

  refreshToken: async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const { data } = await api.post('/auth/refresh-token', { refreshToken: storedRefreshToken });
      const newToken = data.data.accessToken;
      const newRefreshToken = data.data.refreshToken || storedRefreshToken;
      localStorage.setItem('accessToken', newToken);
      if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
      set({ token: newToken });
      return newToken;
    } catch {
      get().logout();
      return null;
    }
  },

  scheduleTokenRefresh: () => {
    const state = get();
    if (state._refreshTimer) clearTimeout(state._refreshTimer);
    const timer = setTimeout(() => state.refreshToken(), TOKEN_REFRESH_THRESHOLD);
    set({ _refreshTimer: timer });
  },

  logout: () => {
    const state = get();
    if (state._refreshTimer) clearTimeout(state._refreshTimer);
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      api.post('/auth/logout', { refreshToken: storedRefreshToken });
    } catch { /* best effort */ }
    localStorage.removeItem('userInfo');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null, role: null, isAuthenticated: false, _refreshTimer: null });
  },
}));

export default useAuthStore;
