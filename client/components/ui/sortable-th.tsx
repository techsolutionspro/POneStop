import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableThProps {
  label: string;
  sortKey: string;
  currentSort: string;
  currentDirection: 'asc' | 'desc';
  onSort: (key: string) => void;
}

export function SortableTh({ label, sortKey, currentSort, currentDirection, onSort }: SortableThProps) {
  const isActive = currentSort === sortKey;

  return (
    <th
      className={cn(
        'text-left px-4 py-2.5 text-xs font-medium uppercase cursor-pointer select-none transition-colors hover:bg-gray-100',
        isActive ? 'text-teal-700' : 'text-gray-500'
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDirection === 'asc' ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-40" />
        )}
      </span>
    </th>
  );
}
