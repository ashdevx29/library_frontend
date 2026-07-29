import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../auth/AuthLayout';
import { adminLogin } from '../../services/authService';

const AdminLogin = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await adminLogin(data.identifier, data.password);
      if (res.success) {
        // Pass userId to the Verify OTP page state
        navigate('/admin/verify-otp', { state: { userId: res.userId, identifier: data.identifier } });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Admin Portal" subtitle="Sign in to your account">
      {errorMsg && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email or Mobile</label>
          <input 
            {...register('identifier', { required: 'This field is required' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-authPrimary focus:border-transparent outline-none transition-all bg-white/50"
            placeholder="Enter email or mobile"
          />
          {errors.identifier && <p className="text-red-500 text-xs mt-1">{errors.identifier.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            type="password"
            {...register('password', { required: 'Password is required' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-authPrimary focus:border-transparent outline-none transition-all bg-white/50"
            placeholder="Enter your password"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center text-gray-600">
            <input type="checkbox" className="mr-2 text-authPrimary focus:ring-authPrimary rounded" />
            Remember me
          </label>
          <Link to="/admin/forgot-password" className="text-authPrimary hover:text-authSecondary font-medium">
            Forgot Password?
          </Link>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-authPrimary hover:bg-authSecondary text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center shadow-lg shadow-authPrimary/30 mt-4"
        >
          {loading ? 'Processing...' : 'Login'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default AdminLogin;
