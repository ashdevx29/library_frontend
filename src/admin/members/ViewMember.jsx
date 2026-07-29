import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiArrowLeft, FiEdit2, FiRefreshCw, FiMessageCircle, FiUser, FiGrid, FiClock, FiCalendar, FiCheckCircle, FiShield } from 'react-icons/fi';
import { useMember, useRenewMember } from '../../hooks/useApi';
import { renewSchema } from '../../validations/member';
import { PageHeader, StatusBadge, TabBar, FormField, inputClass, btnPrimary, btnSecondary } from '../../components/ui/index';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { formatDate, daysLeft, getInitials, formatCurrency } from '../../utils/helpers';
import { PLAN_TYPES, PAYMENT_METHODS } from '../../constants';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FiUser },
  { id: 'attendance', label: 'Attendance', icon: FiClock },
  { id: 'payments', label: 'Payments', icon: FiGrid },
  { id: 'history', label: 'History', icon: FiCalendar },
];

export default function ViewMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: member, isLoading } = useMember(id);
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
  const photo = member.photo || `https://ui-avatars.com/api/?background=FFF0E6&color=FF6B00&name=${encodeURIComponent(member.fullName)}&size=128`;
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
          <button onClick={() => setShowRenew(true)} className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-600"><FiRefreshCw size={14} /> Renew</button>
          <Link to={`/admin/members/card/${id}`} className="flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-600"><FiShield size={14} /> ID Card</Link>
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

          {tab === 'attendance' && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
              <p className="text-sm text-[var(--text-muted)]">Attendance records are available in the Attendance module.</p>
            </div>
          )}

          {tab === 'payments' && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
              <p className="text-sm text-[var(--text-muted)]">Payment history is available in the Payments module.</p>
            </div>
          )}

          {tab === 'history' && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
              <p className="text-sm text-[var(--text-muted)]">Membership history coming soon.</p>
            </div>
          )}
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
