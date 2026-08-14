import axios from 'axios';
import { API_URL } from '../utils/config';

const axiosInstance = axios.create({
  baseURL: `${API_URL}/auth`,
  withCredentials: true
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
