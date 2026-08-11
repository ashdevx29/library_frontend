import React, { useState, useEffect } from 'react';
import { getMyDailyReport, getMyMonthlyReport, getMyYearlyReport } from '../../services/attendanceReportService';
import { getMyMembership, getMyPayments, getMyRenewals, downloadReceipt } from '../../services/paymentService';
import { FiCalendar, FiClock, FiAlertTriangle, FiCheckCircle, FiDollarSign, FiFileText, FiChevronLeft, FiChevronRight, FiCreditCard } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MAIN_TABS = ['Attendance Reports', 'Fees Reports'];
const PERIOD_TABS = ['Daily', 'Monthly', 'Yearly'];

const PaginatedTable = ({ cols, rows = [], emptyMsg = 'No records found', pageSize = 10 }) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">{emptyMsg}</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50">
                {cols.map((c, i) => (
                  <th key={i} className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {currentRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                  {cols.map((c, j) => (
                    <td key={j} className="px-4 py-3 text-slate-800 dark:text-slate-200">
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rows.length > pageSize && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 flex-wrap gap-2">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-white">{startIndex + 1}</span> to <span className="font-semibold text-slate-800 dark:text-white">{Math.min(startIndex + pageSize, rows.length)}</span> of <span className="font-semibold text-slate-800 dark:text-white">{rows.length}</span> entries
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-slate-800 dark:text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const UserReportsPage = () => {
  const [mainTab, setMainTab] = useState('Attendance Reports');
  const [periodTab, setPeriodTab] = useState('Monthly');
  const [loading, setLoading] = useState(false);

  // Attendance states
  const [attendanceReport, setAttendanceReport] = useState(null);

  // Fee states
  const [membershipData, setMembershipData] = useState(null);
  const [userPayments, setUserPayments] = useState([]);
  const [userRenewals, setUserRenewals] = useState([]);

  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  });

  useEffect(() => {
    fetchMainData();
  }, [mainTab, periodTab]);

  const fetchMainData = async () => {
    setLoading(true);
    try {
      if (mainTab === 'Attendance Reports') {
        let data;
        if (periodTab === 'Daily') data = await getMyDailyReport(filters.date);
        else if (periodTab === 'Monthly') data = await getMyMonthlyReport(filters.month, filters.year);
        else data = await getMyYearlyReport(filters.year);
        setAttendanceReport(data);
      } else if (mainTab === 'Fees Reports') {
        const [m, p, r] = await Promise.all([getMyMembership(), getMyPayments(), getMyRenewals()]);
        setMembershipData(m);
        setUserPayments(p);
        setUserRenewals(r);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (id) => {
    try {
      const blob = await downloadReceipt(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a'); a.href = url; a.download = `receipt-${id.slice(-8)}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded');
    } catch (e) {
      toast.error('Download failed');
    }
  };

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const inputClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Student Reports & Statements</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">View your detailed attendance and fee reports (Daily, Monthly, Yearly)</p>
      </div>

      {/* Main Module Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {MAIN_TABS.map(t => (
          <button
            key={t}
            onClick={() => setMainTab(t)}
            className={`pb-3 px-4 text-sm font-bold transition border-b-2 ${mainTab === t ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Period Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-700">
          {PERIOD_TABS.map(pt => (
            <button
              key={pt}
              onClick={() => setPeriodTab(pt)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${periodTab === pt ? 'bg-white text-orange-600 shadow dark:bg-slate-800 dark:text-orange-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              {pt}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {periodTab === 'Daily' && (
            <input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} className={inputClass} />
          )}
          {periodTab === 'Monthly' && (
            <>
              <select value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} className={inputClass}>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>)}
              </select>
              <input type="number" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} min="2020" max="2099" className={inputClass} />
            </>
          )}
          {periodTab === 'Yearly' && (
            <input type="number" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} min="2020" max="2099" className={inputClass} />
          )}
          <button onClick={fetchMainData} disabled={loading} className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {loading && <div className="py-12 text-center text-slate-400">Fetching report data...</div>}

      {/* ─── ATTENDANCE REPORTS TAB ─── */}
      {!loading && mainTab === 'Attendance Reports' && attendanceReport && (
        <div className="space-y-4">
          {periodTab === 'Daily' && (
            attendanceReport.attendance ? (
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
                <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Daily Attendance Log — {fmtDate(attendanceReport.date)}</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/20">
                    <FiClock className="mx-auto mb-2 text-green-500" />
                    <p className="text-xs text-slate-500">Check In</p>
                    <p className="text-lg font-bold text-green-600">{fmtTime(attendanceReport.attendance.checkInTime)}</p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-4 text-center dark:bg-red-900/20">
                    <FiClock className="mx-auto mb-2 text-red-500" />
                    <p className="text-xs text-slate-500">Check Out</p>
                    <p className="text-lg font-bold text-red-600">{attendanceReport.attendance.checkOutTime ? fmtTime(attendanceReport.attendance.checkOutTime) : '—'}</p>
                  </div>
                  <div className="rounded-xl bg-orange-50 p-4 text-center dark:bg-orange-900/20">
                    <FiClock className="mx-auto mb-2 text-orange-500" />
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="text-lg font-bold text-orange-600">{attendanceReport.attendance.duration ? `${attendanceReport.attendance.duration} min` : '—'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-800">
                <FiCalendar className="mx-auto mb-3 text-4xl text-slate-300" />
                <p className="text-slate-400">No attendance record found for {fmtDate(filters.date)}</p>
              </div>
            )
          )}

          {periodTab === 'Monthly' && attendanceReport.stats && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl bg-green-50 p-4 text-center dark:bg-green-900/20"><FiCheckCircle className="mx-auto mb-1 text-green-500" /><p className="text-xs text-slate-500">Present Days</p><p className="text-2xl font-bold text-green-600">{attendanceReport.stats.present}</p></div>
                <div className="rounded-2xl bg-yellow-50 p-4 text-center dark:bg-yellow-900/20"><FiAlertTriangle className="mx-auto mb-1 text-yellow-500" /><p className="text-xs text-slate-500">Late Days</p><p className="text-2xl font-bold text-yellow-600">{attendanceReport.stats.late}</p></div>
                <div className="rounded-2xl bg-blue-50 p-4 text-center dark:bg-blue-900/20"><FiClock className="mx-auto mb-1 text-blue-500" /><p className="text-xs text-slate-500">Total Hours</p><p className="text-2xl font-bold text-blue-600">{Math.round(attendanceReport.stats.totalDuration / 60 * 10) / 10}h</p></div>
                <div className="rounded-2xl bg-purple-50 p-4 text-center dark:bg-purple-900/20"><FiClock className="mx-auto mb-1 text-purple-500" /><p className="text-xs text-slate-500">Avg Duration</p><p className="text-2xl font-bold text-purple-600">{attendanceReport.stats.avgDuration}m</p></div>
              </div>

              <PaginatedTable
                cols={[
                  { label: 'Date', render: r => fmtDate(r.date) },
                  { label: 'Check In', render: r => fmtTime(r.checkInTime) },
                  { label: 'Check Out', render: r => r.checkOutTime ? fmtTime(r.checkOutTime) : 'Active' },
                  { label: 'Shift', render: r => r.shiftId?.shiftName || 'Standard' },
                  { label: 'Duration', render: r => r.duration ? `${r.duration} min` : '—' },
                  { label: 'Status', render: r => <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${r.duration > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-700'}`}>{r.duration > 0 ? 'Present' : 'Active'}</span> }
                ]}
                rows={attendanceReport.attendance || []}
                emptyMsg="No attendance history for this month"
                pageSize={10}
              />
            </div>
          )}

          {periodTab === 'Yearly' && attendanceReport.byMonth && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
                <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">{attendanceReport.year} — Yearly Attendance Summary</h3>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-6">
                  {attendanceReport.byMonth.map(m => (
                    <div key={m.month} className={`rounded-xl p-3 text-center ${m.present > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                      <p className="text-xs text-slate-500">{new Date(2024, m.month - 1).toLocaleString('en', { month: 'short' })}</p>
                      <p className={`text-xl font-bold ${m.present > 0 ? 'text-green-600' : 'text-slate-400'}`}>{m.present}</p>
                      <p className="text-[10px] text-slate-400">days</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── FEES REPORTS TAB ─── */}
      {!loading && mainTab === 'Fees Reports' && (
        <div className="space-y-4">
          {membershipData?.member && (
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">Membership Status</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{membershipData.member.membershipPlan} Plan</p>
                <p className="text-xs text-slate-500">Expires: {fmtDate(membershipData.member.membershipExpiryDate)}</p>
              </div>
              <div className="text-right">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${membershipData.daysLeft > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700'}`}>
                  {membershipData.daysLeft > 0 ? `${membershipData.daysLeft} Days Remaining` : 'Expired'}
                </span>
              </div>
            </div>
          )}

          {/* Filtered Fee Payments */}
          <PaginatedTable
            cols={[
              { label: 'Date', render: r => fmtDate(r.paymentDate || r.createdAt) },
              { label: 'Amount', render: r => <span className="font-bold text-slate-800 dark:text-white">₹{r.amount?.toLocaleString()}</span> },
              { label: 'Plan', render: r => r.membershipId?.planType || r.planType || '—' },
              { label: 'Method', render: r => r.paymentMethod || 'Cash' },
              { label: 'Status', render: r => <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${r.status === 'Paid' || r.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : r.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span> },
              { label: 'Receipt', render: r => (r.status === 'Paid' ? <button onClick={() => handleDownloadReceipt(r._id)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"><FiFileText size={12} /> Download</button> : '—') }
            ]}
            rows={userPayments}
            emptyMsg="No payment history records found"
            pageSize={10}
          />
        </div>
      )}
    </div>
  );
};

export default UserReportsPage;
