import React, { useEffect } from 'react';
import useDashboardStore from '../../store/dashboardStore';
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
  FiAward,
} from '../../components/dashboard';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

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

  const cards = [
    { title: 'My Seat', value: s.seatNumber, icon: FiGrid, tone: 'primary' },
    { title: 'My Shift', value: s.shift, icon: FiClock, tone: 'info' },
    { title: "Today's Attendance", value: s.todayAttendance, icon: FiCalendar, tone: s.todayAttendance === 'Present' ? 'success' : s.todayAttendance === 'Absent' ? 'danger' : 'warning' },
    { title: 'Membership Status', value: s.membershipStatus, icon: FiUserCheck, tone: s.membershipStatus === 'Active' ? 'success' : 'danger' },
    { title: 'Remaining Days', value: s.remainingDays, icon: FiClock, tone: s.remainingDays <= 7 ? 'danger' : s.remainingDays <= 30 ? 'warning' : 'success' },
    { title: 'Membership Expiry', value: formatDate(m.expiryDate), icon: FiAlertTriangle, tone: m.remainingDays <= 7 ? 'danger' : 'primary' },
    { title: 'Pending Fees', value: money(s.pendingFees), icon: FiDollarSign, tone: s.pendingFees > 0 ? 'warning' : 'success' },
    { title: 'Last Payment', value: s.lastPayment ? money(s.lastPayment.amount) : 'No payment', icon: FiCreditCard, tone: 'primary' },
    { title: 'Attendance This Month', value: s.attendancePercentage + '%', icon: FiAward, tone: s.attendancePercentage >= 80 ? 'success' : s.attendancePercentage >= 50 ? 'warning' : 'danger' },
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
              <b>{attendance.presentDays || 0}</b>
            </span>
            <span>
              Absent Days
              <b>{attendance.absentDays || 0}</b>
            </span>
            <span>
              Monthly Percentage
              <b>{attendance.percentage || 0}%</b>
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

      {/* Notifications */}
      <NotificationList data={notifications} />
    </div>
  );
}
