import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit2, FiRefreshCw, FiMessageCircle, FiGrid, FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getPhotoUrl } from '../../utils/image';

const REMINDER_DAYS = [3, 5, 7];

const buildReminderMessage = (name, days) =>
  `Hello ${name},\nYour library membership will expire in ${days} day${days > 1 ? 's' : ''}.\nPlease renew your membership.\nSaahityik Library`;

const MemberCard = ({ member }) => {
  const navigate = useNavigate();
  const [showReminders, setShowReminders] = useState(false);
  const daysLeft = Math.max(Math.ceil((new Date(member.membershipExpiryDate) - new Date()) / 86400000), 0);
  const isExpiring = daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft <= 0;

  const statusColor = member.status === 'Active' && !isExpired
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : isExpired ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';

  const photo = getPhotoUrl(member.photo, member.fullName);

  return (
    <article className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex items-start gap-4">
        <img src={photo} alt={member.fullName} className="h-14 w-14 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-800 dark:text-white">{member.fullName}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{member.mobile}</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor}`}>
            {isExpired ? 'Expired' : member.status}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <FiGrid className="h-3 w-3 text-orange-500" />
          Seat: <b>{member.seatId?.seatNumber || 'Unassigned'}</b>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <FiClock className="h-3 w-3 text-orange-500" />
          Shift: <b>{member.shiftId?.shiftName || '—'}</b>
        </div>
        <div className="text-slate-600 dark:text-slate-300">
          Plan: <b>{member.membershipPlan}</b>
        </div>
        <div className={`font-bold ${isExpired ? 'text-red-500' : isExpiring ? 'text-amber-500' : 'text-green-600 dark:text-green-400'}`}>
          {isExpired ? 'Expired' : `${daysLeft} days left`}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => navigate(`/admin/members/view/${member._id}`)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-blue-50 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
          <FiEye size={12} /> View
        </button>
        <button onClick={() => navigate(`/admin/members/edit/${member._id}`)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-orange-50 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400">
          <FiEdit2 size={12} /> Edit
        </button>
        <button onClick={() => navigate(`/admin/members/view/${member._id}?tab=renew`)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-green-50 py-2 text-xs font-semibold text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
          <FiRefreshCw size={12} /> Renew
        </button>
        <button onClick={() => setShowReminders(!showReminders)} className="flex items-center justify-center rounded-xl bg-green-500 p-2 text-white hover:bg-green-600">
          <FiMessageCircle size={14} />
        </button>
      </div>

      {showReminders && (
        <div className="mt-3 space-y-1.5 rounded-xl bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-[10px] font-semibold text-green-700 dark:text-green-400">Send WhatsApp Reminder</p>
          {REMINDER_DAYS.map(d => {
            const msg = buildReminderMessage(member.fullName, d);
            const url = `https://wa.me/${member.mobile}?text=${encodeURIComponent(msg)}`;
            return (
              <a key={d} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-slate-800 dark:text-green-400">
                <span>{d}-Day Reminder</span>
                <span className="text-[10px] text-green-500">Expires in {d}d</span>
              </a>
            );
          })}
        </div>
      )}
    </article>
  );
};

export default MemberCard;
