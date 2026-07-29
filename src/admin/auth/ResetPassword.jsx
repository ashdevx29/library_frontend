import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthLayout from '../../auth/AuthLayout';
import { resetPassword } from '../../services/authService';

const ResetPassword = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  const password = watch('password', '');

  const onSubmit = async (data) => {
    setLoading(true);
    setMsg('');
    try {
      const res = await resetPassword({ token, password: data.password });
      setIsError(false);
      setMsg(res.message);
      setTimeout(() => navigate('/admin/login'), 3000);
    } catch (err) {
      setIsError(true);
      setMsg(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your new secure password">
      {msg && (
        <div className={`${isError ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'} p-3 rounded-lg mb-6 text-sm text-center`}>
          {msg}
        </div>
      )}

      {!token ? (
        <div className="text-center text-red-500">Invalid or missing reset token.</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input 
              type="password"
              {...register('password', { 
                required: 'Password is required',
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message: 'Must contain 8 chars, one uppercase, one lowercase, one number, and one special char.'
                }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-authPrimary focus:border-transparent outline-none transition-all bg-white/50"
              placeholder="Enter new password"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input 
              type="password"
              {...register('confirmPassword', { 
                required: 'Please confirm password',
                validate: value => value === password || 'Passwords do not match'
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-authPrimary focus:border-transparent outline-none transition-all bg-white/50"
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-authPrimary hover:bg-authSecondary text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center shadow-lg shadow-authPrimary/30 mt-4"
          >
            {loading ? 'Processing...' : 'Update Password'}
          </button>

          <div className="text-center mt-4">
            <Link to="/admin/login" className="text-sm text-gray-500 hover:text-authPrimary">
              Back to Login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
