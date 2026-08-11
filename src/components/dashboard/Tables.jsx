import React from 'react';
import { formatDate } from '../../utils/helpers';

import { getPhotoUrl } from '../../utils/image';

const box = 'rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80';

const Empty = () => (
  <div className="py-10 text-center text-sm text-slate-400">
    No data available yet.
  </div>
);

export function ActivityTable({ data }) {
  return (
    <section className={box}>
      <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
        Recent Activities
      </h2>
      {!data?.length ? (
        <Empty />
      ) : (
        <div className="space-y-1">
          {data.map((x) => (
            <div
              key={x._id}
              className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-700"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {x.description || x.action}
                </p>
                <p className="text-xs text-slate-400">
                  {x.userId?.name || 'System'} ·{' '}
                  {new Date(x.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function UpcomingExpiryTable({ data }) {
  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <section className={box}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
          Upcoming Expiries
        </h2>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
          {data?.length || 0} due
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-3">Member</th>
              <th className="pb-3">Mobile</th>
              <th className="pb-3">Seat</th>
              <th className="pb-3">Shift</th>
              <th className="pb-3">Expires</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.map((x) => {
              const daysLeft = Math.max(
                Math.ceil((new Date(x.membershipExpiryDate) - new Date()) / 86400000),
                0
              );
              return (
                <tr
                  key={x._id}
                  className="border-t dark:border-slate-700"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <img
                        className="h-9 w-9 rounded-full bg-orange-100 object-cover"
                        src={getPhotoUrl(x.photo, x.fullName)}
                        alt={x.fullName}
                      />
                      <b className="text-slate-700 dark:text-slate-200">{x.fullName}</b>
                    </div>
                  </td>
                  <td className="text-slate-600 dark:text-slate-300">{x.mobile}</td>
                  <td className="text-slate-600 dark:text-slate-300">{x.seatId?.seatNumber || '—'}</td>
                  <td className="text-slate-600 dark:text-slate-300">{x.shiftId?.shiftName || '—'}</td>
                  <td>
                    <span className={`font-semibold ${daysLeft <= 3 ? 'text-red-500' : daysLeft <= 7 ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300'}`}>
                      {formatDate(x.membershipExpiryDate)} ({daysLeft}d)
                    </span>
                  </td>
                  <td>
                    <button className="rounded-lg bg-orange-500 px-3 py-2 font-semibold text-white transition hover:bg-orange-600">
                      Renew
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!data?.length && <Empty />}
      </div>
    </section>
  );
}
