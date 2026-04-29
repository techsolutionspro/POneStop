'use client';
import { useEffect, useState } from 'react';
import { auditApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatDateTime } from '@/lib/utils';
import { Shield, Search } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  useEffect(() => { load(); loadStats(); }, [page, actionFilter, resourceFilter]);
  async function load() {
    setLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource = resourceFilter;
      const res = await auditApi.list(params);
      setLogs(res.data.data); setMeta(res.data.meta);
    } catch {} finally { setLoading(false); }
  }
  async function loadStats() { try { const res = await auditApi.stats(); setStats(res.data.data); } catch {} }

  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'IMPERSONATE', 'APPROVE', 'REJECT', 'DISPATCH', 'REFUND', 'EXPORT'];
  const resources = ['user', 'tenant', 'booking', 'online_order', 'pgd', 'consultation', 'prescription', 'shipment'];

  const actionColors: Record<string, string> = { CREATE: 'bg-green-50 text-green-700', UPDATE: 'bg-blue-50 text-blue-700', DELETE: 'bg-red-50 text-red-700', LOGIN: 'bg-gray-100 text-gray-600', APPROVE: 'bg-green-50 text-green-700', REJECT: 'bg-red-50 text-red-700', REFUND: 'bg-yellow-50 text-yellow-700', IMPERSONATE: 'bg-purple-50 text-purple-700', DISPATCH: 'bg-blue-50 text-blue-700', EXPORT: 'bg-gray-100 text-gray-600' };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Audit Logs</h1><p className="text-sm text-gray-500 mt-1">Immutable record of all platform activity</p></div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4"><div className="text-xs text-gray-500">Events Today</div><div className="text-2xl font-bold mt-1">{stats.totalToday || 0}</div></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><div className="text-xs text-gray-500">Logins Today</div><div className="text-2xl font-bold mt-1">{stats.loginCount || 0}</div></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><div className="text-xs text-gray-500">Refunds Today</div><div className="text-2xl font-bold text-yellow-600 mt-1">{stats.refundCount || 0}</div></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><div className="text-xs text-gray-500">Impersonations</div><div className="text-2xl font-bold text-purple-600 mt-1">{stats.impersonationCount || 0}</div></div>
      </div>

      <div className="flex items-center gap-3">
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"><option value="">All Actions</option>{actions.map(a => <option key={a} value={a}>{a}</option>)}</select>
        <select value={resourceFilter} onChange={e => { setResourceFilter(e.target.value); setPage(1); }} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"><option value="">All Resources</option>{resources.map(r => <option key={r} value={r}>{r}</option>)}</select>
        <div className="ml-auto text-xs text-gray-500">{meta.total || 0} events</div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Resource</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Impersonated By</th>
            </tr></thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar firstName={l.user?.firstName || '?'} lastName={l.user?.lastName || '?'} size="sm" /><div><div className="text-xs font-medium">{l.user?.firstName} {l.user?.lastName}</div><div className="text-[10px] text-gray-400">{l.user?.role}</div></div></div></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${actionColors[l.action] || 'bg-gray-100 text-gray-600'}`}>{l.action}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-gray-600">{l.resource}</span>{l.resourceId && <span className="text-[10px] text-gray-400 ml-1">#{l.resourceId.slice(-6)}</span>}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{l.details ? JSON.stringify(l.details).slice(0, 80) : '-'}</td>
                  <td className="px-4 py-3">{l.impersonatedBy ? <span className="text-xs text-purple-600">{l.impersonatedBy.firstName} {l.impersonatedBy.lastName}</span> : <span className="text-xs text-gray-400">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 1 && <div className="flex items-center justify-between px-4 py-3 border-t"><div className="text-xs text-gray-500">Page {meta.page} of {meta.totalPages}</div><div className="flex gap-1"><Button size="sm" variant="outline" disabled={!meta.hasPrev} onClick={() => setPage(p => p-1)}>Prev</Button><Button size="sm" variant="outline" disabled={!meta.hasNext} onClick={() => setPage(p => p+1)}>Next</Button></div></div>}
      </Card>
    </div>
  );
}
