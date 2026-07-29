import api from './api';

export const getShifts = async () => {
  const { data } = await api.get('/shifts');
  return data.data;
};

export const getShift = async (id) => {
  const { data } = await api.get(`/shifts/${id}`);
  return data.data;
};

export const createShift = async (payload) => {
  const { data } = await api.post('/shifts', payload);
  return data.data;
};

export const updateShift = async (id, payload) => {
  const { data } = await api.put(`/shifts/${id}`, payload);
  return data.data;
};

export const deleteShift = async (id) => {
  const { data } = await api.delete(`/shifts/${id}`);
  return data;
};
