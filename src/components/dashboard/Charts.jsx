import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  AreaChart, Area, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import { getCssVar } from '../../utils/themeColors';

const box = 'rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80';

function ChartBox({ title, children }) {
  return (
    <section className={box}>
      <h2 className="mb-5 font-poppins text-lg font-semibold text-slate-800 dark:text-white">
        {title}
      </h2>
      <div className="h-72">{children}</div>
    </section>
  );
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    fontSize: '13px',
  },
};

const gridStyle = { strokeDasharray: '3 3', vertical: false, stroke: '#e2e8f0' };

export function AttendanceChart({ data }) {
  const primary = getCssVar('--primary') || '#FF6B00';
  const accent = getCssVar('--accent') || '#FFB800';

  return (
    <ChartBox title="Attendance Trend">
      <ResponsiveContainer>
        <BarChart data={data} barGap={4}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip {...tooltipStyle} />
          <Legend />
          <Bar dataKey="present" fill="#22c55e" radius={[6, 6, 0, 0]} name="Present" />
          <Bar dataKey="absent" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="Absent" />
          <Bar dataKey="late" fill={accent} radius={[6, 6, 0, 0]} name="Late" />
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function RevenueChart({ data }) {
  const primary = getCssVar('--primary') || '#FF6B00';

  return (
    <ChartBox title="Income Trend">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip {...tooltipStyle} formatter={(v) => ['₹' + Number(v).toLocaleString('en-IN'), 'Income']} />
          <Line
            type="monotone"
            dataKey="income"
            stroke={primary}
            strokeWidth={3}
            dot={{ r: 4, fill: primary }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function ExpenseChart({ data }) {
  return (
    <ChartBox title="Expense Trend">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip {...tooltipStyle} formatter={(v) => ['₹' + Number(v).toLocaleString('en-IN'), 'Expense']} />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ r: 4, fill: '#ef4444' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function SeatChart({ data }) {
  const colors = {
    Occupied: getCssVar('--primary') || '#FF6B00',
    Available: '#22c55e',
    Reserved: getCssVar('--accent') || '#FFB800',
    Maintenance: '#94a3b8',
    occupied: getCssVar('--primary') || '#FF6B00',
    available: '#22c55e',
    reserved: getCssVar('--accent') || '#FFB800',
    maintenance: '#94a3b8',
  };

  return (
    <ChartBox title="Seat Occupancy">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={95}
            paddingAngle={3}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={colors[entry.name] || colors[entry.name?.toLowerCase()] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function MembershipChart({ data }) {
  const secondary = getCssVar('--secondary') || '#FFA000';

  return (
    <ChartBox title="Membership Growth">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondary} stopOpacity={0.6} />
              <stop offset="100%" stopColor={secondary} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip {...tooltipStyle} />
          <Area
            type="monotone"
            dataKey="members"
            stroke={secondary}
            fill="url(#growthGrad)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}
