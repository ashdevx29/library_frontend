import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import {
  FiPlus, FiSearch, FiUsers, FiGrid, FiList, FiPhone,
  FiCalendar, FiEye, FiEdit2, FiTrash2, FiClock, FiCheckCircle, FiAlertTriangle, FiXCircle
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useMembers, useDeleteMember } from '../../hooks/useApi';
import { usePagination } from '../../hooks/useHelpers';
import DataTable from '../../components/ui/DataTable';
import { PageHeader, StatCard, StatusBadge, inputClass } from '../../components/ui/index';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate, calculateRemainingDays, getInitials } from '../../utils/helpers';
import { getPhotoUrl } from '../../utils/image';
import { PLAN_TYPES } from '../../constants';

const col = createColumnHelper();

export default function MemberList() {
  const navigate = useNavigate();
  const { page, limit, setPage } = usePagination();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusTab, setStatusTab] = useState('Active'); // 'Active' | 'Expiring' | 'Expired' | 'All'
  const [view, setView] = useState('card'); // Primary default view is Card View
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useMembers({ page, limit: 1000, search, membershipPlan: planFilter });
  const deleteMut = useDeleteMember();

  const allMembers = Array.isArray(data?.members) ? data.members : Array.isArray(data) ? data : [];

  // Categorize members for status filtering
  const { activeList, expiringList, expiredList } = useMemo(() => {
    const active = [];
    const expiring = [];
    const expired = [];

    allMembers.forEach(m => {
      const days = calculateRemainingDays(m.membershipExpiryDate);
      const isInactive = m.status === 'Inactive' || m.status === 'Expired' || m.status === 'Suspended';

      if (days <= 0 || isInactive) {
        expired.push(m);
      } else if (days <= 7) {
        expiring.push(m);
        active.push(m);
      } else {
        active.push(m);
      }
    });

    return { activeList: active, expiringList: expiring, expiredList: expired };
  }, [allMembers]);

  // Current displayed members based on tab and filters
  const displayedMembers = useMemo(() => {
    let list = [];
    if (statusTab === 'Active') list = activeList;
    else if (statusTab === 'Expiring') list = expiringList;
    else if (statusTab === 'Expired') list = expiredList;
    else list = allMembers;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.fullName?.toLowerCase().includes(q) ||
        m.mobile?.includes(q) ||
        m.email?.toLowerCase().includes(q)
      );
    }

    if (planFilter) {
      list = list.filter(m => m.membershipPlan === planFilter);
    }

    return list;
  }, [statusTab, activeList, expiringList, expiredList, allMembers, search, planFilter]);

  const handleWhatsAppShare = (m) => {
    const days = calculateRemainingDays(m.membershipExpiryDate);
    const studentName = m.fullName || 'Student';
    let message = '';

    if (days > 0 && days <= 7) {
      message = `Dear ${studentName}, your membership is expiring in ${days} days. Please renew your membership.`;
    } else if (days <= 0) {
      const expiredDays = Math.abs(days);
      message = `Dear ${studentName}, your membership has expired${expiredDays > 0 ? ` ${expiredDays} days ago` : ''}. Please renew your membership to continue library access.`;
    } else {
      message = `Dear ${studentName}, your library membership is active (${days} days remaining). Expiry date: ${formatDate(m.membershipExpiryDate)}. Thank you!`;
    }

    const rawMobile = String(m.mobile || '').replace(/\D/g, '');
    const cleanPhone = rawMobile.length === 10 ? `91${rawMobile}` : rawMobile;
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const columns = useMemo(() => [
    col.accessor('fullName', {
      header: 'Member',
      cell: info => (
        <div className="flex items-center gap-2.5">
          <img
            src={getPhotoUrl(info.row.original.photo, info.getValue())}
            alt={info.getValue()}
            className="h-9 w-9 rounded-full object-cover border border-orange-200"
          />
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
      header: 'Expiry Date',
      cell: info => {
        const d = calculateRemainingDays(info.getValue());
        const color = d <= 0 ? 'text-red-500 font-bold' : d <= 7 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-semibold';
        return <span className={`text-xs ${color}`}>{d > 0 ? `${d}d left` : d === 0 ? 'Expiring Today' : `Expired (${Math.abs(d)}d ago)`}</span>;
      },
    }),
    col.accessor('status', {
      header: 'Status',
      cell: info => {
        const d = calculateRemainingDays(info.row.original.membershipExpiryDate);
        const statusText = d <= 0 ? 'Expired' : d <= 7 ? 'Expiring' : 'Active';
        return <StatusBadge status={statusText} />;
      },
    }),
    col.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(info.row.original); }}
            title="WhatsApp Reminder"
            className="rounded-xl bg-green-100 p-2 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 cursor-pointer transition-colors"
          >
            <FaWhatsapp size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/members/view/${info.row.original._id}`); }}
            title="View Details"
            className="rounded-xl bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 cursor-pointer transition-colors"
          >
            <FiEye size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/members/edit/${info.row.original._id}`); }}
            title="Edit Member"
            className="rounded-xl bg-orange-50 p-2 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 cursor-pointer transition-colors"
          >
            <FiEdit2 size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteId(info.row.original._id); }}
            title="Delete Member"
            className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 cursor-pointer transition-colors"
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      ),
    }),
  ], [navigate]);

  if (isLoading) return <PageLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 p-4 md:p-6">
      <PageHeader
        icon={FiUsers}
        title="Members Management"
        subtitle={`${allMembers.length} total members registered`}
        action={<><FiPlus size={16} /> Add New Member</>}
        onAction={() => navigate('/admin/members/add')}
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={FiUsers} label="Total Members" value={allMembers.length} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
        <StatCard icon={FiCheckCircle} label="Active Members" value={activeList.length} color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
        <StatCard icon={FiAlertTriangle} label="Expiring (<=7 Days)" value={expiringList.length} color="bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" />
        <StatCard icon={FiXCircle} label="Expired Members" value={expiredList.length} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
      </div>

      {/* Responsive Filter & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'Active', label: 'Active', count: activeList.length },
            { id: 'Expiring', label: 'Expiring (<=7d)', count: expiringList.length },
            { id: 'Expired', label: 'Expired', count: expiredList.length },
            { id: 'All', label: 'All Members', count: allMembers.length },
          ].map(t => {
            const isActive = statusTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setStatusTab(t.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span>{t.label}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Plan Filter, and View Layout Mode */}
        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end min-w-[280px]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search member name or mobile..."
              className={`${inputClass} pl-9 text-xs py-1.5`}
            />
          </div>

          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className={`${inputClass} text-xs py-1.5 w-auto`}
          >
            <option value="">All Plans</option>
            {PLAN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          {/* View Mode Toggle Button */}
          <div className="flex items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-0.5">
            <button
              onClick={() => setView('card')}
              title="Card View (Default)"
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${view === 'card' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <FiGrid size={13} /> Cards
            </button>
            <button
              onClick={() => setView('table')}
              title="Table View"
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${view === 'table' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <FiList size={13} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {view === 'card' ? (
        !displayedMembers.length ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
            <FiUsers className="mx-auto mb-3 text-4xl text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">No members found for current filters</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Try searching with another keyword or switching status tab</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedMembers.map(m => {
              const days = calculateRemainingDays(m.membershipExpiryDate);
              const statusTag = days <= 0 ? 'Expired' : days <= 7 ? 'Expiring' : 'Active';

              let daysBadgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
              let daysText = `${days} Days Left`;

              if (days <= 0) {
                daysBadgeClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                daysText = days === 0 ? 'Expiring Today' : `Expired ${Math.abs(days)}d ago`;
              } else if (days <= 7) {
                daysBadgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
                daysText = `${days} Days Left`;
              }

              return (
                <motion.div
                  key={m._id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(`/admin/members/view/${m._id}`)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm transition-all hover:shadow-lg cursor-pointer"
                >
                  <div>
                    {/* Header: Photo, Name, Mobile, Status */}
                    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getPhotoUrl(m.photo, m.fullName)}
                          alt={m.fullName}
                          className="h-12 w-12 rounded-full object-cover border-2 border-orange-200 dark:border-orange-900/50 shadow-xs"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                            {m.fullName}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-0.5">
                            <FiPhone size={11} />
                            <span>{m.mobile}</span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={statusTag} />
                    </div>

                    {/* Member Details */}
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">Membership Plan:</span>
                        <span className="font-bold text-[var(--text-primary)] bg-blue-50 px-2 py-0.5 rounded-md dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                          {m.membershipPlan || 'General'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">Expiry Date:</span>
                        <span className="font-medium text-[var(--text-primary)] flex items-center gap-1">
                          <FiCalendar size={12} className="text-[var(--text-muted)]" />
                          {formatDate(m.membershipExpiryDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">Remaining Time:</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${daysBadgeClass}`}>
                          {daysText}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--text-muted)] border-t border-[var(--border)]/50">
                        <span>Seat: <b className="text-[var(--text-primary)]">{m.seatId?.seatNumber || 'Unassigned'}</b></span>
                        <span>Shift: <b className="text-[var(--text-primary)]">{m.shiftId?.shiftName || 'General'}</b></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & WhatsApp Integration */}
                  <div className="mt-4 space-y-2 pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsAppShare(m);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 px-3 py-2 text-xs font-bold text-white transition-colors shadow-xs cursor-pointer"
                        title="Send WhatsApp Reminder"
                      >
                        <FaWhatsapp size={16} /> WhatsApp
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/members/view/${m._id}`); }}
                        title="View Details"
                        className="flex items-center justify-center h-8 w-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-colors cursor-pointer"
                      >
                        <FiEye size={14} />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/members/edit/${m._id}`); }}
                        title="Edit Member"
                        className="flex items-center justify-center h-8 w-8 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 transition-colors cursor-pointer"
                      >
                        <FiEdit2 size={14} />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(m._id); }}
                        title="Delete Member"
                        className="flex items-center justify-center h-8 w-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-colors cursor-pointer"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        <DataTable
          columns={columns}
          data={displayedMembers}
          emptyTitle={`No members found`}
          pageSize={15}
          loading={isLoading}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMut.mutate(deleteId)}
        title="Delete Member?"
        message="Are you sure you want to delete this member? All associated attendance and records will be deleted."
        confirmText="Delete Member"
        variant="danger"
      />
    </motion.div>
  );
}
