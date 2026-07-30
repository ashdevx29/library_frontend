import React, { useState } from 'react';
import { FiDownload, FiFileText, FiGrid, FiFile } from 'react-icons/fi';
import { downloadExport } from '../../services/exportImportService';

const FORMATS = [
  { key: 'xlsx', label: 'Excel', icon: FiGrid, color: 'hover:border-green-500 hover:text-green-600' },
  { key: 'csv', label: 'CSV', icon: FiFileText, color: 'hover:border-blue-500 hover:text-blue-600' },
  { key: 'pdf', label: 'PDF', icon: FiFile, color: 'hover:border-red-500 hover:text-red-600' },
];

export default function ExportButton({ entity, filename, params = {}, disabled = false, onExport, children }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null);

  const handleExport = async (format) => {
    setLoading(format);
    try {
      if (onExport) {
        await onExport(format);
      } else {
        await downloadExport(entity, format, filename, params);
      }
    } catch (e) {
      console.error('Export failed:', e);
    }
    setLoading(null);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all disabled:opacity-50"
      >
        <FiDownload size={16} />
        {children || 'Export'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-xl">
            {FORMATS.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => handleExport(key)}
                disabled={loading !== null}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all ${color} disabled:opacity-50`}
              >
                {loading === key ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                ) : (
                  <Icon size={16} />
                )}
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
