import React from 'react';

const box = 'rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80';

const Empty = () => (
  <div className="py-10 text-center text-sm text-slate-400">
    No notifications yet.
  </div>
);

export default function NotificationList({ data }) {
  return (
    <section className={box}>
      <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
        Notifications
      </h2>
      {!data?.length ? (
        <Empty />
      ) : (
        <div className="space-y-3">
          {data.map((n) => (
            <div
              key={n._id}
              className="rounded-xl bg-orange-50 p-4 dark:bg-slate-700"
            >
              <div className="flex justify-between gap-3">
                <b className="text-sm text-slate-800 dark:text-white">{n.title}</b>
                <span className="shrink-0 text-xs font-semibold text-orange-600 dark:text-orange-400">
                  {n.type}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                {n.message}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
