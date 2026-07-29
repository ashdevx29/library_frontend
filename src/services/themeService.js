import api from './api';

export const fetchTheme = async () => {
  const { data } = await api.get('/themes');
  return data.data;
};

export const saveTheme = async (payload) => {
  const { data } = await api.put('/themes', payload);
  return data.data;
};

export const uploadThemeAsset = async (file, type = 'logo') => {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  const { data } = await api.post('/themes/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};
