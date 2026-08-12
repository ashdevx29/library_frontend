import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAttendanceHistory } from '../../services/attendanceService';
import { getMyMembership, getMyPayments, getMyRenewals, downloadReceipt } from '../../services/paymentService';
import { formatBillingPeriod } from '../fees/index.jsx';
import { exportToCSV, exportToPDF } from '../../utils/exportHelpers';
import { FiCalendar, FiClock, FiCheckCircle, FiDollarSign, FiFileText, FiChevronLeft, FiChevronRight, FiCreditCard, FiSearch, FiX, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MAIN_TABS = ['Attendance Reports', 'Fees Reports'];

const UserReportsPage = () => {
  const [mainTab, setMainTab] = useState('Attendance Reports');
  const [loading, setLoading] = useState(false);

  // Attendance History States
  const [attendanceHistoryData, setAttendanceHistoryData] = useState({ records: [], total: 0, page: 1, totalPages: 1 });
  const [attPage, setAttPage] = useState(1);
  const [attLoading, setAttLoading] = useState(false);

  // Fee states
  const [membershipData, setMembershipData] = useState(null);
  const [userPayments, setUserPayments] = useState([]);
  const [userRenewals, setUserRenewals] = useState([]);

  // Fee Report Filters & Search State
  const [feeSearch, setFeeSearch] = useState('');
  const [feeStartDate, setFeeStartDate] = useState('');
  const [feeEndDate, setFeeEndDate] = useState('');

  // Common Month / Year Filters for Attendance Reports
  const [filters, setFilters] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  });

  // Fetch Attendance History Table Data (Month-wise)
  const fetchAttendanceData = useCallback(async (m, y, p) => {
    setAttLoading(true);
    try {
      const res = await getAttendanceHistory(m, y, p, 10);
      if (res && typeof res === 'object' && Array.isArray(res.records)) {
        setAttendanceHistoryData(res);
      } else if (Array.isArray(res)) {
        setAttendanceHistoryData({
          records: res.slice((p - 1) * 10, p * 10),
          total: res.length,
          page: p,
          totalPages: Math.ceil(res.length / 10) || 1,
        });
      } else {
        setAttendanceHistoryData({ records: [], total: 0, page: 1, totalPages: 1 });
      }
    } catch (e) {
      console.error(e);
      setAttendanceHistoryData({ records: [], total: 0, page: 1, totalPages: 1 });
    } finally {
      setAttLoading(false);
    }
  }, []);

  // Fetch Main Data based on selected tab
  useEffect(() => {
    if (mainTab === 'Attendance Reports') {
      fetchAttendanceData(filters.month, filters.year, attPage);
    } else if (mainTab === 'Fees Reports') {
      setLoading(true);
      Promise.all([getMyMembership(), getMyPayments(), getMyRenewals()])
        .then(([m, p, r]) => {
          setMembershipData(m);
          setUserPayments(p);
          setUserRenewals(r);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [mainTab, filters.month, filters.year, attPage, fetchAttendanceData]);

  // Unified combined Fee Records dataset (Payments + Renewals)
  const combinedFeeRecords = useMemo(() => {
    const list = [];
    const seenRequestIds = new Set();

    (userPayments || []).forEach(p => {
      if (p.renewalRequestId) {
        seenRequestIds.add(p.renewalRequestId.toString());
      }
      list.push({
        id: p._id,
        date: p.paymentDate || p.createdAt,
        billingPeriod: formatBillingPeriod(p),
        planType: p.membershipId?.planType || p.planType || 'Membership Fee',
        amount: p.amount || 0,
        paymentMethod: p.paymentMethod || 'Cash',
        status: p.status || 'Paid',
        note: p.note || '',
        receiptId: p.status === 'Paid' ? p._id : null,
      });
    });

    (userRenewals || []).forEach(r => {
      if (!seenRequestIds.has(r._id.toString())) {
        list.push({
          id: r._id,
          date: r.requestedAt || r.createdAt,
          billingPeriod: formatBillingPeriod(r),
          planType: r.planType ? `${r.planType} Renewal` : 'Renewal',
          amount: r.amount || 0,
          paymentMethod: r.paymentMethod || 'Cash',
          status: r.status,
          note: r.note || '',
          receiptId: null,
        });
      }
    });

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [userPayments, userRenewals]);

  // Filtered fee records based on search and date range
  const filteredFeeRecords = useMemo(() => {
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    return combinedFeeRecords.filter(item => {
      if (feeStartDate) {
        const itemTime = new Date(item.date).getTime();
        const startTime = new Date(feeStartDate).setHours(0, 0, 0, 0);
        if (itemTime < startTime) return false;
      }
      if (feeEndDate) {
        const itemTime = new Date(item.date).getTime();
        const endTime = new Date(feeEndDate).setHours(23, 59, 59, 999);
        if (itemTime > endTime) return false;
      }

      if (feeSearch.trim()) {
        const q = feeSearch.toLowerCase();
        const dateStr = fmt(item.date).toLowerCase();
        const periodStr = (item.billingPeriod || '').toLowerCase();
        const typeStr = (item.planType || '').toLowerCase();
        const amountStr = String(item.amount);
        const methodStr = (item.paymentMethod || '').toLowerCase();
        const statusStr = (item.status || '').toLowerCase();

        return (
          dateStr.includes(q) ||
          periodStr.includes(q) ||
          typeStr.includes(q) ||
          amountStr.includes(q) ||
          methodStr.includes(q) ||
          statusStr.includes(q)
        );
      }

      return true;
    });
  }, [combinedFeeRecords, feeSearch, feeStartDate, feeEndDate]);

  // Handlers for Downloading Fee Receipt
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

  // Export Attendance CSV
  const handleExportAttendanceCSV = async () => {
    try {
      const res = await getAttendanceHistory(filters.month, filters.year, 1, 100);
      const allRecords = res?.records || [];
      const columns = [
        { label: 'Date', accessor: r => fmtDateWithDay(r.date) },
        { label: 'Check-In', accessor: r => r.checkInTime ? fmtTime(r.checkInTime) : '—' },
        { label: 'Check-Out', accessor: r => r.checkOutTime ? fmtTime(r.checkOutTime) : r.checkInTime ? 'Active' : '—' },
        { label: 'Duration', accessor: r => r.duration ? `${Math.floor(r.duration / 60)}h ${r.duration % 60}m` : '—' },
        { label: 'Status', accessor: r => r.duration > 0 || r.checkInTime ? 'Present' : 'Absent' },
      ];
      exportToCSV(`Attendance_Report_${filters.month}_${filters.year}`, columns, allRecords);
      toast.success('Attendance CSV report exported');
    } catch (e) {
      toast.error('Failed to export CSV');
    }
  };

  // Export Attendance PDF
  const handleExportAttendancePDF = async () => {
    try {
      const res = await getAttendanceHistory(filters.month, filters.year, 1, 100);
      const allRecords = res?.records || [];
      const columns = [
        { label: 'Date', accessor: r => fmtDateWithDay(r.date) },
        { label: 'Check-In', accessor: r => r.checkInTime ? fmtTime(r.checkInTime) : '—' },
        { label: 'Check-Out', accessor: r => r.checkOutTime ? fmtTime(r.checkOutTime) : r.checkInTime ? 'Active' : '—' },
        { label: 'Duration', accessor: r => r.duration ? `${Math.floor(r.duration / 60)}h ${r.duration % 60}m` : '—' },
        { label: 'Status', accessor: r => r.duration > 0 || r.checkInTime ? 'Present' : 'Absent' },
      ];
      const monthName = new Date(filters.year, filters.month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      exportToPDF(`Attendance Report — ${monthName}`, columns, allRecords);
    } catch (e) {
      toast.error('Failed to export PDF');
    }
  };

  // Export Fees CSV & PDF
  const handleExportFeeCSV = () => {
    const columns = [
      { label: 'Date', accessor: r => fmtDate(r.date) },
      { label: 'Month / Period', accessor: 'billingPeriod' },
      { label: 'Plan / Type', accessor: 'planType' },
      { label: 'Amount (₹)', accessor: 'amount' },
      { label: 'Payment Method', accessor: 'paymentMethod' },
      { label: 'Status', accessor: 'status' },
    ];
    exportToCSV('My_Fees_Report', columns, filteredFeeRecords);
    toast.success('CSV report exported');
  };

  const handleExportFeePDF = () => {
    const columns = [
      { label: 'Date', accessor: r => fmtDate(r.date) },
      { label: 'Month / Period', accessor: 'billingPeriod' },
      { label: 'Plan / Type', accessor: 'planType' },
      { label: 'Amount (₹)', accessor: 'amount' },
      { label: 'Payment Method', accessor: 'paymentMethod' },
      { label: 'Status', accessor: 'status' },
    ];
    exportToPDF('My Fees Report & Statement', columns, filteredFeeRecords);
  };

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtDateWithDay = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const inputClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  const attRecords = attendanceHistoryData.records || [];
  const attTotal = attendanceHistoryData.total || 0;
  const attTotalPages = attendanceHistoryData.totalPages || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Student Reports & Statements</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">View your detailed attendance and fee reports</p>
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

      {loading && <div className="py-12 text-center text-slate-400">Fetching report data...</div>}

      {/* ─── ATTENDANCE REPORTS TAB (MATCHES IMAGE 1 LAYOUT) ─── */}
      {!loading && mainTab === 'Attendance Reports' && (
        <div className="space-y-4">
          <section className="space-y-4 rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
            {/* Header and Month/Year Filter Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FiCalendar className="text-orange-500" />
                  Attendance Report
                </h2>
                <p className="text-xs text-slate-500">View attendance records month-wise in structured table format</p>
              </div>

              {/* Month / Year Filter Dropdowns & Export Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Month Dropdown */}
                <select
                  value={filters.month}
                  onChange={e => { setFilters(f => ({ ...f, month: e.target.value })); setAttPage(1); }}
                  className={inputClass}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('en-IN', { month: 'long' })}
                    </option>
                  ))}
                </select>

                {/* Year Input */}
                <input
                  type="number"
                  value={filters.year}
                  onChange={e => { setFilters(f => ({ ...f, year: e.target.value })); setAttPage(1); }}
                  min="2020"
                  max="2099"
                  className={inputClass + ' w-24'}
                />

                {/* Export Action Buttons */}
                <button
                  onClick={handleExportAttendanceCSV}
                  disabled={!attRecords.length}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50 transition"
                >
                  <FiFileText size={14} className="text-blue-500" /> Export CSV
                </button>
                <button
                  onClick={handleExportAttendancePDF}
                  disabled={!attRecords.length}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50 transition"
                >
                  <FiDownload size={14} className="text-red-500" /> Export PDF
                </button>
              </div>
            </div>

            {/* Data Table */}
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
                  {attLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Loading attendance records...
                      </td>
                    </tr>
                  ) : !attRecords.length ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No attendance records found for this month
                      </td>
                    </tr>
                  ) : (
                    attRecords.map(h => {
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
                            {fmtDateWithDay(h.date)}
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

            {/* Pagination Controls */}
            {attTotal > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-500">
                  Showing {((attPage - 1) * 10) + 1} to {Math.min(attPage * 10, attTotal)} of {attTotal} records
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAttPage(p => Math.max(1, p - 1))}
                    disabled={attPage === 1 || attLoading}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <FiChevronLeft /> Previous
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Page {attPage} of {attTotalPages}
                  </span>
                  <button
                    onClick={() => setAttPage(p => Math.min(attTotalPages, p + 1))}
                    disabled={attPage >= attTotalPages || attLoading}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ─── FEES REPORTS TAB ─── */}
      {!loading && mainTab === 'Fees Reports' && (
        <div className="space-y-4">
          {/* Membership Status Banner */}
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

          {/* Section Container with Controls & Export */}
          <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
            {/* Header & Export Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <h2 className="font-bold text-lg text-slate-800 dark:text-white">Fee Statement & History</h2>
                <p className="text-xs text-slate-500">All-time fee payment records and renewal history statement</p>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportFeeCSV}
                  disabled={!filteredFeeRecords.length}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50 transition"
                >
                  <FiFileText size={14} className="text-blue-500" /> Export CSV
                </button>
                <button
                  onClick={handleExportFeePDF}
                  disabled={!filteredFeeRecords.length}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50 transition"
                >
                  <FiDownload size={14} className="text-red-500" /> Export PDF
                </button>
              </div>
            </div>

            {/* Search and Date Range Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={feeSearch}
                  onChange={e => setFeeSearch(e.target.value)}
                  placeholder="Search plan, method, status, amount..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              {/* Date-to-Date Range Filters */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={feeStartDate}
                  onChange={e => setFeeStartDate(e.target.value)}
                  title="Start Date"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={feeEndDate}
                  onChange={e => setFeeEndDate(e.target.value)}
                  title="End Date"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                {(feeStartDate || feeEndDate || feeSearch) && (
                  <button
                    onClick={() => { setFeeStartDate(''); setFeeEndDate(''); setFeeSearch(''); }}
                    className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 cursor-pointer"
                    title="Clear Filters"
                  >
                    <FiX size={13} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* All-Time Unified Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Month / Period</th>
                    <th className="px-4 py-3">Plan / Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {!filteredFeeRecords.length ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No payment or renewal history records found
                      </td>
                    </tr>
                  ) : (
                    filteredFeeRecords.map(r => {
                      let badgeColor = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
                      if (r.status === 'Paid' || r.status === 'Approved') {
                        badgeColor = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                      } else if (r.status === 'Rejected' || r.status === 'Failed') {
                        badgeColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                      }

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-white whitespace-nowrap">
                            {fmtDate(r.date)}
                          </td>
                          <td className="px-4 py-3 font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                            {r.billingPeriod || '—'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">
                            {r.planType}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                            ₹{(r.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {r.paymentMethod}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${badgeColor}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {r.status === 'Paid' && r.receiptId ? (
                              <button
                                onClick={() => handleDownloadReceipt(r.receiptId)}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 cursor-pointer"
                                title="Download PDF Receipt"
                              >
                                <FiFileText size={12} /> Download
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default UserReportsPage;
