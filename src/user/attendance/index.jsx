import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { clockInQR, clockOutQR, getAttendanceStatus, getAttendanceHistory } from '../../services/attendanceService';
import { FiCamera, FiClock, FiCheckCircle, FiLogIn, FiLogOut, FiCalendar, FiX } from 'react-icons/fi';

const UserAttendancePage = () => {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null); // 'clockIn' | 'clockOut' | null
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [currentMonth] = useState(() => { const d = new Date(); return { month: d.getMonth() + 1, year: d.getFullYear() }; });
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getAttendanceStatus(),
      getAttendanceHistory(currentMonth.month, currentMonth.year),
    ]).then(([s, h]) => { setStatus(s); setHistory(h); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentMonth]);

  const startScanner = (scanAction) => {
    setAction(scanAction);
    setResult(null);
    setError('');
    setScanning(true);

    setTimeout(() => {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        async (decodedText) => {
          scanner.stop().catch(() => {});
          setScanning(false);

          const tokenMatch = decodedText.match(/qr=([^&]+)/);
          const token = tokenMatch ? tokenMatch[1] : decodedText;

          try {
            const data = scanAction === 'clockIn'
              ? await clockInQR(token)
              : await clockOutQR(token);
            setResult({ success: true, message: data.message, attendance: data.attendance });
            const s = await getAttendanceStatus();
            setStatus(s);
          } catch (e) {
            setResult({ success: false, message: e.response?.data?.message || e.message });
          }
        },
        () => {}
      ).catch(() => {
        setScanning(false);
        setError('Camera access denied. Please allow camera permissions.');
      });
    }, 500);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
    setAction(null);
    setResult(null);
  };

  useEffect(() => {
    return () => { if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current.clear().catch(() => {}); } };
  }, []);

  const fmt = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (loading) return <div className="py-16 text-center text-slate-400">Loading...</div>;

  const checkedIn = status?.hasClockedIn && !status?.hasClockedOut;
  const attendance = status?.attendance;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Attendance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Scan QR to clock in or clock out</p>
      </div>

      {/* Status Card */}
      <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Today's Status</h2>

        {!status?.hasClockedIn ? (
          <div className="text-center py-6">
            <FiClock className="mx-auto mb-3 text-4xl text-slate-300" />
            <p className="text-slate-500 dark:text-slate-400">You haven't clocked in today</p>
            <p className="mt-1 text-xs text-slate-400">Scan the library QR to start your session</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/20">
              <FiLogIn className="mx-auto mb-2 text-green-500" />
              <p className="text-xs text-slate-500">Clock In</p>
              <p className="text-lg font-bold text-green-600">{fmt(attendance.checkInTime)}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4 text-center dark:bg-red-900/20">
              <FiLogOut className="mx-auto mb-2 text-red-500" />
              <p className="text-xs text-slate-500">Clock Out</p>
              <p className="text-lg font-bold text-red-600">{attendance.checkOutTime ? fmt(attendance.checkOutTime) : '—'}</p>
            </div>
            <div className="rounded-xl bg-orange-50 p-4 text-center dark:bg-orange-900/20">
              <FiClock className="mx-auto mb-2 text-orange-500" />
              <p className="text-xs text-slate-500">Duration</p>
              <p className="text-lg font-bold text-orange-600">{attendance.duration ? `${attendance.duration} min` : '—'}</p>
            </div>
          </div>
        )}
      </section>

      {/* Action Buttons */}
      {!checkedIn ? (
        <button
          onClick={() => startScanner('clockIn')}
          className="w-full rounded-2xl bg-green-500 py-4 text-lg font-bold text-white shadow-lg shadow-green-500/30 hover:bg-green-600 transition flex items-center justify-center gap-3"
        >
          <FiLogIn className="text-xl" /> Clock In — Scan QR
        </button>
      ) : (
        <button
          onClick={() => startScanner('clockOut')}
          className="w-full rounded-2xl bg-red-500 py-4 text-lg font-bold text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition flex items-center justify-center gap-3"
        >
          <FiLogOut className="text-xl" /> Clock Out — Scan QR
        </button>
      )}

      {/* Scanner Modal */}
      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={stopScanner}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {action === 'clockIn' ? 'Scan to Clock In' : 'Scan to Clock Out'}
              </h3>
              <button onClick={stopScanner} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700">
                <FiX className="text-xl text-slate-500" />
              </button>
            </div>

            <div id="qr-reader" ref={containerRef} className="rounded-xl overflow-hidden mb-4" />

            {scanning && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <FiCamera className="animate-pulse" /> Scanning...
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
            )}

            {result && (
              <div className={`rounded-xl px-4 py-3 text-sm ${result.success ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                {result.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
          <FiCalendar className="mr-2 inline" />
          {new Date(currentMonth.year, currentMonth.month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })} History
        </h2>
        {!history.length ? (
          <p className="py-8 text-center text-slate-400">No attendance records this month</p>
        ) : (
          <div className="space-y-2">
            {history.map(h => (
              <div key={h._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${h.duration && h.duration > 0 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{fmtDate(h.date)}</p>
                    <p className="text-xs text-slate-400">{fmt(h.checkInTime)} → {h.checkOutTime ? fmt(h.checkOutTime) : 'Active'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{h.duration ? `${h.duration} min` : '—'}</p>
                  <p className="text-xs text-slate-400">{h.seatId?.seatNumber || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default UserAttendancePage;
