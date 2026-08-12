import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { getMyMembership, requestRenewal, getMyPayments, getMyRenewals, downloadReceipt } from '../../services/paymentService';
import { FiCalendar, FiClock, FiCheckCircle, FiAlertTriangle, FiDollarSign, FiGrid, FiCreditCard, FiDownload, FiFileText, FiRefreshCw, FiInfo, FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { exportToCSV, exportToPDF } from '../../utils/exportHelpers';

const PLAN_PRICES = { Monthly: 500, Quarterly: 1200, HalfYearly: 2000, 'Half-Yearly': 2000, Yearly: 3500 };
const PAGE_SIZE = 10;

export const formatBillingPeriod = (item) => {
  if (item?.billingPeriod) return item.billingPeriod;
  if (item?.fromMonth && item?.toMonth) {
    return item.fromMonth === item.toMonth ? item.fromMonth : `${item.fromMonth} - ${item.toMonth}`;
  }

  const startDate = item?.startDate ? new Date(item.startDate) : item?.date ? new Date(item.date) : item?.createdAt ? new Date(item.createdAt) : new Date();
  let endDate = item?.endDate ? new Date(item.endDate) : null;

  if (!endDate) {
    const planType = (item?.type || item?.planType || '').toLowerCase();
    let monthsToAdd = 1;
    if (planType.includes('quarter') || planType.includes('3 month')) monthsToAdd = 3;
    else if (planType.includes('half') || planType.includes('6 month')) monthsToAdd = 6;
    else if (planType.includes('year') || planType.includes('12 month')) monthsToAdd = 12;

    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + monthsToAdd);
  }

  const startMonthStr = startDate.toLocaleDateString('en-IN', { month: 'short' });
  const startYear = startDate.getFullYear();
  const endMonthStr = endDate.toLocaleDateString('en-IN', { month: 'short' });
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    return `${startMonthStr} - ${endMonthStr} ${startYear}`;
  }
  return `${startMonthStr} ${startYear} - ${endMonthStr} ${endYear}`;
};

