import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiUsers, FiGrid } from 'react-icons/fi';
import { useMembers, useDeleteMember } from '../../hooks/useApi';
import { usePagination } from '../../hooks/useHelpers';
import DataTable from '../../components/ui/DataTable';
import { PageHeader, StatCard, StatusBadge, TabBar, inputClass } from '../../components/ui/index';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate, daysLeft, getInitials } from '../../utils/helpers';
import { PLAN_TYPES } from '../../constants';

const col = createColumnHelper();

export default function MemberList() {
  const navigate = useNavigate();
  const { page, limit, setPage } = usePagination();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [view, setView] = useState('table');
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useMembers({ page, limit, search, membershipPlan: planFilter });
  const deleteMut = useDeleteMember();

  const members = data?.members || data || [];
  const total = data?.total || members.length;

  const stats = useMemo(() => {
    const now = new Date();
    const active = members.filter(m => m.status === 'Active' && new Date(m.membershipExpiryDate) > now).length;
    const expiring = members.filter(m => { const d = daysLeft(m.membershipExpiryDate); return d > 0 && d <= 7; }).length;
    const expired = members.filter(m => m.status === 'Inactive' || daysLeft(m.membershipExpiryDate) <= 0).length;
    return { total, active, expiring, expired };
  }, [members, total]);

  const columns = useMemo(() => [
    col.accessor('fullName', {
      header: 'Member',
      cell: info => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">{getInitials(info.getValue())}</div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">{info.getValue()}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{info.row.original.mobile}</p>
          </div>
        </div>
      ),
    }),
    col.accessor('seatId.seatNumber', {
      header: 'Seat',
      cell: info => <span className="text-xs">{info.getValue() || '-'}</span>,
    }),
    col.accessor('shiftId.shiftName', {
      header: 'Shift',
      cell: info => <span className="text-xs">{info.getValue() || '-'}</span>,
    }),
    col.accessor('membershipPlan', {
      header: 'Plan',
      cell: info => <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">{info.getValue() || '-'}</span>,
    }),
    col.accessor('membershipExpiryDate', {
      header: 'Expiry',
      cell: info => {
        const d = daysLeft(info.getValue());
        const color = d <= 0 ? 'text-red-500' : d <= 7 ? 'text-yellow-500' : 'text-green-500';
        return <span className={`text-xs font-semibold ${color}`}>{d > 0 ? `${d}d left` : 'Expired'}</span>;
      },
    }),
    col.accessor('status', {
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: info => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/members/view/${info.row.original._id}`); }} className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">View</button>
          <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/members/edit/${info.row.original._id}`); }} className="rounded-lg bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(info.row.original._id); }} className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">Del</button>
        </div>
      ),
    }),
  ], [navigate]);

  if (isLoading) return <PageLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-4 md:p-6">
      <PageHeader icon={FiUsers} title="Members" subtitle={`${total} total members`} action={<><FiPlus size={16} /> Add Member</>} onAction={() => navigate('/admin/members/add')} />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard icon={FiUsers} label="Total" value={stats.total} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
        <StatCard icon={FiUsers} label="Active" value={stats.active} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
        <StatCard icon={FiUsers} label="Expiring" value={stats.expiring} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" />
        <StatCard icon={FiUsers} label="Expired" value={stats.expired} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search members..." className={`${inputClass} pl-9`} />
        </div>
        <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All Plans</option>
          {PLAN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-1">
          <button onClick={() => setView('table')} className={`rounded px-2 py-1 text-xs ${view === 'table' ? 'bg-[var(--primary)] text-white' : ''}`}><FiGrid size={12} /></button>
          <button onClick={() => setView('card')} className={`rounded px-2 py-1 text-xs ${view === 'card' ? 'bg-[var(--primary)] text-white' : ''}`}><FiUsers size={12} /></button>
        </div>
      </div>

      {view === 'table' ? (
        <DataTable columns={columns} data={members} emptyTitle="No members found" pageSize={limit} loading={isLoading} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map(m => {
            const d = daysLeft(m.membershipExpiryDate);
            return (
              <motion.div key={m._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02 }} onClick={() => navigate(`/admin/members/view/${m._id}`)} className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-bold text-[var(--primary)]">{getInitials(m.fullName)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">{m.fullName}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{m.mobile}</p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                  <div><span className="text-[var(--text-muted)]">Seat:</span> <span className="font-semibold">{m.seatId?.seatNumber || '-'}</span></div>
                  <div><span className="text-[var(--text-muted)]">Shift:</span> <span className="font-semibold">{m.shiftId?.shiftName || '-'}</span></div>
                  <div><span className="text-[var(--text-muted)]">Plan:</span> <span className="font-semibold">{m.membershipPlan}</span></div>
                  <div className={`font-semibold ${d <= 0 ? 'text-red-500' : d <= 7 ? 'text-yellow-500' : 'text-green-500'}`}>{d > 0 ? `${d}d left` : 'Expired'}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} title="Delete Member?" message="This action cannot be undone." confirmText="Delete" />
    </motion.div>
  );
}
