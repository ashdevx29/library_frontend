import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiShield, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiLock } from 'react-icons/fi';
import { getRoles, createRole, updateRole, deleteRole, getRoleStats } from '../../services/roleService.js';
import { MODULES, PERMISSION_MAP } from '../../constants/permissions.js';
import { PageHeader, StatCard, inputClass, textareaClass, btnPrimary, btnSecondary, btnDanger } from '../../components/ui/index';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const ModuleIcon = ({ name }) => {
  const icons = { Members: '👥', Attendance: '📅', Payments: '💳', Expenses: '💰', Reports: '📊', Settings: '⚙️', Notifications: '🔔', Shifts: '🕐', Seats: '💺', Backup: '💾', Logs: '📝', Announcements: '📢', Roles: '🛡️' };
  return <span className="text-sm">{icons[name] || '📦'}</span>;
};

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([getRoles(), getRoleStats()]);
      setRoles(r); setStats(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ name: '', description: '', permissions: [] }); setEditing(null); setShowForm(false); };

  const handleEdit = (role) => {
    setForm({ name: role.name, description: role.description || '', permissions: [...role.permissions] });
    setEditing(role);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Role name is required');
    setSaving(true);
    try {
      if (editing) {
        await updateRole(editing._id, form);
        toast.success('Role updated successfully');
      } else {
        await createRole(form);
        toast.success('Role created successfully');
      }
      resetForm(); await load();
    } catch (e) { toast.error(e.message || 'Operation failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await deleteRole(deleteTarget._id);
      setDeleteTarget(null);
      await load();
      toast.success('Role deleted successfully');
    } catch (e) { toast.error(e.message || 'Delete failed'); }
  };

  const togglePerm = (perm) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm) ? f.permissions.filter(p => p !== perm) : [...f.permissions, perm],
    }));
  };

  const toggleModule = (mod) => {
    const perms = PERMISSION_MAP[mod].map(a => `${mod}:${a}`);
    const allSelected = perms.every(p => form.permissions.includes(p));
    setForm(f => ({
      ...f,
      permissions: allSelected ? f.permissions.filter(p => !perms.includes(p)) : [...new Set([...f.permissions, ...perms])],
    }));
  };

  const selectAll = () => {
    const allPerms = Object.entries(PERMISSION_MAP).flatMap(([mod, actions]) => actions.map(a => `${mod}:${a}`));
    const allSelected = allPerms.every(p => form.permissions.includes(p));
    setForm(f => ({ ...f, permissions: allSelected ? [] : allPerms }));
  };

  if (loading) return <PageLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-4 md:p-6">
      <PageHeader icon={FiShield} title="Roles & Permissions" subtitle="Manage user roles and access control" action={<><FiPlus size={16} /> Add Role</>} onAction={() => { resetForm(); setShowForm(true); }} />

      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={FiShield} label="Total Roles" value={stats.total} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          <StatCard icon={FiLock} label="System Roles" value={stats.system} color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" />
          <StatCard icon={FiPlus} label="Custom Roles" value={stats.custom} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
        </div>
      )}

      {/* Role Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map(role => (
          <motion.div key={role._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[var(--primary)]/10 p-2"><FiShield size={16} className="text-[var(--primary)]" /></div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{role.name}</h3>
                  {role.isSystem && <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400">System</span>}
                </div>
              </div>
              {!role.isSystem && (
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(role)} className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:border-blue-500 hover:text-blue-600"><FiEdit2 size={12} /></button>
                  <button onClick={() => setDeleteTarget(role)} className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:border-red-500 hover:text-red-600"><FiTrash2 size={12} /></button>
                </div>
              )}
            </div>
            {role.description && <p className="mt-2 text-[11px] text-[var(--text-muted)]">{role.description}</p>}
            <div className="mt-3 flex flex-wrap gap-1">
              {MODULES.filter(m => role.permissions.some(p => p.startsWith(m + ':'))).slice(0, 5).map(m => (
                <span key={m} className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[9px] font-semibold text-[var(--primary)]">{m}</span>
              ))}
              {MODULES.filter(m => role.permissions.some(p => p.startsWith(m + ':'))).length > 5 && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500 dark:bg-gray-800">+{MODULES.filter(m => role.permissions.some(p => p.startsWith(m + ':'))).length - 5}</span>
              )}
            </div>
            <p className="mt-2 text-[10px] text-[var(--text-muted)]">{role.permissions.length} permissions</p>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showForm} onClose={resetForm} title={editing ? 'Edit Role' : 'Create Role'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Role Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="e.g. Floor Manager" disabled={editing?.isSystem} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="Brief description" />
            </div>
          </div>

          {/* Permission Matrix */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Permissions ({form.permissions.length} selected)</label>
              <button type="button" onClick={selectAll} className="text-[10px] font-semibold text-[var(--primary)] hover:underline">
                {Object.entries(PERMISSION_MAP).flatMap(([m, a]) => a.map(a => `${m}:${a}`)).every(p => form.permissions.includes(p)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="max-h-[50vh] space-y-3 overflow-y-auto rounded-xl border border-[var(--border)] p-3">
              {MODULES.map(mod => {
                const perms = PERMISSION_MAP[mod];
                const selected = perms.filter(a => form.permissions.includes(`${mod}:${a}`));
                const allSelected = selected.length === perms.length;
                const someSelected = selected.length > 0 && !allSelected;
                return (
                  <div key={mod} className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-[var(--bg-hover)]">
                      <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected; }} onChange={() => toggleModule(mod)} className="rounded" />
                      <ModuleIcon name={mod} />
                      <span className="text-xs font-bold text-[var(--text-primary)]">{mod}</span>
                      <span className="text-[9px] text-[var(--text-muted)]">{selected.length}/{perms.length}</span>
                    </label>
                    <div className="mt-1 flex flex-wrap gap-1 pl-6">
                      {perms.map(action => {
                        const perm = `${mod}:${action}`;
                        const checked = form.permissions.includes(perm);
                        return (
                          <label key={action} className={`flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-all ${checked ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]'}`}>
                            <input type="checkbox" checked={checked} onChange={() => togglePerm(perm)} className="hidden" />
                            {checked ? <FiCheck size={8} /> : null}
                            {action}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
            <button type="button" onClick={resetForm} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : editing ? 'Update Role' : 'Create Role'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Role?" message={`Delete "${deleteTarget?.name}"? Users with this role will lose these permissions.`} confirmText="Delete" />
    </motion.div>
  );
}
