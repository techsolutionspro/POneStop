'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { orderApi } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft, Clock, Package, Truck, Check, X, ShieldCheck,
  FileText, RefreshCw, Snowflake, ClipboardList, CreditCard,
} from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await orderApi.get(id);
      setOrder(res.data.data);
    } catch {} finally { setLoading(false); }
  }

  async function handleDispatch() {
    setActionLoading(true);
    try {
      await orderApi.dispatch(id, {});
      load();
    } catch {} finally { setActionLoading(false); }
  }

  function getSlaColor(deadline: string) {
    if (!deadline) return 'text-gray-400';
    const remaining = new Date(deadline).getTime() - Date.now();
    if (remaining < 3600000) return 'text-red-600';
    if (remaining < 7200000) return 'text-yellow-600';
    return 'text-green-600';
  }

  function getSlaText(deadline: string) {
    if (!deadline) return '-';
    const ms = new Date(deadline).getTime() - Date.now();
    if (ms <= 0) return 'OVERDUE';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m remaining`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-700">Order not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              firstName={order.patient?.user?.firstName || '?'}
              lastName={order.patient?.user?.lastName || '?'}
              size="lg"
              color="indigo"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {order.patient?.user?.firstName} {order.patient?.user?.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">{order.reference}</span>
                <Badge status={order.status} />
                {order.slaDeadline && (
                  <span className={`flex items-center gap-1 text-xs font-medium ${getSlaColor(order.slaDeadline)}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {getSlaText(order.slaDeadline)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/prescriber-queue">
              <Button variant="outline" size="sm"><ClipboardList className="w-3.5 h-3.5" /> Review</Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDispatch}
              disabled={actionLoading || !['APPROVED', 'DISPENSING'].includes(order.status)}
            >
              <Truck className="w-3.5 h-3.5" /> Dispatch
            </Button>
            <Button variant="danger" size="sm" disabled={actionLoading || ['REFUNDED', 'REJECTED'].includes(order.status)}>
              <RefreshCw className="w-3.5 h-3.5" /> Refund
            </Button>
          </div>
        </div>
      </div>

      {/* Order Info Grid */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-medium">Service</div>
              <div className="text-sm font-medium mt-1">{order.service?.name || '-'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-medium">Product</div>
              <div className="text-sm font-medium mt-1">{order.productName || '-'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-medium">Strength</div>
              <div className="text-sm font-medium mt-1">{order.productStrength || '-'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-medium">Quantity</div>
              <div className="text-sm font-medium mt-1">{order.quantity ?? '-'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-medium">Amount</div>
              <div className="text-sm font-medium mt-1">{formatCurrency(order.totalAmount)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-medium">Delivery</div>
              <div className="text-sm font-medium mt-1">{order.deliveryType || 'Standard'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-medium">Cold Chain</div>
              <div className="mt-1">
                {order.isColdChain ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    <Snowflake className="w-3 h-3" /> Yes
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">No</span>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questionnaire Responses */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" /> Questionnaire Responses
            </h3>
          </CardHeader>
          <CardBody>
            {order.questionnaireAnswers && typeof order.questionnaireAnswers === 'object' && Object.keys(order.questionnaireAnswers).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(order.questionnaireAnswers).map(([question, answer]) => (
                  <div key={question} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <div className="text-xs text-gray-500">{question}</div>
                    <div className="text-sm font-medium mt-0.5">{String(answer)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-4">No questionnaire data</div>
            )}
          </CardBody>
        </Card>

        {/* IDV + Consent */}
        <div className="space-y-6">
          {/* IDV Status */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-400" /> Identity Verification
              </h3>
            </CardHeader>
            <CardBody>
              {order.idvPassed ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                    <Check className="w-4 h-4" /> Verified
                  </div>
                  <div className="mt-2 text-xs text-green-600 space-y-1">
                    {order.patient?.idvProvider && <div>Provider: {order.patient.idvProvider}</div>}
                    {order.patient?.idvDocumentType && <div>Document: {order.patient.idvDocumentType}</div>}
                    {order.patient?.idvVerifiedAt && <div>Verified: {formatDateTime(order.patient.idvVerifiedAt)}</div>}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                  IDV not completed or pending
                </div>
              )}
            </CardBody>
          </Card>

          {/* Consent Checklist */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Consent Checklist</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {[
                  ['Clinical terms & conditions', order.consentClinical],
                  ['Remote consultation consent', order.consentRemote],
                  ['GP record sharing', order.consentGpShare],
                  ['Delivery authorisation', order.consentDelivery],
                  ['Privacy policy', order.consentPrivacy],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex items-center gap-2 text-sm">
                    {val ? (
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3" />
                      </span>
                    )}
                    <span className={val ? 'text-gray-700' : 'text-gray-400'}>{String(label)}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Clinical Review */}
      {order.clinicalReview && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Clinical Review</h3>
            <Badge status={order.clinicalReview.decision || order.status} />
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Reviewer</div>
                <div className="text-sm font-medium mt-1">{order.clinicalReview.reviewerName || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Reviewed At</div>
                <div className="text-sm font-medium mt-1">
                  {order.clinicalReview.reviewedAt ? formatDateTime(order.clinicalReview.reviewedAt) : '-'}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Clinical Reason</div>
                <div className="text-sm font-medium mt-1">{order.clinicalReview.clinicalReason || '-'}</div>
              </div>
            </div>
            {order.clinicalReview.notes && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <div className="text-[10px] uppercase text-gray-400 font-medium mb-1">Review Notes</div>
                <div className="text-sm text-gray-700">{order.clinicalReview.notes}</div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Prescription Details */}
      {order.prescription && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Prescription</h3>
            <Badge status={order.prescription.status || 'GENERATED'} />
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Rx Number</div>
                <div className="text-sm font-medium mt-1">{order.prescription.reference || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Prescriber</div>
                <div className="text-sm font-medium mt-1">{order.prescription.prescriberName || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Generated</div>
                <div className="text-sm font-medium mt-1">
                  {order.prescription.createdAt ? formatDateTime(order.prescription.createdAt) : '-'}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Expiry</div>
                <div className="text-sm font-medium mt-1">
                  {order.prescription.expiresAt ? formatDate(order.prescription.expiresAt) : '-'}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Shipment Tracking Timeline */}
      {order.shipment && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" /> Shipment Tracking
            </h3>
            <Badge status={order.shipment.status} />
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Carrier</div>
                <div className="text-sm font-medium mt-1">{order.shipment.carrier || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Tracking No.</div>
                <div className="text-sm font-medium mt-1">{order.shipment.trackingNumber || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Dispatched</div>
                <div className="text-sm font-medium mt-1">
                  {order.shipment.dispatchedAt ? formatDateTime(order.shipment.dispatchedAt) : '-'}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Delivered</div>
                <div className="text-sm font-medium mt-1">
                  {order.shipment.deliveredAt ? formatDateTime(order.shipment.deliveredAt) : '-'}
                </div>
              </div>
            </div>

            {/* Timeline */}
            {order.shipment.events && order.shipment.events.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Tracking Timeline</div>
                <div className="space-y-0">
                  {order.shipment.events.map((event: any, idx: number) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${idx === 0 ? 'bg-teal-600' : 'bg-gray-300'}`} />
                        {idx < order.shipment.events.length - 1 && <div className="w-px h-full bg-gray-200 min-h-[24px]" />}
                      </div>
                      <div className="pb-4">
                        <div className="text-sm font-medium">{event.description || event.status}</div>
                        <div className="text-xs text-gray-400">
                          {event.timestamp ? formatDateTime(event.timestamp) : ''} {event.location ? `- ${event.location}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
