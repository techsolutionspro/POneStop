'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { patientApi, bookingApi, orderApi } from '@/lib/api';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft, Users, Calendar, ShoppingBag, CreditCard,
  Check, X, ShieldCheck, Phone, Mail, MapPin,
} from 'lucide-react';

const TABS = ['Overview', 'Bookings', 'Orders', 'Subscriptions'] as const;
type Tab = typeof TABS[number];

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await patientApi.get(id);
      setPatient(res.data.data);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => {
    if (activeTab === 'Bookings' && bookings.length === 0) loadBookings();
    if (activeTab === 'Orders' && orders.length === 0) loadOrders();
  }, [activeTab]);

  async function loadBookings() {
    setBookingsLoading(true);
    try {
      const res = await bookingApi.list({ patientId: id });
      setBookings(res.data.data || []);
    } catch {} finally { setBookingsLoading(false); }
  }

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const res = await orderApi.list({ patientId: id });
      setOrders(res.data.data || []);
    } catch {} finally { setOrdersLoading(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-16">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-700">Patient not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const user = patient.user || {};

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar firstName={user.firstName || '?'} lastName={user.lastName || '?'} size="lg" color="teal" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                {patient.dateOfBirth && <span>DOB: {formatDate(patient.dateOfBirth)}</span>}
                {patient.gender && <span>{patient.gender}</span>}
                <Badge status={patient.idvStatus || 'PENDING_VERIFICATION'} />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
          {user.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-gray-400" /> {user.email}
            </span>
          )}
          {user.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-gray-400" /> {user.phone}
            </span>
          )}
          {patient.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" /> {patient.address}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Bookings" value={patient.bookingsCount ?? 0} />
            <StatCard label="Total Orders" value={patient.ordersCount ?? 0} />
            <StatCard label="Active Subscriptions" value={patient.subscriptionsCount ?? 0} />
            <StatCard label="Total Spent" value={formatCurrency(patient.totalSpent || 0)} />
          </div>

          {/* IDV Status */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-400" /> Identity Verification
              </h3>
            </CardHeader>
            <CardBody>
              {patient.idvStatus === 'VERIFIED' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                    <Check className="w-4 h-4" /> Verified
                  </div>
                  <div className="mt-2 text-xs text-green-600 space-y-1">
                    {patient.idvProvider && <div>Provider: {patient.idvProvider}</div>}
                    {patient.idvDocumentType && <div>Document: {patient.idvDocumentType}</div>}
                    {patient.idvVerifiedAt && <div>Verified: {formatDateTime(patient.idvVerifiedAt)}</div>}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                  Identity verification pending
                </div>
              )}
            </CardBody>
          </Card>

          {/* Recent Activity */}
          {patient.recentActivity && patient.recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Recent Activity</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {patient.recentActivity.map((activity: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                      <div className="flex-1">{activity.description || activity.type}</div>
                      <div className="text-xs text-gray-400">{activity.createdAt ? formatDateTime(activity.createdAt) : ''}</div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'Bookings' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Booking History</h3>
            <span className="text-xs text-gray-400">{bookings.length} bookings</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Branch</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => (
                  <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{b.reference}</td>
                    <td className="px-4 py-3 text-gray-600">{b.service?.name}</td>
                    <td className="px-4 py-3 text-gray-600">{b.date ? formatDate(b.date) : '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{b.startTime} - {b.endTime}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{b.branch?.name}</td>
                    <td className="px-4 py-3"><Badge status={b.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/bookings/${b.id}`}><Button size="sm" variant="ghost">View</Button></Link>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && !bookingsLoading && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'Orders' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Order History</h3>
            <span className="text-xs text-gray-400">{orders.length} orders</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{o.reference}</td>
                    <td className="px-4 py-3 text-gray-600">{o.service?.name}</td>
                    <td className="px-4 py-3"><div className="text-xs">{o.productName}</div>{o.productStrength && <div className="text-[10px] text-gray-400">{o.productStrength}</div>}</td>
                    <td className="px-4 py-3"><Badge status={o.status} /></td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.totalAmount)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${o.id}`}><Button size="sm" variant="ghost">View</Button></Link>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && !ordersLoading && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'Subscriptions' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Active Subscriptions</h3>
          </CardHeader>
          <CardBody>
            {patient.subscriptions && patient.subscriptions.length > 0 ? (
              <div className="space-y-3">
                {patient.subscriptions.map((sub: any) => (
                  <div key={sub.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{sub.service?.name || sub.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {sub.productName && <span>{sub.productName} {sub.productStrength && `(${sub.productStrength})`} | </span>}
                        {sub.frequency || 'Monthly'} | Next: {sub.nextDeliveryDate ? formatDate(sub.nextDeliveryDate) : '-'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{formatCurrency(sub.amount || 0)}</span>
                      <Badge status={sub.status || 'ACTIVE'} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-8">
                <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <div>No active subscriptions</div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
