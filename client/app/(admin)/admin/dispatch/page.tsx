'use client';
import { useEffect, useState } from 'react';
import { orderApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { formatDateTime } from '@/lib/utils';
import { Truck, AlertTriangle, Printer, FileText, Send, Snowflake, CheckSquare } from 'lucide-react';

const COURIERS = ['Royal Mail', 'DPD', 'Evri', 'Cold-Chain Courier'];

interface DispatchOrder {
  id: string;
  reference: string;
  patient: any;
  productName: string;
  productStrength?: string;
  coldChain?: boolean;
  courier: string;
  trackingNumber: string;
  selected: boolean;
  createdAt: string;
}

export default function DispatchPage() {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await orderApi.list({ status: 'DISPENSING' });
      const mapped = (res.data.data || []).map((o: any) => ({
        ...o,
        courier: o.coldChain ? 'Cold-Chain Courier' : 'Royal Mail',
        trackingNumber: '',
        selected: false,
      }));
      setOrders(mapped);
    } catch {} finally { setLoading(false); }
  }

  function updateOrder(id: string, field: string, value: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  }

  function toggleSelect(id: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, selected: !o.selected } : o));
  }

  function toggleSelectAll() {
    const next = !selectAll;
    setSelectAll(next);
    setOrders(prev => prev.map(o => ({ ...o, selected: next })));
  }

  async function dispatchOrder(id: string) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    try {
      await orderApi.dispatch(id, {
        courier: order.courier,
        trackingNumber: order.trackingNumber,
      });
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch {}
  }

  async function bulkDispatch() {
    const selected = orders.filter(o => o.selected);
    for (const o of selected) {
      try {
        await orderApi.dispatch(o.id, {
          courier: o.courier,
          trackingNumber: o.trackingNumber,
        });
      } catch {}
    }
    load();
  }

  const selectedCount = orders.filter(o => o.selected).length;
  const coldChainOrders = orders.filter(o => o.coldChain);
  const now = new Date();
  const coldChainCutoff = new Date();
  coldChainCutoff.setHours(14, 0, 0, 0);
  const isColdChainWarning = coldChainOrders.length > 0 && now.getHours() >= 12;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispatch Manifest</h1>
          <p className="text-sm text-gray-500 mt-1">Packed orders ready for courier collection</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {}}>
            <Printer className="w-4 h-4" /> Print Labels
          </Button>
          <Button variant="outline" size="sm" onClick={() => {}}>
            <FileText className="w-4 h-4" /> Generate Manifest
          </Button>
          <Button variant="primary" size="sm" disabled={selectedCount === 0} onClick={bulkDispatch}>
            <Send className="w-4 h-4" /> Mark Dispatched ({selectedCount})
          </Button>
        </div>
      </div>

      {/* Cold-chain cut-off warning */}
      {isColdChainWarning && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-amber-800">Cold-Chain Cut-Off Warning</div>
            <div className="text-xs text-amber-700 mt-0.5">
              {coldChainOrders.length} cold-chain order{coldChainOrders.length > 1 ? 's' : ''} must be dispatched before 2:00 PM today for same-day collection. Current time: {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold">Ready to Ship ({orders.length})</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 w-10">
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Flags</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Courier</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Tracking Number</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className={`border-t border-gray-100 hover:bg-gray-50 ${o.coldChain ? 'bg-cyan-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={o.selected} onChange={() => toggleSelect(o.id)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </td>
                  <td className="px-4 py-3 font-medium">{o.reference}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar firstName={o.patient?.user?.firstName || '?'} lastName={o.patient?.user?.lastName || '?'} size="sm" color="indigo" />
                      <span className="text-xs font-medium">{o.patient?.user?.firstName} {o.patient?.user?.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">{o.productName}</div>
                    {o.productStrength && <div className="text-[10px] text-gray-400">{o.productStrength}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {o.coldChain ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                        <Snowflake className="w-3 h-3" /> Cold Chain
                      </span>
                    ) : <span className="text-xs text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.courier}
                      onChange={(e) => updateOrder(o.id, 'courier', e.target.value)}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white"
                    >
                      {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={o.trackingNumber}
                      onChange={(e) => updateOrder(o.id, 'trackingNumber', e.target.value)}
                      placeholder="Enter tracking..."
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white w-40 outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="primary" onClick={() => dispatchOrder(o.id)}>
                      <Send className="w-3.5 h-3.5" /> Dispatch
                    </Button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <div className="font-semibold text-gray-700">No orders ready for dispatch</div>
                  <div className="text-sm text-gray-500 mt-1">Packed orders will appear here when ready to ship.</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
