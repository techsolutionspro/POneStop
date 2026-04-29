'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bookingApi } from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Booking {
  id: string;
  reference: string;
  serviceName: string;
  pharmacyName?: string;
  pharmacySlug?: string;
  date: string;
  time: string;
  status: string;
  serviceId?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    async function load() {
      try {
        const res = await bookingApi.list();
        const items = res.data.data?.items || res.data.data || [];
        setBookings(items);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const now = new Date();
  const upcoming = bookings.filter((b) => new Date(b.date) >= now && !['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(b.status));
  const past = bookings.filter((b) => new Date(b.date) < now || ['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(b.status));
  const displayed = tab === 'upcoming' ? upcoming : past;

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'upcoming' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'past' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Past ({past.length})
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {tab === 'upcoming' ? 'No Upcoming Bookings' : 'No Past Bookings'}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {tab === 'upcoming' ? 'You don\'t have any upcoming consultations booked.' : 'You haven\'t completed any consultations yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{booking.serviceName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {booking.pharmacyName && (
                    <p className="text-sm text-gray-500 mb-1">{booking.pharmacyName}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {formatDate(booking.date)} at {booking.time}
                  </p>
                  {booking.reference && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">Ref: {booking.reference}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {tab === 'past' && booking.pharmacySlug && booking.serviceId && (
                    <Link href={`/pharmacy/${booking.pharmacySlug}/book?serviceId=${booking.serviceId}`}>
                      <Button variant="outline" size="sm">Rebook</Button>
                    </Link>
                  )}
                  {tab === 'upcoming' && booking.status === 'CONFIRMED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        if (confirm('Are you sure you want to cancel this booking?')) {
                          try {
                            await bookingApi.updateStatus(booking.id, 'CANCELLED', 'Patient cancelled');
                            setBookings((prev) => prev.map((b) => b.id === booking.id ? { ...b, status: 'CANCELLED' } : b));
                          } catch {
                            alert('Failed to cancel booking. Please try again.');
                          }
                        }
                      }}
                    >
                      Cancel
                    </Button>
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
