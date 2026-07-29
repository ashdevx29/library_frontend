import React, { useState, useEffect, useMemo } from 'react';
import useThemeStore from '../../store/themeStore.js';
import { adminReportService } from '../../services/adminReportService.js';
import { getDailyReport, getMonthlyReport, getYearlyReport } from '../../services/expenseService.js';
import { FiUsers, FiDollarSign, FiGrid, FiDownload, FiFilter, FiBarChart2, FiClock, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TABS = ['Attendance','Fees','Expenses','Membership','Seats'];

const exportCSV = (data, name) => {
  if (!data.length) return;
  const csv = [Object.keys(data[0]).join(','), ...data.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${name}.csv`; a.click();
};

const ExportBtns = ({ data, name }) => (
  <button onClick={() => exportCSV(data, name)} className="flex items-center gap-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] px-2 py-1 text-[10px] font-semibold text-[var(--text-secondary)] hover:border-green-500 hover:text-green-600 transition-all">
    <FiDownload size={10} /> CSV
  </button>
);

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
    <div className={`rounded-lg p-2 ${color}`}><Icon size={14} /></div>
    <div>
      <p className="text-[10px] font-medium text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  </div>
);

const Table = ({ cols, rows, emptyMsg = 'No data' }) => (
  <div className="overflow-x-auto">
    {rows.length === 0 ? (
      <div className="py-8 text-center text-sm text-[var(--text-muted)]">{emptyMsg}</div>
    ) : (
      <table className="w-full text-xs">
        <thead><tr className="border-b border-[var(--border)]">{cols.map((c, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-[var(--text-secondary)]">{c.label}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)]">{cols.map((c, j) => <td key={j} className="px-3 py-2 text-[var(--text-primary)]">{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}</tbody>
      </table>
    )}
  </div>
);

export default function AdminReports() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [tab, setTab] = useState('Attendance');
  const [subTab, setSubTab] = useState('Daily');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const load = async () => {
    setLoading(true); setData(null);
    try {
      if (tab === 'Attendance') {
        if (subTab === 'Daily') setData(await adminReportService.attendanceDaily(date));
        else if (subTab === 'Monthly') setData(await adminReportService.attendanceMonthly(month, year));
        else setData(await adminReportService.attendanceYearly(year));
      } else if (tab === 'Fees') {
        if (subTab === 'Daily') setData(await adminReportService.feesDaily(date));
        else if (subTab === 'Monthly') setData(await adminReportService.feesMonthly(month, year));
        else setData(await adminReportService.feesPending());
      } else if (tab === 'Expenses') {
        if (subTab === 'Daily') setData(await getDailyReport(date));
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

  useEffect(() => { load(); }, [tab, subTab]);

  const feeSubTabs = ['Daily','Monthly','Pending'];
  const attSubTabs = ['Daily','Monthly','Yearly'];
  const expSubTabs = ['Daily','Monthly','Yearly'];

  const renderTable = () => {
    if (!data) return null;

    // ── ATTENDANCE ──
    if (tab === 'Attendance' && subTab === 'Daily' && data.records) {
      return <Table cols={[{ label: 'Name', key: 'fullName', render: r => r.memberId?.fullName || '-' }, { label: 'Shift', render: r => r.shiftId?.shiftName || '-' }, { label: 'Seat', render: r => r.seatId?.seatNumber || '-' }, { label: 'Check In', render: r => r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '-' }, { label: 'Check Out', render: r => r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : '-' }, { label: 'Status', render: r => <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.status==='Present'?'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400':'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>{r.status}</span> }]} rows={data.records} />;
    }
    if (tab === 'Attendance' && subTab === 'Monthly' && data.byDay) {
      return (
        <>
          <Table cols={[{ label: 'Day', render: (_, i) => `Day ${i+1}` }, { label: 'Present', render: r => r.count }]} rows={data.byDay} />
          <div className="mt-4 h-48 flex items-end gap-1 px-2">
            {data.byDay.map((d, i) => <div key={i} className="flex-1 rounded-t bg-[var(--primary)]" style={{ height: `${d.count / Math.max(...data.byDay.map(x=>x.count), 1) * 100}%`, opacity: 0.7 + (d.count/Math.max(...data.byDay.map(x=>x.count),1))*0.3 }} title={`Day ${d.day}: ${d.count}`} />)}
          </div>
        </>
      );
    }
    if (tab === 'Attendance' && subTab === 'Yearly' && data.byMonth) {
      return (
        <>
          <Table cols={[{ label: 'Month', render: r => MONTHS[r.month-1] }, { label: 'Present', render: r => r.present }]} rows={data.byMonth} />
          <div className="mt-4 h-48 flex items-end gap-1 px-2">
            {data.byMonth.map((m, i) => <div key={i} className="flex-1 rounded-t bg-[var(--primary)]" style={{ height: `${m.present / Math.max(...data.byMonth.map(x=>x.present), 1) * 100}%`, opacity: 0.7 + (m.present/Math.max(...data.byMonth.map(x=>x.present),1))*0.3 }} title={`${MONTHS[m.month-1]}: ${m.present}`} />)}
          </div>
        </>
      );
    }

    // ── FEES ──
    if (tab === 'Fees' && subTab === 'Daily' && data.paid) {
      return <Table cols={[{ label: 'Name', render: r => r.memberId?.fullName || '-' }, { label: 'Amount', render: r => `₹${r.amount}` }, { label: 'Plan', render: r => r.membershipId?.planType || '-' }, { label: 'Method', render: r => r.paymentMethod || '-' }, { label: 'Status', render: r => <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.status==='Paid'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{r.status}</span> }]} rows={[...data.paid, ...data.pending]} />;
    }
    if (tab === 'Fees' && subTab === 'Monthly' && data.paid) {
      return (
        <>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {data.byDay.map((d, i) => <div key={i} className="text-center"><div className="text-[10px] text-[var(--text-muted)]">Day {d.day}</div><div className="text-xs font-bold text-[var(--text-primary)]">₹{d.amount.toLocaleString()}</div></div>)}
          </div>
          <Table cols={[{ label: 'Name', render: r => r.memberId?.fullName || '-' }, { label: 'Amount', render: r => `₹${r.amount}` }, { label: 'Date', render: r => new Date(r.paymentDate).toLocaleDateString() }, { label: 'Status', render: r => <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.status==='Paid'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{r.status}</span> }]} rows={[...data.paid, ...data.pending]} />
        </>
      );
    }
    if (tab === 'Fees' && subTab === 'Pending') {
      return <Table cols={[{ label: 'Name', render: r => r.memberId?.fullName || '-' }, { label: 'Amount', render: r => `₹${r.amount}` }, { label: 'Plan', render: r => r.membershipId?.planType || '-' }, { label: 'Date', render: r => new Date(r.paymentDate).toLocaleDateString() }]} rows={data.pendingPayments} emptyMsg="No pending payments" />;
    }

    // ── EXPENSES ──
    if (tab === 'Expenses' && subTab === 'Daily' && data.expenses) {
      return (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCard icon={FiDollarSign} label="Total Spent" value={`₹${(data.total || 0).toLocaleString()}`} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
            <StatCard icon={FiGrid} label="Expenses" value={data.count || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          </div>
          <Table cols={[{ label: 'Title', render: r => r.title }, { label: 'Category', render: r => r.category }, { label: 'Amount', render: r => `₹${r.amount}` }, { label: 'Method', render: r => r.paymentMethod || '-' }, { label: 'Date', render: r => new Date(r.expenseDate).toLocaleDateString() }, { label: 'By', render: r => r.addedBy?.name || '-' }]} rows={data.expenses} />
        </>
      );
    }
    if (tab === 'Expenses' && subTab === 'Monthly' && data.expenses) {
      return (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCard icon={FiDollarSign} label="Total Spent" value={`₹${(data.total || 0).toLocaleString()}`} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
            <StatCard icon={FiGrid} label="Expenses" value={data.count || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          </div>
          {data.byCategory && Object.keys(data.byCategory).length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-2">
              {Object.entries(data.byCategory).map(([cat, amt]) => <div key={cat} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 text-center"><div className="text-[10px] text-[var(--text-muted)]">{cat}</div><div className="text-xs font-bold text-[var(--text-primary)]">₹{amt.toLocaleString()}</div></div>)}
            </div>
          )}
          <Table cols={[{ label: 'Title', render: r => r.title }, { label: 'Category', render: r => r.category }, { label: 'Amount', render: r => `₹${r.amount}` }, { label: 'Method', render: r => r.paymentMethod || '-' }, { label: 'Date', render: r => new Date(r.expenseDate).toLocaleDateString() }]} rows={data.expenses} />
        </>
      );
    }
    if (tab === 'Expenses' && subTab === 'Yearly' && data.byMonth) {
      return (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCard icon={FiDollarSign} label="Total Spent" value={`₹${(data.total || 0).toLocaleString()}`} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
            <StatCard icon={FiGrid} label="Expenses" value={data.count || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          </div>
          <Table cols={[{ label: 'Month', render: r => MONTHS[r.month-1] }, { label: 'Total', render: r => `₹${r.total.toLocaleString()}` }, { label: 'Count', render: r => r.count }]} rows={data.byMonth} />
          <div className="mt-4 h-48 flex items-end gap-1 px-2">
            {data.byMonth.map((m, i) => <div key={i} className="flex-1 rounded-t bg-red-500" style={{ height: `${m.total / Math.max(...data.byMonth.map(x=>x.total), 1) * 100}%`, opacity: 0.6 + (m.total/Math.max(...data.byMonth.map(x=>x.total),1))*0.4 }} title={`${MONTHS[m.month-1]}: ₹${m.total.toLocaleString()}`} />)}
          </div>
        </>
      );
    }

    // ── MEMBERSHIP ──
    if (tab === 'Membership' && data.total !== undefined) {
      const sub = subTab === 'Active' ? 'Active' : subTab === 'Expiring' ? 'Expiring' : 'Expired';
      const list = sub === 'Active' ? (data.expiringDetails || []).filter(m => { const d = new Date(m.membershipExpiryDate); return d > new Date(Date.now() + 7*86400000); }) : sub === 'Expiring' ? data.expiringDetails : data.expiredDetails;
      return (
        <Table
          cols={[{ label: 'Name', render: r => r.fullName }, { label: 'Mobile', render: r => r.mobile }, { label: 'Seat', render: r => r.seatId?.seatNumber || '-' }, { label: 'Shift', render: r => r.shiftId?.shiftName || '-' }, { label: 'Expiry', render: r => new Date(r.membershipExpiryDate).toLocaleDateString() }, { label: 'Status', render: r => <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sub==='Active'?'bg-green-100 text-green-700':sub==='Expiring'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{sub}</span>}]}
          rows={list}
          emptyMsg={`No ${sub.toLowerCase()} members`}
        />
      );
    }

    // ── SEATS ──
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
          <Table
            cols={[{ label: 'Seat', render: r => r.seatNumber }, { label: 'Floor', render: r => r.floor }, { label: 'Type', render: r => r.seatType || 'Standard' }, { label: 'Status', render: r => <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.status==='Occupied'?'bg-red-100 text-red-700':r.status==='Available'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{r.status}</span> }, { label: 'Occupant', render: r => r.currentOccupant?.fullName || '-' }, { label: 'Shift', render: r => r.shiftId?.shiftName || '-' }]}
            rows={data.occupiedSeats}
          />
        </>
      );
    }

    return null;
  };

  const currentData = useMemo(() => {
    if (!data) return [];
    if (data.records) return data.records;
    if (data.paid) return [...data.paid, ...data.pending];
    if (data.pendingPayments) return data.pendingPayments;
    if (data.expenses) return data.expenses;
    if (data.byDay && tab !== 'Attendance') return data.byDay;
    if (data.byDay && tab === 'Attendance') return data.byDay;
    if (data.byMonth && tab === 'Expenses') return data.byMonth;
    if (data.byMonth) return data.byMonth;
    if (data.expiringDetails) return data.expiringDetails;
    if (data.occupiedSeats) return data.occupiedSeats;
    return [];
  }, [data, tab]);

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

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1 overflow-x-auto">
        {TABS.map(t => <button key={t} onClick={() => { setTab(t); setSubTab(t==='Fees'?'Daily':t==='Membership'?'Active':t==='Seats'?'Overview':'Daily'); }} className={`flex-shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${tab===t?'bg-[var(--primary)] text-white shadow-md':'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>{t}</button>)}
      </div>

      {/* Sub-tabs + Filters + Export */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1">
          {(tab==='Attendance'?attSubTabs:tab==='Fees'?feeSubTabs:tab==='Expenses'?expSubTabs:tab==='Membership'?['Active','Expiring','Expired']:[]).map(s => <button key={s} onClick={() => setSubTab(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${subTab===s?'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20':'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>{s}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(subTab==='Daily') && (
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--text-primary)]" />
          )}
          {(subTab==='Monthly' || subTab==='Yearly') && (
            <>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5 text-xs text-[var(--text-primary)]">{MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}</select>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5 text-xs text-[var(--text-primary)]">{[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
            </>
          )}
          {tab !== 'Expenses' && <ExportBtns data={currentData} name={`${tab}-${subTab}-${date || month+'-'+year}`} />}
          <button onClick={load} className="flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-all"><FiFilter size={12} /> Refresh</button>
        </div>
      </div>

      {/* Stats Bar */}
      {data && tab==='Attendance' && subTab==='Daily' && data.totalMembers !== undefined && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatCard icon={FiUsers} label="Total Members" value={data.totalMembers} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          <StatCard icon={FiCheckCircle} label="Present" value={data.present} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
          <StatCard icon={FiAlertTriangle} label="Absent" value={data.absent} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
          <StatCard icon={FiClock} label="Late" value={data.late} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" />
        </div>
      )}

      {data && tab==='Attendance' && subTab==='Monthly' && data.totalMembers !== undefined && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <StatCard icon={FiUsers} label="Total Members" value={data.totalMembers} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          <StatCard icon={FiCheckCircle} label="Total Present" value={data.totalPresent} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
          <StatCard icon={FiBarChart2} label="Avg Daily" value={data.avgDaily} color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" />
        </div>
      )}

      {data && tab==='Fees' && subTab==='Daily' && data.collection !== undefined && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={FiDollarSign} label="Collection" value={`₹${data.collection.toLocaleString()}`} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
          <StatCard icon={FiCheckCircle} label="Paid" value={data.paidCount} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          <StatCard icon={FiClock} label="Pending" value={`₹${data.pendingAmount.toLocaleString()}`} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" />
        </div>
      )}

      {data && tab==='Fees' && subTab==='Monthly' && data.totalCollection !== undefined && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={FiDollarSign} label="Total Collection" value={`₹${data.totalCollection.toLocaleString()}`} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
          <StatCard icon={FiCheckCircle} label="Paid" value={data.paidCount} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          <StatCard icon={FiClock} label="Pending" value={`₹${data.pendingAmount.toLocaleString()}`} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" />
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

      {data && tab==='Expenses' && subTab==='Daily' && data.total !== undefined && (
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
