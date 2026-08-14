import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiUsers, FiGrid, FiClock, FiCalendar, FiCreditCard, FiDollarSign,
  FiBarChart2,   FiBell, FiSettings, FiUser, FiLogOut, FiMenu, FiMoon, FiSun, FiChevronDown,
  FiVolume2, FiActivity, FiDatabase, FiUpload, FiShield, FiTrendingUp, FiChevronLeft,
} from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import useThemeStore, { API_BASE } from '../store/themeStore';
import { getPhotoUrl } from '../utils/image';

const navItems = [
  [FiHome, 'Dashboard', '/admin/dashboard'],
  [FiUsers, 'Members', '/admin/members'],
  [FiGrid, 'Seats', '/admin/seats'],
  [FiClock, 'Shifts', '/admin/shifts'],
  [FiCalendar, 'Attendance', '/admin/attendance'],
  [FiCreditCard, 'Payments', '/admin/payments'],
  [FiDollarSign, 'Expenses', '/admin/expenses'],
  [FiBarChart2, 'Reports', '/admin/reports'],
  [FiTrendingUp, 'Analytics', '/admin/analytics'],
  [FiBell, 'Notifications', '/admin/notifications'],
  [FiVolume2, 'Announcements', '/admin/announcements'],
  [FiUpload, 'Import/Export', '/admin/import-export'],
  [FiShield, 'Roles & Permissions', '/admin/roles'],
  [FiActivity, 'Logs', '/admin/logs'],
  [FiDatabase, 'Backup', '/admin/backup'],
  [FiSettings, 'Settings', '/admin/settings'],
  [FiUser, 'Profile', '/admin/profile'],
];

const logoUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) return `${API_BASE}${path}`;
  return path;
};

export default function AdminLayout() {
  const [open, setOpen] = useState(window.innerWidth >= 1024);
  const [dark, setDark] = useState(localStorage.theme === 'dark');
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.theme = dark ? 'dark' : 'light';
  }, [dark]);

  const brandName = theme.libraryName || 'Saahityik Library ERP';
  const shortName = brandName.split(' ')[0] || 'Saahityik';

  return (
    <div className="flex min-h-screen bg-[#FFF8F1] text-slate-700 dark:bg-slate-950 dark:text-slate-200">
      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto no-scrollbar text-white transition-transform lg:sticky lg:top-0 lg:h-screen ${
          open ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
        style={{ backgroundColor: 'var(--sidebar)' }}
      >
        <div className="sticky top-0 z-10 relative flex h-20 items-center gap-3 border-b border-white/10 px-5" style={{ backgroundColor: 'var(--sidebar)' }}>
          <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-xl object-contain bg-white/10 p-1" />
          <div className="min-w-0">
            <b className="block truncate font-poppins">{shortName}</b>
            <p className="truncate text-xs text-slate-400">Library ERP</p>
          </div>
          {/* Close button for mobile (<1024px) */}
          <button
            onClick={() => setOpen(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition lg:hidden"
            aria-label="Close sidebar"
          >
            <FiChevronLeft size={18} />
          </button>
        </div>

        <nav className="p-3">
          {navItems.map(([Icon, label, path]) => (
            <NavLink
              key={label}
              to={path}
              onClick={() => window.innerWidth < 1024 && setOpen(false)}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  isActive ? 'bg-orange-500 font-semibold text-white' : 'text-slate-300 hover:bg-white/10'
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}

          {/* Logout button right after menu items */}
          <button
            onClick={() => { logout(); navigate('/admin/login'); }}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-300 hover:bg-white/10 transition"
          >
            <FiLogOut />
            Logout
          </button>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header
          className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-orange-100 px-4 backdrop-blur-xl dark:border-slate-800 sm:px-6"
          style={{ backgroundColor: 'var(--header)' }}
        >
          <button onClick={() => setOpen(!open)} className="icon-btn" type="button">
            <FiMenu />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button className="icon-btn" type="button" onClick={() => setDark(!dark)}>
              {dark ? <FiSun /> : <FiMoon />}
            </button>
            <button className="icon-btn relative" type="button">
              <FiBell />
              <i className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-orange-50 dark:hover:bg-slate-800"
              >
                <UserAvatar
                  src={user?.profileImage}
                  name={user?.name || 'A'}
                  className="h-9 w-9 rounded-xl object-cover"
                />
                <span className="hidden text-left sm:block">
                  <b className="block text-sm text-slate-800 dark:text-slate-100">{user?.name || 'Admin'}</b>
                  <small className="text-slate-500 dark:text-slate-400">{user?.role}</small>
                </span>
                <FiChevronDown />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 text-slate-900 p-2 shadow-2xl z-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                  <NavLink to="/admin/profile" className="block rounded-lg p-2.5 text-sm font-medium hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200">Profile</NavLink>
                  <button
                    type="button"
                    className="w-full rounded-lg p-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => { logout(); navigate('/admin/login'); }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-8rem)] p-4 sm:p-6">
          <Outlet />
        </main>

        <footer className="px-6 py-4 text-center text-xs text-slate-400">
          © 2026 {brandName}
        </footer>
      </div>
    </div>
  );
}
