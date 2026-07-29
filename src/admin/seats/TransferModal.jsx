import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiArrowRight } from 'react-icons/fi';
import { transferSeat, getSeats, getShifts } from '../../services/seatService';

const TransferModal = ({ seat, onClose, onDone }) => {
  const [allSeats, setAllSeats] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [targetSeat, setTargetSeat] = useState('');
  const [selectedShift, setSelectedShift] = useState(seat.currentShift?._id || '');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getSeats(), getShifts()]).then(([s, sh]) => {
      setAllSeats(s.filter(x => x.status === 'Available' && x._id !== seat._id));
      setShifts(sh.filter(x => x.status === 'Active'));
    }).catch(() => {});
  }, [seat._id]);

  const filtered = allSeats.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.seatNumber.toLowerCase().includes(q) || s.floor.toLowerCase().includes(q);
  });

  const onTransfer = async () => {
    if (!targetSeat || !selectedShift) { setError('Select a target seat and shift'); return; }
    setLoading(true);
    setError('');
    try {
      await transferSeat(seat._id, targetSeat, seat.currentOccupant._id, selectedShift);
      onDone();
    } catch (e) {
      setError(e.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Transfer Seat</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700"><FiX /></button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-700/50">
          <div className="text-center">
            <p className="text-xs text-slate-500">From</p>
            <p className="font-bold text-slate-800 dark:text-white">{seat.seatNumber}</p>
          </div>
          <FiArrowRight className="text-orange-500" />
          <div className="text-center">
            <p className="text-xs text-slate-500">Member</p>
            <p className="font-bold text-slate-800 dark:text-white">{seat.currentOccupant?.fullName}</p>
          </div>
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
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Target Seat (Available Only)</label>
          <div className="relative mb-2">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search available seats..." className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          </div>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
            {!filtered.length && <p className="py-4 text-center text-xs text-slate-400">No available seats</p>}
            {filtered.map((s) => (
              <button
                key={s._id}
                onClick={() => setTargetSeat(s._id)}
                className={`flex w-full items-center gap-3 rounded-xl p-2 text-left text-sm transition ${targetSeat === s._id ? 'bg-green-100 ring-2 ring-green-400 dark:bg-green-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{s.seatNumber}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Floor {s.floor} · {s.section} · {s.seatType || 'Standard'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onTransfer} disabled={loading} className="rounded-xl bg-purple-500 px-5 py-2.5 font-semibold text-white disabled:opacity-60 hover:bg-purple-600">
            {loading ? 'Transferring...' : 'Transfer Seat'}
          </button>
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
