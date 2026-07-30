import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import {
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiUsers, FiUserX,
  FiAlertCircle, FiBarChart2, FiPieChart, FiActivity, FiCalendar,
  FiGrid, FiTarget, FiRefreshCw,
} from 'react-icons/fi';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import AttendanceHeatmap from '../../components/dashboard/Heatmap';
import CalendarAttendance from '../../components/dashboard/CalendarAttendance';

const CHART_TYPES = [
  { id: 'bar', label: 'Bar', icon: FiBarChart2 },
  { id: 'area', label: 'Area', icon: FiActivity },
  { id: 'pie', label: 'Pie', icon: FiPieChart },
  { id: 'line', label: 'Line', icon: FiTrendingUp },
];

const METRICS = [
  { id: 'revenue-expense', label: 'Revenue vs Expense', color: '#FF6B00' },
  { id: 'attendance-trend', label: 'Attendance Trend', color: '#22C55E' },
  { id: 'plan-distribution', label: 'Membership Plans', color: '#3B82F6' },
  { id: 'seat-distribution', label: 'Seat Types', color: '#8B5CF6' },
];

const COLORS = ['#FF6B00', '#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

const TooltipBox = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-1 text-[11px] font-bold text-gray-600 dark:text-gray-400">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[11px]" style={{ color: p.color }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [chartType, setChartType] = useState('bar');
  const [metric, setMetric] = useState('revenue-expense');
  const [chartMonths, setChartMonths] = useState(12);
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => { const { data } = await api.get('/analytics/summary'); return data.data; },
    refetchInterval: 60000,
  });

  const { data: revExp } = useQuery({
    queryKey: ['analytics-revenue-expense', chartMonths],
    queryFn: async () => { const { data } = await api.get(`/analytics/revenue-expense?months=${chartMonths}`); return data.data; },
  });

  const { data: attTrend } = useQuery({
    queryKey: ['analytics-attendance-trend', chartMonths],
    queryFn: async () => { const { data } = await api.get(`/analytics/attendance-trend?months=${chartMonths}`); return data.data; },
  });

  const { data: planDist } = useQuery({
    queryKey: ['analytics-plan-distribution'],
    queryFn: async () => { const { data } = await api.get('/analytics/plan-distribution'); return data.data; },
  });

  const { data: seatDist } = useQuery({
    queryKey: ['analytics-seat-distribution'],
    queryFn: async () => { const { data } = await api.get('/analytics/seat-distribution'); return data.data; },
  });

  const { data: dailyMatrix } = useQuery({
    queryKey: ['analytics-daily-matrix', calYear, calMonth],
    queryFn: async () => { const { data } = await api.get(`/analytics/daily-matrix?year=${calYear}&month=${calMonth}`); return data.data; },
  });

  const { data: calYearData } = useQuery({
    queryKey: ['analytics-calendar-year', calYear],
    queryFn: async () => { const { data } = await api.get(`/analytics/calendar-year?year=${calYear}`); return data.data; },
  });

  const handleMonthChange = useCallback((y, m) => {
    setCalYear(y);
    setCalMonth(m);
  }, []);

  const statCards = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Today's Collection", value: formatCurrency(summary.todayCollection), icon: FiDollarSign, tone: 'success', subtitle: 'Revenue today' },
      { label: 'Weekly Collection', value: formatCurrency(summary.weeklyCollection), icon: FiTrendingUp, tone: 'primary', subtitle: 'This week' },
      { label: 'Monthly Collection', value: formatCurrency(summary.monthlyCollection), icon: FiTrendingUp, tone: 'primary', subtitle: 'This month' },
      { label: 'Yearly Collection', value: formatCurrency(summary.yearlyCollection), icon: FiDollarSign, tone: 'success', subtitle: 'This year' },
      { label: 'Active Members', value: summary.activeMembers, icon: FiUsers, tone: 'success', subtitle: `${summary.totalMembers} total` },
      { label: 'Expired Members', value: summary.expiredMembers, icon: FiUserX, tone: 'danger', subtitle: 'Need renewal' },
      { label: 'Pending Fees', value: formatCurrency(summary.pendingFees), icon: FiAlertCircle, tone: 'warning', subtitle: 'Unpaid' },
      { label: 'Attendance %', value: `${summary.attendancePercentage}%`, icon: FiActivity, tone: summary.attendancePercentage >= 70 ? 'success' : 'warning', subtitle: `${summary.presentToday} present today` },
      { label: 'Seat Utilization', value: `${summary.seatUtilization}%`, icon: FiGrid, tone: summary.seatUtilization >= 70 ? 'success' : 'warning', subtitle: `${summary.occupiedSeats}/${summary.totalSeats}` },
      { label: 'Revenue', value: formatCurrency(summary.revenue), icon: FiTrendingUp, tone: 'success', subtitle: 'Total all-time' },
      { label: 'Expenses', value: formatCurrency(summary.expenses), icon: FiTrendingDown, tone: 'danger', subtitle: 'Total all-time' },
      { label: 'Profit', value: formatCurrency(summary.profit), icon: FiTarget, tone: summary.profit >= 0 ? 'success' : 'danger', subtitle: summary.profit >= 0 ? 'Positive' : 'Negative' },
    ];
  }, [summary]);

  const chartData = useMemo(() => {
    switch (metric) {
      case 'revenue-expense': return revExp || [];
      case 'attendance-trend': return attTrend || [];
      case 'plan-distribution': return planDist || [];
      case 'seat-distribution': return seatDist || [];
      default: return [];
    }
  }, [metric, revExp, attTrend, planDist, seatDist]);

  const chartKeys = useMemo(() => {
    if (!chartData.length) return [];
    const keys = Object.keys(chartData[0]).filter(k => k !== 'month' && k !== 'year' && k !== 'name');
    return keys;
  }, [chartData]);

  const cardClass = 'rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all hover:shadow-md';
  const sectionTitle = 'text-lg font-bold text-[var(--text-primary)]';

  if (sumLoading) return <PageLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Comprehensive insights into library operations</p>
        </div>
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {statCards.map((card, i) => {
          const tones = {
            primary: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
            success: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
            danger: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
            warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
          };
          const t = tones[card.tone] || tones.primary;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={cardClass}>
              <div className="flex items-start justify-between">
                <div className={`rounded-lg p-2 ${t}`}><card.icon size={14} /></div>
                <span className="text-[9px] text-[var(--text-muted)]">{card.subtitle}</span>
              </div>
              <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">{card.value}</p>
              <p className="text-[10px] font-medium text-[var(--text-muted)]">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className={cardClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className={sectionTitle}>Charts & Visualizations</h2>
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric selector */}
            <select value={metric} onChange={e => setMetric(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] outline-none">
              {METRICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            {/* Chart type selector */}
            <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-1">
              {CHART_TYPES.map(ct => (
                <button key={ct.id} onClick={() => setChartType(ct.id)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-all ${chartType === ct.id ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                ><ct.icon size={12} /> {ct.label}</button>
              ))}
            </div>
            {/* Months selector (for revenue/attendance) */}
            {(metric === 'revenue-expense' || metric === 'attendance-trend') && (
              <select value={chartMonths} onChange={e => setChartMonths(Number(e.target.value))} className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] outline-none">
                {[3, 6, 12, 24].map(n => <option key={n} value={n}>{n} months</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="h-80">
          {metric === 'plan-distribution' || metric === 'seat-distribution' ? (
            chartData.length > 0 ? (
              <ResponsiveContainer>
                {(chartType === 'pie' || chartType === 'bar') ? (
                  chartType === 'pie' ? (
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={120} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<TooltipBox />} />
                      <Legend />
                    </PieChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<TooltipBox />} />
                      <Bar dataKey="value" fill={COLORS[0]} radius={[6, 6, 0, 0]} name="Count" />
                    </BarChart>
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
                    Pie/Bar charts recommended for distribution data
                  </div>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">No data available</div>
            )
          ) : chartData.length > 0 ? (
            <ResponsiveContainer>
              {chartType === 'bar' && (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<TooltipBox formatter={metric === 'revenue-expense' ? (v) => formatCurrency(v) : undefined} />} />
                  <Legend />
                  {chartKeys.map((key, i) => (
                    <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[6, 6, 0, 0]} name={key.charAt(0).toUpperCase() + key.slice(1)} />
                  ))}
                </BarChart>
              )}
              {chartType === 'line' && (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<TooltipBox formatter={metric === 'revenue-expense' ? (v) => formatCurrency(v) : undefined} />} />
                  <Legend />
                  {chartKeys.map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 3, fill: COLORS[i % COLORS.length] }} activeDot={{ r: 5 }} name={key.charAt(0).toUpperCase() + key.slice(1)} />
                  ))}
                </LineChart>
              )}
              {chartType === 'area' && (
                <AreaChart data={chartData}>
                  <defs>
                    {chartKeys.map((key, i) => (
                      <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<TooltipBox formatter={metric === 'revenue-expense' ? (v) => formatCurrency(v) : undefined} />} />
                  <Legend />
                  {chartKeys.map((key, i) => (
                    <Area key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} fill={`url(#grad-${key})`} strokeWidth={2.5} name={key.charAt(0).toUpperCase() + key.slice(1)} />
                  ))}
                </AreaChart>
              )}
              {chartType === 'pie' && (
                <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
                  Line/Bar/Area charts recommended for trend data
                </div>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">Select a metric to view chart</div>
          )}
        </div>
      </div>

      {/* Heatmap & Calendar */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Attendance Heatmap */}
        <div className={cardClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={sectionTitle}>Attendance Heatmap</h2>
            <span className="text-[10px] text-[var(--text-muted)]">{dailyMatrix?.month ? new Date(calYear, calMonth - 1).toLocaleString('en', { month: 'long', year: 'numeric' }) : ''}</span>
          </div>
          <AttendanceHeatmap data={dailyMatrix} year={calYear} month={calMonth} />
        </div>

        {/* Calendar Attendance */}
        <div className={cardClass}>
          <div className="mb-4 flex items-center gap-2">
            <FiCalendar size={16} className="text-[var(--primary)]" />
            <h2 className={sectionTitle}>Daily Attendance</h2>
          </div>
          <CalendarAttendance data={dailyMatrix} year={calYear} month={calMonth} onMonthChange={handleMonthChange} />
        </div>
      </div>

      {/* Calendar Year Overview */}
      <div className={cardClass}>
        <div className="mb-4 flex items-center gap-2">
          <FiGrid size={16} className="text-[var(--primary)]" />
          <h2 className={sectionTitle}>Year Overview</h2>
          <select value={calYear} onChange={e => setCalYear(Number(e.target.value))} className="ml-2 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-1 text-[10px] font-medium text-[var(--text-primary)] outline-none">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {calYearData?.months ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {calYearData.months.map((m) => {
              const total = m.days.reduce((s, d) => s + d.total, 0);
              const present = m.days.reduce((s, d) => s + d.present, 0);
              const pct = total > 0 ? Math.round((present / total) * 100) : 0;
              return (
                <div key={m.month} className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">{m.name}</span>
                    <span className={`text-[10px] font-semibold ${pct >= 80 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{pct}%</span>
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {m.days.map((d) => {
                      const r = d.total > 0 ? d.present / d.total : 0;
                      let bg = 'bg-gray-100 dark:bg-gray-800';
                      if (r >= 0.8) bg = 'bg-green-500';
                      else if (r >= 0.5) bg = 'bg-yellow-400';
                      else if (r > 0) bg = 'bg-red-400';
                      return <div key={d.day} className={`h-2.5 w-2.5 rounded-sm ${bg}`} title={`Day ${d.day}: ${d.present}/${d.total}`} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-[var(--text-muted)]">Loading year data...</div>
        )}
      </div>
    </motion.div>
  );
}
