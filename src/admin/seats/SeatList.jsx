import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { FiPlus, FiGrid, FiList, FiEye, FiEdit2, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getSeats, deleteSeat, updateSeatStatus } from '../../services/seatService';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const STATUS_BADGE = {
  Available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Occupied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Reserved: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Maintenance: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Inactive: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

import { SOCKET_URL } from '../../utils/config';
const PER_PAGE = 10;

const SeatList = () => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [floorFilter, setFloorFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('seatNumber');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { setSeats(await getSeats()); }
    catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.emit('seat:subscribe');
    socket.on('seat:updated', (seat) => {
      setSeats((prev) => {
        const idx = prev.findIndex((s) => s._id === seat._id);
        if (idx === -1) return [...prev, seat];
        const next = [...prev]; next[idx] = seat; return next;
      });
    });
    socket.on('seat:deleted', ({ id }) => setSeats((prev) => prev.filter((s) => s._id !== id)));
    return () => socket.disconnect();
  }, []);

  const floors = ['All', ...new Set(seats.map((s) => s.floor))].sort();
  const sections = ['All', ...new Set(seats.map((s) => s.section))].sort();

  const filtered = seats.filter((s) => {
    if (filter !== 'All' && s.status !== filter) return false;
    if (floorFilter !== 'All' && s.floor !== floorFilter) return false;
    if (sectionFilter !== 'All' && s.section !== sectionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.seatNumber.toLowerCase().includes(q) &&
          !(s.currentOccupant?.fullName || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    let va = a[sortKey] || '', vb = b[sortKey] || '';
    if (sortKey === 'createdAt') { va = new Date(va); vb = new Date(vb); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const onDelete = (id) => setConfirmId(id);

  const doDelete = async () => {
    try { await deleteSeat(confirmId); setSeats((prev) => prev.filter((s) => s._id !== confirmId)); toast.success('Seat deleted'); }
    catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
    finally { setConfirmId(null); }
  };

  const onStatus = async (id, status) => {
    try { const updated = await updateSeatStatus(id, status); setSeats((prev) => prev.map((s) => (s._id === id ? updated : s))); toast.success('Status updated'); }
    catch (e) { toast.error(e.response?.data?.message || 'Status update failed'); }
  };

  const SortHeader = ({ label, field }) => (
    <th className="cursor-pointer select-none px-4 py-3" onClick={() => toggleSort(field)}>
      <span className="flex items-center gap-1">{label} <span className={`text-[10px] ${sortKey === field ? 'text-orange-500' : 'opacity-30'}`}>{sortDir === 'asc' ? '▲' : '▼'}</span></span>
    </th>
  );

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Seat List</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} seats · {filtered.filter(s => s.status === 'Occupied').length} occupied</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." className="rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
          <select value={floorFilter} onChange={(e) => { setFloorFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            {floors.map(f => <option key={f} value={f}>{f === 'All' ? 'All Floors' : `Floor ${f}`}</option>)}
          </select>
          <select value={sectionFilter} onChange={(e) => { setSectionFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            {sections.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sections' : `Section ${s}`}</option>)}
          </select>
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            {['All', 'Available', 'Occupied', 'Reserved', 'Maintenance', 'Inactive'].map(s => <option key={s}>{s}</option>)}
          </select>
          <Link to="/admin/seats" className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"><FiGrid /> Grid</Link>
          <Link to="/admin/seats/add" className="inline-flex items-center gap-2 rounded-xl bg-[var(--button)] px-4 py-2.5 font-semibold text-white"><FiPlus /> Add Seat</Link>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm dark:bg-slate-800">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-700 dark:text-slate-400">
            <tr>
              <SortHeader label="Seat No" field="seatNumber" />
              <SortHeader label="Floor" field="floor" />
              <SortHeader label="Section" field="section" />
              <th className="px-4 py-3">Shift</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Occupied</th>
              <SortHeader label="Created" field="createdAt" />
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
            ) : !paged.length ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400">No seats found</td></tr>
            ) : paged.map((s) => (
              <tr key={s._id} className="border-b last:border-0 hover:bg-orange-50/40 dark:border-slate-700 dark:hover:bg-slate-700/40">
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{s.seatNumber}</td>
                <td className="px-4 py-3 dark:text-slate-300">{s.floor}</td>
                <td className="px-4 py-3 dark:text-slate-300">{s.section}</td>
                <td className="px-4 py-3 dark:text-slate-300">{s.currentShift?.shiftName || '—'}</td>
                <td className="px-4 py-3 dark:text-slate-300">{s.currentOccupant?.fullName || '—'}</td>
                <td className="px-4 py-3 text-xs dark:text-slate-300">{s.seatType || 'Standard'}</td>
                <td className="px-4 py-3">
                  <select value={s.status} onChange={(e) => onStatus(s._id, e.target.value)} className={`rounded-full border-0 px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[s.status]}`}>
                    {['Available', 'Occupied', 'Reserved', 'Maintenance', 'Inactive'].map(st => <option key={st}>{st}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(s.updatedAt)}</td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(s.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => navigate(`/admin/seats/view/${s._id}`)} className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"><FiEye size={14} /></button>
                    <button onClick={() => navigate(`/admin/seats/edit/${s._id}`)} className="rounded-lg p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"><FiEdit2 size={14} /></button>
                    <button onClick={() => onDelete(s._id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><FiTrash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border p-2 disabled:opacity-40 dark:border-slate-700 dark:text-white"><FiChevronLeft /></button>
          <span className="text-sm text-slate-600 dark:text-slate-300">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border p-2 disabled:opacity-40 dark:border-slate-700 dark:text-white"><FiChevronRight /></button>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={doDelete}
        title="Delete Seat"
        message="Are you sure you want to delete this seat? This action cannot be undone."
        confirmText="Delete Seat"
        variant="danger"
      />
    </div>
  );
};

export default SeatList;
