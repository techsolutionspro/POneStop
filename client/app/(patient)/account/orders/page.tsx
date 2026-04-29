'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { orderApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  reference: string;
  serviceName: string;
  serviceId?: string;
  pharmacyName?: string;
  pharmacySlug?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await orderApi.list();
        const items = res.data.data?.items || res.data.data || [];
        setOrders(items);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-48 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Orders Yet</h3>
          <p className="text-gray-500 text-sm">You haven&apos;t placed any online orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{order.serviceName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {order.pharmacyName && (
                    <p className="text-sm text-gray-500 mb-1">{order.pharmacyName}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatDateTime(order.createdAt)}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  {order.reference && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">Ref: {order.reference}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {order.reference && (
                    <Link href={`/track/${order.reference}`}>
                      <Button variant="outline" size="sm">Track</Button>
                    </Link>
                  )}
                  {order.pharmacySlug && order.serviceId && ['DELIVERED', 'COMPLETED'].includes(order.status) && (
                    <Link href={`/pharmacy/${order.pharmacySlug}/order?serviceId=${order.serviceId}`}>
                      <Button variant="ghost" size="sm">Reorder</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
