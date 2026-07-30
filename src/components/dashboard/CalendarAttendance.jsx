import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusColor = (d) => {
  if (!d || d.total === 0) return 'bg-gray-50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-600';
  const ratio = d.present / d.total;
  if (ratio >= 0.8) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (ratio >= 0.5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

export default function CalendarAttendance({ data, year, month, onMonthChange }) {
  const [currentYear, setCurrentYear] = useState(year || new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(month || new Date().getMonth() + 1);

  const goPrev = () => {
    let m = currentMonth - 1;
    let y = currentYear;
    if (m < 1) { m = 12; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
    onMonthChange?.(y, m);
  };

  const goNext = () => {
    let m = currentMonth + 1;
    let y = currentYear;
    if (m > 12) { m = 1; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
    onMonthChange?.(y, m);
  };

  const daysInMonth = data?.daysInMonth || new Date(currentYear, currentMonth, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const grid = data?.grid || [];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const d = grid.find(g => g.day === day);
    cells.push(d || { day, present: 0, absent: 0, total: 0 });
  }

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en', { month: 'long', year: 'numeric' });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={goPrev} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <FiChevronLeft size={16} />
        </button>
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{monthName}</h3>
        <button onClick={goNext} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <FiChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className="py-1 text-center text-[9px] font-semibold uppercase text-gray-400">{d}</div>
        ))}
        <AnimatePresence mode="popLayout">
          {cells.map((cell, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15, delay: (i % 7) * 0.02 }}
              className={`aspect-square rounded-lg p-1 text-center text-[10px] font-semibold transition-all ${cell ? statusColor(cell) : ''} ${cell?.total > 0 ? 'cursor-pointer hover:shadow-md' : ''}`}
            >
              <div className="flex h-full flex-col items-center justify-center">
                <span>{cell?.day || ''}</span>
                {cell?.total > 0 && (
                  <span className="mt-0.5 text-[7px] opacity-70">{cell.present}/{cell.total}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-green-100 dark:bg-green-900/30" /> High (≥80%)</div>
        <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-yellow-100 dark:bg-yellow-900/30" /> Medium (50-79%)</div>
        <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-red-100 dark:bg-red-900/30" /> Low (&lt;50%)</div>
        <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-gray-50 dark:bg-gray-800/50" /> No data</div>
      </div>
    </motion.div>
  );
}
