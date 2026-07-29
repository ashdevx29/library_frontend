import api from './api';

export const getProfile = async () => {
  const { data } = await api.get('/profile');
  return data.data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put('/profile', payload);
  return data.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const { data } = await api.put('/profile/change-password', { currentPassword, newPassword });
  return data.data;
};

export const uploadProfileImage = async (file) => {
  const form = new FormData();
  form.append('profileImage', file);
  const { data } = await api.post('/profile/upload-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};
