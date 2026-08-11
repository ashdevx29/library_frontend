import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiEdit2, FiArrowLeft, FiClock, FiUser, FiGrid, FiMapPin, FiCalendar, FiRepeat, FiX } from 'react-icons/fi';
import { getSeat, getSeatHistory, getSeatUsage } from '../../services/seatService';
import { getPhotoUrl } from '../../utils/image';
import AssignModal from './AssignModal';
import TransferModal from './TransferModal';

const STATUS_BADGE = {
  Available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Occupied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Reserved: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Maintenance: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Inactive: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const ACTION_LABEL = {
  assign: 'Assigned',
  unassign: 'Unassigned',
  transfer: 'Transferred',
  checkin: 'Checked In',
  checkout: 'Checked Out',
  status_change: 'Status Changed',
};

const ViewSeat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seat, setSeat] = useState(null);
  const [usage, setUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, u, h] = await Promise.all([getSeat(id), getSeatUsage(id), getSeatHistory(id)]);
      setSeat(s); setUsage(u); setHistory(h);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load seat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) return <div className="py-16 text-center text-slate-400">Loading seat details...</div>;
  if (error) return <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>;
  if (!seat) return null;

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="text-sm text-slate-500 dark:text-slate-400 w-32">{label}</span>
      <span className="text-sm font-medium text-slate-800 dark:text-white">{value || '—'}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-xl border border-slate-200 p-2 dark:border-slate-700 dark:text-white"><FiArrowLeft /></button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Seat {seat.seatNumber}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Floor {seat.floor} · Section {seat.section}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {seat.status !== 'Occupied' && seat.status !== 'Maintenance' && seat.status !== 'Inactive' && (
            <button onClick={() => setShowAssign(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 font-semibold text-white hover:bg-blue-600">
              <FiUser /> Assign Member
            </button>
          )}
          {seat.status === 'Occupied' && (
            <>
              <button onClick={() => setShowTransfer(true)} className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 font-semibold text-white hover:bg-purple-600">
                <FiRepeat /> Transfer
              </button>
            </>
          )}
          <Link to={`/admin/seats/edit/${seat._id}`} className="inline-flex items-center gap-2 rounded-xl bg-[var(--button)] px-4 py-2.5 font-semibold text-white">
            <FiEdit2 /> Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Seat Info */}
        <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Seat Information</h2>
          <InfoRow icon={FiGrid} label="Seat Number" value={seat.seatNumber} />
          <InfoRow icon={FiMapPin} label="Floor" value={`Floor ${seat.floor}`} />
          <InfoRow icon={FiMapPin} label="Section" value={seat.section} />
          <InfoRow icon={FiGrid} label="Seat Type" value={seat.seatType || 'Standard'} />
          <InfoRow icon={FiClock} label="Shift" value={seat.currentShift?.shiftName || 'None'} />
          <InfoRow icon={FiCalendar} label="Status" value={
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_BADGE[seat.status]}`}>{seat.status}</span>
          } />
          {seat.description && <InfoRow icon={FiGrid} label="Description" value={seat.description} />}
        </section>

        {/* Assignment */}
        <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Assignment</h2>
          {seat.currentOccupant ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img className="h-12 w-12 rounded-full bg-orange-100 object-cover" src={getPhotoUrl(seat.currentOccupant.photo, seat.currentOccupant.fullName)} alt="" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{seat.currentOccupant.fullName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{seat.currentOccupant.mobile}</p>
                </div>
              </div>
              {seat.currentOccupant.membershipStatus && (
                <p className="text-xs">Membership: <span className="font-semibold">{seat.currentOccupant.membershipStatus}</span></p>
              )}
              {seat.currentOccupant.email && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{seat.currentOccupant.email}</p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">
              <FiUser className="mx-auto mb-2 h-8 w-8 opacity-30" />
              No member assigned
            </div>
          )}
        </section>

        {/* Usage Stats */}
        <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Usage Statistics</h2>
          {usage ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Today's Usage", usage.todayUsage],
                ['Total Usage', usage.totalUsage],
                ['Avg Daily', usage.averageDailyUsage],
                ['Last Check In', formatDate(usage.lastCheckIn)],
                ['Last Check Out', formatDate(usage.lastCheckOut)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-orange-50 p-3 dark:bg-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">No usage data</div>
          )}
        </section>
      </div>

      {/* History */}
      <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Seat History</h2>
        {!history.length ? (
          <div className="py-8 text-center text-sm text-slate-400">No history yet</div>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h._id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                <div className="h-8 w-8 shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/30" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {ACTION_LABEL[h.action] || h.action}
                    {h.memberId?.fullName && <span className="text-slate-500 dark:text-slate-400"> — {h.memberId.fullName}</span>}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(h.createdAt)}{h.duration ? ` · ${h.duration} min` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showAssign && <AssignModal seatId={seat._id} onClose={() => setShowAssign(false)} onDone={() => { setShowAssign(false); load(); }} />}
      {showTransfer && <TransferModal seat={seat} onClose={() => setShowTransfer(false)} onDone={() => { setShowTransfer(false); load(); }} />}
    </div>
  );
};

export default ViewSeat;
