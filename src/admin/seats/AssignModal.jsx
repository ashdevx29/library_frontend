import React, { useState, useEffect } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import { assignSeat, getMembers, getShifts } from '../../services/seatService';

const AssignModal = ({ seatId, onClose, onDone }) => {
  const [members, setMembers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getMembers(), getShifts()]).then(([m, s]) => {
      setMembers(m);
      setShifts(s.filter(sh => sh.status === 'Active'));
    }).catch(() => {});
  }, []);

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.fullName || '').toLowerCase().includes(q) || (m.mobile || '').includes(q);
  });

  const onAssign = async () => {
    if (!selectedMember || !selectedShift) { setError('Select a member and shift'); return; }
    setLoading(true);
    setError('');
    try {
      await assignSeat(seatId, selectedMember, selectedShift);
      onDone();
    } catch (e) {
      setError(e.response?.data?.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 text-slate-900 p-6 shadow-2xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assign Member to Seat</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700"><FiX /></button>
        </div>

        {error && <div className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Select Shift</label>
          <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <option value="">Choose shift...</option>
            {shifts.map((s) => <option key={s._id} value={s._id}>{s.shiftName} ({s.startTime} - {s.endTime})</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Select Member</label>
          <div className="relative mb-2">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or mobile..." className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          </div>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
            {!filtered.length && <p className="py-4 text-center text-xs text-slate-400">No members found</p>}
            {filtered.map((m) => (
              <button
                key={m._id}
                onClick={() => setSelectedMember(m._id)}
                className={`flex w-full items-center gap-3 rounded-xl p-2 text-left text-sm transition ${selectedMember === m._id ? 'bg-orange-100 ring-2 ring-orange-400 dark:bg-orange-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <img className="h-8 w-8 rounded-full bg-orange-100 object-cover" src={`https://ui-avatars.com/api/?background=FFF0E6&color=FF6B00&name=${encodeURIComponent(m.fullName)}`} alt="" />
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{m.fullName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{m.mobile}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onAssign} disabled={loading} className="rounded-xl bg-[var(--button)] px-5 py-2.5 font-semibold text-white disabled:opacity-60">
            {loading ? 'Assigning...' : 'Assign Seat'}
          </button>
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AssignModal;
