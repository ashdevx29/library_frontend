import React, { useState, useEffect, useMemo } from 'react';
import useThemeStore from '../../store/themeStore.js';
import { adminReportService } from '../../services/adminReportService.js';
import { getDailyReport, getMonthlyReport, getYearlyReport } from '../../services/expenseService.js';
import ExportButton from '../../components/ui/ExportButton';
import UserAvatar from '../../components/ui/UserAvatar';
import { FiUsers, FiDollarSign, FiGrid, FiDownload, FiFilter, FiBarChart2, FiClock, FiCheckCircle, FiAlertTriangle, FiEye, FiX, FiCalendar, FiArrowLeft } from 'react-icons/fi';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TABS = ['Attendance','Fees','Expenses','Membership','Seats'];

const formatBillingPeriod = (r) => {
  if (r?.billingPeriod) return r.billingPeriod;
  if (r?.fromMonth && r?.toMonth) {
    return r.fromMonth === r.toMonth ? r.fromMonth : `${r.fromMonth} - ${r.toMonth}`;
  }
  const dateObj = r?.paymentDate ? new Date(r.paymentDate) : r?.date ? new Date(r.date) : r?.createdAt ? new Date(r.createdAt) : new Date();
  const planType = (r?.planType || r?.membershipId?.planType || '').toLowerCase();
  let monthsToAdd = 1;
  if (planType.includes('quarter') || planType.includes('3 month')) monthsToAdd = 3;
  else if (planType.includes('half') || planType.includes('6 month')) monthsToAdd = 6;
  else if (planType.includes('year') || planType.includes('12 month')) monthsToAdd = 12;

  const endDate = new Date(dateObj);
  endDate.setMonth(endDate.getMonth() + monthsToAdd);

  const startStr = dateObj.toLocaleDateString('en-IN', { month: 'short' });
  const startYr = dateObj.getFullYear();
  const endStr = endDate.toLocaleDateString('en-IN', { month: 'short' });
  const endYr = endDate.getFullYear();

  return startYr === endYr ? `${startStr} - ${endStr} ${startYr}` : `${startStr} ${startYr} - ${endStr} ${endYr}`;
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2.5 min-w-0 overflow-hidden shadow-xs">
    <div className={`shrink-0 rounded-lg p-2 ${color}`}><Icon size={14} /></div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] sm:text-xs font-semibold text-[var(--text-muted)] truncate">{label}</p>
      <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{value}</p>
    </div>
  </div>
);

