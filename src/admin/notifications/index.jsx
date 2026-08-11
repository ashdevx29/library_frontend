import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { getNotifications, createNotification, sendNotification, deleteNotification, getNotificationStats } from '../../services/notificationService.js';
import { getMembers } from '../../services/memberService.js';
import { FiBell, FiPlus, FiSend, FiTrash2, FiFilter, FiClock, FiCheckCircle, FiFileText, FiAlertTriangle, FiUsers, FiX, FiEye } from 'react-icons/fi';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const TYPES = ['Fee Reminder', 'Membership Expiry', 'Attendance Alert', 'General Notice'];
const ROLES = ['All', 'Student', 'Staff'];
const TYPE_COLORS = {
  'Fee Reminder': { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  'Membership Expiry': { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  'Attendance Alert': { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  'General Notice': { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
};
const TYPE_ICONS = {
  'Fee Reminder': FiAlertTriangle,
  'Membership Expiry': FiClock,
  'Attendance Alert': FiUsers,
  'General Notice': FiFileText,
};

export default function AdminNotifications() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('list');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ type: '', status: '' });
  const [viewNotif, setViewNotif] = useState(null);
  const [sending, setSending] = useState(null);
  const [confirmSendId, setConfirmSendId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [form, setForm] = useState({
    title: '', message: '', type: 'General Notice', targetRole: 'All', targetMembers: [],
  });
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [n, s] = await Promise.all([getNotifications(filter), getNotificationStats()]);
      setNotifications(n);
      setStats(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadMembers = async () => {
    try { const m = await getMembers({ limit: 200 }); setMembers(m.members || m || []); } catch (e) {}
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { loadMembers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return toast.error('Title and message are required');
    try {
      setLoading(true);
      await createNotification(form);
      setTab('list');
      setForm({ title: '', message: '', type: 'General Notice', targetRole: 'All', targetMembers: [] });
      await load();
      toast.success('Notification created');
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const handleSend = (id) => setConfirmSendId(id);

  const doSend = async () => {
    setSending(confirmSendId);
    try { await sendNotification(confirmSendId); await load(); toast.success('Notification sent!'); } catch (e) { toast.error(e.message); }
    setSending(null);
    setConfirmSendId(null);
  };

  const handleDelete = (id) => setConfirmDeleteId(id);

  const doDelete = async () => {
    try { await deleteNotification(confirmDeleteId); await load(); toast.success('Notification deleted'); } catch (e) { toast.error(e.message); }
    setConfirmDeleteId(null);
  };

  const toggleMember = (id) => {
    setForm(f => ({ ...f, targetMembers: f.targetMembers.includes(id) ? f.targetMembers.filter(m => m !== id) : [...f.targetMembers, id] }));
  };

  const filteredMembers = members.filter(m => {
    const matchSearch = !search || m.fullName?.toLowerCase().includes(search.toLowerCase()) || m.mobile?.includes(search);
    const matchRole = form.targetRole === 'All' || m.role === form.targetRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--primary)]/10 p-3"><FiBell size={24} className="text-[var(--primary)]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
            <p className="text-sm text-[var(--text-muted)]">Create and send announcements to members</p>
          </div>
        </div>
        <button onClick={() => setTab(tab === 'create' ? 'list' : 'create')} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all">
          {tab === 'create' ? <><FiX size={16} /> Cancel</> : <><FiPlus size={16} /> Create Notification</>}
        </button>
      </div>

      {/* Stats */}
      {stats && tab === 'list' && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { icon: FiBell, label: 'Total', value: stats.total, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
            { icon: FiSend, label: 'Sent', value: stats.sent, color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
            { icon: FiFileText, label: 'Drafts', value: stats.draft, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' },
            { icon: FiUsers, label: 'Types', value: Object.keys(stats.byType).length, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
              <div className={`rounded-lg p-2 ${s.color}`}><s.icon size={14} /></div>
              <div><p className="text-[10px] font-medium text-[var(--text-muted)]">{s.label}</p><p className="text-sm font-bold text-[var(--text-primary)]">{s.value}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE FORM */}
      {tab === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none" placeholder="Notification title" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Message *</label>
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none resize-none" placeholder="Write your notification message here..." required />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Target Audience</label>
              <div className="flex gap-2">
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, targetRole: r, targetMembers: [] })} className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${form.targetRole === r ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'}`}>{r}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Specific Members (optional) */}
          {form.targetRole !== 'All' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Select Specific Members (optional — leave empty for all {form.targetRole.toLowerCase()}s)</label>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or mobile..." className="mb-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] outline-none" />
              <div className="max-h-40 overflow-y-auto rounded-xl border border-[var(--border)] p-2">
                {filteredMembers.slice(0, 20).map(m => (
                  <label key={m._id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--bg-hover)] cursor-pointer">
                    <input type="checkbox" checked={form.targetMembers.includes(m._id)} onChange={() => toggleMember(m._id)} className="rounded" />
                    <span className="text-xs text-[var(--text-primary)]">{m.fullName}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{m.mobile}</span>
                  </label>
                ))}
                {filteredMembers.length === 0 && <p className="py-2 text-center text-xs text-[var(--text-muted)]">No members found</p>}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setTab('list')} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? 'Creating...' : <><FiPlus size={14} /> Create Draft</>}
            </button>
          </div>
        </form>
      )}

      {/* LIST */}
      {tab === 'list' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <FiFilter size={14} className="text-[var(--text-muted)]" />
            <select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--text-primary)]">
              <option value="">All Types</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--text-primary)]">
              <option value="">All Status</option>
              <option value="Sent">Sent</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-12 text-center">
              <FiBell size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
              <p className="text-sm text-[var(--text-muted)]">No notifications yet</p>
              <button onClick={() => setTab('create')} className="mt-3 text-xs font-semibold text-[var(--primary)] hover:underline">Create your first notification</button>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => {
                const Icon = TYPE_ICONS[n.type] || FiBell;
                const colors = TYPE_COLORS[n.type] || TYPE_COLORS['General Notice'];
                return (
                  <div key={n._id} className={`rounded-xl border ${colors.border} bg-[var(--bg-card)] p-4 transition-all hover:shadow-md`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`rounded-lg p-2 flex-shrink-0 ${colors.bg} ${colors.text}`}><Icon size={16} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-[var(--text-primary)]">{n.title}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${n.status === 'Sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>{n.status}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text}`}>{n.type}</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{n.message}</p>
                          <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                            <span>To: {n.targetRole === 'All' ? 'All Members' : n.targetRole}</span>
                            {n.targetMembers?.length > 0 && <span>({n.targetMembers.length} selected)</span>}
                            {n.sentAt && <span>Sent: {new Date(n.sentAt).toLocaleString()}</span>}
                            {n.sentBy && <span>By: {n.sentBy.name}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => setViewNotif(n)} className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:border-blue-500 hover:text-blue-600 transition-all"><FiEye size={12} /></button>
                        {n.status === 'Draft' && <button onClick={() => handleSend(n._id)} disabled={sending === n._id} className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:border-green-500 hover:text-green-600 transition-all disabled:opacity-50"><FiSend size={12} /></button>}
                        <button onClick={() => handleDelete(n._id)} className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:border-red-500 hover:text-red-600 transition-all"><FiTrash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW MODAL */}
      {viewNotif && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setViewNotif(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white text-slate-900 p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => { const Icon = TYPE_ICONS[viewNotif.type]; return <Icon size={18} className={TYPE_COLORS[viewNotif.type]?.text || ''} />; })()}
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{viewNotif.title}</h2>
              </div>
              <button onClick={() => setViewNotif(null)} className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><FiX size={14} /></button>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${viewNotif.status === 'Sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>{viewNotif.status}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[viewNotif.type]?.bg || ''} ${TYPE_COLORS[viewNotif.type]?.text || ''}`}>{viewNotif.type}</span>
            </div>
            <div className="mb-4 rounded-xl bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-primary)] whitespace-pre-wrap">{viewNotif.message}</div>
            <div className="space-y-1 text-[11px] text-[var(--text-muted)]">
              <p>Target: {viewNotif.targetRole === 'All' ? 'All Members' : viewNotif.targetRole}</p>
              {viewNotif.targetMembers?.length > 0 && <p>Selected: {viewNotif.targetMembers.map(m => m.fullName).join(', ')}</p>}
              {viewNotif.sentTo?.length > 0 && <p>Delivered to: {viewNotif.sentTo.length} members</p>}
              {viewNotif.sentAt && <p>Sent at: {new Date(viewNotif.sentAt).toLocaleString()}</p>}
              {viewNotif.sentBy && <p>Created by: {viewNotif.sentBy.name}</p>}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!confirmSendId}
        onClose={() => setConfirmSendId(null)}
        onConfirm={doSend}
        title="Send Notification"
        message="Send this notification to all target recipients?"
        confirmText="Yes, Send"
        variant="success"
      />
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={doDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
