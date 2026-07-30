import React, { useState, useRef } from 'react';
import { FiUpload, FiX, FiCheckCircle, FiAlertCircle, FiFile } from 'react-icons/fi';
import { importData } from '../../services/exportImportService';

export default function ImportButton({ entity, label = 'Import', onImport, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await importData(entity, file);
      setResult(res.data || res);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
    setLoading(false);
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const reset = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all disabled:opacity-50"
      >
        <FiUpload size={16} />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={reset}>
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[var(--primary)]/10 p-2"><FiUpload size={20} className="text-[var(--primary)]" /></div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Import {entity}</h2>
              </div>
              <button onClick={reset} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"><FiX size={20} /></button>
            </div>

            <p className="mb-4 text-xs text-[var(--text-muted)]">Upload a CSV or Excel (.xlsx) file with the data to import.</p>

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] p-6 hover:border-[var(--primary)] transition-all">
              <FiFile size={20} className="text-[var(--text-muted)]" />
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {file ? file.name : 'Choose CSV or Excel file'}
              </span>
              <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
            </label>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <FiAlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2 rounded-xl bg-green-50 px-4 py-3 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  <FiCheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>Imported {result.imported}, skipped {result.skipped}</span>
                </div>
                {result.errors?.length > 0 && (
                  <details className="rounded-xl border border-[var(--border)]">
                    <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                      {result.errors.length} error{result.errors.length > 1 ? 's' : ''}
                    </summary>
                    <div className="max-h-32 overflow-y-auto px-3 pb-2">
                      {result.errors.map((e, i) => (
                        <div key={i} className="py-0.5 text-[10px] text-red-500">Row {e.row}: {e.reason}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={reset} className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                {result ? 'Done' : 'Cancel'}
              </button>
              {!result && (
                <button
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Importing...
                    </>
                  ) : (
                    'Import'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
