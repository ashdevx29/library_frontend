import api from './api';

export const getMembers = async (params = {}) => {
  const { data } = await api.get('/members', { params });
  return data.data;
};

export const getMember = async (id) => {
  const { data } = await api.get(`/members/${id}`);
  return data.data;
};

export const createMember = async (payload) => {
  const { data } = await api.post('/members', payload);
  return data.data;
};

export const updateMember = async (id, payload) => {
  const { data } = await api.put(`/members/${id}`, payload);
  return data.data;
};

export const deleteMember = async (id) => {
  const { data } = await api.delete(`/members/${id}`);
  return data;
};

export const renewMembership = async (id, payload) => {
  const { data } = await api.post(`/members/${id}/renew`, payload);
  return data.data;
};

export const getMemberStats = async () => {
  const { data } = await api.get('/members/stats');
  return data.data;
};

export const getMemberAttendance = async (id) => {
  const { data } = await api.get(`/members/${id}/attendance`);
  return data.data;
};

export const getMemberPayments = async (id) => {
  const { data } = await api.get(`/members/${id}/payments`);
  return data.data;
};

export const getMembershipHistory = async (id) => {
  const { data } = await api.get(`/members/${id}/membership-history`);
  return data.data;
};

export const getShifts = async () => {
  const { data } = await api.get('/shifts');
  return data.data;
};

export const getAvailableSeats = async () => {
  const { data } = await api.get('/seats/available');
  return data.data;
};
