import api from '../utils/api';

export const exportData = async (entity, format, params = {}) => {
  const { data } = await api.get(`/export/${entity}`, {
    params: { format, ...params },
    responseType: format === 'csv' ? 'text' : 'blob',
  });
  return data;
};

export const downloadExport = async (entity, format, filename, params = {}) => {
  const response = await api.get(`/export/${entity}`, {
    params: { format, ...params },
    responseType: 'blob',
  });

  const blob = response.data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || entity}-${Date.now()}.${format === 'xlsx' ? 'xlsx' : format}`;
  a.click();
  URL.revokeObjectURL(url);
};

export const getExportableEntities = async () => {
  const { data } = await api.get('/export/entities');
  return data.data;
};

export const importData = async (entity, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/import/${entity}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getImportableEntities = async () => {
  const { data } = await api.get('/import/entities');
  return data.data;
};
