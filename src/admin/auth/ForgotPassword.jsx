import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import AuthLayout from '../../auth/AuthLayout';
import { forgotPassword } from '../../services/authService';

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    setMsg('');
    try {
      const res = await forgotPassword(data.identifier);
      setIsError(false);
      setMsg(res.resetUrl ? `${res.message} Dev link: ${res.resetUrl}` : res.message);
    } catch (err) {
      setIsError(true);
      setMsg(err.response?.data?.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to receive a reset link">
      {msg && (
        <div className={`${isError ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'} p-3 rounded-lg mb-6 text-sm text-center`}>
          {msg}
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

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-authPrimary hover:bg-authSecondary text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center shadow-lg shadow-authPrimary/30 mt-4"
        >
          {loading ? 'Processing...' : 'Send Reset Link'}
        </button>

        <div className="text-center mt-4">
          <Link to="/admin/login" className="text-sm text-gray-500 hover:text-authPrimary">
            Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
