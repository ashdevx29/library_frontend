import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// Add interceptor to pass tokens if needed, but here we keep it simple
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true // send cookies
});

export const adminLogin = async (identifier, password) => {
  const response = await axiosInstance.post('/admin/login', { identifier, password });
  return response.data;
};

export const verifyOtp = async (userId, otp) => {
  const response = await axiosInstance.post('/admin/verify-otp', { userId, otp });
  return response.data;
};

export const resendOtp = async (userId) => {
  const response = await axiosInstance.post('/admin/resend-otp', { userId });
  return response.data;
};

export const forgotPassword = async (identifier) => {
  const response = await axiosInstance.post('/admin/forgot-password', { identifier });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await axiosInstance.post('/admin/reset-password', data);
  return response.data;
};

export const userLogin = async (identifier, password) => {
  const response = await axiosInstance.post('/user/login', { identifier, password });
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post('/logout');
  return response.data;
};
