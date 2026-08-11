import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getActivityLogs, getAuditLogs, getLogStats, clearOldLogs } from '../../services/logService.js';
import { FiActivity, FiShield, FiFilter, FiTrash2, FiClock, FiUser, FiDatabase } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';

const TABS = ['Activity', 'Audit'];

export default function LogsPage() {
  const [tab, setTab] = useState('Activity');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [audit, setAudit] = useState([]);
  const [filter, setFilter] = useState({ module: '', startDate: '', endDate: '' });
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearDays, setClearDays] = useState('90');
  const [clearing, setClearing] = useState(false);

  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const s = await getLogStats();
      setStats(s);
      if (tab === 'Activity') setActivity(await getActivityLogs(filter));
      else setAudit(await getAuditLogs(filter));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { setPage(1); load(); }, [tab, filter]);

  const handleClearLogs = async (e) => {
    e.preventDefault();
    const daysNum = parseInt(clearDays);
    if (isNaN(daysNum) || daysNum < 1) {
      return toast.error('Please enter a valid number of days');
    }
    setClearing(true);
    try {
      await clearOldLogs(daysNum);
      setShowClearModal(false);
      await load();
      toast.success(`Logs older than ${daysNum} days cleared`);
    } catch (e) {
      toast.error(e.message || 'Failed to clear logs');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--primary)]/10 p-3"><FiActivity size={24} className="text-[var(--primary)]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Logs</h1>
            <p className="text-sm text-[var(--text-muted)]">Activity and audit trail</p>
          </div>
        </div>
        <button onClick={() => setShowClearModal(true)} className="flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
          <FiTrash2 size={14} /> Clear Old Logs
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {[
            { icon: FiActivity, label: 'Activity Logs', value: stats.totalActivity, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
            { icon: FiClock, label: 'Today', value: stats.todayActivity, color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
            { icon: FiShield, label: 'Audit Logs', value: stats.totalAudit, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
              <div className={`rounded-lg p-2 ${s.color}`}><s.icon size={14} /></div>
              <div><p className="text-[10px] font-medium text-[var(--text-muted)]">{s.label}</p><p className="text-sm font-bold text-[var(--text-primary)]">{s.value}</p></div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${tab === t ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>{t}</button>)}
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={filter.module} onChange={e => setFilter({ ...filter, module: e.target.value })} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--text-primary)]">
          <option value="">All Modules</option>
          {['Auth', 'Members', 'Seats', 'Payments', 'Expenses', 'Attendance', 'Settings', 'Notifications'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="date" value={filter.startDate} onChange={e => setFilter({ ...filter, startDate: e.target.value })} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--text-primary)]" />
        <input type="date" value={filter.endDate} onChange={e => setFilter({ ...filter, endDate: e.target.value })} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--text-primary)]" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" /></div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          {tab === 'Activity' && (
            activity.length === 0 ? <p className="py-8 text-center text-sm text-[var(--text-muted)]">No activity logs</p> :
            <div className="space-y-3">
              <div className="space-y-2">
                {activity.slice((page - 1) * 10, page * 10).map((l, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--bg-hover)]">
                    <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/20"><FiActivity size={12} className="text-blue-600 dark:text-blue-400" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)]">{l.userId?.name || 'System'}</span>
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">{l.module}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{l.action}</span>
                      </div>
                      {l.description && <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{l.description}</p>}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {activity.length > 10 && (
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs">
                  <span className="text-[var(--text-muted)]">
                    Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, activity.length)} of {activity.length}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-[var(--border)] px-3 py-1 font-semibold hover:bg-[var(--bg-hover)] disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="px-2 py-1 font-bold text-[var(--primary)]">Page {page} of {Math.ceil(activity.length / 10)}</span>
                    <button
                      onClick={() => setPage(p => Math.min(p + 1, Math.ceil(activity.length / 10)))}
                      disabled={page >= Math.ceil(activity.length / 10)}
                      className="rounded-lg border border-[var(--border)] px-3 py-1 font-semibold hover:bg-[var(--bg-hover)] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'Audit' && (
            audit.length === 0 ? <p className="py-8 text-center text-sm text-[var(--text-muted)]">No audit logs</p> :
            <div className="space-y-3">
              <div className="space-y-2">
                {audit.slice((page - 1) * 10, page * 10).map((l, i) => (
                  <div key={i} className="rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--bg-hover)]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{l.userId?.name || 'System'}</span>
                      <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">{l.module}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{new Date(l.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                      {l.oldData && <div className="rounded bg-red-50 p-1.5 dark:bg-red-900/10"><span className="font-semibold text-red-600">Before:</span> <span className="text-[var(--text-muted)]">{JSON.stringify(l.oldData).slice(0, 120)}</span></div>}
                      {l.newData && <div className="rounded bg-green-50 p-1.5 dark:bg-green-900/10"><span className="font-semibold text-green-600">After:</span> <span className="text-[var(--text-muted)]">{JSON.stringify(l.newData).slice(0, 120)}</span></div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {audit.length > 10 && (
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs">
                  <span className="text-[var(--text-muted)]">
                    Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, audit.length)} of {audit.length}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-[var(--border)] px-3 py-1 font-semibold hover:bg-[var(--bg-hover)] disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="px-2 py-1 font-bold text-[var(--primary)]">Page {page} of {Math.ceil(audit.length / 10)}</span>
                    <button
                      onClick={() => setPage(p => Math.min(p + 1, Math.ceil(audit.length / 10)))}
                      disabled={page >= Math.ceil(audit.length / 10)}
                      className="rounded-lg border border-[var(--border)] px-3 py-1 font-semibold hover:bg-[var(--bg-hover)] disabled:opacity-40"
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

      <Modal isOpen={showClearModal} onClose={() => setShowClearModal(false)} title="Clear Old Logs">
        <form onSubmit={handleClearLogs} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Delete logs older than (days):</label>
            <input
              type="number"
              min="1"
              value={clearDays}
              onChange={e => setClearDays(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowClearModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={clearing} className="rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
              {clearing ? 'Clearing...' : 'Clear Logs'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
