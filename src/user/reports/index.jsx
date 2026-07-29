import React, { useState } from 'react';
import { getMyDailyReport, getMyMonthlyReport, getMyYearlyReport } from '../../services/attendanceReportService';
import { FiCalendar, FiClock, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const TABS = ['Daily', 'Monthly', 'Yearly'];

const UserReportsPage = () => {
  const [tab, setTab] = useState('Daily');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      let data;
      if (tab === 'Daily') data = await getMyDailyReport(filters.date);
      else if (tab === 'Monthly') data = await getMyMonthlyReport(filters.month, filters.year);
      else data = await getMyYearlyReport(filters.year);
      setReport(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const input = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Attendance Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">View your attendance history</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setReport(null); }} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${tab === t ? 'bg-white text-orange-600 shadow dark:bg-slate-700 dark:text-orange-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>{t}</button>
        ))}
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
        <div className="flex flex-wrap items-end gap-3">
          {tab === 'Daily' && (
            <div><label className="mb-1 block text-xs font-medium text-slate-500">Date</label><input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} className={input} /></div>
          )}
          {tab === 'Monthly' && (
            <>
              <div><label className="mb-1 block text-xs font-medium text-slate-500">Month</label>
                <select value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} className={input}>
                  {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>)}
                </select>
              </div>
              <div><label className="mb-1 block text-xs font-medium text-slate-500">Year</label>
                <input type="number" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} min="2020" max="2099" className={input} />
              </div>
            </>
          )}
          {tab === 'Yearly' && (
            <div><label className="mb-1 block text-xs font-medium text-slate-500">Year</label>
              <input type="number" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} min="2020" max="2099" className={input} />
            </div>
          )}
          <button onClick={fetchReport} disabled={loading} className="rounded-xl bg-[var(--button)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? 'Loading...' : 'View Report'}
          </button>
        </div>
      </section>

      {loading && <div className="py-12 text-center text-slate-400">Loading...</div>}

      {!loading && report && (
        <>
          {/* Daily */}
          {tab === 'Daily' && (
            <div className="space-y-4">
              {report.attendance ? (
                <>
                  <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
                    <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">{fmtDate(report.date)} — Attendance</h2>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/20">
                        <FiClock className="mx-auto mb-2 text-green-500" />
                        <p className="text-xs text-slate-500">Check In</p>
                        <p className="text-lg font-bold text-green-600">{fmt(report.attendance.checkInTime)}</p>
                      </div>
                      <div className="rounded-xl bg-red-50 p-4 text-center dark:bg-red-900/20">
                        <FiClock className="mx-auto mb-2 text-red-500" />
                        <p className="text-xs text-slate-500">Check Out</p>
                        <p className="text-lg font-bold text-red-600">{report.attendance.checkOutTime ? fmt(report.attendance.checkOutTime) : '—'}</p>
                      </div>
                      <div className="rounded-xl bg-orange-50 p-4 text-center dark:bg-orange-900/20">
                        <FiClock className="mx-auto mb-2 text-orange-500" />
                        <p className="text-xs text-slate-500">Duration</p>
                        <p className="text-lg font-bold text-orange-600">{report.attendance.duration ? `${report.attendance.duration} min` : '—'}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-800">
                  <FiCalendar className="mx-auto mb-3 text-4xl text-slate-300" />
                  <p className="text-slate-400">No attendance record for this date</p>
                </div>
              )}
            </div>
          )}

          {/* Monthly */}
          {tab === 'Monthly' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
                {[
                  [FiCheckCircle, 'Present', report.stats.present, 'green'],
                  [FiAlertTriangle, 'Late', report.stats.late, 'yellow'],
                  [FiClock, 'Total Hours', Math.round(report.stats.totalDuration / 60 * 10) / 10, 'blue'],
                  [FiClock, 'Avg Duration', `${report.stats.avgDuration}m`, 'purple'],
                ].map(([Icon, label, value, color]) => (
                  <div key={label} className={`rounded-2xl bg-${color}-50 p-4 text-center dark:bg-${color}-900/20`}>
                    <Icon className={`mx-auto mb-2 text-${color}-500`} />
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
                <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">Daily Records</h3>
                {!report.attendance.length ? <p className="py-8 text-center text-slate-400">No records</p> : (
                  <div className="space-y-2">
                    {report.attendance.map(a => (
                      <div key={a._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full ${a.duration > 0 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">{fmtDate(a.date)}</p>
                            <p className="text-xs text-slate-400">{fmt(a.checkInTime)} → {a.checkOutTime ? fmt(a.checkOutTime) : 'Active'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{a.duration ? `${a.duration} min` : '—'}</p>
                          <p className="text-xs text-slate-400">{a.shiftId?.shiftName || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Yearly */}
          {tab === 'Yearly' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
                <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">{report.year} — Monthly Summary</h3>
                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {report.byMonth.map(m => (
                    <div key={m.month} className={`rounded-xl p-4 text-center ${m.present > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                      <p className="text-xs text-slate-500">{new Date(2024, m.month - 1).toLocaleString('en', { month: 'short' })}</p>
                      <p className={`text-xl font-bold ${m.present > 0 ? 'text-green-600' : 'text-slate-400'}`}>{m.present}</p>
                      <p className="text-xs text-slate-400">days</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
                <p className="text-center text-sm text-slate-500">Total days present in {report.year}: <span className="font-bold text-orange-600">{report.totalPresent}</span></p>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !report && (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-slate-800">
          <FiCalendar className="mx-auto mb-3 text-5xl text-slate-300" />
          <p className="text-lg text-slate-400">Select a period and click "View Report"</p>
        </div>
      )}
    </div>
  );
};

export default UserReportsPage;
