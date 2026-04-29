'use client';
import { useEffect, useState } from 'react';
import { bookingApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Calendar, List, ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react';
import { exportToCsv } from '@/lib/export';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { load(); }, [dateFilter, statusFilter]);
  async function load() {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await bookingApi.list(params);
      setBookings(res.data.data);
    } catch {} finally { setLoading(false); }
  }

  async function updateStatus(id: string, status: string) {
    await bookingApi.updateStatus(id, status); load();
  }

  function shiftDate(days: number) {
    const d = new Date(dateFilter);
    d.setDate(d.getDate() + days);
    setDateFilter(d.toISOString().split('T')[0]);
  }

  const statuses = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Bookings</h1><p className="text-sm text-gray-500 mt-1">Manage in-branch appointments</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const headers = ['Reference', 'Patient', 'Service', 'Branch', 'Date', 'Time', 'Status'];
            const rows = bookings.map((b: any) => [
              b.reference,
              `${b.patient?.user?.firstName || ''} ${b.patient?.user?.lastName || ''}`.trim(),
              b.service?.name || '',
              b.branch?.name || '',
              dateFilter,
              `${b.startTime} - ${b.endTime}`,
              b.status,
            ]);
            exportToCsv('bookings.csv', headers, rows);
            toast.success('Bookings exported');
          }}><Download className="w-4 h-4" /> Export CSV</Button>
          <Link href="/admin/bookings/new"><Button><Plus className="w-4 h-4" /> New Booking</Button></Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          <button onClick={() => shiftDate(-1)} className="p-1.5 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="text-sm border-none outline-none bg-transparent px-2" />
          <button onClick={() => shiftDate(1)} className="p-1.5 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <button onClick={() => setDateFilter(new Date().toISOString().split('T')[0])} className="text-xs text-teal-600 font-medium hover:underline">Today</button>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <div className="ml-auto flex gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded text-xs font-medium ${view === 'list' ? 'bg-teal-50 text-teal-700' : 'text-gray-500'}`}><List className="w-3.5 h-3.5 inline mr-1" />List</button>
          <button onClick={() => setView('calendar')} className={`px-3 py-1.5 rounded text-xs font-medium ${view === 'calendar' ? 'bg-teal-50 text-teal-700' : 'text-gray-500'}`}><Calendar className="w-3.5 h-3.5 inline mr-1" />Calendar</button>
        </div>
      </div>

      <Card>
        <CardHeader><h3 className="text-sm font-semibold">{bookings.length} bookings for {formatDate(dateFilter)}</h3></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Service</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Branch</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {bookings.map((b: any) => (
                <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{b.startTime} - {b.endTime}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar firstName={b.patient?.user?.firstName || '?'} lastName={b.patient?.user?.lastName || '?'} size="sm" /><div><div className="font-medium">{b.patient?.user?.firstName} {b.patient?.user?.lastName}</div><div className="text-xs text-gray-400">{b.reference}</div></div></div></td>
                  <td className="px-4 py-3 text-gray-600">{b.service?.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{b.branch?.name}</td>
                  <td className="px-4 py-3"><Badge status={b.source} /></td>
                  <td className="px-4 py-3"><Badge status={b.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {b.status === 'CONFIRMED' && <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, 'CHECKED_IN')}>Check In</Button>}
                      {b.status === 'CHECKED_IN' && <Button size="sm" variant="success" onClick={() => updateStatus(b.id, 'IN_PROGRESS')}>Start</Button>}
                      {b.status === 'IN_PROGRESS' && <Button size="sm" variant="success" onClick={() => updateStatus(b.id, 'COMPLETED')}>Complete</Button>}
                      {['PENDING', 'CONFIRMED'].includes(b.status) && <Button size="sm" variant="ghost" className="text-red-600" onClick={() => updateStatus(b.id, 'CANCELLED')}>Cancel</Button>}
                      <Link href={`/admin/bookings/${b.id}`}><Button size="sm" variant="ghost">View</Button></Link>
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && !loading && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No bookings for this date</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
