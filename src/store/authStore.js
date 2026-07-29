import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('userInfo')) || null,
  token: localStorage.getItem('accessToken') || null,
  role: JSON.parse(localStorage.getItem('userInfo'))?.role || null,
  isAuthenticated: !!localStorage.getItem('userInfo'),
  loading: false,
  
  setLoading: (loading) => set({ loading }),
  
  login: (userData, token) => {
    const data = { ...userData, permissions: userData.permissions || [] };
    localStorage.setItem('userInfo', JSON.stringify(data));
    localStorage.setItem('accessToken', token);
    set({ user: data, token, role: data.role, isAuthenticated: true });
  },
  
  updateUser: (updates) => {
    set((state) => {
      const updated = { ...state.user, ...updates };
      localStorage.setItem('userInfo', JSON.stringify(updated));
      return { user: updated };
    });
  },
  
  logout: () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('accessToken');
    set({ user: null, token: null, role: null, isAuthenticated: false });
  }
}));

export default useAuthStore;
