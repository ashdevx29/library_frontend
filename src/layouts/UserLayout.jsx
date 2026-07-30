import React, { useEffect, useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiClock, FiDollarSign, FiUser, FiLogOut, FiMenu, FiMoon, FiSun, FiBarChart2, FiBell, FiChevronDown, FiChevronLeft } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import useThemeStore, { API_BASE } from '../store/themeStore';

const logoUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) return `${API_BASE}${path}`;
  return path;
};

const navItems = [
  [FiHome, 'Dashboard', '/student'],
  [FiClock, 'Attendance', '/student/attendance'],
  [FiDollarSign, 'My Fees', '/student/fees'],
  [FiBarChart2, 'Reports', '/student/reports'],
  [FiBell, 'Notifications', '/student/notifications'],
  [FiUser, 'Profile', '/student/profile'],
];

const UserLayout = () => {
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

  const brandName = theme.libraryName || 'Student Portal';
  const shortName = brandName.split(' ')[0] || 'Saahityik';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
            <p className="truncate text-xs text-slate-400">Student Portal</p>
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
              end={path === '/student'}
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
            onClick={handleLogout}
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
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 font-bold text-white">
                  {user?.name?.[0] || 'S'}
                </span>
                <span className="hidden text-left sm:block">
                  <b className="block text-sm text-slate-800 dark:text-slate-100">{user?.name || 'Student'}</b>
                  <small className="text-slate-500 dark:text-slate-400">Student</small>
                </span>
                <FiChevronDown />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 text-slate-900 p-2 shadow-2xl z-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                  <NavLink to="/student/profile" className="block rounded-lg p-2.5 text-sm font-medium hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200">Profile</NavLink>
                  <button
                    type="button"
                    className="w-full rounded-lg p-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] bg-[var(--bg)] p-4 sm:p-6">
          <Outlet />
        </main>

        <footer className="px-6 py-4 text-center text-xs text-slate-400">
          © 2026 {brandName}
        </footer>
      </div>
    </div>
  );
};

export default UserLayout;
