import api from './api';

export const getAnnouncements = async (params = {}) => {
  const { data } = await api.get('/announcements', { params });
  return data.data;
};

export const getAnnouncement = async (id) => {
  const { data } = await api.get(`/announcements/${id}`);
  return data.data;
};

export const createAnnouncement = async (payload) => {
  const { data } = await api.post('/announcements', payload);
  return data.data;
};

export const updateAnnouncement = async (id, payload) => {
  const { data } = await api.put(`/announcements/${id}`, payload);
  return data.data;
};

export const deleteAnnouncement = async (id) => {
  const { data } = await api.delete(`/announcements/${id}`);
  return data;
};

export const getActiveAnnouncements = async () => {
  const { data } = await api.get('/announcements/active');
  return data.data;
};
