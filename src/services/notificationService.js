import api from './api';

export const getNotifications = async (params = {}) => {
  const { data } = await api.get('/notifications', { params });
  return data.data;
};

export const getNotification = async (id) => {
  const { data } = await api.get(`/notifications/${id}`);
  return data.data;
};

export const createNotification = async (payload) => {
  const { data } = await api.post('/notifications', payload);
  return data.data;
};

export const updateNotification = async (id, payload) => {
  const { data } = await api.put(`/notifications/${id}`, payload);
  return data.data;
};

export const sendNotification = async (id) => {
  const { data } = await api.post(`/notifications/${id}/send`);
  return data.data;
};

export const deleteNotification = async (id) => {
  const { data } = await api.delete(`/notifications/${id}`);
  return data;
};

export const getMyNotifications = async () => {
  const { data } = await api.get('/notifications/my');
  return data.data;
};

export const getNotificationStats = async () => {
  const { data } = await api.get('/notifications/stats');
  return data.data;
};
