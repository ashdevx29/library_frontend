import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../services/announcementService.js';
import { FiVolume2, FiPlus, FiEdit2, FiTrash2, FiX, FiCalendar, FiCheckCircle, FiClock } from 'react-icons/fi';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', status: 'Active' });
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setAnnouncements(await getAnnouncements()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ title: '', description: '', startDate: '', endDate: '', status: 'Active' }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await updateAnnouncement(editing._id, form);
      else await createAnnouncement(form);
      resetForm(); await load();
      toast.success(editing ? 'Announcement updated' : 'Announcement created');
    } catch (e) { toast.error(e.message); }
  };

  const handleEdit = (a) => { setForm({ title: a.title, description: a.description, startDate: a.startDate?.split('T')[0] || '', endDate: a.endDate?.split('T')[0] || '', status: a.status }); setEditing(a); setShowForm(true); };

  const handleDelete = (id) => setConfirmId(id);

  const doDelete = async () => {
    try { await deleteAnnouncement(confirmId); await load(); toast.success('Announcement deleted'); } catch (e) { toast.error(e.message); }
    setConfirmId(null);
  };

  const now = new Date();

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--primary)]/10 p-3"><FiVolume2 size={24} className="text-[var(--primary)]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Announcements</h1>
            <p className="text-sm text-[var(--text-muted)]">Manage library-wide announcements</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          <FiPlus size={16} /> Add Announcement
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{editing ? 'Edit' : 'New'} Announcement</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)]">
                <option value="Active">Active</option><option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Description *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={3} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Start Date *</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)]" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">End Date *</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)]" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Cancel</button>
            <button type="submit" className="rounded-xl bg-[var(--primary)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" /></div>
      ) : announcements.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-12 text-center"><FiVolume2 size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" /><p className="text-sm text-[var(--text-muted)]">No announcements yet</p></div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const isActive = a.status === 'Active' && new Date(a.endDate) >= now;
            const isExpired = new Date(a.endDate) < now;
            return (
              <div key={a._id} className={`rounded-xl border bg-[var(--bg-card)] p-4 transition-all hover:shadow-md ${isActive ? 'border-green-200 dark:border-green-800' : isExpired ? 'border-red-200 dark:border-red-800' : 'border-[var(--border)]'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">{a.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {isActive ? 'Active' : isExpired ? 'Expired' : a.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{a.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1"><FiCalendar size={10} /> {new Date(a.startDate).toLocaleDateString()} — {new Date(a.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(a)} className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:border-blue-500 hover:text-blue-600"><FiEdit2 size={12} /></button>
                    <button onClick={() => handleDelete(a._id)} className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:border-red-500 hover:text-red-600"><FiTrash2 size={12} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={doDelete}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
