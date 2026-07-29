import api from './api';

export const getActivityLogs = async (params = {}) => {
  const { data } = await api.get('/logs/activity', { params });
  return data.data;
};

export const getAuditLogs = async (params = {}) => {
  const { data } = await api.get('/logs/audit', { params });
  return data.data;
};

export const getLogStats = async () => {
  const { data } = await api.get('/logs/stats');
  return data.data;
};

export const clearOldLogs = async (days = 90) => {
  const { data } = await api.post('/logs/clear', { days });
  return data.data;
};
