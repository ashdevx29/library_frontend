import React from 'react';
import { motion } from 'framer-motion';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getIntensity = (val, max) => {
  if (max === 0) return 0;
  const ratio = val / max;
  if (ratio === 0) return 0;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};

const intensityStyles = [
  'bg-gray-100 dark:bg-gray-800',
  'bg-green-200 dark:bg-green-900/40',
  'bg-green-300 dark:bg-green-900/60',
  'bg-green-500 dark:bg-green-800',
  'bg-green-700 dark:bg-green-700',
];

export default function AttendanceHeatmap({ data, year, month }) {
  if (!data?.grid?.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-400">
        No attendance data for this period
      </div>
    );
  }

  const maxPresent = Math.max(...data.grid.map(d => d.present), 1);
  const weeks = [];
  let week = [];

  const firstDay = data.grid[0]?.dayOfWeek ?? 0;
  for (let i = 0; i < firstDay; i++) week.push(null);

  data.grid.forEach((d) => {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const headerCell = 'w-8 text-[9px] font-medium text-gray-400 text-center';
  const dayLabel = 'w-8 text-[9px] font-medium text-gray-400 text-center';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        <div className="flex items-end gap-1">
          <div className="flex flex-col gap-1">
            <div className="flex" style={{ paddingLeft: '0px' }}>
              {DAYS.map(d => <div key={d} className={headerCell}>{d}</div>)}
            </div>
            {weeks.map((w, wi) => (
              <div key={wi} className="flex gap-1">
                {w.map((d, di) => (
                  <div key={di}
                    className={`h-8 w-8 rounded-md ${d ? intensityStyles[getIntensity(d.present, maxPresent)] : 'bg-transparent'} flex items-center justify-center transition-all hover:scale-110 hover:shadow-md ${d ? 'cursor-pointer' : ''} group relative`}
                    title={d ? `${d.present} present, ${d.absent} absent on day ${d.day}` : ''}
                  >
                    {d && (
                      <>
                        <span className="text-[8px] font-bold text-white/90">{d.day}</span>
                        <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                          Day {d.day}: {d.present}P / {d.absent}A
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 self-end text-[10px] text-gray-500">
          <span>Less</span>
          {intensityStyles.map((s, i) => <div key={i} className={`h-3 w-3 rounded-sm ${s}`} />)}
          <span>More</span>
        </div>
      </div>
    </motion.div>
  );
}
