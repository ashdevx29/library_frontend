import React, { useState, useEffect, useCallback } from 'react';
import { generateQR, getAttendanceStatus } from '../../services/attendanceService';
import { FiRefreshCw, FiClock, FiCheckCircle, FiXCircle, FiUsers, FiGrid } from 'react-icons/fi';

const AdminAttendancePage = () => {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [todayStats, setTodayStats] = useState({ checkedIn: 0, checkedOut: 0 });

  const fetchQR = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generateQR();
      setQr(data);
      setCountdown(300);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQR(); }, [fetchQR]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown <= 0 && qr) fetchQR();
  }, [countdown, qr, fetchQR]);

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">QR Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate QR for users to scan and mark attendance</p>
        </div>
      </div>

      {/* QR Section */}
      <section className="rounded-2xl border border-white/70 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Library Attendance QR</h2>

          {qr ? (
            <div className="relative">
              <div className="rounded-2xl bg-white p-4 shadow-lg">
                <img src={qr.qrDataUrl} alt="Attendance QR" className="h-[300px] w-[300px]" />
              </div>
              <div className="mt-3 text-center">
                <p className={`text-sm font-semibold ${countdown <= 60 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                  Expires in {mins}:{secs.toString().padStart(2, '0')}
                </p>
                <div className="mx-auto mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${countdown <= 60 ? 'bg-red-500' : 'bg-orange-500'}`}
                    style={{ width: `${(countdown / 300) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[300px] w-[300px] items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
              <p className="text-slate-400">Loading QR...</p>
            </div>
          )}

          <button
            onClick={fetchQR}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--button)] px-6 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Regenerate QR
          </button>

          <p className="max-w-sm text-center text-xs text-slate-400">
            Users scan this QR from their Attendance page. The QR auto-refreshes every 5 minutes for security.
          </p>
        </div>
      </section>

      {/* Today's Overview */}
      <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Today's Attendance</h2>
        <p className="text-sm text-slate-400">Real-time attendance data will appear here via Socket.IO updates.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/20">
            <FiCheckCircle className="mx-auto mb-2 text-green-500" />
            <p className="text-xs text-slate-500">Checked In</p>
            <p className="text-2xl font-bold text-green-600">{todayStats.checkedIn}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-4 text-center dark:bg-red-900/20">
            <FiXCircle className="mx-auto mb-2 text-red-500" />
            <p className="text-xs text-slate-500">Checked Out</p>
            <p className="text-2xl font-bold text-red-600">{todayStats.checkedOut}</p>
          </div>
          <div className="rounded-xl bg-orange-50 p-4 text-center dark:bg-orange-900/20">
            <FiUsers className="mx-auto mb-2 text-orange-500" />
            <p className="text-xs text-slate-500">Currently In Library</p>
            <p className="text-2xl font-bold text-orange-600">{todayStats.checkedIn - todayStats.checkedOut}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminAttendancePage;
