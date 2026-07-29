import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createSeat, getSeat, updateSeat, getShifts } from '../../services/seatService';

const SeatForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { status: 'Available', seatType: 'Standard', floor: '1', section: 'A' },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    getShifts().then(setShifts).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const seat = await getSeat(id);
        reset({
          seatNumber: seat.seatNumber,
          floor: seat.floor,
          section: seat.section,
          seatType: seat.seatType || 'Standard',
          description: seat.description || '',
          currentShift: seat.currentShift?._id || '',
          status: seat.status,
        });
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load seat');
      }
    })();
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      if (isEdit) await updateSeat(id, data);
      else await createSeat(data);
      navigate('/admin/seats');
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const field = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
  const label = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{isEdit ? 'Edit Seat' : 'Add Seat'}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure seat details, type and status</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label}>Seat Number</label>
            <input {...register('seatNumber', { required: 'Required' })} className={field} placeholder="A-01" />
            {errors.seatNumber && <p className="mt-1 text-xs text-red-500">{errors.seatNumber.message}</p>}
          </div>
          <div>
            <label className={label}>Floor</label>
            <select {...register('floor', { required: 'Required' })} className={field}>
              {['Ground', '1', '2', '3', '4', '5'].map(f => <option key={f} value={f}>Floor {f}</option>)}
            </select>
            {errors.floor && <p className="mt-1 text-xs text-red-500">{errors.floor.message}</p>}
          </div>
          <div>
            <label className={label}>Section</label>
            <select {...register('section', { required: 'Required' })} className={field}>
              {['A', 'B', 'C', 'D', 'E', 'Silent Zone', 'Reading Zone', 'Premium Zone'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.section && <p className="mt-1 text-xs text-red-500">{errors.section.message}</p>}
          </div>
          <div>
            <label className={label}>Seat Type</label>
            <select {...register('seatType')} className={field}>
              {['Standard', 'Premium', 'Silent Zone', 'Reading Zone', 'Computer Desk'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Default Shift</label>
            <select {...register('currentShift')} className={field}>
              <option value="">None</option>
              {shifts.filter(s => s.status === 'Active').map(s => (
                <option key={s._id} value={s._id}>{s.shiftName} ({s.startTime} - {s.endTime})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Status</label>
            <select {...register('status')} className={field}>
              {['Available', 'Reserved', 'Maintenance', 'Inactive'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Description</label>
          <textarea {...register('description')} rows={3} className={field} placeholder="Optional notes about this seat..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="rounded-xl bg-[var(--button)] px-5 py-2.5 font-semibold text-white disabled:opacity-60">
            {loading ? 'Saving...' : isEdit ? 'Update Seat' : 'Create Seat'}
          </button>
          <Link to="/admin/seats" className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</Link>
        </div>
      </form>
    </div>
  );
};

export default SeatForm;
