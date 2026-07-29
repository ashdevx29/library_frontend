import { create } from 'zustand';
import api from '../services/api';

const useDashboardStore = create((set) => ({
  summary: null,
  attendance: [],
  revenue: [],
  expenses: [],
  occupancy: [],
  growth: [],
  activities: [],
  expiring: [],
  membership: null,
  notifications: [],
  loading: false,
  error: null,

  loadAdmin: async () => {
    set({ loading: true, error: null });
    try {
      const endpoints = [
        'summary',
        'attendance?months=6',
        'revenue',
        'expenses',
        'occupancy',
        'growth',
        'activity',
        'expiring-members',
      ];

      const results = await Promise.all(
        endpoints.map((p) => api.get(`/dashboard/admin/${p}`))
      );

      set({
        summary: results[0].data.data,
        attendance: results[1].data.data,
        revenue: results[2].data.data,
        expenses: results[3].data.data,
        occupancy: results[4].data.data,
        growth: results[5].data.data,
        activities: results[6].data.data,
        expiring: results[7].data.data,
        loading: false,
      });
    } catch (e) {
      set({
        loading: false,
        error:
          e.response?.data?.message ||
          (e.code === 'ERR_NETWORK'
            ? 'Network error. Check that the server is running.'
            : 'Dashboard could not be loaded.'),
      });
    }
  },

  loadUser: async () => {
    set({ loading: true, error: null });
    try {
      const endpoints = ['summary', 'attendance', 'membership', 'notifications'];
      const results = await Promise.all(
        endpoints.map((p) => api.get(`/dashboard/user/${p}`))
      );

      set({
        summary: results[0].data.data,
        attendance: results[1].data.data,
        membership: results[2].data.data,
        notifications: results[3].data.data,
        loading: false,
      });
    } catch (e) {
      set({
        loading: false,
        error: e.response?.data?.message || 'Dashboard could not be loaded.',
      });
    }
  },

  refresh: async (role) => {
    if (role === 'Student') {
      await useDashboardStore.getState().loadUser();
    } else {
      await useDashboardStore.getState().loadAdmin();
    }
  },
}));

export default useDashboardStore;
