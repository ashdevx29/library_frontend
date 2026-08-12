import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { getPayments, getPaymentStats, getPendingDues, createPayment, markPaid, markFailed, downloadReceipt, downloadInvoice, getMembers, getPendingRenewals, getAllRenewals, approveRenewal, rejectRenewal, getExpiredMembers, getPlanStats } from '../../services/paymentService';
import { FiDollarSign, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiUser, FiFilter, FiCheck, FiX, FiPlus, FiDownload, FiFileText, FiAlertTriangle, FiRefreshCw, FiSearch } from 'react-icons/fi';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToCSV, exportToPDF } from '../../utils/exportHelpers';

const TABS = ['Dashboard', 'Payments', 'Add Payment', 'Pending Dues', 'Renewals', 'Expired Members'];
const PLAN_PRICES = { Monthly: 500, Quarterly: 1200, HalfYearly: 2000, 'Half-Yearly': 2000, Yearly: 3500 };

const formatBillingPeriod = (item, defaultPlan = 'Monthly') => {
  if (item?.billingPeriod && item.billingPeriod !== '—') return item.billingPeriod;
  if (item?.fromMonth && item?.toMonth) {
    return item.fromMonth === item.toMonth ? item.fromMonth : `${item.fromMonth} - ${item.toMonth}`;
  }

  const startDate = item?.startDate ? new Date(item.startDate) : item?.paymentDate ? new Date(item.paymentDate) : item?.requestedAt ? new Date(item.requestedAt) : item?.createdAt ? new Date(item.createdAt) : new Date();
  let endDate = item?.endDate ? new Date(item.endDate) : null;

  if (!endDate) {
    const planType = (item?.type || item?.planType || item?.membershipId?.planType || defaultPlan || '').toLowerCase();
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

const AdminFeesPage = () => {
  const [tab, setTab] = useState('Dashboard');
  const [stats, setStats] = useState(null);
  const [planStats, setPlanStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [dues, setDues] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [expiredMembers, setExpiredMembers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewalFilter, setRenewalFilter] = useState('Pending');
  const [expiredFilter, setExpiredFilter] = useState('all');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [confirmMarkFailedId, setConfirmMarkFailedId] = useState(null);
  const [confirmApproveId, setConfirmApproveId] = useState(null);

  // Payments Tab Filters & Pagination State
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  // Add Payment Form State
  const [addForm, setAddForm] = useState({
    memberId: '',
    planType: 'Monthly',
    billingPeriod: '',
    fromMonth: '',
    toMonth: '',
    amount: '500',
    discount: '',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    status: 'Paid'
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addResult, setAddResult] = useState(null);

  // Month options generator for Add Payment form
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

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (tab === 'Pending Dues') loadDues();
    if (tab === 'Renewals') loadRenewals();
    if (tab === 'Payments') loadPayments();
    if (tab === 'Expired Members') loadExpired();
  }, [tab, renewalFilter, expiredFilter, filterStatus, filterMethod]);

  // Handle plan selection in Add Payment form
  const handlePlanChange = (plan) => {
    let defaultAmount = PLAN_PRICES[plan] || 500;
    let bPeriod = '';
    let fMonth = '';
    let tMonth = '';

    if (plan === 'Monthly') {
      bPeriod = monthOptions.single[1] || monthOptions.single[0];
    } else if (plan === 'Quarterly') {
      fMonth = monthOptions.threeFrom[0];
      tMonth = monthOptions.threeTo[0];
    } else if (plan === 'HalfYearly' || plan === 'Half-Yearly') {
      fMonth = monthOptions.sixFrom[0];
      tMonth = monthOptions.sixTo[0];
    } else if (plan === 'Yearly') {
      fMonth = monthOptions.twelveFrom[0];
      tMonth = monthOptions.twelveTo[0];
    }

    setAddForm(prev => ({
      ...prev,
      planType: plan,
      amount: String(defaultAmount),
      billingPeriod: bPeriod,
      fromMonth: fMonth,
      toMonth: tMonth
    }));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, p, m, ps] = await Promise.all([getPaymentStats(), getPayments(), getMembers(), getPlanStats()]);
      setStats(s); setPayments(p); setMembers(m); setPlanStats(ps);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadPayments = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterMethod) params.paymentMethod = filterMethod;
      setPayments(await getPayments(params));
    } catch (e) { console.error(e); }
  };

  const loadDues = async () => { try { setDues(await getPendingDues()); } catch (e) { console.error(e); } };
  const loadRenewals = async () => { try { setRenewals(await getAllRenewals(renewalFilter !== 'All' ? renewalFilter : undefined)); } catch (e) { console.error(e); } };
  const loadExpired = async () => { try { setExpiredMembers(await getExpiredMembers(expiredFilter !== 'all' ? expiredFilter : undefined)); } catch (e) { console.error(e); } };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setAddLoading(true); setAddResult(null);

    let finalBillingPeriod = addForm.billingPeriod;
    if (addForm.planType !== 'Monthly' && addForm.fromMonth && addForm.toMonth) {
      finalBillingPeriod = `${addForm.fromMonth} to ${addForm.toMonth}`;
    }

    try {
      await createPayment({
        ...addForm,
        amount: Number(addForm.amount),
        billingPeriod: finalBillingPeriod
      });
      setAddResult({ success: true, message: 'Payment recorded successfully' });
      setAddForm({
        memberId: '',
        planType: 'Monthly',
        billingPeriod: '',
        fromMonth: '',
        toMonth: '',
        amount: '500',
        discount: '',
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString().split('T')[0],
        transactionId: '',
        status: 'Paid'
      });
      loadData();
    } catch (e) { setAddResult({ success: false, message: e.response?.data?.message || 'Failed' }); }
    finally { setAddLoading(false); }
  };

  const handleMarkPaid = async (id) => { try { await markPaid(id); loadDues(); loadData(); toast.success('Marked as Paid'); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } };
  const handleMarkFailed = (id) => setConfirmMarkFailedId(id);
  const doMarkFailed = async () => {
    try { await markFailed(confirmMarkFailedId); loadDues(); loadData(); toast.success('Marked as Failed'); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    setConfirmMarkFailedId(null);
  };

  const handleApprove = (id) => setConfirmApproveId(id);
  const doApprove = async () => {
    try { await approveRenewal(confirmApproveId); loadRenewals(); loadData(); toast.success('Renewal approved'); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    setConfirmApproveId(null);
  };
  const handleReject = async () => {
    if (!rejectModal) return;
    if (rejectNote.trim().length > 150) {
      toast.error('Rejection reason cannot exceed 150 characters');
      return;
    }
    try {
      await rejectRenewal(rejectModal, rejectNote);
      setRejectModal(null);
      setRejectNote('');
      loadRenewals();
      toast.success('Renewal rejected');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const handleDownload = async (id, type) => {
    try {
      const blob = type === 'receipt' ? await downloadReceipt(id) : await downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a'); a.href = url; a.download = `${type}-${id.slice(-8)}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e) { toast.error('Download failed'); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const BADGE = { Paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  const RENEW_BADGE = { Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', Approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  const field = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
  const label = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';

  // Process and Filter Payments dataset
  const formattedPayments = useMemo(() => {
    return payments.map(p => ({
      ...p,
      computedPeriod: formatBillingPeriod(p),
      formattedDate: fmt(p.paymentDate || p.createdAt),
      memberNameStr: p.studentName || p.memberId?.fullName || '—',
    }));
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return formattedPayments.filter(item => {
      const itemTime = new Date(item.paymentDate || item.createdAt).getTime();

      if (startDate) {
        const startTime = new Date(startDate).setHours(0, 0, 0, 0);
        if (itemTime < startTime) return false;
      }
      if (endDate) {
        const endTime = new Date(endDate).setHours(23, 59, 59, 999);
        if (itemTime > endTime) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const memberStr = (item.memberNameStr || '').toLowerCase();
        const planStr = (item.planType || item.membershipId?.planType || '').toLowerCase();
        const methodStr = (item.paymentMethod || '').toLowerCase();
        const statusStr = (item.status || '').toLowerCase();
        const amountStr = String(item.amount || '');
        const periodStr = (item.computedPeriod || '').toLowerCase();

        return memberStr.includes(q) || planStr.includes(q) || methodStr.includes(q) || statusStr.includes(q) || amountStr.includes(q) || periodStr.includes(q);
      }

      return true;
    });
  }, [formattedPayments, searchQuery, startDate, endDate]);

  useEffect(() => {
    setPaymentsPage(1);
  }, [searchQuery, startDate, endDate, filterStatus, filterMethod]);

  const totalPaymentRows = filteredPayments.length;
  const totalPaymentPages = Math.ceil(totalPaymentRows / 10) || 1;
  const activePaymentsPage = Math.min(paymentsPage, totalPaymentPages);
  const paginatedPayments = filteredPayments.slice((activePaymentsPage - 1) * 10, activePaymentsPage * 10);

  // Export handlers for Payments table
  const handleExportCSV = () => {
    const columns = [
      { header: 'Member', key: 'memberNameStr' },
      { header: 'Date', key: 'formattedDate' },
      { header: 'Month / Period', key: 'computedPeriod' },
      { header: 'Plan / Type', key: 'planType' },
      { header: 'Amount', key: 'amount' },
      { header: 'Payment Method', key: 'paymentMethod' },
      { header: 'Status', key: 'status' }
    ];
    exportToCSV('All_Payments_Report', columns, filteredPayments);
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Member', key: 'memberNameStr' },
      { header: 'Date', key: 'formattedDate' },
      { header: 'Month / Period', key: 'computedPeriod' },
      { header: 'Plan / Type', key: 'planType' },
      { header: 'Amount', key: 'amount' },
      { header: 'Payment Method', key: 'paymentMethod' },
      { header: 'Status', key: 'status' }
    ];
    exportToPDF('Payments & Fee Submissions Report', columns, filteredPayments);
  };

  if (loading) return <div className="py-16 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Payment Management</h1><p className="text-sm text-slate-500 dark:text-slate-400">Manage payments, dues, renewals, and expiring memberships</p></div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg py-2.5 px-3 text-sm font-semibold transition ${tab === t ? 'bg-white text-orange-600 shadow dark:bg-slate-700 dark:text-orange-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>{t}</button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'Dashboard' && stats && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [FiDollarSign, 'Total Revenue', money(stats.totalRevenue), 'green'],
              [FiCalendar, 'This Month', money(stats.monthRevenue), 'blue'],
              [FiDollarSign, 'This Year', money(stats.yearRevenue), 'purple'],
              [FiClock, 'Pending Dues', stats.pendingDues ?? 0, 'yellow'],
              [FiCheckCircle, 'Total Transactions', stats.totalTransactions ?? 0, 'green'],
              [FiAlertTriangle, 'Pending Renewals', planStats?.pendingRenewals ?? stats.pendingRenewals ?? 0, 'orange'],
            ].map(([Icon, label, value, color]) => (
              <div key={label} className={`rounded-2xl bg-${color}-50 p-5 dark:bg-${color}-900/20`}>
                <Icon className={`mb-2 text-${color}-500`} /><p className="text-xs text-slate-500">{label}</p><p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Plan-wise Stats */}
          {planStats && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
                <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">Plan-wise Revenue</h3>
                <div className="space-y-3">
                  {(planStats.revenueBreakdown || []).map(p => (
                    <div key={p.plan} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{p.label}</p>
                        <p className="text-xs text-slate-400">{p.renewalCount} renewals</p>
                      </div>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">{money(p.totalRevenue)}</p>
                    </div>
                  ))}
                  {!(planStats.revenueBreakdown || []).some(p => p.totalRevenue > 0) && <p className="py-4 text-center text-sm text-slate-400">No revenue data yet</p>}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
                <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">Active Members by Plan</h3>
                <div className="space-y-3">
                  {(planStats.memberBreakdown || []).map(p => (
                    <div key={p.plan} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                      <p className="font-medium text-slate-800 dark:text-white">{p.label}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-600">
                          <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, (p.count / Math.max(...(planStats.memberBreakdown || []).map(x => x.count), 1)) * 100)}%` }} />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{p.count}</span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <span>Expiring this week: <b className="text-orange-600">{planStats.expiringThisWeek || 0}</b></span>
                    <span>Already expired: <b className="text-red-600">{planStats.expiredMembers || 0}</b></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Payments */}
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
            <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">Recent Payments</h3>
            {!stats.recentPayments?.length ? <p className="py-8 text-center text-slate-400">No payments yet</p> : (
              <div className="space-y-2">
                {(stats.recentPayments || []).map(p => (
                  <div key={p._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center dark:bg-orange-900/30"><FiUser className="text-orange-500" /></div>
                      <div><p className="font-medium text-slate-800 dark:text-white">{p.memberId?.fullName || '—'}</p><p className="text-xs text-slate-400">{p.paymentMethod} · {fmt(p.paymentDate)}</p></div>
                    </div>
                    <div className="text-right"><p className="font-bold text-slate-800 dark:text-white">{money(p.amount)}</p><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${BADGE[p.status]}`}>{p.status}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payments */}
      {tab === 'Payments' && (
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800 space-y-4">
          {/* Header Actions & Export Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">All Payments & Submissions</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Complete record of every fee payment and plan renewal</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <FiFileText size={14} className="text-blue-500" /> Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <FiDownload size={14} className="text-red-500" /> Export PDF
              </button>
            </div>
          </div>

          {/* Filter Controls Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <FiFilter className="text-slate-400 text-sm shrink-0" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shrink-0 min-w-[110px]"
            >
              <option value="">All Status</option>
              {['Paid', 'Pending', 'Failed'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select
              value={filterMethod}
              onChange={e => setFilterMethod(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shrink-0 min-w-[120px]"
            >
              <option value="">All Methods</option>
              {['Cash', 'UPI', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
            </select>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search member, plan, method, status, amount..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Date to Date Picker */}
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {(startDate || endDate || searchQuery || filterStatus || filterMethod) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); setSearchQuery(''); setFilterStatus(''); setFilterMethod(''); }}
                  className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:opacity-80 cursor-pointer"
                >
                  <FiX size={13} /> Clear
                </button>
              )}
            </div>
          </div>

          {!paginatedPayments.length ? <p className="py-8 text-center text-slate-400">No payment records found</p> : (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">MEMBER</th>
                      <th className="py-3 px-4">MONTH / PERIOD</th>
                      <th className="py-3 px-4">PLAN / TYPE</th>
                      <th className="py-3 px-4">AMOUNT</th>
                      <th className="py-3 px-4">PAYMENT METHOD</th>
                      <th className="py-3 px-4">DATE</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {paginatedPayments.map(p => (
                      <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white whitespace-nowrap">{p.memberNameStr}</td>
                        <td className="py-3 px-4 font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">{p.computedPeriod}</td>
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{p.planType || 'Monthly'}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{money(p.amount)}</td>
                        <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">{p.paymentMethod || 'Cash'}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{p.formattedDate}</td>
                        <td className="py-3 px-4"><span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${BADGE[p.status]}`}>{p.status}</span></td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleDownload(p._id, 'receipt')} title="Receipt" className="rounded-lg bg-blue-50 p-1.5 text-blue-500 hover:bg-blue-100 dark:bg-blue-900/30 cursor-pointer"><FiFileText size={14} /></button>
                            <button onClick={() => handleDownload(p._id, 'invoice')} title="Invoice" className="rounded-lg bg-purple-50 p-1.5 text-purple-500 hover:bg-purple-100 dark:bg-purple-900/30 cursor-pointer"><FiDownload size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPaymentRows > 0 && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 flex-wrap gap-2">
                  <div>
                    Showing <span className="font-semibold text-slate-800 dark:text-white">{(activePaymentsPage - 1) * 10 + 1}</span> to <span className="font-semibold text-slate-800 dark:text-white">{Math.min(activePaymentsPage * 10, totalPaymentRows)}</span> of <span className="font-semibold text-slate-800 dark:text-white">{totalPaymentRows}</span> entries
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                      disabled={activePaymentsPage === 1}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="px-2 font-bold text-slate-800 dark:text-white">
                      Page {activePaymentsPage} of {totalPaymentPages}
                    </span>
                    <button
                      onClick={() => setPaymentsPage(p => Math.min(totalPaymentPages, p + 1))}
                      disabled={activePaymentsPage >= totalPaymentPages}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Payment */}
      {tab === 'Add Payment' && (
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Record Payment</h2>
          {addResult && <div className={`rounded-xl px-4 py-3 text-sm ${addResult.success ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>{addResult.message}</div>}
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div><label className={label}>Member *</label>
              <select value={addForm.memberId} onChange={e => setAddForm({ ...addForm, memberId: e.target.value })} required className={field}>
                <option value="">Select Member</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.fullName} — {m.mobile}</option>)}
              </select>
            </div>

            {/* Plan Type Selection */}
            <div><label className={label}>Plan Type *</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { value: 'Monthly', label: '1 Month' },
                  { value: 'Quarterly', label: '3 Months' },
                  { value: 'HalfYearly', label: '6 Months' },
                  { value: 'Yearly', label: '12 Months' }
                ].map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handlePlanChange(p.value)}
                    className={`rounded-xl border-2 p-2.5 text-xs font-bold transition-all ${addForm.planType === p.value ? 'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400' : 'border-slate-200 text-slate-600 hover:border-orange-300 dark:border-slate-700 dark:text-slate-300'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Billing Period Selection */}
            {addForm.planType === 'Monthly' ? (
              <div>
                <label className={label}>Billing Month / Period *</label>
                <select value={addForm.billingPeriod} onChange={e => setAddForm({ ...addForm, billingPeriod: e.target.value })} required className={field}>
                  {monthOptions.single.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            ) : addForm.planType === 'Quarterly' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>From Month / Period *</label>
                  <select value={addForm.fromMonth} onChange={e => setAddForm({ ...addForm, fromMonth: e.target.value })} required className={field}>
                    {monthOptions.threeFrom.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>To Month / Period *</label>
                  <select value={addForm.toMonth} onChange={e => setAddForm({ ...addForm, toMonth: e.target.value })} required className={field}>
                    {monthOptions.threeTo.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            ) : addForm.planType === 'HalfYearly' || addForm.planType === 'Half-Yearly' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>From Month / Period *</label>
                  <select value={addForm.fromMonth} onChange={e => setAddForm({ ...addForm, fromMonth: e.target.value })} required className={field}>
                    {monthOptions.sixFrom.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>To Month / Period *</label>
                  <select value={addForm.toMonth} onChange={e => setAddForm({ ...addForm, toMonth: e.target.value })} required className={field}>
                    {monthOptions.sixTo.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>From Month / Period *</label>
                  <select value={addForm.fromMonth} onChange={e => setAddForm({ ...addForm, fromMonth: e.target.value })} required className={field}>
                    {monthOptions.twelveFrom.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>To Month / Period *</label>
                  <select value={addForm.toMonth} onChange={e => setAddForm({ ...addForm, toMonth: e.target.value })} required className={field}>
                    {monthOptions.twelveTo.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={label}>Amount (₹) *</label>
                <input type="number" value={addForm.amount} onChange={e => setAddForm({ ...addForm, amount: e.target.value })} required className={field} placeholder="Enter fee amount" />
              </div>
              <div><label className={label}>Discount (₹) (optional)</label>
                <input type="number" value={addForm.discount} onChange={e => setAddForm({ ...addForm, discount: e.target.value })} className={field} placeholder="Discount amount" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={label}>Payment Method *</label>
                <select value={addForm.paymentMethod} onChange={e => setAddForm({ ...addForm, paymentMethod: e.target.value })} className={field}>
                  {['Cash', 'UPI', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div><label className={label}>Status *</label>
                <select value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })} className={field}>
                  {['Paid', 'Pending'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div><label className={label}>Payment Date *</label>
              <input type="date" value={addForm.paymentDate} onChange={e => setAddForm({ ...addForm, paymentDate: e.target.value })} required className={field} />
            </div>
            <div><label className={label}>Transaction ID (optional)</label>
              <input value={addForm.transactionId} onChange={e => setAddForm({ ...addForm, transactionId: e.target.value })} className={field} />
            </div>
            <button type="submit" disabled={addLoading} className="rounded-xl bg-orange-500 px-6 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-60 cursor-pointer">{addLoading ? 'Saving...' : 'Record Payment'}</button>
          </form>
        </div>
      )}

      {/* Pending Dues */}
      {tab === 'Pending Dues' && (
        <div className="space-y-3">
          {!dues.length ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-800">
              <FiCheckCircle className="mx-auto mb-3 text-4xl text-green-400" /><p className="text-slate-400">No pending dues</p>
            </div>
          ) : dues.map(p => {
            const expiry = p.memberId?.membershipExpiryDate || p.membershipId?.expiryDate;
            const diffDays = expiry ? Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24)) : null;
            return (
              <div key={p._id} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800 border border-yellow-200 dark:border-yellow-900/30">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center dark:bg-yellow-900/30"><FiDollarSign className="text-yellow-500" /></div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 dark:text-white">{p.memberId?.fullName || '—'}</p>
                        {diffDays !== null && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${diffDays > 0 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : diffDays === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                            {diffDays > 0 ? `Due in ${diffDays} days` : diffDays === 0 ? 'Due Today' : `Overdue by ${Math.abs(diffDays)} days`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{p.memberId?.mobile || '—'} · Plan: {p.membershipId?.planType || '—'} · Date: {fmt(p.paymentDate)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{money(p.amount)}</p>
                    <p className="text-xs text-slate-400">{p.paymentMethod}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleMarkPaid(p._id)} className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600"><FiCheck /> Mark Paid</button>
                  <button onClick={() => handleMarkFailed(p._id)} className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"><FiX /> Mark Failed</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Renewals */}
      {tab === 'Renewals' && (
        <div className="space-y-4">
          <div className="flex gap-2">{['Pending', 'Approved', 'Rejected', 'All'].map(s => (
            <button key={s} onClick={() => setRenewalFilter(s)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${renewalFilter === s ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>{s}</button>
          ))}</div>
          {!renewals.length ? <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-800"><FiCheckCircle className="mx-auto mb-3 text-4xl text-slate-300" /><p className="text-slate-400">No renewal requests</p></div> : (
            <div className="space-y-3">
              {renewals.map(r => (
                <div key={r._id} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center dark:bg-orange-900/30"><FiUser className="text-orange-500" /></div>
                      <div><p className="font-semibold text-slate-800 dark:text-white">{r.memberId?.fullName || '—'}</p><p className="text-xs text-slate-400">{r.memberId?.mobile} · Current: {r.memberId?.membershipPlan}</p><p className="text-xs text-slate-400">Expiry: {fmt(r.memberId?.membershipExpiryDate)}</p></div>
                    </div>
                    <div className="text-right"><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${RENEW_BADGE[r.status]}`}>{r.status}</span><p className="mt-1 text-xs text-slate-400">{fmt(r.requestedAt)}</p></div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                    <div className="flex gap-6 text-sm">
                      <div><span className="text-slate-500">Plan:</span> <span className="font-bold text-slate-800 dark:text-white">{r.planType}</span></div>
                      <div><span className="text-slate-500">Amount:</span> <span className="font-bold text-slate-800 dark:text-white">{money(r.amount)}</span></div>
                      <div><span className="text-slate-500">Method:</span> <span className="font-bold text-slate-800 dark:text-white">{r.paymentMethod}</span></div>
                    </div>
                    {r.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(r._id)} className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600"><FiCheck /> Approve</button>
                        <button onClick={() => { setRejectModal(r._id); setRejectNote(''); }} className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"><FiX /> Reject</button>
                      </div>
                    )}
                    {r.status === 'Rejected' && r.note && <p className="text-xs text-red-500">Reason: {r.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expired Members */}
      {tab === 'Expired Members' && (
        <div className="space-y-4">
          <div className="flex gap-2">{['all', 'expired', 'expiring'].map(s => (
            <button key={s} onClick={() => setExpiredFilter(s)} className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${expiredFilter === s ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>{s === 'all' ? 'All Due' : s}</button>
          ))}</div>
          {!expiredMembers.length ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-800">
              <FiCheckCircle className="mx-auto mb-3 text-4xl text-green-400" /><p className="text-slate-400">No members found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiredMembers.map(m => {
                const exp = new Date(m.membershipExpiryDate) < new Date();
                return (
                  <div key={m._id} className={`rounded-2xl border p-5 shadow-sm ${exp ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20' : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${exp ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                          <FiAlertTriangle className={exp ? 'text-red-500' : 'text-yellow-500'} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{m.fullName}</p>
                          <p className="text-xs text-slate-400">{m.userId?.email || m.userId?.mobile || '—'} · {m.mobile}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${exp ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                          {exp ? 'Expired' : 'Expiring Soon'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <span className="text-slate-500">Plan: <b className="text-slate-800 dark:text-white">{m.membershipPlan}</b></span>
                      <span className="text-slate-500">Expired: <b className={exp ? 'text-red-600' : 'text-yellow-600'}>{fmt(m.membershipExpiryDate)}</b></span>
                      <span className="text-slate-500">Seat: <b className="text-slate-800 dark:text-white">{m.seatId?.seatNumber || '—'}</b></span>
                      <span className="text-slate-500">Shift: <b className="text-slate-800 dark:text-white">{m.shiftId?.shiftName || '—'}</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setRejectModal(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100" onClick={e => e.stopPropagation()}>
            <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Reject Renewal</h2>
            <p className="text-xs text-slate-500 mb-3">Provide a reason for rejecting this renewal (max 150 characters).</p>
            <div>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value.slice(0, 150))}
                maxLength={150}
                placeholder="Enter rejection reason..."
                rows={3}
                className={field}
              />
              <div className="mt-1 text-right text-[11px] text-slate-400 font-medium">
                <span className={rejectNote.length >= 150 ? 'text-red-500 font-bold' : ''}>{rejectNote.length}</span>/150 characters
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleReject}
                disabled={rejectNote.length > 150}
                className="rounded-xl bg-red-500 px-5 py-2.5 font-semibold text-white hover:bg-red-600 disabled:opacity-60 cursor-pointer"
              >
                Reject
              </button>
              <button onClick={() => setRejectModal(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 dark:border-slate-700 dark:text-white cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!confirmMarkFailedId}
        onClose={() => setConfirmMarkFailedId(null)}
        onConfirm={doMarkFailed}
        title="Mark as Failed"
        message="Are you sure you want to mark this payment as failed?"
        confirmText="Mark Failed"
        variant="danger"
      />
      <ConfirmDialog
        isOpen={!!confirmApproveId}
        onClose={() => setConfirmApproveId(null)}
        onConfirm={doApprove}
        title="Approve Renewal"
        message="Are you sure you want to approve this renewal request?"
        confirmText="Approve"
        variant="success"
      />
    </div>
  );
};

export default AdminFeesPage;