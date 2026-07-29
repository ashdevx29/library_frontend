import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createShift, getShift, updateShift } from '../../services/shiftService';

const ShiftForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { status: 'Active' },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const shift = await getShift(id);
        reset({
          shiftName: shift.shiftName,
          shiftCode: shift.shiftCode,
          startTime: shift.startTime,
          endTime: shift.endTime,
          description: shift.description || '',
          status: shift.status,
        });
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load shift');
      }
    })();
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      if (isEdit) await updateShift(id, data);
      else await createShift(data);
      navigate('/admin/shifts');
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const field = 'w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-400';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Edit Shift' : 'Add Shift'}</h1>
        <p className="text-sm text-slate-500">Define shift timing and status</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Shift Name</label>
            <select {...register('shiftName', { required: 'Required' })} className={field}>
              <option value="">Select shift</option>
              {['Morning', 'Afternoon', 'Evening', 'Night'].map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {errors.shiftName && <p className="mt-1 text-xs text-red-500">{errors.shiftName.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Shift Code</label>
            <input {...register('shiftCode', { required: 'Required' })} className={field} placeholder="MOR" />
            {errors.shiftCode && <p className="mt-1 text-xs text-red-500">{errors.shiftCode.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Start Time</label>
            <input type="time" {...register('startTime', { required: 'Required' })} className={field} />
            {errors.startTime && <p className="mt-1 text-xs text-red-500">{errors.startTime.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">End Time</label>
            <input type="time" {...register('endTime', { required: 'Required' })} className={field} />
            {errors.endTime && <p className="mt-1 text-xs text-red-500">{errors.endTime.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea {...register('description')} rows={3} className={field} placeholder="Optional notes" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select {...register('status')} className={field}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="rounded-xl bg-[var(--button)] px-5 py-2.5 font-semibold text-white disabled:opacity-60">
            {loading ? 'Saving...' : isEdit ? 'Update Shift' : 'Create Shift'}
          </button>
          <Link to="/admin/shifts" className="rounded-xl border px-5 py-2.5 font-medium text-slate-600">Cancel</Link>
        </div>
      </form>
    </div>
  );
};

export default ShiftForm;
