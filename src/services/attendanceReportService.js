import api from './api';

// Admin reports
export const getDailyReport = async (params = {}) => {
  const { data } = await api.get('/attendance/reports/daily', { params });
  return data.data;
};

export const getMonthlyReport = async (params = {}) => {
  const { data } = await api.get('/attendance/reports/monthly', { params });
  return data.data;
};

export const getYearlyReport = async (params = {}) => {
  const { data } = await api.get('/attendance/reports/yearly', { params });
  return data.data;
};

// User reports (own data)
export const getMyDailyReport = async (date) => {
  const { data } = await api.get('/attendance/reports/my-daily', { params: { date } });
  return data.data;
};

export const getMyMonthlyReport = async (month, year) => {
  const { data } = await api.get('/attendance/reports/my-monthly', { params: { month, year } });
  return data.data;
};

export const getMyYearlyReport = async (year) => {
  const { data } = await api.get('/attendance/reports/my-yearly', { params: { year } });
  return data.data;
};

// Shared for filters
export const getShifts = async () => {
  const { data } = await api.get('/shifts');
  return data.data;
};

export const getMembers = async (params = {}) => {
  const { data } = await api.get('/members', { params });
  return data.data;
};
