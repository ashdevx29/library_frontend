import React, { useState, useEffect } from 'react';
import { getMyNotifications } from '../../services/notificationService.js';
import { FiBell, FiClock, FiAlertTriangle, FiFileText, FiUsers, FiCheckCircle } from 'react-icons/fi';

const TYPE_COLORS = {
  'Fee Reminder': { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800', icon: FiAlertTriangle },
  'Membership Expiry': { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', icon: FiClock },
  'Attendance Alert': { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', icon: FiUsers },
  'General Notice': { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', icon: FiFileText },
};

export default function UserNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try { setNotifications(await getMyNotifications()); } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const unread = notifications.length;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--primary)]/10 p-3"><FiBell size={24} className="text-[var(--primary)]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
            <p className="text-sm text-[var(--text-muted)]">Library announcements and alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[var(--primary)]/10 px-3 py-2">
          <FiBell size={14} className="text-[var(--primary)]" />
          <span className="text-xs font-semibold text-[var(--primary)]">{unread} notification{unread !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 overflow-x-auto">
        {['all', 'Fee Reminder', 'Membership Expiry', 'Attendance Alert', 'General Notice'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${filter === f ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'}`}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-12 text-center">
          <FiBell size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">No notifications</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => {
            const tc = TYPE_COLORS[n.type] || TYPE_COLORS['General Notice'];
            const Icon = tc.icon;
            const timeAgo = (date) => {
              if (!date) return '';
              const diff = Date.now() - new Date(date).getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 60) return `${mins}m ago`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `${hrs}h ago`;
              const days = Math.floor(hrs / 24);
              return `${days}d ago`;
            };

            return (
              <div key={n._id} className={`rounded-xl border ${tc.border} bg-[var(--bg-card)] p-4 transition-all hover:shadow-md`}>
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 flex-shrink-0 ${tc.bg} ${tc.text}`}><Icon size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">{n.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tc.bg} ${tc.text}`}>{n.type}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">{n.message}</p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                      {n.sentAt && <span className="flex items-center gap-1"><FiClock size={10} /> {timeAgo(n.sentAt)}</span>}
                      {n.sentBy?.name && <span>From: {n.sentBy.name}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
