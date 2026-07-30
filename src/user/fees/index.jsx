import React, { useState, useEffect } from 'react';
import { getMyMembership, requestRenewal, getMyPayments, getMyRenewals, downloadReceipt } from '../../services/paymentService';
import { FiCalendar, FiClock, FiCheckCircle, FiAlertTriangle, FiDollarSign, FiGrid, FiCreditCard, FiDownload, FiFileText, FiRefreshCw, FiInfo } from 'react-icons/fi';

const PLAN_PRICES = { Monthly: 500, Quarterly: 1200, HalfYearly: 2000, Yearly: 3500 };

const UserFeesPage = () => {
  const [data, setData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('membership');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

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
    }
  }, [selectedPlan]);

  const handleRenew = async () => {
    if (!selectedPlan) return;
    setSubmitting(true); setResult(null);
    try {
      await requestRenewal(selectedPlan, Number(amount) || 0, method);
      setResult({ success: true, message: 'Renewal request submitted! Waiting for admin approval.' });
      const [m, r] = await Promise.all([getMyMembership(), getMyRenewals()]);
      setData(m); setRenewals(r);
    } catch (e) { setResult({ success: false, message: e.response?.data?.message || 'Failed' }); }
    finally { setSubmitting(false); }
  };

  const handleDownloadReceipt = async (id) => {
    try {
      const blob = await downloadReceipt(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a'); a.href = url; a.download = `receipt-${id.slice(-8)}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e) { alert('Download failed'); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const field = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  if (loading) return <div className="py-16 text-center text-slate-400">Loading...</div>;
  if (!data) return null;

  const { member, daysLeft, isExpired, pendingRequest, plans } = data;
  const RENEW_BADGE = { Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', Approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Fees & Payments</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">View your membership, submit fees, and track renewals</p>
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

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {['membership', 'payments', 'renewals', 'renew'].map(t => (
          <button key={t} onClick={() => { setTab(t); setResult(null); }} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold capitalize transition ${tab === t ? 'bg-white text-orange-600 shadow dark:bg-slate-700 dark:text-orange-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>{t}</button>
        ))}
      </div>

      {/* Membership */}
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

      {/* Payments */}
      {tab === 'payments' && (
        <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-white">Payment History</h2>
          {!payments.length ? <p className="py-8 text-center text-slate-400">No payments yet</p> : (
            <div className="space-y-2">
              {payments.map(p => (
                <div key={p._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">₹{p.amount?.toLocaleString('en-IN')} — {p.membershipId?.planType || ''}</p>
                    <p className="text-xs text-slate-400">{p.paymentMethod} · {fmt(p.paymentDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.status === 'Paid' ? 'bg-green-100 text-green-700' : p.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
                    {p.status === 'Paid' && <button onClick={() => handleDownloadReceipt(p._id)} className="rounded-lg bg-blue-50 p-1.5 text-blue-500 hover:bg-blue-100" title="Download Receipt"><FiFileText size={14} /></button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Renewals */}
      {tab === 'renewals' && (
        <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-white">Renewal History</h2>
          {!renewals.length ? <p className="py-8 text-center text-slate-400">No renewal requests</p> : (
            <div className="space-y-2">
              {renewals.map(r => (
                <div key={r._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{r.planType} — ₹{r.amount?.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-400">{fmt(r.requestedAt)} · {r.paymentMethod}</p>
                    {r.reviewedAt && <p className="text-xs text-slate-400">Reviewed: {fmt(r.reviewedAt)} by {r.reviewedBy?.name || 'Admin'}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${RENEW_BADGE[r.status]}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Renew */}
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
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount (₹)</label>
                      <div className="relative"><FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" className={field + ' pl-10'} />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Method</label>
                      <div className="relative"><FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select value={method} onChange={e => setMethod(e.target.value)} className={field + ' pl-10'}>
                          {['Cash', 'UPI', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={handleRenew} disabled={submitting}
                      className="w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
                      {submitting ? 'Submitting...' : <><FiRefreshCw /> Submit Renewal & Pay ₹{Number(amount || 0).toLocaleString('en-IN')}</>}
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