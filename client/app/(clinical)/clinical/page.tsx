'use client';
import { useEffect, useState } from 'react';
import { bookingApi, orderApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { StatCard, Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ClipboardList, Calendar, Video, Heart } from 'lucide-react';
import Link from 'next/link';

export default function ClinicalDashboard() {
  const { user } = useAuthStore();
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bookingApi.today(), orderApi.queue()])
      .then(([bRes, oRes]) => { setTodayBookings(bRes.data.data); setQueue(oRes.data.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Clinical Dashboard</h1><p className="text-sm text-gray-500 mt-1">Welcome back, {user?.firstName}. Here&apos;s your day.</p></div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Today's Consultations" value={todayBookings.length} />
        <StatCard label="Online Queue" value={queue.length} change={queue.length > 0 ? 'Action needed' : 'Clear'} trend={queue.length > 0 ? 'down' : 'up'} />
        <StatCard label="Completed Today" value={todayBookings.filter((b: any) => b.status === 'COMPLETED').length} />
        <StatCard label="Aftercare Due" value={0} change="All caught up" trend="up" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Link href="/admin/bookings" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
          <div><div className="text-sm font-semibold">Today&apos;s List</div><div className="text-xs text-gray-500">{todayBookings.length} appointments</div></div>
        </Link>
        <Link href="/admin/prescriber-queue" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center"><ClipboardList className="w-5 h-5" /></div>
          <div><div className="text-sm font-semibold">Review Queue</div><div className="text-xs text-gray-500">{queue.length} awaiting</div></div>
        </Link>
        <Link href="/clinical/econsultation" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Video className="w-5 h-5" /></div>
          <div><div className="text-sm font-semibold">eConsultation</div><div className="text-xs text-gray-500">Start consultation</div></div>
        </Link>
        <Link href="/clinical/aftercare" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center"><Heart className="w-5 h-5" /></div>
          <div><div className="text-sm font-semibold">Aftercare</div><div className="text-xs text-gray-500">Follow-ups due</div></div>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><h3 className="text-sm font-semibold">Today&apos;s Appointments</h3></CardHeader>
          <div className="divide-y divide-gray-100">
            {todayBookings.slice(0, 8).map((b: any) => (
              <div key={b.id} className="px-5 py-3 flex items-center gap-3">
                <div className="text-sm font-medium w-14 text-gray-500">{b.startTime}</div>
                <Avatar firstName={b.patient?.user?.firstName || '?'} lastName={b.patient?.user?.lastName || '?'} size="sm" />
                <div className="flex-1"><div className="text-sm font-medium">{b.patient?.user?.firstName} {b.patient?.user?.lastName}</div><div className="text-xs text-gray-400">{b.service?.name}</div></div>
                <Badge status={b.status} />
                {b.status === 'CHECKED_IN' && <Link href={`/clinical/econsultation?bookingId=${b.id}`}><Button size="sm">Start</Button></Link>}
              </div>
            ))}
            {todayBookings.length === 0 && <div className="px-5 py-8 text-center text-sm text-gray-400">No appointments today</div>}
          </div>
        </Card>

        <Card>
          <CardHeader><h3 className="text-sm font-semibold">Online Order Queue</h3><Link href="/admin/prescriber-queue" className="text-xs text-teal-600 font-medium">View All</Link></CardHeader>
          <div className="divide-y divide-gray-100">
            {queue.slice(0, 8).map((o: any) => (
              <div key={o.id} className="px-5 py-3 flex items-center gap-3">
                <Avatar firstName={o.patient?.user?.firstName || '?'} lastName={o.patient?.user?.lastName || '?'} size="sm" color="amber" />
                <div className="flex-1"><div className="text-sm font-medium">{o.patient?.user?.firstName} {o.patient?.user?.lastName}</div><div className="text-xs text-gray-400">{o.productName} | {o.reference}</div></div>
                <Badge status={o.status} />
                <Link href={`/admin/prescriber-queue`}><Button size="sm">Review</Button></Link>
              </div>
            ))}
            {queue.length === 0 && <div className="px-5 py-8 text-center text-sm text-gray-400">No orders in queue</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