const UserFeesPage = () => {
  const [data, setData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('membership');

  // Form State
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Month options generator
  const monthOptions = useMemo(() => {
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    const getMonthStr = (offset) => {
      const d = new Date(currentYear, currentMonthIdx + offset, 1);
      return {
        short: d.toLocaleDateString('en-IN', { month: 'short' }),
        year: d.getFullYear()
      };
    };

    const single = [];
    for (let i = -1; i <= 6; i++) {
      const m1 = getMonthStr(i);
      const m2 = getMonthStr(i + 1);
      const yearStr = m1.year === m2.year ? m1.year : `${m1.year}-${m2.year}`;
      single.push(`${m1.short} - ${m2.short} ${yearStr}`);
    }

    const threeFrom = [];
    const threeTo = [];
    for (let i = -2; i <= 4; i++) {
      const mStart = getMonthStr(i);
      const mEnd = getMonthStr(i + 2);
      const yStr = mStart.year === mEnd.year ? mStart.year : `${mStart.year}-${mEnd.year}`;
      threeFrom.push(`${mStart.short} - ${mEnd.short} ${yStr}`);
    }
    for (let i = 1; i <= 7; i++) {
      const mStart = getMonthStr(i);
      const mEnd = getMonthStr(i + 2);
      const yStr = mStart.year === mEnd.year ? mStart.year : `${mStart.year}-${mEnd.year}`;
      threeTo.push(`${mStart.short} - ${mEnd.short} ${yStr}`);
    }

    const sixFrom = [];
    const sixTo = [];
    for (let i = 0; i <= 5; i++) {
      const mStart = getMonthStr(i);
      const mEnd = getMonthStr(i + 5);
      sixFrom.push(`${mStart.short} ${mStart.year} - ${mEnd.short} ${mEnd.year}`);
    }
    for (let i = 6; i <= 11; i++) {
      const mStart = getMonthStr(i);
      const mEnd = getMonthStr(i + 5);
      sixTo.push(`${mStart.short} ${mStart.year} - ${mEnd.short} ${mEnd.year}`);
    }

    const twelveFrom = [];
    const twelveTo = [];
    for (let i = 0; i <= 3; i++) {
      const mStart = getMonthStr(i);
      const mEnd = getMonthStr(i + 11);
      twelveFrom.push(`${mStart.short} ${mStart.year} - ${mEnd.short} ${mEnd.year}`);
    }
    for (let i = 12; i <= 15; i++) {
      const mStart = getMonthStr(i);
      const mEnd = getMonthStr(i + 11);
      twelveTo.push(`${mStart.short} ${mStart.year} - ${mEnd.short} ${mEnd.year}`);
    }

    return { single, threeFrom, threeTo, sixFrom, sixTo, twelveFrom, twelveTo };
  }, []);

  // Table Filters & Pagination State for Combined Payments & Renewals
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([getMyMembership(), getMyPayments(), getMyRenewals()])
      .then(([m, p, r]) => {
        setData(m); setPayments(p); setRenewals(r);
        if (m?.isExpired) setTab('renew');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      setAmount(String(PLAN_PRICES[selectedPlan] || ''));
      if (selectedPlan === 'Monthly') {
        setSelectedMonth(monthOptions.single[1] || monthOptions.single[0]);
      } else if (selectedPlan === 'Quarterly') {
        setFromMonth(monthOptions.threeFrom[0]);
        setToMonth(monthOptions.threeTo[0]);
      } else if (selectedPlan === 'HalfYearly' || selectedPlan === 'Half-Yearly') {
        setFromMonth(monthOptions.sixFrom[0]);
        setToMonth(monthOptions.sixTo[0]);
      } else if (selectedPlan === 'Yearly') {
        setFromMonth(monthOptions.twelveFrom[0]);
        setToMonth(monthOptions.twelveTo[0]);
      }
    }
  }, [selectedPlan, monthOptions]);

  const handleRenew = async () => {
    if (!selectedPlan) return;
    setSubmitting(true); setResult(null);
    try {
      const isSingleMonth = selectedPlan === 'Monthly';
      const periodStr = isSingleMonth ? selectedMonth : `${fromMonth} to ${toMonth}`;
      const fMonth = isSingleMonth ? selectedMonth : fromMonth;
      const tMonth = isSingleMonth ? selectedMonth : toMonth;

      await requestRenewal(selectedPlan, Number(amount) || 0, method, screenshotFile, periodStr, fMonth, tMonth);
      setResult({ success: true, message: 'Renewal request submitted! Waiting for admin approval.' });
      setScreenshotFile(null);
      const [m, r, p] = await Promise.all([getMyMembership(), getMyRenewals(), getMyPayments()]);
      setData(m); setRenewals(r); setPayments(p);
    } catch (e) { setResult({ success: false, message: e.response?.data?.message || 'Failed' }); }
    finally { setSubmitting(false); }
  };

  const handleDownloadReceipt = async (id) => {
    try {
      const blob = await downloadReceipt(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a'); a.href = url; a.download = `receipt-${id.slice(-8)}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e) { toast.error('Download failed'); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const field = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all';

  // Combine Payments and Renewals into a single unified dataset
  const combinedHistory = useMemo(() => {
    const list = [];
    const seenRequestIds = new Set();

    (payments || []).forEach(p => {
      if (p.renewalRequestId) {
        seenRequestIds.add(p.renewalRequestId.toString());
      }
      list.push({
        id: p._id,
        date: p.paymentDate || p.createdAt,
        billingPeriod: formatBillingPeriod(p),
        type: p.membershipId?.planType || 'Membership Fee',
        amount: p.amount || 0,
        method: p.paymentMethod || 'Cash',
        status: p.status || 'Paid',
        note: p.note || '',
        receiptId: p.status === 'Paid' ? p._id : null,
      });
    });

    (renewals || []).forEach(r => {
      if (!seenRequestIds.has(r._id.toString())) {
        list.push({
          id: r._id,
          date: r.requestedAt || r.createdAt,
          billingPeriod: formatBillingPeriod(r),
          type: r.planType ? `${r.planType} Renewal` : 'Renewal',
          amount: r.amount || 0,
          method: r.paymentMethod || 'Cash',
          status: r.status,
          note: r.note || '',
          receiptId: null,
        });
      }
    });

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [payments, renewals]);

  // Filtered combined dataset based on search & date filters
  const filteredHistory = useMemo(() => {
    return combinedHistory.filter(item => {
      // Date Filter
      if (startDate) {
        const itemTime = new Date(item.date).getTime();
        const startTime = new Date(startDate).setHours(0, 0, 0, 0);
        if (itemTime < startTime) return false;
      }
      if (endDate) {
        const itemTime = new Date(item.date).getTime();
        const endTime = new Date(endDate).setHours(23, 59, 59, 999);
        if (itemTime > endTime) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const dateStr = fmt(item.date).toLowerCase();
        const amountStr = String(item.amount);
        const typeStr = (item.type || '').toLowerCase();
        const methodStr = (item.method || '').toLowerCase();
        const statusStr = (item.status || '').toLowerCase();
        const noteStr = (item.note || '').toLowerCase();

        return (
          dateStr.includes(q) ||
          amountStr.includes(q) ||
          typeStr.includes(q) ||
          methodStr.includes(q) ||
          statusStr.includes(q) ||
          noteStr.includes(q)
        );
      }

      return true;
    });
  }, [combinedHistory, searchQuery, startDate, endDate]);

  // Paginated Rows (10 rows per page)
  const totalPages = Math.ceil(filteredHistory.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedHistory = useMemo(() => {
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    return filteredHistory.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filteredHistory, currentPage]);

  // Export Handlers
  const handleExportCSV = () => {
    const columns = [
      { label: 'Date', accessor: r => fmt(r.date) },
      { label: 'Plan / Type', accessor: 'type' },
      { label: 'Amount (₹)', accessor: 'amount' },
      { label: 'Payment Method', accessor: 'method' },
      { label: 'Status', accessor: 'status' },
      { label: 'Rejection Reason / Note', accessor: 'note' },
    ];
    exportToCSV('My_Payments_and_Renewals', columns, filteredHistory);
    toast.success('CSV exported successfully');
  };

  const handleExportPDF = () => {
    const columns = [
      { label: 'Date', accessor: r => fmt(r.date) },
      { label: 'Plan / Type', accessor: 'type' },
      { label: 'Amount (₹)', accessor: 'amount' },
      { label: 'Payment Method', accessor: 'method' },
      { label: 'Status', accessor: 'status' },
      { label: 'Rejection Reason / Note', accessor: 'note' },
    ];
    exportToPDF('My Payments & Renewals History', columns, filteredHistory);
  };

  if (loading) return <div className="py-16 text-center text-slate-400">Loading...</div>;
  if (!data) return null;

  const { member, daysLeft, isExpired, pendingRequest, plans } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Fees & Payments</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">View your membership, track payment history, and submit renewals</p>
      </div>

      {/* Expired Alert Banner */}
      {isExpired && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-3xl text-red-500" />
            <div>
              <p className="text-lg font-bold text-red-600">Membership Expired</p>
              <p className="text-sm text-red-500">Your membership expired on {fmt(member.membershipExpiryDate)}. Please renew to continue using library services.</p>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Soon Alert */}
      {!isExpired && daysLeft <= 7 && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 dark:border-yellow-800 dark:bg-yellow-950/20">
          <div className="flex items-center gap-3">
            <FiClock className="text-3xl text-yellow-500" />
            <div>
              <p className="text-lg font-bold text-yellow-600">Membership Expiring Soon</p>
              <p className="text-sm text-yellow-500">{daysLeft} days remaining. Renew now to avoid interruption.</p>
            </div>
          </div>
        </div>
      )}

      {/* Combined Unified Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {[
          { id: 'membership', label: 'Membership' },
          { id: 'payments', label: 'Payments & Renewals' },
          { id: 'renew', label: 'Renew Membership' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setResult(null); }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${tab === t.id ? 'bg-white text-orange-600 shadow dark:bg-slate-700 dark:text-orange-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Membership Tab */}
      {tab === 'membership' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
            <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Current Membership</h2>
            <div className={`rounded-2xl p-6 ${isExpired ? 'bg-red-50 dark:bg-red-900/20' : daysLeft <= 7 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
              <div className="flex items-center gap-3 mb-4">
                {isExpired ? <FiAlertTriangle className="text-3xl text-red-500" /> : daysLeft <= 7 ? <FiClock className="text-3xl text-yellow-500" /> : <FiCheckCircle className="text-3xl text-green-500" />}
                <div><p className={`text-2xl font-bold ${isExpired ? 'text-red-600' : daysLeft <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>{isExpired ? 'Expired' : `${daysLeft} days left`}</p><p className="text-sm text-slate-500">{member.membershipPlan} Plan</p></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/60 p-3 dark:bg-slate-800/60"><p className="text-xs text-slate-500">Joining Date</p><p className="font-bold text-slate-800 dark:text-white">{fmt(member.joiningDate)}</p></div>
                <div className="rounded-xl bg-white/60 p-3 dark:bg-slate-800/60"><p className="text-xs text-slate-500">Expiry Date</p><p className="font-bold text-slate-800 dark:text-white">{fmt(member.membershipExpiryDate)}</p></div>
                <div className="rounded-xl bg-white/60 p-3 dark:bg-slate-800/60"><p className="text-xs text-slate-500">Plan</p><p className="font-bold text-slate-800 dark:text-white">{member.membershipPlan}</p></div>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
            <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-white">Seat & Shift</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-orange-50 p-4 dark:bg-orange-900/20"><FiGrid className="mb-1 text-orange-500" /><p className="text-xs text-slate-500">Seat</p><p className="text-xl font-bold text-slate-800 dark:text-white">{member.seatId?.seatNumber || 'Unassigned'}</p></div>
              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20"><FiClock className="mb-1 text-blue-500" /><p className="text-xs text-slate-500">Shift</p><p className="text-xl font-bold text-slate-800 dark:text-white">{member.shiftId?.shiftName || 'Unassigned'}</p>{member.shiftId?.startTime && <p className="text-xs text-slate-400">{member.shiftId.startTime} - {member.shiftId.endTime}</p>}</div>
            </div>
          </section>
          {pendingRequest && <div className="rounded-2xl bg-yellow-50 p-5 dark:bg-yellow-900/20"><div className="flex items-center gap-2"><FiClock className="text-yellow-600" /><p className="font-semibold text-yellow-700 dark:text-yellow-400">Renewal Pending</p></div><p className="mt-1 text-sm text-yellow-600">Your {pendingRequest.planType} renewal is awaiting admin approval.</p></div>}
          {isExpired && (
            <button onClick={() => setTab('renew')} className="w-full rounded-2xl bg-orange-500 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition">
              Renew Membership Now
            </button>
          )}
        </div>
      )}

      {/* Unified Payments & Renewals Data Table Tab */}
      {tab === 'payments' && (
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          {/* Header & Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">Payments & Renewals History</h2>
              <p className="text-xs text-slate-500">Track all fee submissions, receipts, and approval statuses</p>
            </div>

            {/* Export Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={!filteredHistory.length}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50 transition"
              >
                <FiFileText size={14} className="text-blue-500" /> Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                disabled={!filteredHistory.length}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50 transition"
              >
                <FiDownload size={14} className="text-red-500" /> Export PDF
              </button>
            </div>
          </div>

          {/* Search and Date Range Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search plan, method, status, amount..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* Date Range Inputs */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setPage(1); }}
                title="Start Date"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setPage(1); }}
                title="End Date"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              {(startDate || endDate || searchQuery) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); setSearchQuery(''); setPage(1); }}
                  className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 cursor-pointer"
                  title="Clear Filters"
                >
                  <FiX size={13} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Unified Data Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Month / Period</th>
                  <th className="px-4 py-3">Plan / Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Details / Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {!paginatedHistory.length ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No payments or renewal records found
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map(r => {
                    let badgeColor = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
                    if (r.status === 'Paid' || r.status === 'Approved') {
                      badgeColor = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                    } else if (r.status === 'Rejected' || r.status === 'Failed') {
                      badgeColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                    }

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-white whitespace-nowrap">
                          {fmt(r.date)}
                        </td>
                        <td className="px-4 py-3 font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                          {r.billingPeriod || '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">
                          {r.type}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                          ₹{(r.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {r.method}
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
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 cursor-pointer"
                              title="Download PDF Receipt"
                            >
                              <FiFileText size={13} /> Receipt
                            </button>
                          ) : (r.status === 'Rejected' || r.status === 'Failed') && r.note ? (
                            <span className="text-[11px] font-medium text-red-600 dark:text-red-400 truncate max-w-[200px] inline-block" title={r.note}>
                              Reason: {r.note}
                            </span>
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

          {/* 10 Rows Data Table Pagination Controls */}
          {filteredHistory.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filteredHistory.length)} of {filteredHistory.length} entries
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Renew Tab */}
      {tab === 'renew' && (
        <div className="space-y-4">
          {pendingRequest ? (
            <div className="rounded-2xl bg-yellow-50 p-8 text-center dark:bg-yellow-900/20"><FiClock className="mx-auto mb-3 text-4xl text-yellow-500" /><p className="font-semibold text-yellow-700 dark:text-yellow-400">Renewal Request Pending</p><p className="mt-1 text-sm text-yellow-600">Your {pendingRequest.planType} renewal is being reviewed.</p></div>
          ) : (
            <>
              {/* Plan Selection */}
              <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
                <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Choose a Plan & Submit Fees</h2>
                <p className="mb-4 text-sm text-slate-500">Select a plan to renew your membership. Admin approval is required.</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {plans.map(p => {
                    const price = PLAN_PRICES[p.type] || 0;
                    const isPopular = p.type === 'Quarterly';
                    return (
                      <button key={p.type} onClick={() => setSelectedPlan(p.type)}
                        className={`relative rounded-xl border-2 p-5 text-left transition-all ${selectedPlan === p.type ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-200 dark:bg-orange-900/20 dark:shadow-orange-900/30' : 'border-slate-200 hover:border-orange-300 hover:shadow-md dark:border-slate-700'}`}>
                        {isPopular && <span className="absolute -top-2.5 right-3 rounded-full bg-orange-500 px-3 py-0.5 text-[10px] font-bold text-white">Popular</span>}
                        <p className="text-lg font-bold text-slate-800 dark:text-white">{p.label}</p>
                        <p className="mt-1 text-2xl font-extrabold text-orange-600">₹{price.toLocaleString('en-IN')}</p>
                        <p className="mt-1 text-xs text-slate-400">{p.days} days · ₹{Math.round(price / p.days)}/day</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Payment Form */}
              {selectedPlan && (
                <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
                  <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Payment Details</h2>
                  <div className="rounded-xl bg-orange-50 p-4 mb-5 dark:bg-orange-900/20">
                    <div className="flex items-center gap-2 text-sm">
                      <FiInfo className="text-orange-500" />
                      <span className="text-orange-700 dark:text-orange-300">Amount auto-filled based on selected plan. You can adjust if needed.</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {/* Month Selection Fields */}
                    {selectedPlan === 'Monthly' ? (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Billing Month / Period
                        </label>
                        <div className="relative">
                          <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className={field + ' pl-10'}
                          >
                            {(monthOptions.single || []).map(mOpt => (
                              <option key={mOpt} value={mOpt}>{mOpt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            From Month / Period
                          </label>
                          <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                              value={fromMonth}
                              onChange={e => setFromMonth(e.target.value)}
                              className={field + ' pl-10'}
                            >
                              {(selectedPlan === 'Quarterly' ? monthOptions.threeFrom : selectedPlan === 'Yearly' ? monthOptions.twelveFrom : monthOptions.sixFrom).map(fOpt => (
                                <option key={fOpt} value={fOpt}>{fOpt}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            To Month / Period
                          </label>
                          <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                              value={toMonth}
                              onChange={e => setToMonth(e.target.value)}
                              className={field + ' pl-10'}
                            >
                              {(selectedPlan === 'Quarterly' ? monthOptions.threeTo : selectedPlan === 'Yearly' ? monthOptions.twelveTo : monthOptions.sixTo).map(tOpt => (
                                <option key={tOpt} value={tOpt}>{tOpt}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount (₹)</label>
                      <div className="relative"><FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="number"
                          value={amount}
                          onWheel={e => e.target.blur()}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="Enter amount"
                          className={`${field} pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Method</label>
                      <div className="relative"><FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select value={method} onChange={e => setMethod(e.target.value)} className={field + ' pl-10'}>
                          {['UPI', 'Bank Transfer', 'Cash'].map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Optional Screenshot Upload */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Payment Screenshot / Receipt <span className="text-xs font-normal text-slate-400">(Optional)</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => setScreenshotFile(e.target.files?.[0] || null)}
                        className={`${field} py-1.5 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-600 dark:file:bg-orange-900/30 dark:file:text-orange-400 hover:file:bg-orange-100 cursor-pointer`}
                      />
                      {screenshotFile && (
                        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <FiCheckCircle size={13} /> Selected: {screenshotFile.name}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleRenew}
                      disabled={submitting}
                      className="w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
          {result && <div className={`rounded-xl px-4 py-3 text-sm ${result.success ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>{result.message}</div>}
        </div>
      )}
    </div>
  );
};

export default UserFeesPage;