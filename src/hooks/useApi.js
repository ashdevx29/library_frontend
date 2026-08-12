import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';

const fetcher = async (url) => { const { data } = await api.get(url); return data.data; };

// ─── Members ───
export const useMembers = (params = {}) => useQuery({ queryKey: ['members', params], queryFn: async () => { const { data } = await api.get('/members', { params }); return data.data; } });
export const useMember = (id) => useQuery({ queryKey: ['member', id], queryFn: () => fetcher(`/members/${id}`), enabled: !!id });
export const useCreateMember = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d) => api.post('/members', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); toast.success('Member created'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};
export const useUpdateMember = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => api.put(`/members/${id}`, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); toast.success('Member updated'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};
export const useDeleteMember = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => api.delete(`/members/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); toast.success('Member deleted'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};
export const useRenewMember = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => api.post(`/members/${id}/renew`, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); toast.success('Membership renewed'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};
export const useMemberAttendance = (id) => useQuery({ queryKey: ['member-attendance', id], queryFn: () => fetcher(`/members/${id}/attendance`), enabled: !!id });
export const useMemberPayments = (id) => useQuery({ queryKey: ['member-payments', id], queryFn: () => fetcher(`/members/${id}/payments`), enabled: !!id });
export const useMembershipHistory = (id) => useQuery({ queryKey: ['membership-history', id], queryFn: () => fetcher(`/members/${id}/history`), enabled: !!id });

// ─── Shifts ───
export const useShifts = () => useQuery({ queryKey: ['shifts'], queryFn: () => fetcher('/shifts') });
export const useCreateShift = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d) => api.post('/shifts', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); toast.success('Shift created'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};
export const useUpdateShift = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => api.put(`/shifts/${id}`, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); toast.success('Shift updated'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};
export const useDeleteShift = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => api.delete(`/shifts/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); toast.success('Shift deleted'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};

// ─── Seats ───
export const useSeats = (params = {}) => useQuery({ queryKey: ['seats', params], queryFn: async () => { const { data } = await api.get('/seats', { params }); return data.data; } });
export const useCreateSeat = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d) => api.post('/seats', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['seats'] }); toast.success('Seat created'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};
export const useUpdateSeat = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => api.put(`/seats/${id}`, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['seats'] }); toast.success('Seat updated'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};

// ─── Payments ───
export const usePayments = (params = {}) => useQuery({ queryKey: ['payments', params], queryFn: async () => { const { data } = await api.get('/payments', { params }); return data.data; } });
export const useCreatePayment = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d) => api.post('/payments', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); toast.success('Payment recorded'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};

// ─── Expenses ───
export const useExpenses = (params = {}) => useQuery({ queryKey: ['expenses', params], queryFn: async () => { const { data } = await api.get('/expenses', { params }); return data.data; } });
export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d) => api.post('/expenses', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense added'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};
export const useDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => api.delete(`/expenses/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense deleted'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};

// ─── Notifications ───
export const useNotifications = (params = {}) => useQuery({ queryKey: ['notifications', params], queryFn: async () => { const { data } = await api.get('/notifications', { params }); return data.data; } });
export const useCreateNotification = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d) => api.post('/notifications', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Notification created'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};
export const useSendNotification = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => api.post(`/notifications/${id}/send`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Notification sent'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};

// ─── Dashboard ───
export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: () => fetcher('/dashboard') });

// ─── Settings ───
export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: () => fetcher('/settings') });
export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d) => api.put('/settings', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Settings saved'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};

// ─── Backups ───
export const useBackups = () => useQuery({ queryKey: ['backups'], queryFn: () => fetcher('/backups') });
export const useCreateBackup = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.post('/backups/create'), onSuccess: () => { qc.invalidateQueries({ queryKey: ['backups'] }); toast.success('Backup created'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
};
