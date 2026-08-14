import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import AuthLayout from '../../auth/AuthLayout';
import { userLogin } from '../../services/authService';
import useAuthStore from '../../store/authStore';

const UserLogin = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await userLogin(data.identifier, data.password);
      if (res.success && res.data) {
        login(res.data, res.data.accessToken, res.data.refreshToken);
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Student Portal" subtitle="Sign in to your account">
      {errorMsg && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-center text-sm text-red-500">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email or Mobile</label>
          <input
            {...register('identifier', { required: 'This field is required' })}
            className="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-2 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-400"
            placeholder="Enter email or mobile"
          />
          {errors.identifier && <p className="mt-1 text-xs text-red-500">{errors.identifier.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { required: 'Password is required' })}
              className="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-2 pr-10 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-400"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center text-gray-600">
            <input type="checkbox" className="mr-2 rounded text-orange-500 focus:ring-orange-400" />
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-orange-500 py-3 px-4 font-bold text-white shadow-lg shadow-orange-300/30 transition-colors hover:bg-orange-600 disabled:opacity-60"
        >
          {loading ? 'Processing...' : 'Login'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default UserLogin;
