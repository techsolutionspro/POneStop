import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-700',
    APPROVED: 'bg-green-50 text-green-700',
    COMPLETED: 'bg-green-50 text-green-700',
    DELIVERED: 'bg-green-50 text-green-700',
    CONFIRMED: 'bg-green-50 text-green-700',
    VERIFIED: 'bg-green-50 text-green-700',
    PUBLISHED: 'bg-green-50 text-green-700',
    PENDING: 'bg-yellow-50 text-yellow-700',
    ONBOARDING: 'bg-yellow-50 text-yellow-700',
    AWAITING_REVIEW: 'bg-yellow-50 text-yellow-700',
    QUERIED: 'bg-yellow-50 text-yellow-700',
    PENDING_VERIFICATION: 'bg-yellow-50 text-yellow-700',
    IN_REVIEW: 'bg-yellow-50 text-yellow-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    DISPATCHED: 'bg-blue-50 text-blue-700',
    OUT_FOR_DELIVERY: 'bg-blue-50 text-blue-700',
    DRAFT: 'bg-gray-100 text-gray-600',
    NOT_APPLICABLE: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-50 text-red-700',
    REJECTED: 'bg-red-50 text-red-700',
    SUSPENDED: 'bg-red-50 text-red-700',
    REFUNDED: 'bg-red-50 text-red-700',
    FAILED: 'bg-red-50 text-red-700',
    NO_SHOW: 'bg-red-50 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}
