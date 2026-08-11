import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../auth/AuthLayout';
import { verifyOtp, resendOtp } from '../../services/authService';
import useAuthStore from '../../store/authStore';

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const userId = location.state?.userId;
  const identifier = location.state?.identifier;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate('/admin/login', { replace: true });
    }
  }, [userId, navigate]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setErrorMsg('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await verifyOtp(userId, cleanOtp);
      if (res.success) {
        login(res.data, res.data.accessToken);
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !userId) return;
    try {
      setErrorMsg('');
      await resendOtp(userId);
      setTimer(300);
      setCanResend(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AuthLayout title="Verify OTP" subtitle={`OTP sent to ${identifier || 'your device'}`}>
      {errorMsg && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6 flex flex-col items-center w-full">
        <div className="w-full">
          <input
            type="text"
            name="otp"
            maxLength="6"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-2xl font-bold tracking-widest py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-authPrimary focus:border-transparent outline-none bg-white/50"
            autoFocus
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-authPrimary hover:bg-authSecondary text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center shadow-lg shadow-authPrimary/30"
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Time remaining: <span className="font-bold text-authPrimary">{formatTime(timer)}</span></p>
        <div className="mt-4">
          Didn't receive the code?{' '}
          <button 
            onClick={handleResend} 
            disabled={!canResend}
            className={`${canResend ? 'text-authPrimary hover:underline font-bold' : 'text-gray-400 cursor-not-allowed'}`}
          >
            Resend OTP
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtp;
