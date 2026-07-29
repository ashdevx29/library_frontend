import api from './api';

export const getSeats = async (params = {}) => {
  const { data } = await api.get('/seats', { params });
  return data.data;
};

export const getSeatGrid = async () => {
  const { data } = await api.get('/seats/grid');
  return data.data;
};

export const getAvailableSeats = async (shift) => {
  const { data } = await api.get('/seats/available', { params: { shift } });
  return data.data;
};

export const getSeat = async (id) => {
  const { data } = await api.get(`/seats/${id}`);
  return data.data;
};

export const createSeat = async (payload) => {
  const { data } = await api.post('/seats', payload);
  return data.data;
};

export const updateSeat = async (id, payload) => {
  const { data } = await api.put(`/seats/${id}`, payload);
  return data.data;
};

export const deleteSeat = async (id) => {
  const { data } = await api.delete(`/seats/${id}`);
  return data;
};

export const updateSeatStatus = async (id, status) => {
  const { data } = await api.patch(`/seats/${id}/status`, { status });
  return data.data;
};

export const assignSeat = async (id, memberId, shiftId) => {
  const { data } = await api.post(`/seats/${id}/assign`, { memberId, shiftId });
  return data.data;
};

export const unassignSeat = async (id) => {
  const { data } = await api.post(`/seats/${id}/unassign`);
  return data.data;
};

export const transferSeat = async (id, toSeatId, memberId, shiftId) => {
  const { data } = await api.post(`/seats/${id}/transfer`, { toSeatId, memberId, shiftId });
  return data.data;
};

export const getSeatStats = async () => {
  const { data } = await api.get('/seats/stats');
  return data.data;
};

export const getSeatHistory = async (id, limit) => {
  const { data } = await api.get(`/seats/${id}/history`, { params: { limit } });
  return data.data;
};

export const getSeatUsage = async (id) => {
  const { data } = await api.get(`/seats/${id}/usage`);
  return data.data;
};

export const getShifts = async () => {
  const { data } = await api.get('/shifts');
  return data.data;
};

export const getMembers = async (params = {}) => {
  const { data } = await api.get('/members', { params });
  return data.data;
};
