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

  login: (userData, accessToken) => {
    const data = { ...userData, permissions: userData.permissions || [] };
    localStorage.setItem('userInfo', JSON.stringify(data));
    localStorage.setItem('accessToken', accessToken);
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
      const { data } = await api.post('/auth/refresh-token');
      const newToken = data.data.accessToken;
      localStorage.setItem('accessToken', newToken);
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
    try { api.post('/auth/logout'); } catch { /* best effort */ }
    localStorage.removeItem('userInfo');
    localStorage.removeItem('accessToken');
    set({ user: null, token: null, role: null, isAuthenticated: false, _refreshTimer: null });
  },
}));

export default useAuthStore;
