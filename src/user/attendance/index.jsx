import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { clockInQR, clockOutQR, getAttendanceStatus, getAttendanceHistory } from '../../services/attendanceService';
import { FiCamera, FiClock, FiCheckCircle, FiLogIn, FiLogOut, FiCalendar, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const PAGE_SIZE = 10;

const UserAttendancePage = () => {
  const [status, setStatus] = useState(null);
  const [historyData, setHistoryData] = useState({ records: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [action, setAction] = useState(null); // 'clockIn' | 'clockOut' | null
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Month selection: 'current' (Current Month) vs 'last' (Last Month)
  const [monthTab, setMonthTab] = useState('current'); // 'current' | 'last'
  const [page, setPage] = useState(1);

  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  // Compute targeted month & year
  const getTargetMonth = useCallback((tabKey) => {
    const d = new Date();
    if (tabKey === 'last') {
      d.setMonth(d.getMonth() - 1);
    }
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  }, []);

  const fetchHistory = useCallback((tabKey, p) => {
    setHistoryLoading(true);
    const target = getTargetMonth(tabKey);
    getAttendanceHistory(target.month, target.year, p, PAGE_SIZE)
      .then(res => {
        if (res && typeof res === 'object' && Array.isArray(res.records)) {
          setHistoryData(res);
        } else if (Array.isArray(res)) {
          setHistoryData({
            records: res.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE),
            total: res.length,
            page: p,
            totalPages: Math.ceil(res.length / PAGE_SIZE) || 1,
          });
        } else {
          setHistoryData({ records: [], total: 0, page: 1, totalPages: 1 });
        }
      })
      .catch(() => {
        setHistoryData({ records: [], total: 0, page: 1, totalPages: 1 });
      })
      .finally(() => setHistoryLoading(false));
  }, [getTargetMonth]);

  useEffect(() => {
    getAttendanceStatus()
      .then(s => setStatus(s))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchHistory(monthTab, page);
  }, [monthTab, page, fetchHistory]);

  const handleMonthTabChange = (newTab) => {
    setMonthTab(newTab);
    setPage(1);
  };

  const processScanResult = async (decodedText, scanAction) => {
    const tokenMatch = decodedText.match(/qr=([^&]+)/);
    const token = tokenMatch ? tokenMatch[1] : decodedText;
    if (!token) {
      setResult({ success: false, message: 'Invalid QR code: no token found' });
      return;
    }
    try {
      const data = scanAction === 'clockIn'
        ? await clockInQR(token)
        : await clockOutQR(token);
      setResult({ success: true, message: data.message, attendance: data.attendance });
      const s = await getAttendanceStatus();
      setStatus(s);
      fetchHistory(monthTab, page);
    } catch (e) {
      setResult({ success: false, message: e.response?.data?.message || e.message });
    }
  };

  const startScanner = (scanAction) => {
    setAction(scanAction);
    setResult(null);
    setError('');
    setScanning(true);

    setTimeout(() => {
      const el = document.getElementById('qr-reader');
      if (!el) {
        setScanning(false);
        setError('QR reader element not found');
        return;
      }
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        async (decodedText) => {
          scanner.stop().catch(() => {});
          setScanning(false);
          await processScanResult(decodedText, scanAction);
        },
        () => {}
      ).catch(() => {
        setScanning(false);
        setError('Camera access denied or camera not available. Please grant camera permission.');
      });
    }, 500);
  };

  const stopScanner = () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    setAction(null);
    setScanning(false);
    setResult(null);

    if (scanner) {
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
      }
    };
  }, []);

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' }) : '—';

  if (loading) return <div className="py-16 text-center text-slate-400">Loading...</div>;

  const checkedIn = status?.hasClockedIn && !status?.hasClockedOut;
  const attendance = status?.attendance;

  const currentMonthTarget = getTargetMonth('current');
  const lastMonthTarget = getTargetMonth('last');

  const currentMonthLabel = new Date(currentMonthTarget.year, currentMonthTarget.month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const lastMonthLabel = new Date(lastMonthTarget.year, lastMonthTarget.month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const { records = [], total = 0, totalPages = 1 } = historyData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Attendance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Scan QR to clock in or clock out and view attendance history</p>
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
              <p className="text-lg font-bold text-green-600">{fmtTime(attendance?.checkInTime)}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4 text-center dark:bg-red-900/20">
              <FiLogOut className="mx-auto mb-2 text-red-500" />
              <p className="text-xs text-slate-500">Clock Out</p>
              <p className="text-lg font-bold text-red-600">{attendance?.checkOutTime ? fmtTime(attendance.checkOutTime) : '—'}</p>
            </div>
            <div className="rounded-xl bg-orange-50 p-4 text-center dark:bg-orange-900/20">
              <FiClock className="mx-auto mb-2 text-orange-500" />
              <p className="text-xs text-slate-500">Duration</p>
              <p className="text-lg font-bold text-orange-600">{attendance?.duration ? `${attendance.duration} min` : '—'}</p>
            </div>
          </div>
        )}
      </section>

      {/* Action Buttons */}
      {!checkedIn ? (
        <button
          onClick={() => startScanner('clockIn')}
          className="w-full rounded-2xl bg-green-500 py-4 text-lg font-bold text-white shadow-lg shadow-green-500/30 hover:bg-green-600 transition flex items-center justify-center gap-3 cursor-pointer"
        >
          <FiLogIn className="text-xl" /> Clock In — Scan QR
        </button>
      ) : (
        <button
          onClick={() => startScanner('clockOut')}
          className="w-full rounded-2xl bg-red-500 py-4 text-lg font-bold text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition flex items-center justify-center gap-3 cursor-pointer"
        >
          <FiLogOut className="text-xl" /> Clock Out — Scan QR
        </button>
      )}

      {/* Scanner Modal */}
      {action && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={stopScanner}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {action === 'clockIn' ? 'Scan to Clock In' : 'Scan to Clock Out'}
              </h3>
              <button onClick={stopScanner} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700">
                <FiX className="text-xl text-slate-500" />
              </button>
            </div>

            <div id="qr-reader" ref={containerRef} className="rounded-xl overflow-hidden mb-4 border border-slate-200 dark:border-slate-700 bg-black min-h-[250px]" />

            {scanning && (
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 py-2">
                <FiCamera className="animate-pulse text-lg" /> Scanning QR Code...
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-900/20">{error}</div>
            )}

            {result && (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium ${result.success ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                {result.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance History Section with Month Selector & Paginated Data Table */}
      <section className="space-y-4 rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
        {/* Header and Month Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FiCalendar className="text-orange-500" />
              Attendance Report
            </h2>
            <p className="text-xs text-slate-500">View attendance records month-wise in structured table format</p>
          </div>

          {/* Month Filter Tabs: Current Month vs Last Month */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-700">
            <button
              onClick={() => handleMonthTabChange('current')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer ${monthTab === 'current' ? 'bg-white text-orange-600 shadow dark:bg-slate-800 dark:text-orange-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'}`}
            >
              Current Month ({currentMonthLabel})
            </button>
            <button
              onClick={() => handleMonthTabChange('last')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer ${monthTab === 'last' ? 'bg-white text-orange-600 shadow dark:bg-slate-800 dark:text-orange-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'}`}
            >
              Last Month ({lastMonthLabel})
            </button>
          </div>
        </div>

        {/* Responsive Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Check-In</th>
                <th className="px-4 py-3">Check-Out</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {historyLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : !records.length ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No attendance records for {monthTab === 'current' ? currentMonthLabel : lastMonthLabel}
                  </td>
                </tr>
              ) : (
                records.map(h => {
                  const isAbsent = h.isAbsent || h.status === 'Absent';
                  const isCompleted = !isAbsent && !!h.checkOutTime;
                  const isActive = !isAbsent && h.checkInTime && !h.checkOutTime;
                  let badgeText = 'Absent';
                  let badgeStyle = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

                  if (isCompleted) {
                    badgeText = 'Present';
                    badgeStyle = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                  } else if (isActive) {
                    badgeText = 'Active In Library';
                    badgeStyle = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
                  }

                  return (
                    <tr key={h._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                        {fmtDate(h.date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                        {h.checkInTime ? fmtTime(h.checkInTime) : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                        {h.checkOutTime ? fmtTime(h.checkOutTime) : isActive ? <span className="text-yellow-600 font-bold dark:text-yellow-400">Active</span> : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {h.duration ? (
                          <span className="font-bold text-slate-800 dark:text-white">
                            {Math.floor(h.duration / 60)}h {h.duration % 60}m ({h.duration} mins)
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${badgeStyle}`}>
                          {badgeText}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 10 Rows Pagination Controls */}
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
              Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} records
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || historyLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <FiChevronLeft /> Previous
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || historyLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default UserAttendancePage;
