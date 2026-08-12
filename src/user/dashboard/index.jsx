import React, { useEffect, useState } from 'react';
import useDashboardStore from '../../store/dashboardStore';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  DashboardCard,
  NotificationList,
  Skeleton,
  money,
  FiGrid,
  FiClock,
  FiCalendar,
  FiUserCheck,
  FiDollarSign,
  FiCreditCard,
  FiAlertTriangle,
} from '../../components/dashboard';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatFullDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    weekday: 'short',
  });
};

const formatTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PAGE_SIZE = 10;

export default function UserDashboard() {
  const {
    summary,
    attendance,
    membership,
    notifications,
    loading,
    error,
    loadUser,
  } = useDashboardStore();

  const [page, setPage] = useState(1);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton className="h-28" key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-panel">
        {error}
        <button onClick={loadUser}>Try again</button>
      </div>
    );
  }

  const s = summary || {};
  const m = membership || {};
  const attData = attendance || {};
  const records = Array.isArray(attData.records) ? attData.records : [];

  const totalRecords = records.length;
  const totalPages = Math.ceil(totalRecords / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedRecords = records.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const cards = [
    { title: 'My Seat', value: s.seatNumber, icon: FiGrid, tone: 'primary' },
    { title: 'My Shift', value: s.shift, icon: FiClock, tone: 'info' },
    { title: "Today's Attendance", value: s.todayAttendance, icon: FiCalendar, tone: s.todayAttendance === 'Present' ? 'success' : s.todayAttendance === 'Absent' ? 'danger' : 'warning' },
    { title: 'Membership Status', value: s.membershipStatus, icon: FiUserCheck, tone: s.membershipStatus === 'Active' ? 'success' : 'danger' },
    { title: 'Remaining Days', value: s.remainingDays, icon: FiClock, tone: s.remainingDays <= 7 ? 'danger' : s.remainingDays <= 30 ? 'warning' : 'success' },
    { title: 'Membership Expiry', value: formatDate(m.expiryDate), icon: FiAlertTriangle, tone: m.remainingDays <= 7 ? 'danger' : 'primary' },
    { title: 'Pending Fees', value: money(s.pendingFees), icon: FiDollarSign, tone: s.pendingFees > 0 ? 'warning' : 'success' },
    { title: 'Last Payment', value: s.lastPayment ? money(s.lastPayment.amount) : 'No payment', icon: FiCreditCard, tone: 'primary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="dash-title">Hello, welcome back!</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Here's an overview of your library account.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map(({ title, value, icon, tone }) => (
          <DashboardCard
            key={title}
            title={title}
            value={value}
            icon={icon}
            tone={tone}
          />
        ))}
      </div>

      {/* Summary Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="dash-section">
          <h2>Attendance Summary</h2>
          <div className="summary-grid">
            <span>
              Present Days
              <b>{attData.presentDays || 0}</b>
            </span>
            <span>
              Absent Days
              <b>{attData.absentDays || 0}</b>
            </span>
            <span>
              Monthly Percentage
              <b>{attData.percentage || 0}%</b>
            </span>
          </div>
        </section>

        <section className="dash-section">
          <h2>Membership Summary</h2>
          <div className="space-y-3 text-sm">
            <p>
              Joining Date
              <b>{formatDate(m.joiningDate)}</b>
            </p>
            <p>
              Plan
              <b>{m.plan || '—'}</b>
            </p>
            <p>
              Expiry Date
              <b className={m.remainingDays <= 7 ? 'text-red-500' : ''}>
                {formatDate(m.expiryDate)}
              </b>
            </p>
            <p>
              Remaining
              <b className={m.remainingDays <= 7 ? 'text-red-500' : 'text-green-600'}>
                {m.remainingDays || 0} days
              </b>
            </p>
          </div>
        </section>
      </div>

      {/* Current Month Attendance Table */}
      <section className="dash-section space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FiCalendar className="text-orange-500" />
              Current Month Attendance Records
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed daily check-in and check-out records for your active account
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Check-In</th>
                <th className="px-4 py-3">Check-Out</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {!paginatedRecords.length ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No attendance records for this month
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const isUpcoming = r.isUpcoming || r.status === '—';
                  const isAbsent = !isUpcoming && (r.isAbsent || r.status === 'Absent');
                  const isCompleted = !isUpcoming && !isAbsent && !!r.checkOutTime;
                  const isActive = !isUpcoming && !isAbsent && r.checkInTime && !r.checkOutTime;

                  let badgeText = '—';
                  let badgeStyle = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';

                  if (isCompleted || r.status === 'Present') {
                    badgeText = 'Present';
                    badgeStyle = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                  } else if (isActive) {
                    badgeText = 'Active In Library';
                    badgeStyle = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
                  } else if (isAbsent) {
                    badgeText = 'Absent';
                    badgeStyle = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                  }

                  return (
                    <tr key={r._id || r.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                        {formatFullDate(r.date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                        {r.checkInTime ? formatTime(r.checkInTime) : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                        {r.checkOutTime ? formatTime(r.checkOutTime) : isActive ? <span className="text-yellow-600 font-bold dark:text-yellow-400">Active</span> : '—'}
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

        {/* Pagination Controls */}
        {totalRecords > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, totalRecords)} of {totalRecords} records
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <FiChevronLeft /> Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Notifications */}
      <NotificationList data={notifications} />
    </div>
  );
}

