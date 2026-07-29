import React from 'react';
import useThemeStore, { API_BASE } from '../store/themeStore';

const logoUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) return `${API_BASE}${path}`;
  return path;
};

const AuthLayout = ({ children, title, subtitle }) => {
  const { theme } = useThemeStore();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-authBg font-sans">
      <div className="absolute left-[-100px] top-[-100px] h-64 w-64 rounded-full bg-authSecondary opacity-30 mix-blend-multiply blur-3xl filter" />
      <div className="absolute bottom-[-100px] right-[-100px] h-80 w-80 rounded-full bg-authPrimary opacity-30 mix-blend-multiply blur-3xl filter" />

      <div className="glassmorphism relative z-10 w-full max-w-md rounded-2xl p-8 shadow-xl">
        <div className="mb-8 text-center">
          {theme.logo && (
            <img
              src={logoUrl(theme.logo)}
              alt={theme.libraryName}
              className="mx-auto mb-4 h-14 w-14 rounded-xl object-contain"
            />
          )}
          <h1 className="font-poppins text-3xl font-bold tracking-tight text-gray-800">{title}</h1>
          {subtitle && <p className="mt-2 font-inter text-sm text-gray-500">{subtitle}</p>}
          {theme.libraryName && (
            <p className="mt-1 text-xs font-semibold text-orange-500">{theme.libraryName}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
