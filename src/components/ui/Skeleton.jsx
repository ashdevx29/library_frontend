import { cn } from '../../utils/helpers';

export default function Skeleton({ className, count = 1 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('animate-pulse rounded-xl bg-[var(--bg-hover)]', className || 'h-16 w-full')} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-[var(--bg-hover)]" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/3 rounded bg-[var(--bg-hover)]" />
          <div className="h-3 w-1/2 rounded bg-[var(--bg-hover)]" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-[var(--bg-hover)]" />
        <div className="h-3 w-2/3 rounded bg-[var(--bg-hover)]" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="animate-pulse h-10 flex-1 rounded bg-[var(--bg-hover)]" />
          ))}
        </div>
      ))}
    </div>
  );
}
