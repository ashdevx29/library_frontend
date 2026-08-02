import React, { useState, useEffect } from 'react';
import { getActivityLogs, getAuditLogs, getLogStats, clearOldLogs } from '../../services/logService.js';
import { FiActivity, FiShield, FiFilter, FiTrash2, FiClock, FiUser, FiDatabase } from 'react-icons/fi';

const TABS = ['Activity', 'Audit'];

export default function LogsPage() {
  const [tab, setTab] = useState('Activity');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [audit, setAudit] = useState([]);
  const [filter, setFilter] = useState({ module: '', startDate: '', endDate: '' });

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

  useEffect(() => { load(); }, [tab, filter]);

  const handleClear = async () => {
    const days = prompt('Delete logs older than how many days?', '90');
    if (!days) return;
    try { await clearOldLogs(parseInt(days)); await load(); } catch (e) { alert(e.message); }
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
        <button onClick={handleClear} className="flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
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
            <div className="space-y-2">
              {activity.map((l, i) => (
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
          )}

          {tab === 'Audit' && (
            audit.length === 0 ? <p className="py-8 text-center text-sm text-[var(--text-muted)]">No audit logs</p> :
            <div className="space-y-2">
              {audit.map((l, i) => (
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
          )}
        </div>
      )}
    </div>
  );
}
