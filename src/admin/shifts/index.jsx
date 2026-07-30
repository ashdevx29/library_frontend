import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getShifts, deleteShift } from '../../services/shiftService';

const ShiftsList = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setShifts(await getShifts());
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id) => {
    if (!confirm('Delete this shift?')) return;
    try {
      await deleteShift(id);
      setShifts((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Shift Management</h1>
          <p className="text-sm text-slate-500">Morning, Afternoon, Evening, Full Day defaults + custom shifts</p>
        </div>
        <Link
          to="/admin/shifts/add"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--button)] px-4 py-2.5 font-semibold text-white"
        >
          <FiPlus /> Add Shift
        </Link>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {['Name', 'Code', 'Start', 'End', 'Description', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
            ) : !shifts.length ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No shifts found</td></tr>
            ) : shifts.map((s) => (
              <tr key={s._id} className="border-b last:border-0 hover:bg-orange-50/40">
                <td className="px-4 py-3 font-semibold">{s.shiftName}</td>
                <td className="px-4 py-3">{s.shiftCode}</td>
                <td className="px-4 py-3">{s.startTime}</td>
                <td className="px-4 py-3">{s.endTime}</td>
                <td className="px-4 py-3 text-slate-500">{s.description || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/admin/shifts/edit/${s._id}`)} className="rounded-lg p-2 text-orange-600 hover:bg-orange-50">
                      <FiEdit2 />
                    </button>
                    <button onClick={() => onDelete(s._id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShiftsList;
