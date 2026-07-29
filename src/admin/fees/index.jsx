import React, { useState, useEffect } from 'react';
import { getPayments, getPaymentStats, getPendingDues, createPayment, markPaid, markFailed, downloadReceipt, downloadInvoice, getMembers, getPendingRenewals, getAllRenewals, approveRenewal, rejectRenewal } from '../../services/paymentService';
import { FiDollarSign, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiUser, FiFilter, FiCheck, FiX, FiPlus, FiDownload, FiFileText } from 'react-icons/fi';

const TABS = ['Dashboard', 'Payments', 'Add Payment', 'Pending Dues', 'Renewals'];

const AdminFeesPage = () => {
  const [tab, setTab] = useState('Dashboard');
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [dues, setDues] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewalFilter, setRenewalFilter] = useState('Pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [addForm, setAddForm] = useState({ memberId: '', amount: '', paymentMethod: 'Cash', paymentDate: new Date().toISOString().split('T')[0], transactionId: '', status: 'Paid' });
  const [addLoading, setAddLoading] = useState(false);
  const [addResult, setAddResult] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (tab === 'Pending Dues') loadDues();
    if (tab === 'Renewals') loadRenewals();
    if (tab === 'Payments') loadPayments();
  }, [tab, renewalFilter, filterStatus, filterMethod]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, p, m] = await Promise.all([getPaymentStats(), getPayments(), getMembers()]);
      setStats(s); setPayments(p); setMembers(m);
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

  const handleMarkPaid = async (id) => { try { await markPaid(id); loadDues(); loadData(); } catch (e) { alert(e.response?.data?.message || 'Failed'); } };
  const handleMarkFailed = async (id) => { if (!confirm('Mark as failed?')) return; try { await markFailed(id); loadDues(); loadData(); } catch (e) { alert(e.response?.data?.message || 'Failed'); } };

  const handleApprove = async (id) => { if (!confirm('Approve renewal?')) return; try { await approveRenewal(id); loadRenewals(); loadData(); } catch (e) { alert(e.response?.data?.message || 'Failed'); } };
  const handleReject = async () => { if (!rejectModal) return; try { await rejectRenewal(rejectModal, rejectNote); setRejectModal(null); setRejectNote(''); loadRenewals(); } catch (e) { alert(e.response?.data?.message || 'Failed'); } };

  const handleDownload = async (id, type) => {
    try {
      const blob = type === 'receipt' ? await downloadReceipt(id) : await downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a'); a.href = url; a.download = `${type}-${id.slice(-8)}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e) { alert('Download failed'); }
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
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Payment Management</h1><p className="text-sm text-slate-500 dark:text-slate-400">Manage payments, dues, and renewals</p></div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${tab === t ? 'bg-white text-orange-600 shadow dark:bg-slate-700 dark:text-orange-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>{t}</button>
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
              [FiClock, 'Pending Dues', stats.pendingDues, 'yellow'],
              [FiCheckCircle, 'Total Transactions', stats.totalTransactions, 'green'],
              [FiDollarSign, 'Avg per Transaction', stats.totalTransactions > 0 ? money(Math.round(stats.totalRevenue / stats.totalTransactions)) : '₹0', 'slate'],
            ].map(([Icon, label, value, color]) => (
              <div key={label} className={`rounded-2xl bg-${color}-50 p-5 dark:bg-${color}-900/20`}>
                <Icon className={`mb-2 text-${color}-500`} /><p className="text-xs text-slate-500">{label}</p><p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
            <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">Recent Payments</h3>
            {!stats.recentPayments.length ? <p className="py-8 text-center text-slate-400">No payments yet</p> : (
              <div className="space-y-2">
                {stats.recentPayments.map(p => (
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 px-3 text-slate-500">Member</th><th className="py-2 px-3 text-slate-500">Plan</th><th className="py-2 px-3 text-slate-500">Amount</th><th className="py-2 px-3 text-slate-500">Method</th><th className="py-2 px-3 text-slate-500">Date</th><th className="py-2 px-3 text-slate-500">Status</th><th className="py-2 px-3 text-slate-500">Actions</th>
                </tr></thead>
                <tbody>
                  {payments.map(p => (
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
            <div><label className={label}>Amount (₹) *</label>
              <input type="number" value={addForm.amount} onChange={e => setAddForm({ ...addForm, amount: e.target.value })} required className={field} />
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
          ) : dues.map(p => (
            <div key={p._id} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center dark:bg-yellow-900/30"><FiDollarSign className="text-yellow-500" /></div>
                  <div><p className="font-semibold text-slate-800 dark:text-white">{p.memberId?.fullName || '—'}</p><p className="text-xs text-slate-400">{p.memberId?.mobile} · {fmt(p.paymentDate)}</p></div>
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
          ))}
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

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRejectModal(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-white">Reject Renewal</h2>
            <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Reason (optional)" rows={3} className={field} />
            <div className="mt-4 flex gap-3">
              <button onClick={handleReject} className="rounded-xl bg-red-500 px-5 py-2.5 font-semibold text-white hover:bg-red-600">Reject</button>
              <button onClick={() => setRejectModal(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 dark:border-slate-700 dark:text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeesPage;
