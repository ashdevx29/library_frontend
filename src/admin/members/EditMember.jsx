import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSave, FiEdit2 } from 'react-icons/fi';
import { memberEditSchema } from '../../validations/member';
import { useMember, useUpdateMember, useShifts, useSeats } from '../../hooks/useApi';
import { PageHeader, FormField, inputClass, btnPrimary, btnSecondary, PageLoader } from '../../components/ui/index';

export default function EditMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: member, isLoading } = useMember(id);
  const { data: shifts = [] } = useShifts();
  const { data: seatsData } = useSeats();
  const seats = seatsData?.seats || seatsData || [];
  const updateMut = useUpdateMember();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({ resolver: zodResolver(memberEditSchema) });

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
      });
    }
  }, [member, reset]);

  const onSubmit = async (formData) => {
    try {
      await updateMut.mutateAsync({ id, data: formData });
      navigate('/admin/members');
    } catch (e) {}
  };

  if (isLoading) return <PageLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <PageHeader icon={FiEdit2} title="Edit Member" subtitle={`Editing ${member?.fullName}`} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Full Name" error={errors.fullName?.message} required>
            <input {...register('fullName')} className={inputClass} />
          </FormField>
          <FormField label="Mobile" error={errors.mobile?.message} required>
            <input {...register('mobile')} className={inputClass} maxLength={10} />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" className={inputClass} />
          </FormField>
          <FormField label="Address">
            <input {...register('address')} className={inputClass} />
          </FormField>
          <FormField label="Aadhaar Number">
            <input {...register('aadhaarNumber')} className={inputClass} />
          </FormField>
          <FormField label="Shift" error={errors.shiftId?.message} required>
            <select {...register('shiftId')} className={inputClass}>
              <option value="">Select shift</option>
              {shifts.map(s => <option key={s._id} value={s._id}>{s.shiftName} ({s.startTime} - {s.endTime})</option>)}
            </select>
          </FormField>
          <FormField label="Seat" error={errors.seatId?.message} required>
            <select {...register('seatId')} className={inputClass}>
              <option value="">Select seat</option>
              {seats.map(s => <option key={s._id} value={s._id}>{s.seatNumber} - Floor {s.floor}</option>)}
            </select>
          </FormField>
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
