import api from './api';

export const generateQR = async () => {
  const { data } = await api.get('/attendance/qr/generate');
  return data.data;
};

export const clockInQR = async (qrToken) => {
  const { data } = await api.post('/attendance/qr/clock-in', { qrToken });
  return data.data;
};

export const clockOutQR = async (qrToken) => {
  const { data } = await api.post('/attendance/qr/clock-out', { qrToken });
  return data.data;
};

export const getAttendanceStatus = async () => {
  const { data } = await api.get('/attendance/status');
  return data.data;
};

export const getAttendanceHistory = async (month, year, page = 1, limit = 10) => {
  const { data } = await api.get('/attendance/history', { params: { month, year, page, limit } });
  return data.data;
};
