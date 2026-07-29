import api from './api';

export const getExpenses = async (params = {}) => {
  const { data } = await api.get('/expenses', { params });
  return data.data;
};

export const getExpense = async (id) => {
  const { data } = await api.get(`/expenses/${id}`);
  return data.data;
};

export const createExpense = async (payload) => {
  const { data } = await api.post('/expenses', payload);
  return data.data;
};

export const updateExpense = async (id, payload) => {
  const { data } = await api.put(`/expenses/${id}`, payload);
  return data.data;
};

export const deleteExpense = async (id) => {
  const { data } = await api.delete(`/expenses/${id}`);
  return data;
};

export const getExpenseStats = async () => {
  const { data } = await api.get('/expenses/stats');
  return data.data;
};

export const getExpenseCategories = async () => {
  const { data } = await api.get('/expenses/categories');
  return data.data;
};

export const getDailyReport = async (date) => {
  const { data } = await api.get('/expenses/reports/daily', { params: { date } });
  return data.data;
};

export const getMonthlyReport = async (month, year) => {
  const { data } = await api.get('/expenses/reports/monthly', { params: { month, year } });
  return data.data;
};

export const getYearlyReport = async (year) => {
  const { data } = await api.get('/expenses/reports/yearly', { params: { year } });
  return data.data;
};
