import { cn } from '@/lib/utils';

interface LiveBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export default function LiveBadge({ className, size = 'md' }: LiveBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 bg-red-600 text-white font-bold rounded uppercase tracking-wider',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
        className
      )}
    >
      <span className="live-dot" style={{ width: size === 'sm' ? 5 : 7, height: size === 'sm' ? 5 : 7 }} />
      Ao Vivo
    </span>
  );
}
