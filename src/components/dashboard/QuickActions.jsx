import React from 'react';
import { Link } from 'react-router-dom';
import { getCssVar } from '../../utils/themeColors';
import {
  FiUsers, FiGrid, FiClock, FiCamera, FiCreditCard, FiDollarSign,
} from 'react-icons/fi';

const box = 'rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80';

const actions = [
  { icon: FiUsers, label: 'Add Member', to: '/admin/members' },
  { icon: FiGrid, label: 'Add Seat', to: '/admin/seats/add' },
  { icon: FiClock, label: 'Add Shift', to: '/admin/shifts/add' },
  { icon: FiCamera, label: 'Generate QR', to: '/admin/attendance' },
  { icon: FiCreditCard, label: 'Add Payment', to: '/admin/payments' },
  { icon: FiDollarSign, label: 'Add Expense', to: '/admin/expenses' },
];

export default function QuickActions() {
  const primary = getCssVar('--primary') || '#FF6B00';

  return (
    <section className={box}>
      <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map(({ icon: Icon, label, to }) => (
          <Link
            key={label}
            to={to}
            className="flex items-center gap-2 rounded-xl border border-orange-100 p-3 text-sm font-semibold transition hover:bg-orange-50 dark:border-slate-700 dark:hover:bg-slate-700"
          >
            <Icon style={{ color: primary }} />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
