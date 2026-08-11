import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPayments, getPaymentStats, getPendingDues, createPayment, markPaid, markFailed, downloadReceipt, downloadInvoice, getMembers, getPendingRenewals, getAllRenewals, approveRenewal, rejectRenewal, getExpiredMembers, getPlanStats } from '../../services/paymentService';
import { FiDollarSign, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiUser, FiFilter, FiCheck, FiX, FiPlus, FiDownload, FiFileText, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const TABS = ['Dashboard', 'Payments', 'Add Payment', 'Pending Dues', 'Renewals', 'Expired Members'];

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
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [addForm, setAddForm] = useState({ memberId: '', amount: '', discount: '', paymentMethod: 'Cash', paymentDate: new Date().toISOString().split('T')[0], transactionId: '', status: 'Paid' });
  const [addLoading, setAddLoading] = useState(false);
  const [addResult, setAddResult] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (tab === 'Pending Dues') loadDues();
    if (tab === 'Renewals') loadRenewals();
    if (tab === 'Payments') loadPayments();
    if (tab === 'Expired Members') loadExpired();
  }, [tab, renewalFilter, expiredFilter, filterStatus, filterMethod]);

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
    try {
      await createPayment({ ...addForm, amount: Number(addForm.amount) });
      setAddResult({ success: true, message: 'Payment recorded successfully' });
      setAddForm({ memberId: '', amount: '', paymentMethod: 'Cash', paymentDate: new Date().toISOString().split('T')[0], transactionId: '', status: 'Paid' });
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
  const handleReject = async () => { if (!rejectModal) return; try { await rejectRenewal(rejectModal, rejectNote); setRejectModal(null); setRejectNote(''); loadRenewals(); toast.success('Renewal rejected'); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } };

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
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <FiFilter className="text-slate-400" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={field + ' w-auto'}><option value="">All Status</option>{['Paid', 'Pending', 'Failed'].map(s => <option key={s}>{s}</option>)}</select>
            <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className={field + ' w-auto'}><option value="">All Methods</option>{['Cash', 'UPI', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}</select>
          </div>
          {!payments.length ? <p className="py-8 text-center text-slate-400">No payments</p> : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 px-3 text-slate-500">Member</th><th className="py-2 px-3 text-slate-500">Plan</th><th className="py-2 px-3 text-slate-500">Amount</th><th className="py-2 px-3 text-slate-500">Method</th><th className="py-2 px-3 text-slate-500">Date</th><th className="py-2 px-3 text-slate-500">Status</th><th className="py-2 px-3 text-slate-500">Actions</th>
                  </tr></thead>
                  <tbody>
                    {payments.slice((paymentsPage - 1) * 10, paymentsPage * 10).map(p => (
                      <tr key={p._id} className="border-b border-slate-100 dark:border-slate-700/50">
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-white">{p.memberId?.fullName || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.membershipId?.planType || '—'}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white">{money(p.amount)}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.paymentMethod}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{fmt(p.paymentDate)}</td>
                        <td className="py-2.5 px-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${BADGE[p.status]}`}>{p.status}</span></td>
                        <td className="py-2.5 px-3">
                          <div className="flex gap-1">
                            <button onClick={() => handleDownload(p._id, 'receipt')} title="Receipt" className="rounded-lg bg-blue-50 p-1.5 text-blue-500 hover:bg-blue-100"><FiFileText size={14} /></button>
                            <button onClick={() => handleDownload(p._id, 'invoice')} title="Invoice" className="rounded-lg bg-purple-50 p-1.5 text-purple-500 hover:bg-purple-100"><FiDownload size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {payments.length > 10 && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 flex-wrap gap-2">
                  <div>
                    Showing <span className="font-semibold text-slate-800 dark:text-white">{(paymentsPage - 1) * 10 + 1}</span> to <span className="font-semibold text-slate-800 dark:text-white">{Math.min(paymentsPage * 10, payments.length)}</span> of <span className="font-semibold text-slate-800 dark:text-white">{payments.length}</span> entries
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                      disabled={paymentsPage === 1}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-700"
                    >
                      Previous
                    </button>
                    <span className="px-2 font-bold text-slate-800 dark:text-white">
                      Page {paymentsPage} of {Math.ceil(payments.length / 10)}
                    </span>
                    <button
                      onClick={() => setPaymentsPage(p => Math.min(Math.ceil(payments.length / 10), p + 1))}
                      disabled={paymentsPage >= Math.ceil(payments.length / 10)}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-700"
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
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Record Payment</h2>
          {addResult && <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${addResult.success ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>{addResult.message}</div>}
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div><label className={label}>Member *</label>
              <select value={addForm.memberId} onChange={e => setAddForm({ ...addForm, memberId: e.target.value })} required className={field}>
                <option value="">Select Member</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.fullName} — {m.mobile}</option>)}
              </select>
            </div>
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
            <button type="submit" disabled={addLoading} className="rounded-xl bg-[var(--button)] px-6 py-2.5 font-semibold text-white disabled:opacity-60">{addLoading ? 'Saving...' : 'Record Payment'}</button>
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
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Reject Renewal</h2>
            <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Reason (optional)" rows={3} className={field} />
            <div className="mt-4 flex gap-3">
              <button onClick={handleReject} className="rounded-xl bg-red-500 px-5 py-2.5 font-semibold text-white hover:bg-red-600">Reject</button>
              <button onClick={() => setRejectModal(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 dark:border-slate-700 dark:text-white">Cancel</button>
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