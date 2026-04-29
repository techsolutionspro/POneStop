'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { orderApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TrackingStep {
  key: string;
  label: string;
  description: string;
  timestamp?: string;
  completed: boolean;
}

interface OrderTrackingData {
  reference: string;
  status: string;
  serviceName: string;
  totalAmount: number;
  createdAt: string;
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  pharmacy: {
    name: string;
    slug: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  timeline: {
    orderPlaced?: string;
    clinicalReview?: string;
    dispensed?: string;
    dispatched?: string;
    delivered?: string;
  };
}

const STATUS_ORDER = ['ORDER_PLACED', 'CLINICAL_REVIEW', 'DISPENSED', 'DISPATCHED', 'DELIVERED'];

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    PENDING: 0,
    AWAITING_REVIEW: 0,
    ORDER_PLACED: 0,
    IN_REVIEW: 1,
    CLINICAL_REVIEW: 1,
    APPROVED: 2,
    DISPENSED: 2,
    DISPATCHED: 3,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4,
    COMPLETED: 4,
  };
  return map[status] ?? 0;
}

export default function TrackOrderPage() {
  const params = useParams();
  const reference = params.reference as string;
  const [data, setData] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await orderApi.track(reference);
        setData(res.data.data);
      } catch {
        setError('Order not found. Please check your reference number.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Tracking your order...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <p className="text-sm text-gray-400">Reference: <span className="font-mono">{reference}</span></p>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex(data.status);
  const accentColor = data.pharmacy?.primaryColor || '#0d9488';

  const steps: TrackingStep[] = [
    {
      key: 'ORDER_PLACED',
      label: 'Order Placed',
      description: 'Your order has been received and payment confirmed.',
      timestamp: data.timeline?.orderPlaced || data.createdAt,
      completed: currentStep >= 0,
    },
    {
      key: 'CLINICAL_REVIEW',
      label: 'Clinical Review',
      description: 'A qualified pharmacist is reviewing your questionnaire and medical details.',
      timestamp: data.timeline?.clinicalReview,
      completed: currentStep >= 1,
    },
    {
      key: 'DISPENSED',
      label: 'Dispensed',
      description: 'Your medication has been prepared and safety-checked.',
      timestamp: data.timeline?.dispensed,
      completed: currentStep >= 2,
    },
    {
      key: 'DISPATCHED',
      label: 'Dispatched',
      description: data.trackingNumber
        ? `Shipped via ${data.courierName || 'courier'}. Tracking: ${data.trackingNumber}`
        : 'Your order has been handed to the delivery courier.',
      timestamp: data.timeline?.dispatched,
      completed: currentStep >= 3,
    },
    {
      key: 'DELIVERED',
      label: 'Delivered',
      description: 'Your order has been delivered successfully.',
      timestamp: data.timeline?.delivered,
      completed: currentStep >= 4,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Pharmacy Branding */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.pharmacy?.logoUrl ? (
              <img src={data.pharmacy.logoUrl} alt={data.pharmacy.name} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: accentColor }}>
                {data.pharmacy?.name?.charAt(0) || 'P'}
              </div>
            )}
            <span className="font-semibold text-gray-900">{data.pharmacy?.name || 'Pharmacy'}</span>
          </div>
          {data.pharmacy?.slug && (
            <Link href={`/pharmacy/${data.pharmacy.slug}`}>
              <Button variant="ghost" size="sm">Visit Pharmacy</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Status Banner */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-1">Order Reference</p>
            <p className="text-2xl font-mono font-bold text-teal-600">{data.reference}</p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-1 mb-2">
            {STATUS_ORDER.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-colors ${idx <= currentStep ? 'bg-teal-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Placed</span>
            <span>Review</span>
            <span>Dispensed</span>
            <span>Shipped</span>
            <span>Delivered</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Tracking Timeline</h2>
          <div className="space-y-1">
            {steps.map((trackingStep, idx) => {
              const isCurrent = idx === currentStep;
              const isPast = idx < currentStep;
              const isFuture = idx > currentStep;
              return (
                <div key={trackingStep.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isPast ? 'bg-teal-600' : isCurrent ? 'bg-teal-600 ring-4 ring-teal-100' : 'bg-gray-200'}`}>
                      {isPast ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : isCurrent ? (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      )}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`w-0.5 h-16 ${isPast ? 'bg-teal-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pb-8">
                    <p className={`font-semibold text-sm ${isFuture ? 'text-gray-400' : 'text-gray-900'}`}>
                      {trackingStep.label}
                    </p>
                    <p className={`text-sm mt-0.5 ${isFuture ? 'text-gray-300' : 'text-gray-500'}`}>
                      {trackingStep.description}
                    </p>
                    {trackingStep.timestamp && !isFuture && (
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(trackingStep.timestamp)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estimated Delivery */}
        {data.estimatedDelivery && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-6 h-6 text-teal-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <div>
              <p className="text-sm font-medium text-teal-800">Estimated Delivery</p>
              <p className="text-sm text-teal-600">{formatDateTime(data.estimatedDelivery)}</p>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Treatment</span>
              <span className="text-gray-900 font-medium">{data.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Order Date</span>
              <span className="text-gray-900 font-medium">{formatDateTime(data.createdAt)}</span>
            </div>
            {data.trackingNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tracking Number</span>
                <span className="text-gray-900 font-mono font-medium">{data.trackingNumber}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="text-gray-900 font-semibold">Total Paid</span>
              <span className="text-gray-900 font-bold">{formatCurrency(data.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
