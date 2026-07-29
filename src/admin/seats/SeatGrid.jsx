import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FiPlus, FiGrid, FiList, FiEye, FiEdit2, FiTrash2, FiSearch, FiFilter, FiUsers } from 'react-icons/fi';
import { getSeats, getSeatGrid, deleteSeat, updateSeatStatus } from '../../services/seatService';

const STATUS_STYLE = {
  Available: 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600',
  Occupied: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600',
  Reserved: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600',
  Maintenance: 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600',
  Inactive: 'border-gray-300 bg-gray-100 dark:bg-gray-800/40 dark:border-gray-600',
};

const STATUS_DOT = {
  Available: 'bg-green-500',
  Occupied: 'bg-blue-500',
  Reserved: 'bg-yellow-500',
  Maintenance: 'bg-red-500',
  Inactive: 'bg-gray-400',
};

const STATUS_TEXT = {
  Available: 'text-green-700 dark:text-green-300',
  Occupied: 'text-blue-700 dark:text-blue-300',
  Reserved: 'text-yellow-700 dark:text-yellow-300',
  Maintenance: 'text-red-700 dark:text-red-300',
  Inactive: 'text-gray-500 dark:text-gray-400',
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SeatGrid = () => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState('All');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setSeats(await getSeatGrid());
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load seats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.emit('seat:subscribe');
    socket.on('seat:updated', (seat) => {
      setSeats((prev) => {
        const idx = prev.findIndex((s) => s._id === seat._id);
        if (idx === -1) return [...prev, seat];
        const next = [...prev];
        next[idx] = seat;
        return next;
      });
    });
    socket.on('seat:deleted', ({ id }) => {
      setSeats((prev) => prev.filter((s) => s._id !== id));
    });
    return () => socket.disconnect();
  }, []);

  const floors = ['All', ...new Set(seats.map((s) => s.floor))].sort();

  const filtered = seats.filter((s) => {
    if (filter !== 'All' && s.status !== filter) return false;
    if (floorFilter !== 'All' && s.floor !== floorFilter) return false;
    if (search && !s.seatNumber.toLowerCase().includes(search.toLowerCase()) &&
        !(s.currentOccupant?.fullName || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce((acc, seat) => {
    const key = `${seat.floor} - Section ${seat.section}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(seat);
    return acc;
  }, {});

  const onDelete = async (id) => {
    if (!confirm('Delete this seat?')) return;
    try {
      await deleteSeat(id);
      setSeats((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Seat Grid</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Visual floor plan with real-time occupancy</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search seat or member..."
              className="rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            {floors.map((f) => <option key={f} value={f}>{f === 'All' ? 'All Floors' : `Floor ${f}`}</option>)}
          </select>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            {['All', 'Available', 'Occupied', 'Reserved', 'Maintenance', 'Inactive'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <Link to="/admin/seats" className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <FiList /> List
          </Link>
          <Link to="/admin/seats/add" className="inline-flex items-center gap-2 rounded-xl bg-[var(--button)] px-4 py-2.5 font-semibold text-white">
            <FiPlus /> Add Seat
          </Link>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-semibold">
        {Object.entries(STATUS_DOT).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {status}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="py-16 text-center text-slate-400">No seats found</div>
      ) : (
        Object.entries(grouped).map(([group, groupSeats]) => (
          <div key={group}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {group} ({groupSeats.length})
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {groupSeats.map((seat) => (
                <article
                  key={seat._id}
                  onClick={() => navigate(`/admin/seats/view/${seat._id}`)}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition hover:shadow-lg hover:-translate-y-0.5 ${STATUS_STYLE[seat.status] || ''}`}
                >
                  <div className="flex items-start justify-between">
                    <b className="text-lg text-slate-800 dark:text-white">{seat.seatNumber}</b>
                    <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[seat.status]}`} />
                  </div>
                  <p className={`mt-1 text-xs font-semibold uppercase ${STATUS_TEXT[seat.status]}`}>{seat.status}</p>
                  {seat.seatType && <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{seat.seatType}</p>}
                  {seat.currentOccupant && (
                    <p className="mt-2 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                      <FiUsers className="mr-1 inline h-3 w-3" />{seat.currentOccupant.fullName}
                    </p>
                  )}
                  {seat.currentShift && (
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{seat.currentShift.shiftName}</p>
                  )}
                  <div className="mt-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/admin/seats/view/${seat._id}`)} className="rounded-lg bg-white/70 p-1.5 dark:bg-slate-700/70"><FiEye size={14} /></button>
                    <button onClick={() => navigate(`/admin/seats/edit/${seat._id}`)} className="rounded-lg bg-white/70 p-1.5 dark:bg-slate-700/70"><FiEdit2 size={14} /></button>
                    <button onClick={() => onDelete(seat._id)} className="rounded-lg bg-white/70 p-1.5 text-red-500 dark:bg-slate-700/70"><FiTrash2 size={14} /></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SeatGrid;
