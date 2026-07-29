import api from './api';

export const getRoles = async (params = {}) => {
  const { data } = await api.get('/roles', { params });
  return data.data;
};

export const getRole = async (id) => {
  const { data } = await api.get(`/roles/${id}`);
  return data.data;
};

export const createRole = async (payload) => {
  const { data } = await api.post('/roles', payload);
  return data.data;
};

export const updateRole = async (id, payload) => {
  const { data } = await api.put(`/roles/${id}`, payload);
  return data.data;
};

export const deleteRole = async (id) => {
  const { data } = await api.delete(`/roles/${id}`);
  return data;
};

export const getRoleStats = async () => {
  const { data } = await api.get('/roles/stats');
  return data.data;
};
