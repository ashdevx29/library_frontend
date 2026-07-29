import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSave, FiUser } from 'react-icons/fi';
import { memberSchema } from '../../validations/member';
import { useCreateMember, useShifts, useSeats } from '../../hooks/useApi';
import { PLAN_TYPES } from '../../constants';
import { PageHeader, FormField, inputClass, btnPrimary, btnSecondary } from '../../components/ui/index';

export default function AddMember() {
  const navigate = useNavigate();
  const { data: shifts = [] } = useShifts();
  const { data: seatsData } = useSeats({ status: 'Available' });
  const seats = seatsData?.seats || seatsData || [];
  const createMut = useCreateMember();

  const { register, handleSubmit, formState: { errors }, watch } = useForm({ resolver: zodResolver(memberSchema), defaultValues: { membershipPlan: 'Monthly', joiningDate: new Date().toISOString().split('T')[0] } });

  const onSubmit = async (formData) => {
    try {
      await createMut.mutateAsync(formData);
      navigate('/admin/members');
    } catch (e) {}
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <PageHeader icon={FiUser} title="Add Member" subtitle="Register a new library member" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        {/* Personal Info */}
        <div>
          <h3 className="mb-3 text-sm font-bold text-[var(--text-primary)]">Personal Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Full Name" error={errors.fullName?.message} required>
              <input {...register('fullName')} className={inputClass} placeholder="Enter full name" />
            </FormField>
            <FormField label="Mobile" error={errors.mobile?.message} required>
              <input {...register('mobile')} className={inputClass} placeholder="10-digit mobile number" maxLength={10} />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" className={inputClass} placeholder="email@example.com" />
            </FormField>
            <FormField label="Address">
              <input {...register('address')} className={inputClass} placeholder="Address" />
            </FormField>
            <FormField label="Aadhaar Number">
              <input {...register('aadhaarNumber')} className={inputClass} placeholder="12-digit Aadhaar (optional)" maxLength={12} />
            </FormField>
          </div>
        </div>

        {/* Auth */}
        <div>
          <h3 className="mb-3 text-sm font-bold text-[var(--text-primary)]">Login Credentials</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Password" error={errors.password?.message} required>
              <input {...register('password')} type="password" className={inputClass} placeholder="Min 6 characters" />
            </FormField>
            <FormField label="Confirm Password" error={errors.confirmPassword?.message}>
              <input {...register('confirmPassword')} type="password" className={inputClass} placeholder="Repeat password" />
            </FormField>
          </div>
        </div>

        {/* Seat & Shift */}
        <div>
          <h3 className="mb-3 text-sm font-bold text-[var(--text-primary)]">Seat & Shift</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Shift" error={errors.shiftId?.message} required>
              <select {...register('shiftId')} className={inputClass}>
                <option value="">Select shift</option>
                {shifts.map(s => <option key={s._id} value={s._id}>{s.shiftName} ({s.startTime} - {s.endTime})</option>)}
              </select>
            </FormField>
            <FormField label="Seat" error={errors.seatId?.message} required>
              <select {...register('seatId')} className={inputClass}>
                <option value="">Select seat</option>
                {seats.map(s => <option key={s._id} value={s._id}>{s.seatNumber} - Floor {s.floor} ({s.seatType})</option>)}
              </select>
            </FormField>
          </div>
        </div>

        {/* Membership */}
        <div>
          <h3 className="mb-3 text-sm font-bold text-[var(--text-primary)]">Membership</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Joining Date" error={errors.joiningDate?.message} required>
              <input {...register('joiningDate')} type="date" className={inputClass} />
            </FormField>
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
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-4">
          <button type="button" onClick={() => navigate(-1)} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={createMut.isPending} className={btnPrimary}>
            {createMut.isPending ? 'Creating...' : <><FiSave size={14} /> Create Member</>}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
