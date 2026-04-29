'use client';
import { useEffect, useState } from 'react';
import { orderApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingBag, Search, Filter, Download, AlertTriangle, Clock, TrendingDown, DollarSign } from 'lucide-react';
import { exportToCsv } from '@/lib/export';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [page, statusFilter]);
  async function load() {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await orderApi.list(params);
      setOrders(res.data.data); setMeta(res.data.meta);
    } catch {} finally { setLoading(false); }
  }

  const statuses = ['RECEIVED', 'AWAITING_IDV', 'IDV_PASSED', 'AWAITING_REVIEW', 'QUERIED', 'APPROVED', 'REJECTED', 'DISPENSING', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REFUNDED'];

  const statusTabs = [
    { value: '', label: 'All' },
    { value: 'AWAITING_REVIEW', label: 'Awaiting Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'DISPATCHED', label: 'Dispatched' },
    { value: 'DELIVERED', label: 'Delivered' },
  ];

  const todayOrders = orders.filter((o: any) => {
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const rejectedCount = orders.filter((o: any) => o.status === 'REJECTED').length;
  const rejectionRate = orders.length > 0 ? ((rejectedCount / orders.length) * 100).toFixed(1) : '0.0';
  const coldChainOrders = orders.filter((o: any) => o.requiresColdChain && ['APPROVED', 'DISPENSING'].includes(o.status));

  // SLA: orders older than 4h that are still in review statuses
  const slaThresholdMs = 4 * 60 * 60 * 1000;
  const getOrderAge = (o: any) => o.createdAt ? Date.now() - new Date(o.createdAt).getTime() : 0;
  const isApproachingSla = (o: any) => {
    if (!['RECEIVED', 'AWAITING_IDV', 'IDV_PASSED', 'AWAITING_REVIEW', 'QUERIED'].includes(o.status)) return false;
    return getOrderAge(o) > slaThresholdMs * 0.75;
  };
  const isBreachingSla = (o: any) => {
    if (!['RECEIVED', 'AWAITING_IDV', 'IDV_PASSED', 'AWAITING_REVIEW', 'QUERIED'].includes(o.status)) return false;
    return getOrderAge(o) > slaThresholdMs;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Online Orders</h1><p className="text-sm text-gray-500 mt-1">Manage online orders and home delivery</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const headers = ['Reference', 'Patient', 'Service', 'Product', 'Status', 'Amount', 'Date'];
            const rows = orders.map((o: any) => [
              o.reference,
              `${o.patient?.user?.firstName || ''} ${o.patient?.user?.lastName || ''}`.trim(),
              o.service?.name || '',
              o.productName || '',
              o.status,
              o.totalAmount,
              o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '',
            ]);
            exportToCsv('orders.csv', headers, rows);
            toast.success('Orders exported');
          }}><Download className="w-4 h-4" /> Export CSV</Button>
          <Link href="/admin/prescriber-queue"><Button variant="outline">Prescriber Queue</Button></Link>
          <Link href="/admin/dispatch"><Button variant="outline">Dispatch</Button></Link>
        </div>
      </div>

      {/* Cold Chain Warning */}
      {coldChainOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-800">{coldChainOrders.length} cold-chain order{coldChainOrders.length > 1 ? 's' : ''} pending dispatch</div>
            <div className="text-xs text-blue-600 mt-0.5">These orders require temperature-controlled packaging. Dispatch before end of day.</div>
          </div>
          <Link href="/admin/dispatch"><Button size="sm" variant="outline">Go to Dispatch</Button></Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-5 h-5" /></div>
          <div><div className="text-2xl font-bold text-gray-900">{todayOrders.length}</div><div className="text-xs text-gray-500">Orders Today</div></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0"><DollarSign className="w-5 h-5" /></div>
          <div><div className="text-2xl font-bold text-gray-900">{formatCurrency(todayRevenue)}</div><div className="text-xs text-gray-500">Revenue Today</div></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5" /></div>
          <div><div className="text-2xl font-bold text-gray-900">&lt;4h</div><div className="text-xs text-gray-500">Avg Processing</div></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0"><TrendingDown className="w-5 h-5" /></div>
          <div><div className="text-2xl font-bold text-gray-900">{rejectionRate}%</div><div className="text-xs text-gray-500">Rejection Rate</div></div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-64"><Search className="w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" placeholder="Search orders..." /></div>
          <div className="text-xs text-gray-500">{meta.total || 0} total orders</div>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Service</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Shipping</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase"></th>
            </tr></thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className={`border-t border-gray-100 hover:bg-gray-50 ${isBreachingSla(o) ? 'border-l-4 border-l-red-500 bg-red-50/30' : isApproachingSla(o) ? 'border-l-4 border-l-yellow-400 bg-yellow-50/30' : ''}`}>
                  <td className="px-4 py-3 font-medium">{o.reference}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar firstName={o.patient?.user?.firstName || '?'} lastName={o.patient?.user?.lastName || '?'} size="sm" color="indigo" /><div><div className="font-medium text-xs">{o.patient?.user?.firstName} {o.patient?.user?.lastName}</div><div className="text-[10px] text-gray-400">{o.idvPassed ? 'ID Verified' : 'IDV Pending'}</div></div></div></td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{o.service?.name}</td>
                  <td className="px-4 py-3"><div className="text-xs">{o.productName}</div>{o.productStrength && <div className="text-[10px] text-gray-400">{o.productStrength}</div>}</td>
                  <td className="px-4 py-3"><Badge status={o.status} /></td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.totalAmount)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(o.createdAt)}</td>
                  <td className="px-4 py-3">{o.shipment ? <Badge status={o.shipment.status} /> : <span className="text-xs text-gray-400">-</span>}</td>
                  <td className="px-4 py-3 text-right"><Link href={`/admin/orders/${o.id}`}><Button size="sm" variant="ghost">View</Button></Link></td>
                </tr>
              ))}
              {orders.length === 0 && !loading && <tr><td colSpan={9} className="px-4 py-16 text-center"><ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" /><div className="font-semibold text-gray-700">No orders yet</div><div className="text-sm text-gray-500 mt-1">Orders will appear here when patients purchase online.</div></td></tr>}
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
