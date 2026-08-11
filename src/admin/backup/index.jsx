import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getBackups, createBackup, restoreBackup, deleteBackup } from '../../services/backupService.js';
import { FiDatabase, FiDownload, FiUpload, FiTrash2, FiRefreshCw, FiClock, FiAlertTriangle } from 'react-icons/fi';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function BackupPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [confirmCreate, setConfirmCreate] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setBackups(await getBackups()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => setConfirmCreate(true);

  const doCreate = async () => {
    setConfirmCreate(false);
    setCreating(true);
    try { await createBackup(); await load(); toast.success('Backup created successfully!'); } catch (e) { toast.error(e.message || 'Failed to create backup'); }
    setCreating(false);
  };

  const handleRestore = (filename) => setConfirmRestore(filename);

  const doRestore = async () => {
    const filename = confirmRestore;
    setConfirmRestore(null);
    setRestoring(filename);
    try { await restoreBackup(filename); toast.success('Backup restored successfully!'); } catch (e) { toast.error(e.message || 'Restore failed'); }
    setRestoring(null);
  };

  const handleDelete = (filename) => setConfirmDelete(filename);

  const doDelete = async () => {
    const filename = confirmDelete;
    setConfirmDelete(null);
    try { await deleteBackup(filename); await load(); toast.success('Backup deleted'); } catch (e) { toast.error(e.message || 'Delete failed'); }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--primary)]/10 p-3"><FiDatabase size={24} className="text-[var(--primary)]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Backup & Restore</h1>
            <p className="text-sm text-[var(--text-muted)]">Database backup management</p>
          </div>
        </div>
        <button onClick={handleCreate} disabled={creating} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {creating ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating...</> : <><FiDownload size={16} /> Create Backup</>}
        </button>
      </div>

      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/10">
        <div className="flex items-start gap-2">
          <FiAlertTriangle size={16} className="mt-0.5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Important</p>
            <p className="text-[11px] text-yellow-600 dark:text-yellow-500">Restoring a backup will overwrite all current data. Make sure to create a new backup first.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" /></div>
      ) : backups.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-12 text-center">
          <FiDatabase size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">No backups yet</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Create your first backup above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {backups.map((b, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20"><FiDatabase size={16} className="text-blue-600 dark:text-blue-400" /></div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">{b.filename}</p>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                    <span>{formatSize(b.size)}</span>
                    <span className="flex items-center gap-1"><FiClock size={10} /> {new Date(b.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleRestore(b.filename)} disabled={restoring === b.filename} className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[10px] font-semibold text-[var(--text-secondary)] hover:border-green-500 hover:text-green-600 disabled:opacity-50">
                  {restoring === b.filename ? <div className="h-3 w-3 animate-spin rounded-full border border-green-600 border-t-transparent" /> : <FiUpload size={10} />} Restore
                </button>
                <button onClick={() => handleDelete(b._id)} className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:border-red-500 hover:text-red-600"><FiTrash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmCreate}
        onClose={() => setConfirmCreate(false)}
        onConfirm={doCreate}
        title="Create Backup"
        message="Create a full database backup now?"
        confirmText="Create Backup"
        variant="success"
      />
      <ConfirmDialog
        isOpen={!!confirmRestore}
        onClose={() => setConfirmRestore(null)}
        onConfirm={doRestore}
        title="Restore Backup"
        message={`Restore "${confirmRestore}"? ⚠️ This will OVERWRITE all current data and cannot be undone!`}
        confirmText="Yes, Restore"
        variant="warning"
      />
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        title="Delete Backup"
        message={`Are you sure you want to delete "${confirmDelete}"?`}
        confirmText="Delete Backup"
        variant="danger"
      />
    </div>
  );
}
