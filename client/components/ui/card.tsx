import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('px-5 py-4 border-b border-gray-100 flex items-center justify-between', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ label, value, change, trend }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
      <div className="text-sm text-gray-500 font-medium">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{value}</div>
      {change && (
        <div className={cn('text-xs font-medium mt-1', {
          'text-green-600': trend === 'up',
          'text-red-600': trend === 'down',
          'text-gray-500': trend === 'neutral',
        })}>
          {change}
        </div>
      )}
    </div>
  );
}
