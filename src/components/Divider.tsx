import { cn } from '@/lib/utils';

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="h-px flex-1 bg-pheno-border" />
        <span className="text-xs text-pheno-text-tertiary font-body">{label}</span>
        <div className="h-px flex-1 bg-pheno-border" />
      </div>
    );
  }
  return <div className={cn('h-px w-full bg-pheno-border', className)} />;
}
