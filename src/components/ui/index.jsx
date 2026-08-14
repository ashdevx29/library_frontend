import { cn } from '../../utils/helpers';
import { STATUS_COLORS } from '../../constants';
import LoadingSpinner, { PageLoader } from './LoadingSpinner';
import UserAvatar from './UserAvatar';

export { LoadingSpinner, PageLoader, UserAvatar };

export function StatusBadge({ status, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold', STATUS_COLORS[status] || 'bg-gray-100 text-gray-500', className)}>
      {status}
    </span>
  );
}

export function Card({ children, className, hover = false }) {
  return (
    <div className={cn('rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4', hover && 'transition-all hover:shadow-md', className)}>
      {children}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color = 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', className }) {
  return (
    <Card className={cn('flex items-center gap-3', className)}>
      <div className={cn('rounded-lg p-2', color)}><Icon size={16} /></div>
      <div>
        <p className="text-[10px] font-medium text-[var(--text-muted)]">{label}</p>
        <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </Card>
  );
}

export function TabBar({ tabs, active, onChange, className }) {
  return (
    <div className={cn('flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1 overflow-x-auto', className)}>
      {tabs.map(t => (
        <button key={t.id || t} onClick={() => onChange(t.id || t)} className={cn('flex-shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-all', (active === (t.id || t)) ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]')}>
          {t.icon && <t.icon size={12} className="mr-1 inline" />}
          {t.label || t}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ icon: Icon, title, subtitle, action, onAction, actionLabel }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        {Icon && <div className="rounded-xl bg-[var(--primary)]/10 p-3"><Icon size={24} className="text-[var(--primary)]" /></div>}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {action && onAction && (
        <button onClick={onAction} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all">
          {action}
        </button>
      )}
    </div>
  );
}

export function FormField({ label, error, children, required, className }) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-xs font-semibold text-[var(--text-secondary)]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

export const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all';
export const selectClass = inputClass;
export const textareaClass = cn(inputClass, 'resize-none');
export const btnPrimary = 'flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all';
export const btnSecondary = 'flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all';
export const btnDanger = 'flex items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-all';
