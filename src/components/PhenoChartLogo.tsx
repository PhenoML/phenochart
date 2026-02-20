import { cn } from '@/lib/utils';

interface PhenoChartLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { diamond: 'text-lg', text: 'text-base' },
  md: { diamond: 'text-2xl', text: 'text-xl' },
  lg: { diamond: 'text-3xl', text: 'text-2xl' },
};

export function PhenoChartLogo({ size = 'md', className }: PhenoChartLogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <span className={cn(s.diamond, 'text-pheno-accent animate-in fade-in duration-500')}>&#9671;</span>
      <span className={cn(s.text, 'font-display text-pheno-text-primary')}>PhenoChart</span>
    </div>
  );
}
