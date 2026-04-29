'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingApi } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import {
  ArrowLeft, Calendar, Clock, MapPin, Check, X, FileText,
  CreditCard, UserCheck, Play, CheckCircle, Ban, AlertTriangle,
} from 'lucide-react';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await bookingApi.get(id);
      setBooking(res.data.data);
    } catch {} finally { setLoading(false); }
  }

  async function handleStatusUpdate(status: string, reason?: string) {
    setActionLoading(true);
    try {
      await bookingApi.updateStatus(id, status, reason);
      setShowCancelModal(false);
      setCancelReason('');
      load();
    } catch {} finally { setActionLoading(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-16">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-700">Booking not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              firstName={booking.patient?.user?.firstName || '?'}
              lastName={booking.patient?.user?.lastName || '?'}
              size="lg"
              color="teal"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {booking.patient?.user?.firstName} {booking.patient?.user?.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">{booking.reference}</span>
                <Badge status={booking.status} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {booking.status === 'CONFIRMED' && (
              <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('CHECKED_IN')} disabled={actionLoading}>
                <UserCheck className="w-3.5 h-3.5" /> Check In
              </Button>
            )}
            {booking.status === 'CHECKED_IN' && (
              <Button variant="success" size="sm" onClick={() => handleStatusUpdate('IN_PROGRESS')} disabled={actionLoading}>
                <Play className="w-3.5 h-3.5" /> Start Consultation
              </Button>
            )}
            {booking.status === 'IN_PROGRESS' && (
              <Button variant="success" size="sm" onClick={() => handleStatusUpdate('COMPLETED')} disabled={actionLoading}>
                <CheckCircle className="w-3.5 h-3.5" /> Complete
              </Button>
            )}
            {['PENDING', 'CONFIRMED'].includes(booking.status) && (
              <>
                <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-300" onClick={() => handleStatusUpdate('NO_SHOW')} disabled={actionLoading}>
                  <AlertTriangle className="w-3.5 h-3.5" /> No Show
                </Button>
                <Button variant="danger" size="sm" onClick={() => setShowCancelModal(true)} disabled={actionLoading}>
                  <Ban className="w-3.5 h-3.5" /> Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Date / Time / Service / Branch */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Date</div>
                <div className="text-sm font-semibold">{booking.date ? formatDate(booking.date) : '-'}</div>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Time</div>
                <div className="text-sm font-semibold">{booking.startTime || '-'} - {booking.endTime || '-'}</div>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Service</div>
                <div className="text-sm font-semibold">{booking.service?.name || '-'}</div>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Branch</div>
                <div className="text-sm font-semibold">{booking.branch?.name || '-'}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questionnaire Answers */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" /> Questionnaire Responses
            </h3>
          </CardHeader>
          <CardBody>
            {booking.questionnaireAnswers && typeof booking.questionnaireAnswers === 'object' && Object.keys(booking.questionnaireAnswers).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(booking.questionnaireAnswers).map(([question, answer]) => (
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

        <div className="space-y-6">
          {/* Consent Status */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Consent Status</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {[
                  ['Clinical terms & conditions', booking.consentClinical],
                  ['Data processing consent', booking.consentDataProcessing],
                  ['GP record sharing', booking.consentGpShare],
                  ['Privacy policy', booking.consentPrivacy],
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

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" /> Payment
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-medium">Amount</div>
                  <div className="text-lg font-bold mt-1">{formatCurrency(booking.totalAmount || booking.amount || 0)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-medium">Status</div>
                  <div className="mt-1"><Badge status={booking.paymentStatus || 'PENDING'} /></div>
                </div>
                {booking.paymentMethod && (
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-medium">Method</div>
                    <div className="text-sm font-medium mt-1">{booking.paymentMethod}</div>
                  </div>
                )}
                {booking.paymentReference && (
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-medium">Reference</div>
                    <div className="text-sm font-medium mt-1 font-mono text-xs">{booking.paymentReference}</div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Consultation Record */}
      {booking.consultation && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Consultation Record</h3>
            <Badge status={booking.consultation.status || 'COMPLETED'} />
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Clinician</div>
                <div className="text-sm font-medium mt-1">{booking.consultation.clinicianName || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Started</div>
                <div className="text-sm font-medium mt-1">
                  {booking.consultation.startedAt ? formatDateTime(booking.consultation.startedAt) : '-'}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Completed</div>
                <div className="text-sm font-medium mt-1">
                  {booking.consultation.completedAt ? formatDateTime(booking.consultation.completedAt) : '-'}
                </div>
              </div>
            </div>
            {booking.consultation.notes && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <div className="text-[10px] uppercase text-gray-400 font-medium mb-1">Consultation Notes</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{booking.consultation.notes}</div>
              </div>
            )}
            {booking.consultation.outcome && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <div className="text-[10px] uppercase text-gray-400 font-medium mb-1">Outcome</div>
                <div className="text-sm text-gray-700">{booking.consultation.outcome}</div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Cancel Booking</h3>
              <button onClick={() => setShowCancelModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Are you sure you want to cancel this booking? This action cannot be undone.</p>
              <div>
                <label className="text-sm font-medium text-gray-700">Cancellation Reason</label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm mt-1.5"
                  rows={3}
                  placeholder="Enter reason for cancellation..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCancelModal(false)}>Keep Booking</Button>
                <Button variant="danger" onClick={() => handleStatusUpdate('CANCELLED', cancelReason)} disabled={actionLoading}>
                  {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
