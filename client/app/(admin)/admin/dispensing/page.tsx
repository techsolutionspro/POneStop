'use client';
import { useEffect, useState } from 'react';
import { orderApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatDateTime } from '@/lib/utils';
import { Package, ScanBarcode, CheckCircle, Loader2, Snowflake } from 'lucide-react';

type DispensingStatus = 'PICKING' | 'PACKED' | 'READY_FOR_DISPATCH';

interface DispensingOrder {
  id: string;
  reference: string;
  patient: any;
  productName: string;
  productStrength?: string;
  coldChain?: boolean;
  dispensingStatus: DispensingStatus;
  createdAt: string;
}

export default function DispensingPage() {
  const [orders, setOrders] = useState<DispensingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await orderApi.list({ status: 'APPROVED' });
      const mapped = (res.data.data || []).map((o: any) => ({
        ...o,
        dispensingStatus: o.dispensingStatus || 'PICKING',
      }));
      setOrders(mapped);
    } catch {} finally { setLoading(false); }
  }

  function advanceStatus(id: string) {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next: Record<DispensingStatus, DispensingStatus> = {
        PICKING: 'PACKED',
        PACKED: 'READY_FOR_DISPATCH',
        READY_FOR_DISPATCH: 'READY_FOR_DISPATCH',
      };
      return { ...o, dispensingStatus: next[o.dispensingStatus] };
    }));
  }

  function simulateBarcodeScan(id: string) {
    setActionLoading(id);
    setTimeout(() => {
      advanceStatus(id);
      setActionLoading(null);
    }, 800);
  }

  function getActionLabel(status: DispensingStatus): string {
    switch (status) {
      case 'PICKING': return 'Pick & Pack';
      case 'PACKED': return 'Label & Ready';
      case 'READY_FOR_DISPATCH': return 'Dispatched';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispensing Worklist</h1>
          <p className="text-sm text-gray-500 mt-1">Pick, pack, and label approved online orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">Picking</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{orders.filter(o => o.dispensingStatus === 'PICKING').length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">Packed</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{orders.filter(o => o.dispensingStatus === 'PACKED').length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">Ready for Dispatch</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{orders.filter(o => o.dispensingStatus === 'READY_FOR_DISPATCH').length}</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold">Worklist ({orders.length})</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Order Ref</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Strength</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Flags</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{o.reference}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar firstName={o.patient?.user?.firstName || '?'} lastName={o.patient?.user?.lastName || '?'} size="sm" color="indigo" />
                      <span className="text-xs font-medium">{o.patient?.user?.firstName} {o.patient?.user?.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{o.productName}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{o.productStrength || '-'}</td>
                  <td className="px-4 py-3">
                    {o.coldChain ? (
                      <Badge status="COLD_CHAIN" label="Cold Chain" className="bg-cyan-50 text-cyan-700" />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      status={o.dispensingStatus}
                      label={o.dispensingStatus === 'PICKING' ? 'Picking' : o.dispensingStatus === 'PACKED' ? 'Packed' : 'Ready'}
                      className={
                        o.dispensingStatus === 'PICKING' ? 'bg-amber-50 text-amber-700' :
                        o.dispensingStatus === 'PACKED' ? 'bg-blue-50 text-blue-700' :
                        'bg-green-50 text-green-700'
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {o.dispensingStatus !== 'READY_FOR_DISPATCH' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading === o.id}
                            onClick={() => simulateBarcodeScan(o.id)}
                          >
                            <ScanBarcode className="w-3.5 h-3.5" />
                            {actionLoading === o.id ? 'Scanning...' : 'Scan'}
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => advanceStatus(o.id)}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {getActionLabel(o.dispensingStatus)}
                          </Button>
                        </>
                      )}
                      {o.dispensingStatus === 'READY_FOR_DISPATCH' && (
                        <Badge status="COMPLETED" label="Done" dot />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <div className="font-semibold text-gray-700">No orders to dispense</div>
                  <div className="text-sm text-gray-500 mt-1">Approved orders will appear here for picking and packing.</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
