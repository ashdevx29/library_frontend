import { cn } from '../../utils/helpers';

export default function EmptyState({ icon: Icon, title, description, action, onAction, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && <Icon size={48} className="mb-4 text-[var(--text-muted)] opacity-30" />}
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>}
      {action && onAction && (
        <button onClick={onAction} className="mt-4 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all">
          {action}
        </button>
      )}
    </div>
  );
}
