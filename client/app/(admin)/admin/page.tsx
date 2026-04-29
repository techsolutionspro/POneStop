'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { StatCard, Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ClipboardList, Truck, BarChart3, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.tenant().then(res => {
      setData(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {' | '}{user?.tenant?.name}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Bookings" value={stats.todayBookings || 0} change="+12% vs last week" trend="up" />
        <StatCard label="Online Orders" value={stats.todayOrders || 0} change="+8% vs last week" trend="up" />
        <StatCard label="Week Revenue" value={formatCurrency(stats.weekRevenue || 0)} change="+15% vs last week" trend="up" />
        <StatCard
          label="Awaiting Review"
          value={stats.awaitingReview || 0}
          change={stats.awaitingReview > 0 ? 'Action needed' : 'All clear'}
          trend={stats.awaitingReview > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        <Link href="/admin/bookings/new" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-teal-300 transition-all">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Add Booking</div>
            <div className="text-xs text-gray-500">Walk-in or phone</div>
          </div>
        </Link>
        <Link href="/admin/prescriber-queue" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-yellow-300 transition-all">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Review Queue</div>
            <div className="text-xs text-gray-500">{stats.awaitingReview || 0} waiting</div>
          </div>
        </Link>
        <Link href="/admin/dispatch" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Dispatch</div>
            <div className="text-xs text-gray-500">Ready to ship</div>
          </div>
        </Link>
        <Link href="/admin/reports" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-green-300 transition-all">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Reports</div>
            <div className="text-xs text-gray-500">Weekly summary</div>
          </div>
        </Link>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Bookings */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Today&apos;s Bookings</h3>
            <Link href="/admin/bookings" className="text-xs text-teal-600 hover:text-teal-700 font-medium">View All</Link>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentBookings || []).slice(0, 5).map((b: any) => (
                  <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{b.startTime}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar firstName={b.patient?.user?.firstName || 'U'} lastName={b.patient?.user?.lastName || 'N'} size="sm" />
                        <span>{b.patient?.user?.firstName} {b.patient?.user?.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.service?.name}</td>
                    <td className="px-4 py-3"><Badge status={b.status} /></td>
                  </tr>
                ))}
                {(!data?.recentBookings || data.recentBookings.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No bookings today</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Online Orders */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Recent Online Orders</h3>
            <Link href="/admin/orders" className="text-xs text-teal-600 hover:text-teal-700 font-medium">View All</Link>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentOrders || []).slice(0, 5).map((o: any) => (
                  <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{o.reference}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar firstName={o.patient?.user?.firstName || 'U'} lastName={o.patient?.user?.lastName || 'N'} size="sm" color="indigo" />
                        <span>{o.patient?.user?.firstName} {o.patient?.user?.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge status={o.status} /></td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.totalAmount)}</td>
                  </tr>
                ))}
                {(!data?.recentOrders || data.recentOrders.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
