'use client';
import { useEffect, useState } from 'react';
import { orderApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ClipboardList, Check, X, MessageCircle, ArrowUpRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrescriberQueuePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [clinicalReason, setClinicalReason] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    try { const res = await orderApi.queue(); setOrders(res.data.data); if (res.data.data.length > 0 && !selected) setSelected(res.data.data[0]); } catch {} finally { setLoading(false); }
  }

  async function loadOrderDetail(id: string) {
    try { const res = await orderApi.get(id); setSelected(res.data.data); } catch {}
  }

  async function handleReview(action: 'APPROVE' | 'REJECT' | 'QUERY' | 'ESCALATE') {
    if (!selected) return;
    setReviewLoading(true);
    try {
      await orderApi.review(selected.id, { action, notes: reviewNotes, clinicalReason });
      const messages: Record<string, string> = { APPROVE: 'Order approved', REJECT: 'Order rejected', QUERY: 'Query sent to patient', ESCALATE: 'Order escalated' };
      toast.success(messages[action] || 'Review submitted');
      setReviewNotes(''); setClinicalReason('');
      load(); setSelected(null);
    } catch {} finally { setReviewLoading(false); }
  }

  function getSlaColor(order: any) {
    if (!order.slaDeadline) return 'text-gray-400';
    const remaining = new Date(order.slaDeadline).getTime() - Date.now();
    if (remaining < 3600000) return 'text-red-600'; // < 1h
    if (remaining < 7200000) return 'text-yellow-600'; // < 2h
    return 'text-green-600';
  }
  function getSlaText(order: any) {
    if (!order.slaDeadline) return '-';
    const ms = new Date(order.slaDeadline).getTime() - Date.now();
    if (ms <= 0) return 'OVERDUE';
    const h = Math.floor(ms / 3600000); const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Prescriber Queue</h1><p className="text-sm text-gray-500 mt-1">{orders.length} orders awaiting clinical review</p></div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Queue List */}
        <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Awaiting Review</span>
            <span className="text-xs text-gray-400">SLA</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {orders.map((o: any) => (
              <button key={o.id} onClick={() => loadOrderDetail(o.id)} className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 transition ${selected?.id === o.id ? 'bg-teal-50 border-l-[3px] border-l-teal-600' : ''}`}>
                <Avatar firstName={o.patient?.user?.firstName || '?'} lastName={o.patient?.user?.lastName || '?'} size="sm" color="amber" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{o.patient?.user?.firstName} {o.patient?.user?.lastName}</div>
                  <div className="text-[11px] text-gray-500 truncate">{o.service?.name} | {o.productName}</div>
                </div>
                <div className={`text-[11px] font-medium ${getSlaColor(o)}`}>{getSlaText(o)}</div>
              </button>
            ))}
            {orders.length === 0 && !loading && (
              <div className="flex flex-col items-center py-12 text-center px-4">
                <ClipboardList className="w-10 h-10 text-gray-300 mb-3" />
                <div className="text-sm font-medium text-gray-700">Queue empty</div>
                <div className="text-xs text-gray-400 mt-1">All orders have been reviewed</div>
              </div>
            )}
          </div>
        </div>

        {/* Order Detail */}
        {selected ? (
          <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar firstName={selected.patient?.user?.firstName || '?'} lastName={selected.patient?.user?.lastName || '?'} color="amber" />
                <div>
                  <h3 className="text-lg font-semibold">{selected.patient?.user?.firstName} {selected.patient?.user?.lastName}</h3>
                  <div className="text-sm text-gray-500">DOB: {selected.patient?.dateOfBirth ? new Date(selected.patient.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'} | {selected.patient?.gender || 'N/A'} | {selected.reference}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {selected.idvPassed && <Badge status="VERIFIED" label="ID Verified" />}
                <Badge status={selected.status} />
                <div className={`flex items-center gap-1 text-xs font-medium ${getSlaColor(selected)}`}><Clock className="w-3.5 h-3.5" />{getSlaText(selected)}</div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {/* Order Info */}
              <div className="col-span-2 bg-gray-50 rounded-lg p-4 grid grid-cols-4 gap-4">
                <div><div className="text-[10px] uppercase text-gray-400 font-medium">Service</div><div className="text-sm font-medium mt-1">{selected.service?.name}</div></div>
                <div><div className="text-[10px] uppercase text-gray-400 font-medium">Product</div><div className="text-sm font-medium mt-1">{selected.productName} {selected.productStrength}</div></div>
                <div><div className="text-[10px] uppercase text-gray-400 font-medium">Amount</div><div className="text-sm font-medium mt-1">{formatCurrency(selected.totalAmount)}</div></div>
                <div><div className="text-[10px] uppercase text-gray-400 font-medium">Delivery</div><div className="text-sm font-medium mt-1">{selected.isColdChain ? 'Cold-Chain' : 'Standard'}</div></div>
              </div>

              {/* Questionnaire */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-3">Questionnaire Responses</h4>
                {selected.questionnaireAnswers && typeof selected.questionnaireAnswers === 'object' ? (
                  <div className="space-y-2">
                    {Object.entries(selected.questionnaireAnswers).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm"><span className="text-gray-500">{k}</span><span className="font-medium">{String(v)}</span></div>
                    ))}
                  </div>
                ) : <div className="text-sm text-gray-400">No questionnaire data</div>}
              </div>

              {/* Consent + IDV */}
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3">Identity Verification</h4>
                  {selected.idvPassed ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700"><Check className="w-4 h-4" /><strong>Verified</strong> — {selected.patient?.idvProvider}, {selected.patient?.idvDocumentType}</div>
                  ) : <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">IDV not completed</div>}
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3">Consent</h4>
                  <div className="space-y-1.5 text-sm">
                    {[['Clinical terms', selected.consentClinical], ['Remote consultation', selected.consentRemote], ['GP sharing', selected.consentGpShare], ['Delivery auth', selected.consentDelivery]].map(([label, val]) => (
                      <div key={String(label)} className="flex items-center gap-2">{val ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-gray-300" />}{String(label)}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Review Actions */}
              <div className="col-span-2 border-2 border-gray-200 rounded-lg p-5">
                <h4 className="text-sm font-semibold mb-3">Clinical Review</h4>
                <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-3" rows={2} placeholder="Review notes (optional)..." />
                <textarea value={clinicalReason} onChange={e => setClinicalReason(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4" rows={2} placeholder="Clinical reason (required for reject/query)..." />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleReview('ESCALATE')} disabled={reviewLoading}><ArrowUpRight className="w-3.5 h-3.5" /> Escalate</Button>
                    <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-300" onClick={() => handleReview('QUERY')} disabled={reviewLoading}><MessageCircle className="w-3.5 h-3.5" /> Query Patient</Button>
                    <Button variant="danger" size="sm" onClick={() => handleReview('REJECT')} disabled={reviewLoading}><X className="w-3.5 h-3.5" /> Reject</Button>
                  </div>
                  <Button variant="success" onClick={() => handleReview('APPROVE')} disabled={reviewLoading}><Check className="w-4 h-4" /> Approve & Generate Rx</Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 text-sm">Select an order to review</div>
        )}
      </div>
    </div>
  );
}
