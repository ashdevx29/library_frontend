import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSave, FiEdit2, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { memberEditSchema } from '../../validations/member';
import { useMember, useUpdateMember, useShifts, useSeats } from '../../hooks/useApi';
import { PageHeader, FormField, inputClass, btnPrimary, btnSecondary, PageLoader } from '../../components/ui/index';

export default function EditMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: member, isLoading } = useMember(id);
  const { data: shifts = [] } = useShifts();
  const { data: seatsData } = useSeats();
  const seats = seatsData?.seats || seatsData || [];
  const updateMut = useUpdateMember();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(memberEditSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    }
  });

  useEffect(() => {
    if (member) {
      reset({
        fullName: member.fullName || '',
        mobile: member.mobile || '',
        email: member.email || '',
        address: member.address || '',
        aadhaarNumber: member.aadhaarNumber || '',
        shiftId: member.shiftId?._id || '',
        seatId: member.seatId?._id || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [member, reset]);

  const onSubmit = async (formData) => {
    try {
      const payload = { ...formData };
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
        delete payload.confirmPassword;
      }
      await updateMut.mutateAsync({ id, data: payload });
      navigate('/admin/members');
    } catch (e) {}
  };

  if (isLoading) return <PageLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <PageHeader icon={FiEdit2} title="Edit Member" subtitle={`Editing details for ${member?.fullName}`} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div>
          <h3 className="mb-3 text-sm font-bold text-[var(--text-primary)]">Personal Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Full Name" error={errors.fullName?.message} required>
              <input {...register('fullName')} className={inputClass} placeholder="Full Name" />
            </FormField>
            <FormField label="Mobile" error={errors.mobile?.message} required>
              <input {...register('mobile')} className={inputClass} maxLength={10} placeholder="Mobile Number" />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" className={inputClass} placeholder="Email" />
            </FormField>
            <FormField label="Address">
              <input {...register('address')} className={inputClass} placeholder="Address" />
            </FormField>
            <FormField label="Aadhaar Number">
              <input {...register('aadhaarNumber')} className={inputClass} placeholder="Aadhaar Number" maxLength={12} />
            </FormField>
            <FormField label="Shift" error={errors.shiftId?.message} required>
              <select {...register('shiftId')} className={inputClass}>
                <option value="">Select shift</option>
                {shifts.map(s => <option key={s._id} value={s._id}>{s.shiftName} ({s.startTime} - {s.endTime})</option>)}
              </select>
            </FormField>
            <FormField label="Seat" error={errors.seatId?.message} required className="md:col-span-2">
              <select {...register('seatId')} className={inputClass}>
                <option value="">Select seat</option>
                {seats.map(s => <option key={s._id} value={s._id}>{s.seatNumber} - Floor {s.floor}</option>)}
              </select>
            </FormField>
          </div>
        </div>

        {/* Update Password Option */}
        <div className="border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-2 mb-3">
            <FiLock size={16} className="text-[var(--primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Update Password (Optional)</h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-3">Leave blank if you do not wish to change the student's password.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="New Password" error={errors.password?.message}>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClass} pr-10`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </FormField>

            <FormField label="Confirm New Password" error={errors.confirmPassword?.message}>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`${inputClass} pr-10`}
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-4">
          <button type="button" onClick={() => navigate(-1)} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={updateMut.isPending} className={btnPrimary}>
            {updateMut.isPending ? 'Saving...' : <><FiSave size={14} /> Save Changes</>}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
