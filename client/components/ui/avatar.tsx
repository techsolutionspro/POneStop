import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'teal' | 'indigo' | 'amber' | 'rose';
  className?: string;
}

const colors = {
  teal: 'bg-teal-100 text-teal-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  amber: 'bg-amber-100 text-amber-800',
  rose: 'bg-rose-100 text-rose-700',
};

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function Avatar({ firstName, lastName, size = 'md', color = 'teal', className }: AvatarProps) {
  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
      sizes[size], colors[color], className
    )}>
      {getInitials(firstName, lastName)}
    </div>
  );
}
