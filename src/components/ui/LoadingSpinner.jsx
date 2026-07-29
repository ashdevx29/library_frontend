import { cn } from '../../utils/helpers';

export default function LoadingSpinner({ size = 'md', className }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent', sizes[size])} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-3 text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    </div>
  );
}
