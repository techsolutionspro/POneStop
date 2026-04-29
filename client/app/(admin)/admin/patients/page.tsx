'use client';
import { useEffect, useState } from 'react';
import { patientApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { Users, Search, Filter, Download } from 'lucide-react';
import { exportToCsv } from '@/lib/export';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { setSearchDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { load(); }, [page, searchDebounced]);

  async function load() {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (searchDebounced) params.search = searchDebounced;
      const res = await patientApi.list(params);
      setPatients(res.data.data);
      setMeta(res.data.meta);
    } catch {} finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-500 mt-1">Patient records and CRM</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => {
            const headers = ['Name', 'Email', 'Phone', 'IDV Status', 'Bookings', 'Orders', 'Joined'];
            const rows = patients.map((p: any) => [
              `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim(),
              p.user?.email || '',
              p.user?.phone || '',
              p.idvStatus || 'PENDING',
              p.bookingsCount ?? 0,
              p.ordersCount ?? 0,
              p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
            ]);
            exportToCsv('patients.csv', headers, rows);
            toast.success('Patients exported');
          }}><Download className="w-4 h-4" /> Export CSV</Button>
          <span className="text-xs text-gray-500">{meta.total || 0} total patients</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-72">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full"
            placeholder="Search by name, email, or phone..."
          />
        </div>
        <Button variant="outline" size="sm"><Filter className="w-3.5 h-3.5" /> Filters</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">IDV Status</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Bookings</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Subscriptions</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p: any) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={p.user?.firstName || '?'} lastName={p.user?.lastName || '?'} size="sm" color="teal" />
                      <div>
                        <div className="font-medium">{p.user?.firstName} {p.user?.lastName}</div>
                        {p.dateOfBirth && <div className="text-[10px] text-gray-400">DOB: {formatDate(p.dateOfBirth)}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{p.user?.email}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{p.user?.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge status={p.idvStatus || 'PENDING_VERIFICATION'} />
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-gray-700">{p.bookingsCount ?? 0}</td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-gray-700">{p.ordersCount ?? 0}</td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-gray-700">{p.subscriptionsCount ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.createdAt ? formatDate(p.createdAt) : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/patients/${p.id}`}>
                      <Button size="sm" variant="ghost">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && !loading && (
                <tr><td colSpan={9} className="px-4 py-16 text-center">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <div className="font-semibold text-gray-700">No patients found</div>
                  <div className="text-sm text-gray-500 mt-1">Patient records will appear here as they register.</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">Page {meta.page} of {meta.totalPages}</div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={!meta.hasPrev} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={!meta.hasNext} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
