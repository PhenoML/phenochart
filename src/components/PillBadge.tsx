import { cn } from '@/lib/utils';

interface PillBadgeProps {
  variant: 'accepted' | 'rejected';
  className?: string;
}

export function PillBadge({ variant, className }: PillBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'accepted' && 'bg-pheno-accent-light text-pheno-accent',
        variant === 'rejected' && 'bg-pheno-reject-light text-pheno-reject',
        className,
      )}
    >
      {variant === 'accepted' ? '\u2713 Accepted' : '\u2717 Rejected'}
    </span>
  );
}