const PaginatedTable = ({ cols, rows = [], emptyMsg = 'No data', pageSize = 10 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const safeRows = Array.isArray(rows) ? rows : [];

  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(safeRows.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = safeRows.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        {safeRows.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)]">{emptyMsg}</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {cols.map((c, i) => (
                  <th key={i} className="px-3 py-2 text-left font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((r, i) => (
                <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)]">
                  {cols.map((c, j) => (
                    <td key={j} className="px-3 py-2 text-[var(--text-primary)] whitespace-nowrap">
                      {c.render ? c.render(r) : (r && c.key ? r[c.key] : '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {safeRows.length > 0 && (
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--text-muted)] flex-wrap gap-2">
          <div>
            Showing <span className="font-semibold text-[var(--text-primary)]">{startIndex + 1}</span> to <span className="font-semibold text-[var(--text-primary)]">{Math.min(startIndex + pageSize, safeRows.length)}</span> of <span className="font-semibold text-[var(--text-primary)]">{safeRows.length}</span> entries
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-semibold hover:bg-[var(--bg-hover)] disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-[var(--text-primary)]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-semibold hover:bg-[var(--bg-hover)] disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MemberAttendancePageView = ({ memberId, initialMonth, initialYear, onBack }) => {
  const [modalMonth, setModalMonth] = useState(initialMonth || new Date().getMonth() + 1);
  const [modalYear, setModalYear] = useState(initialYear || new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await adminReportService.attendanceMemberDetails(memberId, modalMonth, modalYear);
        if (isMounted) setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDetails();
    return () => { isMounted = false; };
  }, [memberId, modalMonth, modalYear]);

  if (!memberId) return null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Bar with Back Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all shadow-sm cursor-pointer shrink-0"
          >
            <FiArrowLeft size={14} /> Back to Reports
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <UserAvatar
              src={data?.member?.photo}
              name={data?.member?.fullName || 'User'}
              className="h-10 w-10 shrink-0 rounded-full object-cover bg-orange-100 border border-orange-200 shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">{data?.member?.fullName || 'Member Attendance'}</h1>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                {data?.member?.mobile || '—'} · Seat: <b className="text-[var(--text-primary)]">{data?.member?.seatNumber}</b> · Shift: <b className="text-[var(--text-primary)]">{data?.member?.shiftName}</b>
              </p>
            </div>
          </div>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5">
            <FiCalendar size={13} className="text-[var(--text-muted)]" />
            <select
              value={modalMonth}
              onChange={e => setModalMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5">
            <select
              value={modalYear}
              onChange={e => setModalYear(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : !data ? (
        <div className="py-16 text-center text-sm text-[var(--text-muted)]">Failed to load attendance details</div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={FiCalendar} label="Total Days" value={data.summary.totalDays} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
            <StatCard icon={FiCheckCircle} label="Present" value={data.summary.daysPresent} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
            <StatCard icon={FiAlertTriangle} label="Absent" value={data.summary.daysAbsent} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
            <StatCard icon={FiClock} label="Late" value={data.summary.daysLate} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" />
            <StatCard icon={FiBarChart2} label="Attendance %" value={`${data.summary.attendancePercentage}%`} color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" />
          </div>

          {/* Daily Logs Table */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Daily Attendance Log — {MONTHS[modalMonth - 1]} {modalYear}
            </h2>
            <PaginatedTable
              cols={[
                {
                  label: 'Date',
                  render: r => (
                    <div className="whitespace-nowrap flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--text-primary)]">{r.date}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">({r.dayOfWeek})</span>
                    </div>
                  )
                },
                { label: 'Shift', render: r => r.shiftName },
                { label: 'Seat', render: r => r.seatNumber },
                {
                  label: 'Check In',
                  render: r => r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
                },
                {
                  label: 'Check Out',
                  render: r => r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
                },
                {
                  label: 'Duration',
                  render: r => r.duration ? `${(r.duration / 60).toFixed(1)} hrs` : '—'
                },
                {
                  label: 'Status',
                  render: r => {
                    if (r.isFuture || r.status === '—') {
                      return <span className="text-[var(--text-muted)] font-semibold">—</span>;
                    }
                    let badgeClass = 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
                    if (r.status === 'Present' || r.status === 'Checked Out') {
                      badgeClass = r.isLate
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
                    }
                    return (
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                        {r.isLate ? 'Late' : r.status}
                      </span>
                    );
                  }
                }
              ]}
              rows={[...(data.dailyLogs || [])].sort((a, b) => a.date.localeCompare(b.date))}
              emptyMsg="No daily logs for this month"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminReports() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [tab, setTab] = useState('Attendance');
  const [subTab, setSubTab] = useState('Today');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMemberView, setSelectedMemberView] = useState(null);

  const load = async () => {
    setLoading(true); setData(null);
    try {
      if (tab === 'Attendance') {
        if (subTab === 'Today' || subTab === 'Daily') setData(await adminReportService.attendanceDaily(date));
        else if (subTab === 'Monthly') setData(await adminReportService.attendanceMonthly(month, year));
        else setData(await adminReportService.attendanceYearly(year, month));
      } else if (tab === 'Fees') {
        if (subTab === 'Today' || subTab === 'Daily') setData(await adminReportService.feesDaily(date));
        else if (subTab === 'Monthly') setData(await adminReportService.feesMonthly(month, year));
        else if (subTab === 'Yearly') setData(await adminReportService.feesYearly(year));
        else setData(await adminReportService.feesPending());
      } else if (tab === 'Expenses') {
        if (subTab === 'Today' || subTab === 'Daily') setData(await getDailyReport(date));
        else if (subTab === 'Monthly') setData(await getMonthlyReport(month, year));
        else setData(await getYearlyReport(year));
      } else if (tab === 'Membership') {
        setData(await adminReportService.membershipOverview());
      } else if (tab === 'Seats') {
        setData(await adminReportService.seatOverview());
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab, subTab, date, month, year]);

  const feeSubTabs = ['Today','Monthly','Yearly','Pending'];
  const attSubTabs = ['Today'];
  const expSubTabs = ['Today','Monthly','Yearly'];

  const entityMap = { Attendance: 'attendance', Fees: 'payments', Expenses: 'expenses', Membership: 'members', Seats: 'members' };

  const exportParams = useMemo(() => {
    if (tab === 'Attendance' && (subTab === 'Today' || subTab === 'Daily')) return { startDate: date, endDate: date };
    if (tab === 'Attendance' && subTab === 'Monthly') return { startDate: `${year}-${String(month).padStart(2,'0')}-01`, endDate: `${year}-${String(month).padStart(2,'0')}-31` };
    if (tab === 'Attendance' && subTab === 'Yearly') return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
    if (tab === 'Fees' && (subTab === 'Today' || subTab === 'Daily')) return { startDate: date, endDate: date };
    if (tab === 'Fees' && subTab === 'Monthly') return { startDate: `${year}-${String(month).padStart(2,'0')}-01`, endDate: `${year}-${String(month).padStart(2,'0')}-31` };
    if (tab === 'Expenses' && (subTab === 'Today' || subTab === 'Daily')) return { startDate: date, endDate: date };
    if (tab === 'Expenses' && subTab === 'Monthly') return { startDate: `${year}-${String(month).padStart(2,'0')}-01`, endDate: `${year}-${String(month).padStart(2,'0')}-31` };
    if (tab === 'Expenses' && subTab === 'Yearly') return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
    return {};
  }, [tab, subTab, date, month, year]);

  const renderTable = () => {
    if (!data) return null;

    if (tab === 'Attendance' && (subTab === 'Today' || subTab === 'Daily') && data.records) {
      return (
        <PaginatedTable
          cols={[
            {
              label: 'Name',
              key: 'fullName',
              render: r => (
                <div className="flex items-center gap-2">
                    <UserAvatar
                      src={r.memberId?.photo}
                      name={r.memberId?.fullName || 'User'}
                      className="h-8 w-8 rounded-full bg-orange-100 object-cover border border-orange-200"
                    />
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">{r.memberId?.fullName || '-'}</span>
                    <p className="text-[10px] text-[var(--text-muted)]">{r.memberId?.mobile}</p>
                  </div>
                </div>
              )
            },
            { label: 'Shift', render: r => r.shiftId?.shiftName || '-' },
            { label: 'Seat', render: r => r.seatId?.seatNumber || '-' },
            { label: 'Check In', render: r => r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-' },
            { label: 'Check Out', render: r => r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-' },
            {
              label: 'Status',
              render: r => (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${r.status === 'Present' || r.status === 'Checked Out' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                  {r.status}
                </span>
              )
            },
            {
              label: 'Action',
              render: r => (
                <button
                  onClick={() => {
                    const selDate = new Date(date || Date.now());
                    setSelectedMemberView({
                      memberId: r.memberId?._id || r.memberId,
                      fullName: r.memberId?.fullName,
                      month: selDate.getMonth() + 1,
                      year: selDate.getFullYear(),
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm cursor-pointer"
                >
                  <FiEye size={13} /> View Attendance
                </button>
              )
            }
          ]}
          rows={data.records}
        />
      );
    }

    if (tab === 'Attendance' && subTab === 'Monthly' && data.memberRecords) {
      return (
        <>
          <PaginatedTable
            cols={[
              {
                label: 'Name',
                render: r => (
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      src={r.photo}
                      name={r.fullName}
                      className="h-8 w-8 rounded-full bg-orange-100 object-cover border border-orange-200"
                    />
                    <div>
                      <b className="text-[var(--text-primary)] font-semibold">{r.fullName}</b>
                      <p className="text-[10px] text-[var(--text-muted)]">{r.mobile}</p>
                    </div>
                  </div>
                )
              },
              { label: 'Shift', render: r => r.shiftName || '—' },
              { label: 'Seat', render: r => r.seatNumber || '—' },
              { label: 'Present', render: r => <span className="font-semibold text-green-600 dark:text-green-400">{r.daysPresent} days</span> },
              { label: 'Absent', render: r => <span className="font-semibold text-red-500 dark:text-red-400">{r.daysAbsent} days</span> },
              { label: 'Late', render: r => <span className="font-semibold text-yellow-600 dark:text-yellow-400">{r.daysLate} days</span> },
              {
                label: 'Attendance %',
                render: r => {
                  const p = r.attendancePercentage;
                  const color = p >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : p >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${color}`}>{p}%</span>;
                }
              },
              {
                label: 'Action',
                render: r => (
                  <button
                    onClick={() => setSelectedMemberView({ memberId: r.memberId, fullName: r.fullName, month, year })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm cursor-pointer"
                  >
                    <FiEye size={13} /> View Attendance
                  </button>
                )
              }
            ]}
            rows={data.memberRecords}
            emptyMsg="No monthly attendance records found"
          />
          {data.byDay && data.byDay.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <p className="mb-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Daily Attendance Trend ({MONTHS[month-1]} {year})</p>
              <div className="h-36 flex items-end gap-1 px-2">
                {data.byDay.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-[var(--primary)] transition-all hover:opacity-100"
                    style={{
                      height: `${(d.count / Math.max(...data.byDay.map(x => x.count), 1)) * 100}%`,
                      opacity: 0.6 + (d.count / Math.max(...data.byDay.map(x => x.count), 1)) * 0.4
                    }}
                    title={`Day ${d.day}: ${d.count} present`}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      );
    }

    if (tab === 'Attendance' && subTab === 'Yearly' && data.memberRecords) {
      return (
        <>
          <PaginatedTable
            cols={[
              {
                label: 'Name',
                render: r => (
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      src={r.photo}
                      name={r.fullName}
                      className="h-8 w-8 rounded-full bg-orange-100 object-cover border border-orange-200"
                    />
                    <div>
                      <b className="text-[var(--text-primary)] font-semibold">{r.fullName}</b>
                      <p className="text-[10px] text-[var(--text-muted)]">{r.mobile}</p>
                    </div>
                  </div>
                )
              },
              { label: 'Shift', render: r => r.shiftName || '—' },
              { label: 'Seat', render: r => r.seatNumber || '—' },
              { label: 'Present', render: r => <span className="font-semibold text-green-600 dark:text-green-400">{r.daysPresent} days</span> },
              { label: 'Absent', render: r => <span className="font-semibold text-red-500 dark:text-red-400">{r.daysAbsent} days</span> },
              { label: 'Late', render: r => <span className="font-semibold text-yellow-600 dark:text-yellow-400">{r.daysLate || 0} days</span> },
              {
                label: 'Attendance %',
                render: r => {
                  const p = r.attendancePercentage;
                  const color = p >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : p >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${color}`}>{p}%</span>;
                }
              },
              {
                label: 'Action',
                render: r => (
                  <button
                    onClick={() => setSelectedMemberView({ memberId: r.memberId, fullName: r.fullName, month: month || new Date().getMonth() + 1, year })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm cursor-pointer"
                  >
                    <FiEye size={13} /> View Attendance
                  </button>
                )
              }
            ]}
            rows={data.memberRecords}
            emptyMsg="No yearly attendance records found"
          />
          {data.byMonth && data.byMonth.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <p className="mb-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Monthly Breakdown Overview ({year})</p>
              <div className="h-36 flex items-end gap-1 px-2">
                {data.byMonth.map((m, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-[var(--primary)] transition-all hover:opacity-100"
                    style={{
                      height: `${(m.present / Math.max(...data.byMonth.map(x => x.present), 1)) * 100}%`,
                      opacity: 0.6 + (m.present / Math.max(...data.byMonth.map(x => x.present), 1)) * 0.4
                    }}
                    title={`${MONTHS[m.month - 1]}: ${m.present} total present`}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      );
    }

    if (tab === 'Fees' && (subTab === 'Today' || subTab === 'Daily')) {
      const records = Array.isArray(data?.paid) || Array.isArray(data?.pending) ? [...(data?.paid || []), ...(data?.pending || [])] : [];
      return (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <StatCard icon={FiDollarSign} label="Daily Collection" value={`₹${(data?.collection || 0).toLocaleString()}`} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
            <StatCard icon={FiCheckCircle} label="Paid Count" value={data?.paidCount || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
            <StatCard icon={FiClock} label="Pending Amount" value={`₹${(data?.pendingAmount || 0).toLocaleString()}`} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" />
          </div>
          <PaginatedTable
            cols={[
              {
                label: 'Name',
                render: r => (
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      src={r.memberId?.photo}
                      name={r.memberId?.fullName || 'User'}
                      className="h-8 w-8 rounded-full object-cover border border-orange-200"
                    />  <div>
                      <b className="text-[var(--text-primary)] font-semibold">{r?.memberId?.fullName || '—'}</b>
                      <p className="text-[10px] text-[var(--text-muted)]">{r?.memberId?.mobile || '—'}</p>
                    </div>
                  </div>
                )
              },
              { label: 'Shift', render: r => r?.memberId?.shiftId?.shiftName || '—' },
              { label: 'Seat', render: r => r?.memberId?.seatId?.seatNumber || '—' },
              { label: 'Month / Period', render: r => <span className="font-bold text-[var(--primary)]">{r?.billingPeriod || formatBillingPeriod(r)}</span> },
              { label: 'Plan', render: r => r?.membershipId?.planType || '—' },
              { label: 'Amount', render: r => <span className="font-bold text-[var(--text-primary)]">₹{(r?.amount || 0).toLocaleString()}</span> },
              { label: 'Payment Method', render: r => r?.paymentMethod || '—' },
              {
                label: 'Status',
                render: r => (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${r?.status === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                    {r?.status || 'Pending'}
                  </span>
                )
              }
            ]}
            rows={records}
            emptyMsg="No daily fee records found"
          />
        </>
      );
    }

    if (tab === 'Fees' && subTab === 'Monthly') {
      const records = Array.isArray(data?.studentRecords) ? data.studentRecords : Array.isArray(data?.paid) ? [...(data.paid || []), ...(data.pending || [])] : [];
      return (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard icon={FiDollarSign} label="Total Collection" value={`₹${(data?.totalCollection || 0).toLocaleString()}`} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
            <StatCard icon={FiClock} label="Total Pending" value={`₹${(data?.totalPendingAmount || 0).toLocaleString()}`} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
            <StatCard icon={FiCheckCircle} label="Paid Students" value={data?.paidCount || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
            <StatCard icon={FiUsers} label="Pending Students" value={data?.pendingCount || 0} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" />
          </div>
          <PaginatedTable
            cols={[
              {
                label: 'Name',
                render: r => (
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      src={r.memberId?.photo || r.photo}
                      name={r?.memberId?.fullName || r.fullName || 'User'}
                      className="h-8 w-8 rounded-full object-cover border border-orange-200"
                    /><div>
                      <b className="text-[var(--text-primary)] font-semibold">{r?.fullName || r?.memberId?.fullName || '—'}</b>
                      <p className="text-[10px] text-[var(--text-muted)]">{r?.mobile || r?.memberId?.mobile || '—'}</p>
                    </div>
                  </div>
                )
              },
              { label: 'Shift', render: r => r?.shiftName || r?.memberId?.shiftId?.shiftName || '—' },
              { label: 'Seat', render: r => r?.seatNumber || r?.memberId?.seatId?.seatNumber || '—' },
              { label: 'Month / Period', render: r => <span className="font-bold text-[var(--primary)]">{r?.billingPeriod || formatBillingPeriod(r)}</span> },
              { label: 'Plan', render: r => r?.planType || r?.membershipId?.planType || '—' },
              { label: 'Amount', render: r => <span className="font-bold text-[var(--text-primary)]">₹{(r?.amount || 0).toLocaleString()}</span> },
              { label: 'Payment Date', render: r => r?.paymentDate && r?.paymentDate !== '—' ? new Date(r.paymentDate).toLocaleDateString('en-IN') : '—' },
              { label: 'Payment Method', render: r => r?.paymentMethod || '—' },
              {
                label: 'Status',
                render: r => (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${r?.status === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                    {r?.status || 'Pending'}
                  </span>
                )
              }
            ]}
            rows={records}
            emptyMsg="No monthly fee records found"
          />
        </>
      );
    }

    if (tab === 'Fees' && subTab === 'Yearly') {
      const records = Array.isArray(data?.studentRecords) ? data.studentRecords : [];
      return (
        <>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <StatCard icon={FiDollarSign} label="Yearly Collection" value={`₹${(data?.totalYearlyCollection || 0).toLocaleString()}`} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
            <StatCard icon={FiCheckCircle} label="Paid Transactions" value={data?.paidTransactionsCount || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
            <StatCard icon={FiUsers} label="Total Students" value={data?.totalStudents || 0} color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" />
          </div>
          <PaginatedTable
            cols={[
              {
                label: 'Name',
                render: r => (
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      src={r?.photo}
                      name={r?.fullName || 'User'}
                      className="h-8 w-8 rounded-full object-cover border border-orange-200"
                    /><div>
                      <b className="text-[var(--text-primary)] font-semibold">{r?.fullName || '—'}</b>
                      <p className="text-[10px] text-[var(--text-muted)]">{r?.mobile || '—'}</p>
                    </div>
                  </div>
                )
              },
              { label: 'Shift', render: r => r?.shiftName || '—' },
              { label: 'Seat', render: r => r?.seatNumber || '—' },
              { label: 'Plan', render: r => r?.planType || '—' },
              { label: 'Yearly Paid', render: r => <span className="font-bold text-green-600 dark:text-green-400">₹{(r?.yearlyPaidAmount || 0).toLocaleString()}</span> },
              { label: 'Paid Months', render: r => <span className="font-semibold text-[var(--text-primary)]">{r?.paidMonthsCount || 0} / 12 months</span> },
              {
                label: 'Month-wise Info',
                render: r => (
                  <div className="flex items-center gap-1 overflow-x-auto max-w-[220px] py-1">
                    {r?.monthLogs?.map(m => (
                      <span
                        key={m.month}
                        title={`${MONTHS[m.month - 1]}: ${m.status} (₹${m.amount})`}
                        className={`inline-flex items-center justify-center h-4 w-4 rounded text-[9px] font-bold ${m.status === 'Paid' ? 'bg-green-500 text-white' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'}`}
                      >
                        {m.month}
                      </span>
                    ))}
                  </div>
                )
              }
            ]}
            rows={records}
            emptyMsg="No yearly fee records found"
          />
        </>
      );
    }

    if (tab === 'Fees' && subTab === 'Pending') {
      const records = Array.isArray(data?.pendingStudents) ? data.pendingStudents : Array.isArray(data?.pendingPayments) ? data.pendingPayments : [];
      return (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <StatCard icon={FiClock} label="Total Pending Amount" value={`₹${(data?.pendingAmount || 0).toLocaleString()}`} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
            <StatCard icon={FiUsers} label="Pending Students" value={data?.totalPending || 0} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" />
          </div>
          <PaginatedTable
            cols={[
              {
                label: 'Name',
                render: r => (
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      src={r?.photo || r?.memberId?.photo}
                      name={r?.fullName || r?.memberId?.fullName || 'User'}
                      className="h-8 w-8 rounded-full bg-orange-100 object-cover border border-orange-200"
                    />
                    <div>
                      <b className="text-[var(--text-primary)] font-semibold">{r?.fullName || r?.memberId?.fullName || '—'}</b>
                      <p className="text-[10px] text-[var(--text-muted)]">{r?.mobile || r?.memberId?.mobile || '—'}</p>
                    </div>
                  </div>
                )
              },
              { label: 'Shift', render: r => r?.shiftName || r?.memberId?.shiftId?.shiftName || '—' },
              { label: 'Seat', render: r => r?.seatNumber || r?.memberId?.seatId?.seatNumber || '—' },
              { label: 'Plan', render: r => r?.planType || r?.membershipId?.planType || '—' },
              { label: 'Pending Amount', render: r => <span className="font-bold text-red-600 dark:text-red-400">₹{(r?.amount || 0).toLocaleString()}</span> },
              { label: 'Expiry / Due Date', render: r => r?.dueDate || (r?.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : '—') },
              {
                label: 'Status',
                render: r => (
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    Pending
                  </span>
                )
              }
            ]}
            rows={records}
            emptyMsg="No pending fee records found"
          />
        </>
      );
    }

    if (tab === 'Expenses' && (subTab === 'Today' || subTab === 'Daily') && data.expenses) {
      return (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-3">
            <StatCard icon={FiDollarSign} label="Daily Spent" value={`₹${(data.total || 0).toLocaleString()}`} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
            <StatCard icon={FiGrid} label="Total Entries" value={data.count || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
            <StatCard icon={FiClock} label="Average / Entry" value={`₹${data.count > 0 ? Math.round(data.total / data.count).toLocaleString() : 0}`} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
          </div>
          <PaginatedTable
            cols={[
              { label: 'Date', render: r => r.expenseDate ? new Date(r.expenseDate).toLocaleDateString('en-IN') : '—' },
              { label: 'Title / Reason', render: r => <span className="font-semibold text-[var(--text-primary)]">{r.title || '—'}</span> },
              { label: 'Category', render: r => r.category || 'General' },
              { label: 'Description / Note', render: r => <span className="text-[var(--text-muted)] truncate max-w-[200px] inline-block" title={r.description}>{r.description || '—'}</span> },
              { label: 'Amount', render: r => <span className="font-bold text-red-600 dark:text-red-400">₹{(r.amount || 0).toLocaleString()}</span> },
              { label: 'Method', render: r => r.paymentMethod || 'Cash' },
              { label: 'Added By', render: r => r.addedBy?.name || '—' }
            ]}
            rows={data.expenses}
            emptyMsg="No expense records found for this date"
          />
        </>
      );
    }
    if (tab === 'Expenses' && subTab === 'Monthly' && data.expenses) {
      return (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-3">
            <StatCard icon={FiDollarSign} label="Monthly Spent" value={`₹${(data.total || 0).toLocaleString()}`} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
            <StatCard icon={FiGrid} label="Total Entries" value={data.count || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
            <StatCard icon={FiClock} label="Average / Entry" value={`₹${data.count > 0 ? Math.round(data.total / data.count).toLocaleString() : 0}`} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
          </div>
          {data.byCategory && Object.keys(data.byCategory).length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Category Breakdown</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(data.byCategory).map(([cat, amt]) => (
                  <div key={cat} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2.5 text-center">
                    <div className="text-[10px] font-medium text-[var(--text-muted)] truncate">{cat}</div>
                    <div className="text-xs font-bold text-[var(--text-primary)] mt-0.5">₹{amt.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <PaginatedTable
            cols={[
              { label: 'Date', render: r => r.expenseDate ? new Date(r.expenseDate).toLocaleDateString('en-IN') : '—' },
              { label: 'Title / Reason', render: r => <span className="font-semibold text-[var(--text-primary)]">{r.title || '—'}</span> },
              { label: 'Category', render: r => r.category || 'General' },
              { label: 'Description / Note', render: r => <span className="text-[var(--text-muted)] truncate max-w-[200px] inline-block" title={r.description}>{r.description || '—'}</span> },
              { label: 'Amount', render: r => <span className="font-bold text-red-600 dark:text-red-400">₹{(r.amount || 0).toLocaleString()}</span> },
              { label: 'Method', render: r => r.paymentMethod || 'Cash' },
              { label: 'Added By', render: r => r.addedBy?.name || '—' }
            ]}
            rows={data.expenses}
            emptyMsg="No expense records found for this month"
          />
        </>
      );
    }
    if (tab === 'Expenses' && subTab === 'Yearly') {
      return (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCard icon={FiDollarSign} label="Yearly Spent" value={`₹${(data?.total || 0).toLocaleString()}`} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
            <StatCard icon={FiGrid} label="Total Entries" value={data?.count || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          </div>
          {data?.byMonth && data.byMonth.length > 0 && (
            <div className="mb-6">
              <p className="mb-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Monthly Expense Summary ({year})</p>
              <PaginatedTable
                cols={[
                  { label: 'Month', render: r => MONTHS[r.month - 1] },
                  { label: 'Total Amount', render: r => <span className="font-bold text-red-600 dark:text-red-400">₹{r.total.toLocaleString()}</span> },
                  { label: 'Entries Count', render: r => <span className="font-semibold text-[var(--text-primary)]">{r.count} entries</span> }
                ]}
                rows={data.byMonth}
                pageSize={12}
              />
              <div className="mt-4 h-36 flex items-end gap-1 px-2 border-t border-[var(--border)] pt-4">
                {data.byMonth.map((m, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-red-500 transition-all hover:opacity-100"
                    style={{
                      height: `${(m.total / Math.max(...data.byMonth.map(x => x.total), 1)) * 100}%`,
                      opacity: 0.6 + (m.total / Math.max(...data.byMonth.map(x => x.total), 1)) * 0.4
                    }}
                    title={`${MONTHS[m.month - 1]}: ₹${m.total.toLocaleString()}`}
                  />
                ))}
              </div>
            </div>
          )}

          {data?.expenses && (
            <div>
              <p className="mb-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Individual Expense Records ({year})</p>
              <PaginatedTable
                cols={[
                  { label: 'Date', render: r => r.expenseDate ? new Date(r.expenseDate).toLocaleDateString('en-IN') : '—' },
                  { label: 'Title / Reason', render: r => <span className="font-semibold text-[var(--text-primary)]">{r.title || '—'}</span> },
                  { label: 'Category', render: r => r.category || 'General' },
                  { label: 'Description / Note', render: r => <span className="text-[var(--text-muted)] truncate max-w-[200px] inline-block" title={r.description}>{r.description || '—'}</span> },
                  { label: 'Amount', render: r => <span className="font-bold text-red-600 dark:text-red-400">₹{(r.amount || 0).toLocaleString()}</span> },
                  { label: 'Method', render: r => r.paymentMethod || 'Cash' },
                  { label: 'Added By', render: r => r.addedBy?.name || '—' }
                ]}
                rows={data.expenses}
                emptyMsg="No yearly expense records found"
              />
            </div>
          )}
        </>
      );
    }

    if (tab === 'Membership' && data.total !== undefined) {
      const sub = subTab === 'Active' ? 'Active' : subTab === 'Expiring' ? 'Expiring' : 'Expired';
      const list = sub === 'Active'
        ? (data.activeDetails || data.expiringDetails || [])
        : sub === 'Expiring'
        ? (data.expiringDetails || [])
        : (data.expiredDetails || []);

      return (
        <PaginatedTable
          cols={[
            {
              label: 'Name',
              render: r => (
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    src={r.photo}
                    name={r.fullName}
                    className="h-8 w-8 rounded-full bg-orange-100 object-cover border border-orange-200"
                  />
                  <div>
                    <b className="text-[var(--text-primary)] font-semibold">{r.fullName}</b>
                    <p className="text-[10px] text-[var(--text-muted)]">{r.mobile}</p>
                  </div>
                </div>
              )
            },
            { label: 'Seat', render: r => r.seatId?.seatNumber || '-' },
            { label: 'Shift', render: r => r.shiftId?.shiftName || '-' },
            { label: 'Expiry', render: r => r.membershipExpiryDate ? new Date(r.membershipExpiryDate).toLocaleDateString('en-IN') : '-' },
            {
              label: 'Status',
              render: r => (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${sub === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : sub === 'Expiring' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                  {sub}
                </span>
              )
            }
          ]}
          rows={list}
          emptyMsg={`No ${sub.toLowerCase()} members`}
        />
      );
    }

    if (tab === 'Seats' && data.total !== undefined) {
      return (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon={FiGrid} label="Total" value={data.total} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
            <StatCard icon={FiUsers} label="Occupied" value={data.occupied} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
            <StatCard icon={FiCheckCircle} label="Available" value={data.available} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
            <StatCard icon={FiClock} label="Reserved" value={data.reserved} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" />
          </div>
          {data.byFloor.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">By Floor</p>
              <div className="grid grid-cols-2 gap-2">
                {data.byFloor.map((f, i) => <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2"><div className="text-[10px] font-semibold text-[var(--text-secondary)]">Floor {f.floor}</div><div className="flex gap-3 mt-1"><span className="text-xs text-green-600">{f.available} free</span><span className="text-xs text-red-600">{f.occupied} taken</span></div></div>)}
              </div>
            </div>
          )}
          <PaginatedTable
            cols={[{ label: 'Seat', render: r => r.seatNumber }, { label: 'Floor', render: r => r.floor }, { label: 'Type', render: r => r.seatType || 'Standard' }, { label: 'Status', render: r => <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.status==='Occupied'?'bg-red-100 text-red-700':r.status==='Available'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{r.status}</span> }, { label: 'Occupant', render: r => r.currentOccupant?.fullName || '-' }, { label: 'Shift', render: r => r.shiftId?.shiftName || '-' }]}
            rows={data.occupiedSeats}
          />
        </>
      );
    }

    return null;
  };

  if (selectedMemberView) {
    return (
      <MemberAttendancePageView
        memberId={selectedMemberView.memberId}
        initialMonth={selectedMemberView.month}
        initialYear={selectedMemberView.year}
        onBack={() => setSelectedMemberView(null)}
      />
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--primary)]/10 p-3"><FiBarChart2 size={24} className="text-[var(--primary)]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
            <p className="text-sm text-[var(--text-muted)]">Comprehensive analytics and insights</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1 overflow-x-auto">
        {TABS.map(t => <button key={t} onClick={() => { setData(null); setTab(t); setSubTab(t==='Fees'?'Monthly':t==='Attendance'?'Today':t==='Membership'?'Active':t==='Seats'?'Overview':'Today'); }} className={`flex-shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${tab===t?'bg-[var(--primary)] text-white shadow-md':'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>{t}</button>)}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1">
          {(tab==='Attendance'?attSubTabs:tab==='Fees'?feeSubTabs:tab==='Expenses'?expSubTabs:tab==='Membership'?['Active','Expiring','Expired']:[]).map(s => <button key={s} onClick={() => { setData(null); setSubTab(s); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${subTab===s?'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20':'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>{s}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(subTab==='Today' || subTab==='Daily') && (
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--text-primary)]" />
          )}
          {subTab==='Monthly' && (
            <>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5 text-xs text-[var(--text-primary)]">{MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}</select>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5 text-xs text-[var(--text-primary)]">{[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
            </>
          )}
          {subTab==='Yearly' && (
            <>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5 text-xs text-[var(--text-primary)]">{[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
              {tab !== 'Fees' && (
                <select value={month || ''} onChange={e => setMonth(e.target.value ? Number(e.target.value) : '')} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5 text-xs text-[var(--text-primary)]">
                  <option value="">All Months</option>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              )}
            </>
          )}
          <ExportButton entity={entityMap[tab]} filename={`${tab}-${subTab}-report`} params={exportParams} disabled={tab==='Seats'} />
          <button onClick={load} className="flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-all"><FiFilter size={12} /> Refresh</button>
        </div>
      </div>

      {data && tab==='Attendance' && (subTab==='Today' || subTab==='Daily') && data.totalMembers !== undefined && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatCard icon={FiUsers} label="Total Members" value={data.totalMembers} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          <StatCard icon={FiCheckCircle} label="Present" value={data.present} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
          <StatCard icon={FiAlertTriangle} label="Absent" value={data.absent} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
          <StatCard icon={FiClock} label="Late" value={data.late || 0} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" />
        </div>
      )}

      {data && tab==='Attendance' && subTab==='Monthly' && data.totalMembers !== undefined && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <StatCard icon={FiUsers} label="Total Members" value={data.totalMembers} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          <StatCard icon={FiCheckCircle} label="Total Present Logs" value={data.totalPresent} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
          <StatCard icon={FiBarChart2} label="Avg Daily Present" value={data.avgDaily} color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" />
        </div>
      )}

      {data && tab==='Attendance' && subTab==='Yearly' && data.totalMembers !== undefined && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <StatCard icon={FiUsers} label="Total Members" value={data.totalMembers} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          <StatCard icon={FiCheckCircle} label="Total Present Logs" value={data.totalPresent} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
          <StatCard icon={FiCalendar} label="Year" value={year} color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" />
        </div>
      )}



      {data && tab==='Membership' && data.total !== undefined && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatCard icon={FiUsers} label="Total" value={data.total} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          <StatCard icon={FiCheckCircle} label="Active" value={data.active} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
          <StatCard icon={FiClock} label="Expiring (7d)" value={data.expiringWeek} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" />
          <StatCard icon={FiAlertTriangle} label="Expired" value={data.expired} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
        </div>
      )}

      {data && tab==='Expenses' && (subTab==='Today' || subTab==='Daily') && data.total !== undefined && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={FiDollarSign} label="Total Spent" value={`₹${(data.total || 0).toLocaleString()}`} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
          <StatCard icon={FiGrid} label="Expenses" value={data.count || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
        </div>
      )}

      {data && tab==='Expenses' && subTab==='Monthly' && data.total !== undefined && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={FiDollarSign} label="Monthly Spent" value={`₹${(data.total || 0).toLocaleString()}`} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
          <StatCard icon={FiGrid} label="Expenses" value={data.count || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
        </div>
      )}

      {data && tab==='Expenses' && subTab==='Yearly' && data.total !== undefined && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={FiDollarSign} label="Yearly Spent" value={`₹${(data.total || 0).toLocaleString()}`} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
          <StatCard icon={FiGrid} label="Expenses" value={data.count || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          {renderTable()}
        </div>
      )}
    </div>
  );
}
