'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { StatCard, Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ClipboardList, Truck, BarChart3, Plus, Calendar, ShoppingCart, UserPlus, Settings, Check, Globe, Sparkles } from 'lucide-react';
import Link from 'next/link';

const MOCK_ACTIVITY = [
  { id: 1, type: 'booking', text: 'New booking created for Flu Vaccination', time: '5 min ago', icon: Calendar, color: 'bg-teal-50 text-teal-600' },
  { id: 2, type: 'order', text: 'Online order #ORD-2847 received', time: '12 min ago', icon: ShoppingCart, color: 'bg-indigo-50 text-indigo-600' },
  { id: 3, type: 'booking', text: 'Weight Management consultation booked', time: '28 min ago', icon: Calendar, color: 'bg-teal-50 text-teal-600' },
  { id: 4, type: 'order', text: 'Order #ORD-2846 dispatched via DPD', time: '45 min ago', icon: Truck, color: 'bg-blue-50 text-blue-600' },
  { id: 5, type: 'booking', text: 'Blood Pressure Check walk-in added', time: '1 hr ago', icon: Calendar, color: 'bg-teal-50 text-teal-600' },
  { id: 6, type: 'order', text: 'Online order #ORD-2845 received', time: '2 hrs ago', icon: ShoppingCart, color: 'bg-indigo-50 text-indigo-600' },
];

const GETTING_STARTED = [
  { id: 'service', label: 'Add your first service', done: true, href: '/admin/services', icon: Plus },
  { id: 'team', label: 'Invite a team member', done: false, href: '/admin/team', icon: UserPlus },
  { id: 'booking', label: 'Create your first booking', done: false, href: '/admin/bookings/new', icon: Calendar },
  { id: 'storefront', label: 'Customise your storefront', done: false, href: '/admin/website', icon: Globe },
];

function RevenueSparkline() {
  // Simple sparkline using inline SVG — last 7 days mock data
  const data = [320, 480, 390, 550, 620, 510, 680];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const width = 120;
  const height = 36;
  const padding = 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + ((max - v) / (max - min)) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="ml-auto">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparkFill)" />
      <polyline points={points} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

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
  const totalBookings = (stats.todayBookings || 0) + (data?.recentBookings?.length || 0);
  const showGettingStarted = totalBookings < 5;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-teal-200" />
            <span className="text-sm text-teal-200 font-medium">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {user?.firstName}
          </h1>
          <p className="text-teal-100 text-sm mt-1">
            Here is what is happening at {user?.tenant?.name} today.
          </p>
        </div>
      </div>

      {/* Getting Started Checklist (shows if < 5 bookings) */}
      {showGettingStarted && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-semibold">Getting Started</h3>
            </div>
            <span className="text-xs text-gray-400">{GETTING_STARTED.filter(s => s.done).length}/{GETTING_STARTED.length} complete</span>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GETTING_STARTED.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${item.done ? 'border-teal-200 bg-teal-50/50' : 'border-gray-200 hover:border-teal-300 hover:shadow-sm'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'}`}>
                    {item.done ? <Check className="w-4 h-4" /> : <item.icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-sm font-medium ${item.done ? 'text-teal-700 line-through' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Bookings" value={stats.todayBookings || 0} change="+12% vs last week" trend="up" />
        <StatCard label="Online Orders" value={stats.todayOrders || 0} change="+8% vs last week" trend="up" />

        {/* Revenue card with sparkline */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500 font-medium">Week Revenue</div>
              <div className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{formatCurrency(stats.weekRevenue || 0)}</div>
              <div className="text-xs font-medium mt-1 text-green-600">+15% vs last week</div>
            </div>
            <RevenueSparkline />
          </div>
        </div>

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

      {/* Tables + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Bookings */}
        <Card className="lg:col-span-1">
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
        <Card className="lg:col-span-1">
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

        {/* Activity Feed */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h3 className="text-sm font-semibold">Recent Activity</h3>
            <span className="text-xs text-gray-400">Live feed</span>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {MOCK_ACTIVITY.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className={`w-8 h-8 rounded-lg ${activity.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
