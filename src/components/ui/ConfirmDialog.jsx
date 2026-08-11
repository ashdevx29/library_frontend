import { FiAlertTriangle, FiCheckCircle, FiAlertOctagon } from 'react-icons/fi';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) {
  if (!isOpen) return null;

  const config = {
    danger:  { btn: 'bg-red-500 hover:bg-red-600',     icon: FiAlertTriangle, iconBg: 'bg-red-100 dark:bg-red-900/20',     iconColor: 'text-red-600 dark:text-red-400' },
    warning: { btn: 'bg-yellow-500 hover:bg-yellow-600', icon: FiAlertOctagon,  iconBg: 'bg-yellow-100 dark:bg-yellow-900/20', iconColor: 'text-yellow-600 dark:text-yellow-400' },
    success: { btn: 'bg-green-500 hover:bg-green-600',  icon: FiCheckCircle,   iconBg: 'bg-green-100 dark:bg-green-900/20',   iconColor: 'text-green-600 dark:text-green-400' },
  };
  const { btn, icon: Icon, iconBg, iconColor } = config[variant] || config.danger;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex justify-center">
          <div className={`rounded-full p-3 ${iconBg}`}>
            <Icon size={26} className={iconColor} />
          </div>
        </div>
        <h3 className="mb-2 text-center text-lg font-bold text-slate-900">{title}</h3>
        <p className="mb-6 text-center text-sm text-slate-600">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all ${btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
