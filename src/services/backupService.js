import api from './api';

export const getBackups = async () => {
  const { data } = await api.get('/backups');
  return data.data;
};

export const createBackup = async () => {
  const { data } = await api.post('/backups/create');
  return data.data;
};

export const restoreBackup = async (filename) => {
  const { data } = await api.post(`/backups/restore/${filename}`);
  return data.data;
};

export const deleteBackup = async (filename) => {
  const { data } = await api.delete(`/backups/${filename}`);
  return data;
};
