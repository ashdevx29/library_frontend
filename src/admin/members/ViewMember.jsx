import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiArrowLeft, FiEdit2, FiRefreshCw, FiMessageCircle, FiUser, FiGrid, FiClock, FiCalendar, FiCheckCircle, FiShield, FiChevronLeft, FiChevronRight, FiDollarSign, FiXCircle, FiSearch, FiDownload, FiFileText, FiX } from 'react-icons/fi';
import { useMember, useRenewMember, useMemberAttendance, useMemberPayments } from '../../hooks/useApi';
import { renewSchema } from '../../validations/member';
import { PageHeader, StatusBadge, TabBar, FormField, inputClass, btnPrimary, btnSecondary } from '../../components/ui/index';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { formatDate, daysLeft, getInitials, formatCurrency } from '../../utils/helpers';
import { PLAN_TYPES, PAYMENT_METHODS } from '../../constants';
import { getPhotoUrl } from '../../utils/image';
import { approveRenewal, rejectRenewal } from '../../services/paymentService';
import { exportToCSV, exportToPDF } from '../../utils/exportHelpers';
import toast from 'react-hot-toast';

export default function ViewMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: member, isLoading, refetch: refetchMember } = useMember(id);
  const renewMut = useRenewMember();
  const [tab, setTab] = useState('overview');
  const [showRenew, setShowRenew] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({ resolver: zodResolver(renewSchema), defaultValues: { membershipPlan: 'Monthly', paymentMethod: 'Cash' } });

  const onRenew = async (formData) => {
    try {
      await renewMut.mutateAsync({ id, data: formData });
      setShowRenew(false);
      reset();
    } catch (e) {}
  };

  if (isLoading) return <PageLoader />;
  if (!member) return null;

  const d = daysLeft(member.membershipExpiryDate);
  const photo = getPhotoUrl(member.photo, member.fullName);
  const selectedPlan = PLAN_TYPES.find(p => p.value === watch('membershipPlan'));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 hover:bg-[var(--bg-hover)]"><FiArrowLeft size={16} /></button>
          <img src={photo} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-[var(--primary)]/20" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{member.fullName}</h1>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span>{member.mobile}</span><span>·</span><StatusBadge status={member.status} />
              <span className={`ml-2 text-xs font-semibold ${d <= 0 ? 'text-red-500' : d <= 7 ? 'text-yellow-500' : 'text-green-500'}`}>{d > 0 ? `${d} days left` : 'Expired'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/members/edit/${id}`} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90"><FiEdit2 size={14} /> Edit</Link>
          <a href={`https://wa.me/${member.mobile}?text=Hello%20${encodeURIComponent(member.fullName)}%2C%20Your%20library%20membership%20expires%20in%20${d}%20days.`} target="_blank" rel="noopener" className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-700"><FiMessageCircle size={14} /> WhatsApp</a>
        </div>
      </div>

      {/* Tabs */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>

          {tab === 'overview' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Name', value: member.fullName, icon: FiUser },
                { label: 'Mobile', value: member.mobile, icon: FiGrid },
                { label: 'Email', value: member.email || '-', icon: FiGrid },
                { label: 'Address', value: member.address || '-', icon: FiGrid },
                { label: 'Aadhaar', value: member.aadhaarNumber || '-', icon: FiGrid },
                { label: 'Seat', value: member.seatId?.seatNumber || '-', icon: FiGrid },
                { label: 'Shift', value: member.shiftId ? `${member.shiftId.shiftName} (${member.shiftId.startTime}-${member.shiftId.endTime})` : '-', icon: FiClock },
                { label: 'Plan', value: member.membershipPlan || '-', icon: FiCalendar },
                { label: 'Joining Date', value: formatDate(member.joiningDate), icon: FiCalendar },
                { label: 'Expiry Date', value: formatDate(member.membershipExpiryDate), icon: FiCalendar },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
                  <div className="rounded-lg bg-[var(--primary)]/10 p-2"><item.icon size={14} className="text-[var(--primary)]" /></div>
                  <div>
                    <p className="text-[10px] font-medium text-[var(--text-muted)]">{item.label}</p>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'attendance' && <MemberAttendanceTab memberId={id} />}

          {tab === 'payments' && <MemberFeesHistoryTab memberId={id} memberName={member.fullName} refetchMember={refetchMember} />}
        </motion.div>
      </AnimatePresence>

      {/* Renew Modal */}
      <Modal isOpen={showRenew} onClose={() => setShowRenew(false)} title="Renew Membership">
        <form onSubmit={handleSubmit(onRenew)} className="space-y-4">
          <FormField label="Plan Type" error={errors.membershipPlan?.message} required>
            <div className="grid grid-cols-2 gap-2">
              {PLAN_TYPES.map(p => (
                <label key={p.value} className={`flex cursor-pointer items-center justify-center rounded-xl border-2 p-3 text-xs font-semibold transition-all ${watch('membershipPlan') === p.value ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50'}`}>
                  <input type="radio" {...register('membershipPlan')} value={p.value} className="hidden" />
                  <div className="text-center"><div>{p.label}</div><div className="text-[10px] text-[var(--text-muted)]">{p.days} days</div></div>
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="Amount" error={errors.amount?.message} required>
            <input {...register('amount')} type="number" className={inputClass} placeholder="Enter amount" />
          </FormField>
          <FormField label="Payment Method" error={errors.paymentMethod?.message} required>
            <select {...register('paymentMethod')} className={inputClass}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormField>
          {selectedPlan && (
            <div className="rounded-xl bg-green-50 p-3 dark:bg-green-900/10">
              <p className="text-xs text-green-700 dark:text-green-400">New expiry: {formatDate(new Date(Date.now() + selectedPlan.days * 86400000).toISOString())}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowRenew(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={renewMut.isPending} className={btnPrimary}>
              {renewMut.isPending ? 'Renewing...' : <><FiRefreshCw size={14} /> Renew</>}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: FiUser },
  { id: 'attendance', label: 'Attendance', icon: FiClock },
  { id: 'payments', label: 'Fees History', icon: FiDollarSign },
];

function MemberAttendanceTab({ memberId }) {
  const { data, isLoading } = useMemberAttendance(memberId);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  if (isLoading) return <div className="py-8 text-center text-[var(--text-muted)]">Loading attendance...</div>;

  const records = data?.records || [];
  const total = records.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginated = records.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-6">
      <div className="grid grid-cols-3 gap-3 rounded-xl bg-[var(--bg)] p-3 text-center">
        <div>
          <span className="text-[11px] font-medium text-[var(--text-muted)] block">Present Days</span>
          <b className="text-lg font-bold text-green-600 dark:text-green-400">{data?.present || 0}</b>
        </div>
        <div>
          <span className="text-[11px] font-medium text-[var(--text-muted)] block">Absent Days</span>
          <b className="text-lg font-bold text-red-600 dark:text-red-400">{data?.absent || 0}</b>
        </div>
        <div>
          <span className="text-[11px] font-medium text-[var(--text-muted)] block">Monthly %</span>
          <b className="text-lg font-bold text-[var(--primary)]">{data?.percentage || 0}%</b>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-xs text-[var(--text-primary)]">
          <thead className="bg-[var(--bg-hover)] text-[11px] font-bold uppercase text-[var(--text-muted)] border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Check-In</th>
              <th className="px-4 py-3">Check-Out</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {!paginated.length ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[var(--text-muted)]">No attendance records found for this month</td>
              </tr>
            ) : (
              paginated.map((r) => {
                const isUpcoming = r.isUpcoming || r.status === '—';
                const isAbsent = !isUpcoming && (r.isAbsent || r.status === 'Absent');
                const isCompleted = !isUpcoming && !isAbsent && !!r.checkOutTime;
                const isActive = !isUpcoming && !isAbsent && r.checkInTime && !r.checkOutTime;

                let badgeText = '—';
                let badgeStyle = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
                if (isCompleted || r.status === 'Present') {
                  badgeText = 'Present';
                  badgeStyle = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                } else if (isActive) {
                  badgeText = 'Active In Library';
                  badgeStyle = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
                } else if (isAbsent) {
                  badgeText = 'Absent';
                  badgeStyle = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                }

                return (
                  <tr key={r._id || r.date} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400 whitespace-nowrap">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-3 font-medium text-red-600 dark:text-red-400 whitespace-nowrap">{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : isActive ? 'Active' : '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${badgeStyle}`}>{badgeText}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[var(--text-muted)]">
          <span>Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, total)} of {total} records</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-40"><FiChevronLeft size={14} /></button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-40"><FiChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberFeesHistoryTab({ memberId, memberName, refetchMember }) {
  const { data: rawPayments = [], isLoading, refetch } = useMemberPayments(memberId);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const handleApprove = async (renewalId) => {
    try {
      setSubmitting(true);
      await approveRenewal(renewalId);
      toast.success('Fee/Renewal approved successfully');
      refetch();
      if (refetchMember) refetchMember();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Approval failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    try {
      setSubmitting(true);
      await rejectRenewal(rejectingId, rejectionReason);
      toast.success('Fee/Renewal rejected');
      setRejectingId(null);
      setRejectionReason('');
      refetch();
      if (refetchMember) refetchMember();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Rejection failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to calculate Month / Period fallback
  const getMonthPeriod = (p) => {
    if (p?.billingPeriod && p.billingPeriod !== '—') return p.billingPeriod;
    if (p?.fromMonth && p?.toMonth) {
      return p.fromMonth === p.toMonth ? p.fromMonth : `${p.fromMonth} - ${p.toMonth}`;
    }
    const d = p?.paymentDate ? new Date(p.paymentDate) : p?.createdAt ? new Date(p.createdAt) : new Date();
    const m1 = d.toLocaleDateString('en-IN', { month: 'short' });
    const y1 = d.getFullYear();

    const end = new Date(d);
    end.setMonth(end.getMonth() + 1);
    const m2 = end.toLocaleDateString('en-IN', { month: 'short' });
    const y2 = end.getFullYear();

    return y1 === y2 ? `${m1} - ${m2} ${y1}` : `${m1} ${y1} - ${m2} ${y2}`;
  };

  // Process data with computed billing periods
  const formattedData = useMemo(() => {
    return rawPayments.map(p => ({
      ...p,
      computedPeriod: getMonthPeriod(p),
      formattedDate: formatDate(p.paymentDate || p.createdAt),
    }));
  }, [rawPayments]);

  // Filter records by Search & Date-to-Date
  const filteredRecords = useMemo(() => {
    return formattedData.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      const itemDate = item.paymentDate ? new Date(item.paymentDate) : new Date(item.createdAt);

      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        if (itemDate < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        if (itemDate > e) return false;
      }

      if (!q) return true;

      const plan = (item.planType || '').toLowerCase();
      const method = (item.paymentMethod || '').toLowerCase();
      const status = (item.status || '').toLowerCase();
      const amountStr = String(item.amount || '');
      const period = (item.computedPeriod || '').toLowerCase();
      const student = (item.studentName || memberName || '').toLowerCase();

      return plan.includes(q) || method.includes(q) || status.includes(q) || amountStr.includes(q) || period.includes(q) || student.includes(q);
    });
  }, [formattedData, searchTerm, startDate, endDate, memberName]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  const totalRecords = filteredRecords.length;
  const totalPages = Math.ceil(totalRecords / PAGE_SIZE) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const paginatedRecords = filteredRecords.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  // Export handlers
  const handleExportCSV = () => {
    const columns = [
      { header: 'Date', key: 'formattedDate' },
      { header: 'Student Name', key: 'studentName' },
      { header: 'Month / Period', key: 'computedPeriod' },
      { header: 'Plan / Type', key: 'planType' },
      { header: 'Amount', key: 'amount' },
      { header: 'Payment Method', key: 'paymentMethod' },
      { header: 'Status', key: 'status' }
    ];
    const exportData = filteredRecords.map(r => ({
      ...r,
      studentName: r.studentName || memberName
    }));
    exportToCSV(`${memberName.replace(/\s+/g, '_')}_Fees_History`, columns, exportData);
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Date', key: 'formattedDate' },
      { header: 'Month / Period', key: 'computedPeriod' },
      { header: 'Plan / Type', key: 'planType' },
      { header: 'Amount', key: 'amount' },
      { header: 'Payment Method', key: 'paymentMethod' },
      { header: 'Status', key: 'status' }
    ];
    exportToPDF(`Fees History - ${memberName}`, columns, filteredRecords);
  };

  if (isLoading) return <div className="py-8 text-center text-[var(--text-muted)]">Loading fees history...</div>;

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-6">
      {/* Header & Export Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Payments & Renewals History</h3>
          <p className="text-xs text-[var(--text-muted)]">Track all fee submissions, receipts, and approval statuses</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            <FiFileText size={14} className="text-blue-500" /> Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            <FiDownload size={14} className="text-red-500" /> Export PDF
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search plan, method, status, amount..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Date to Date Picker */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
          />
          <span className="text-xs text-[var(--text-muted)]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
          />
          {(startDate || endDate || searchTerm) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }}
              className="flex items-center gap-1 rounded-xl bg-gray-200 dark:bg-gray-700 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:opacity-80 transition-opacity cursor-pointer"
            >
              <FiX size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-xs text-[var(--text-primary)]">
          <thead className="bg-[var(--bg-hover)] text-[11px] font-bold uppercase text-[var(--text-muted)] border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3">DATE</th>
              <th className="px-4 py-3">MONTH / PERIOD</th>
              <th className="px-4 py-3">PLAN / TYPE</th>
              <th className="px-4 py-3">AMOUNT</th>
              <th className="px-4 py-3">PAYMENT METHOD</th>
              <th className="px-4 py-3">STATUS</th>
              <th className="px-4 py-3 text-right">DETAILS / ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {!paginatedRecords.length ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                  No fees history found for this member
                </td>
              </tr>
            ) : (
              paginatedRecords.map(p => {
                const isPending = p.status === 'Pending';
                const canApproveReject = isPending && p.renewalRequestId;

                return (
                  <tr key={p._id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {p.formattedDate}
                    </td>
                    <td className="px-4 py-3 font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                      {p.computedPeriod}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                      {p.planType || 'Monthly'}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--text-primary)]">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {p.paymentMethod || 'Cash'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {canApproveReject ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(p.renewalRequestId)}
                            disabled={submitting}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1 text-xs font-bold text-white hover:bg-green-600 cursor-pointer disabled:opacity-50"
                          >
                            <FiCheckCircle size={13} /> Approve
                          </button>
                          <button
                            onClick={() => { setRejectingId(p.renewalRequestId); setRejectionReason(''); }}
                            disabled={submitting}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1 text-xs font-bold text-white hover:bg-red-600 cursor-pointer disabled:opacity-50"
                          >
                            <FiXCircle size={13} /> Reject
                          </button>
                        </div>
                      ) : p.status === 'Rejected' || p.status === 'Failed' ? (
                        <div className="text-right">
                          <span className="text-xs font-bold text-red-600 dark:text-red-400">Rejected</span>
                          {p.note && (
                            <p className="text-[10px] text-red-500 dark:text-red-400 truncate max-w-[180px]" title={p.note}>
                              Reason: {p.note}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">Approved / Paid</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalRecords > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[var(--text-muted)]">
          <span>
            Showing {((activePage - 1) * PAGE_SIZE) + 1} to {Math.min(activePage * PAGE_SIZE, totalRecords)} of {totalRecords} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={activePage === 1}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-40"
            >
              Previous
            </button>
            <span>Page {activePage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={activePage >= totalPages}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      <Modal isOpen={!!rejectingId} onClose={() => setRejectingId(null)} title="Reject Fee / Renewal Request">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Please provide a reason for rejecting this fee submission:</p>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason (visible to student)..."
            maxLength={150}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-xs outline-none focus:ring-2 focus:ring-red-400 dark:text-white"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setRejectingId(null)} className={btnSecondary}>Cancel</button>
            <button
              onClick={handleConfirmReject}
              disabled={submitting}
              className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Rejecting...' : 'Reject Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
