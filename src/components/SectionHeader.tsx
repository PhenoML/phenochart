import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  label: string;
  count: number;
  variant: 'condition' | 'medication';
}

export function SectionHeader({ label, count, variant }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-l-[3px] px-4 py-2',
        variant === 'condition'
          ? 'border-pheno-condition'
          : 'border-pheno-medication',
      )}
    >
      <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-pheno-text-tertiary">
        {label}
      </span>
      <span className="font-body text-[11px] text-pheno-text-tertiary">
        {count} found
      </span>
    </div>
  );
}
