import React, { useEffect } from 'react';
import useDashboardStore from '../../store/dashboardStore';
import {
  DashboardCard,
  AttendanceChart,
  RevenueChart,
  ExpenseChart,
  SeatChart,
  MembershipChart,
  ActivityTable,
  UpcomingExpiryTable,
  QuickActions,
  Skeleton,
  money,
  FiUsers,
  FiUserCheck,
  FiCalendar,
  FiUserX,
  FiGrid,
  FiDollarSign,
  FiAlertCircle,
  FiClock,
} from '../../components/dashboard';

export default function AdminDashboard() {
  const {
    summary,
    attendance,
    revenue,
    expenses,
    occupancy,
    growth,
    activities,
    expiring,
    loading,
    error,
    loadAdmin,
  } = useDashboardStore();

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-panel">
        <b>Dashboard unavailable</b>
        <p>{error}</p>
        <button onClick={loadAdmin}>Try again</button>
      </div>
    );
  }

  const s = summary || {};

  const cards = [
    { title: 'Total Members', value: s.totalMembers, icon: FiUsers, tone: 'primary' },
    { title: 'Present Today', value: s.presentToday, icon: FiCalendar, tone: 'success' },
    { title: 'Absent Today', value: s.absentToday, icon: FiUserX, tone: 'danger' },
    { title: 'Occupied Seats', value: s.occupiedSeats, icon: FiGrid, tone: 'warning' },
    { title: 'Available Seats', value: s.availableSeats, icon: FiGrid, tone: 'success' },
    { title: 'Monthly Income', value: money(s.monthlyIncome), icon: FiDollarSign, tone: 'success' },
    { title: 'Monthly Expenses', value: money(s.monthlyExpenses), icon: FiDollarSign, tone: 'danger' },
    { title: 'Pending Fees', value: money(s.pendingFees), icon: FiAlertCircle, tone: 'warning' },
    { title: 'Expiring in 7 Days', value: s.membershipExpiry, icon: FiClock, tone: 'danger' },
    { title: 'Active Members', value: s.activeMembers, icon: FiUserCheck, tone: 'primary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="dash-title">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          A live view of your library operations.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

      {/* Charts Row 1 */}
      <div className="grid gap-6 xl:grid-cols-2">
        <AttendanceChart data={attendance} />
        <SeatChart data={occupancy} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueChart data={revenue} />
        <ExpenseChart data={expenses} />
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-6 xl:grid-cols-2">
        <MembershipChart data={growth} />
        <QuickActions />
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <ActivityTable data={activities} />
        <UpcomingExpiryTable data={expiring} />
      </div>
    </div>
  );
}
