'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bookingApi, orderApi, patientApi } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';

interface Booking {
  id: string;
  reference: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
}

interface Order {
  id: string;
  reference: string;
  serviceName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export default function AccountOverviewPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [bookingsRes, ordersRes] = await Promise.allSettled([
          bookingApi.list({ limit: 3, upcoming: true }),
          orderApi.list({ limit: 3 }),
        ]);
        if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.data.data?.items || bookingsRes.value.data.data || []);
        if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data.data?.items || ordersRes.value.data.data || []);
      } catch {
        // Silently fail individual sections
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
            <div className="h-4 bg-gray-100 rounded w-full mb-2" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  const tenantSlug = user?.tenant?.slug;
  const nextBooking = bookings.length > 0 ? bookings[0] : null;

  return (
    <div>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName || 'Patient'}</h1>
        <p className="text-teal-100 text-sm mt-1">
          {user?.tenant?.name ? `Your pharmacy: ${user.tenant.name}` : 'Manage your health services and treatments'}
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Link href={tenantSlug ? `/pharmacy/${tenantSlug}/book` : '/account/bookings'} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all text-center">
          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">Book Appointment</h3>
        </Link>
        <Link href={tenantSlug ? `/pharmacy/${tenantSlug}/order` : '/account/orders'} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">Order Online</h3>
        </Link>
        <Link href="/account/orders" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">Track Order</h3>
        </Link>
        <Link href="/account/profile" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">View Profile</h3>
        </Link>
      </div>

      {/* Health Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <div className="text-xs text-gray-500">ID Verification</div>
              <div className="text-sm font-semibold text-gray-900">Pending</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </div>
            <div>
              <div className="text-xs text-gray-500">Active Subscriptions</div>
              <div className="text-sm font-semibold text-gray-900">0</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <div className="text-xs text-gray-500">Next Appointment</div>
              <div className="text-sm font-semibold text-gray-900">{nextBooking ? `${formatDate(nextBooking.date)} at ${nextBooking.time}` : 'None scheduled'}</div>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link href="/account/profile" className="text-sm text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Notification Preferences
          </Link>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
          <Link href="/account/bookings">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-gray-500 text-sm">No upcoming bookings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{booking.serviceName}</p>
                  <p className="text-xs text-gray-500">{formatDate(booking.date)} at {booking.time}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/account/orders">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <p className="text-gray-500 text-sm">No recent orders</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{order.serviceName}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)} - {formatCurrency(order.totalAmount)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  {order.reference && (
                    <Link href={`/track/${order.reference}`}>
                      <Button variant="ghost" size="sm">Track</Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
