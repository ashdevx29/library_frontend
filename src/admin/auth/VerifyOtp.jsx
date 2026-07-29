import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../auth/AuthLayout';
import { verifyOtp, resendOtp } from '../../services/authService';
import useAuthStore from '../../store/authStore';

const VerifyOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const userId = location.state?.userId;
  const identifier = location.state?.identifier;

  useEffect(() => {
    if (!userId) {
      navigate('/admin/login');
    }
  }, [userId, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      setErrorMsg('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await verifyOtp(userId, otpValue);
      if (res.success) {
        login(res.data, res.data.accessToken);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
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

      <form onSubmit={handleVerify} className="space-y-6 flex flex-col items-center">
        <div className="flex justify-center space-x-2">
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              name="otp"
              maxLength="1"
              className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-authPrimary focus:border-transparent outline-none bg-white/50"
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              onFocus={(e) => e.target.select()}
            />
          ))}
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
