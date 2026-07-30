import { FiAlertTriangle } from 'react-icons/fi';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) {
  if (!isOpen) return null;
  const colors = { danger: 'bg-red-500 hover:bg-red-600', warning: 'bg-yellow-500 hover:bg-yellow-600', success: 'bg-green-500 hover:bg-green-600' };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex justify-center"><div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20"><FiAlertTriangle size={24} className="text-red-600 dark:text-red-400" /></div></div>
        <h3 className="mb-2 text-center text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mb-6 text-center text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-all">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all ${colors[variant]}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
