'use client';
import { useState } from 'react';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { Send, Mail, MessageSquare, Tag, Plus, Trash2, X, Eye, MousePointer } from 'lucide-react';

const SEGMENTS = [
  'All Patients',
  'Active Subscribers',
  'Lapsed Patients (90+ days)',
  'Recent Orders',
  'Booking No-Shows',
  'IDV Verified',
];

export default function MarketingPage() {
  const [broadcastType, setBroadcastType] = useState<'email' | 'sms'>('email');
  const [segment, setSegment] = useState('All Patients');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentNotice, setSentNotice] = useState('');

  // Coupons
  const [coupons, setCoupons] = useState([
    { id: '1', code: 'WELCOME10', discount: '10%', expiry: '2026-06-30', uses: 45, active: true },
    { id: '2', code: 'SUMMER15', discount: '15%', expiry: '2026-08-31', uses: 12, active: true },
  ]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discount: '', expiry: '' });

  // Stats
  const stats = {
    emailsSent: 2840,
    smsSent: 1256,
    openRate: 42,
    clickRate: 18,
  };

  function handleSendBroadcast() {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSentNotice(`${broadcastType === 'email' ? 'Email' : 'SMS'} broadcast queued to "${segment}"`);
      setSubject('');
      setMessage('');
      setTimeout(() => setSentNotice(''), 4000);
    }, 1200);
  }

  function addCoupon() {
    if (!couponForm.code || !couponForm.discount) return;
    setCoupons(prev => [...prev, {
      id: Date.now().toString(),
      code: couponForm.code.toUpperCase(),
      discount: couponForm.discount,
      expiry: couponForm.expiry,
      uses: 0,
      active: true,
    }]);
    setCouponForm({ code: '', discount: '', expiry: '' });
    setShowCouponForm(false);
  }

  function removeCoupon(id: string) {
    setCoupons(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <p className="text-sm text-gray-500 mt-1">Broadcasts, coupons, and campaign stats</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Emails Sent" value={stats.emailsSent.toLocaleString()} change="This month" trend="neutral" />
        <StatCard label="SMS Sent" value={stats.smsSent.toLocaleString()} change="This month" trend="neutral" />
        <StatCard label="Open Rate" value={`${stats.openRate}%`} change="+3% vs last month" trend="up" />
        <StatCard label="Click Rate" value={`${stats.clickRate}%`} change="+1% vs last month" trend="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast Composer */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Send Broadcast</h3>
          </CardHeader>
          <CardBody>
            {sentNotice && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 mb-4">{sentNotice}</div>
            )}
            <div className="space-y-4">
              {/* Type Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setBroadcastType('email')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    broadcastType === 'email' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
                <button
                  onClick={() => setBroadcastType('sms')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    broadcastType === 'sms' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> SMS
                </button>
              </div>

              {/* Segment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Patient Segment</label>
                <select
                  value={segment}
                  onChange={e => setSegment(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Subject (email only) */}
              {broadcastType === 'email' && (
                <Input label="Subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject line..." />
              )}

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                  placeholder={broadcastType === 'email' ? 'Write your email content...' : 'Write your SMS message (160 chars)...'}
                  maxLength={broadcastType === 'sms' ? 160 : undefined}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
                {broadcastType === 'sms' && (
                  <span className="text-[10px] text-gray-400">{message.length}/160 characters</span>
                )}
              </div>

              <Button onClick={handleSendBroadcast} disabled={sending || !message.trim()}>
                <Send className="w-4 h-4" /> {sending ? 'Sending...' : `Send ${broadcastType === 'email' ? 'Email' : 'SMS'}`}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Coupon Codes */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Coupon Codes</h3>
            <Button size="sm" variant="outline" onClick={() => setShowCouponForm(true)}>
              <Plus className="w-3.5 h-3.5" /> Create Coupon
            </Button>
          </CardHeader>
          <CardBody>
            {showCouponForm && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">New Coupon</span>
                  <button onClick={() => setShowCouponForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <Input label="Code" placeholder="e.g. SPRING20" value={couponForm.code}
                  onChange={e => setCouponForm(f => ({ ...f, code: e.target.value }))} />
                <Input label="Discount" placeholder="e.g. 10% or 5.00" value={couponForm.discount}
                  onChange={e => setCouponForm(f => ({ ...f, discount: e.target.value }))} />
                <Input label="Expiry Date" type="date" value={couponForm.expiry}
                  onChange={e => setCouponForm(f => ({ ...f, expiry: e.target.value }))} />
                <Button size="sm" onClick={addCoupon}>Create</Button>
              </div>
            )}
            <div className="space-y-3">
              {coupons.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Tag className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-mono text-sm font-bold text-gray-900">{c.code}</div>
                      <div className="text-[10px] text-gray-400">{c.discount} off{c.expiry ? ` | Expires ${formatDate(c.expiry)}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{c.uses} uses</span>
                    <Badge status={c.active ? 'ACTIVE' : 'DRAFT'} />
                    <button onClick={() => removeCoupon(c.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {coupons.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-400">No coupons created yet.</div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
