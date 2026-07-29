import api from './api';

// Admin
export const createPayment = async (payload) => {
  const { data } = await api.post('/payments', payload);
  return data.data;
};

export const getPayments = async (params = {}) => {
  const { data } = await api.get('/payments', { params });
  return data.data;
};

export const getPaymentById = async (id) => {
  const { data } = await api.get(`/payments/${id}`);
  return data.data;
};

export const getPaymentStats = async () => {
  const { data } = await api.get('/payments/stats');
  return data.data;
};

export const getPendingDues = async () => {
  const { data } = await api.get('/payments/pending-dues');
  return data.data;
};

export const markPaid = async (id) => {
  const { data } = await api.post(`/payments/${id}/mark-paid`);
  return data.data;
};

export const markFailed = async (id) => {
  const { data } = await api.post(`/payments/${id}/mark-failed`);
  return data.data;
};

export const downloadReceipt = async (id) => {
  const { data } = await api.get(`/payments/${id}/receipt`, { responseType: 'blob' });
  return data;
};

export const downloadInvoice = async (id) => {
  const { data } = await api.get(`/payments/${id}/invoice`, { responseType: 'blob' });
  return data;
};

// User
export const getMyPayments = async () => {
  const { data } = await api.get('/payments/user/my-payments');
  return data.data;
};

export const getMyRenewals = async () => {
  const { data } = await api.get('/payments/user/my-renewals');
  return data.data;
};

// Shared
export const getMembers = async (params = {}) => {
  const { data } = await api.get('/members', { params });
  return data.data;
};

export const getShifts = async () => {
  const { data } = await api.get('/shifts');
  return data.data;
};

// Membership (renewal)
export const requestRenewal = async (planType, amount, paymentMethod) => {
  const { data } = await api.post('/membership/renewal/request', { planType, amount, paymentMethod });
  return data.data;
};

export const getMyMembership = async () => {
  const { data } = await api.get('/membership/my-membership');
  return data.data;
};

export const getPendingRenewals = async () => {
  const { data } = await api.get('/membership/renewals/pending');
  return data.data;
};

export const getAllRenewals = async (status) => {
  const { data } = await api.get('/membership/renewals', { params: { status } });
  return data.data;
};

export const approveRenewal = async (id) => {
  const { data } = await api.post(`/membership/renewals/${id}/approve`);
  return data.data;
};

export const rejectRenewal = async (id, note) => {
  const { data } = await api.post(`/membership/renewals/${id}/reject`, { note });
  return data.data;
};
