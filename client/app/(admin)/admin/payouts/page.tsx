'use client';

import { useState, useEffect } from 'react';
import { Wallet, Clock, CheckCircle, XCircle, Loader2, Plus, Banknote } from 'lucide-react';
import { payoutApi, earningsApi } from '@/lib/api';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ amount: '', bankName: '', accountNumber: '', sortCode: '' });
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [payoutsRes, statsRes, earningsRes] = await Promise.all([
        payoutApi.list(),
        payoutApi.stats(),
        earningsApi.summary(),
      ]);
      setPayouts(payoutsRes.data.data || []);
      setStats(statsRes.data.data);
      setBalance(earningsRes.data.data?.availableBalance || 0);
    } catch {}
    setLoading(false);
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return; }
    if (amount > balance) { setError('Amount exceeds available balance'); return; }

    setSubmitting(true);
    try {
      await payoutApi.request({
        amount,
        bankName: form.bankName || undefined,
        accountNumber: form.accountNumber || undefined,
        sortCode: form.sortCode || undefined,
      });
      setShowForm(false);
      setForm({ amount: '', bankName: '', accountNumber: '', sortCode: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request payout');
    }
    setSubmitting(false);
  }

  const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    REJECTED: 'bg-red-100 text-red-700',
    PAID: 'bg-green-100 text-green-700',
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="text-gray-500 mt-1">Request withdrawals from your available balance</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={balance <= 0}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Request Payout
        </button>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white">
        <p className="text-teal-100 text-sm">Available Balance</p>
        <p className="text-4xl font-bold mt-1">£{balance.toFixed(2)}</p>
        {stats && (
          <div className="mt-4 flex gap-6 text-sm text-teal-100">
            <span>{stats.pending} pending</span>
            <span>{stats.approved} approved</span>
            <span>£{stats.totalPaidAmount.toFixed(2)} total paid out</span>
          </div>
        )}
      </div>

      {/* Request form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Payout</h2>
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Amount (max £{balance.toFixed(2)})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
                  <input
                    type="number"
                    step="0.01"
                    max={balance}
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-2.5 text-gray-900"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={e => setForm({ ...form, bankName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900"
                  placeholder="e.g. Barclays"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Sort Code</label>
                  <input
                    type="text"
                    value={form.sortCode}
                    onChange={e => setForm({ ...form, sortCode: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900"
                    placeholder="00-00-00"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Account Number</label>
                  <input
                    type="text"
                    value={form.accountNumber}
                    onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900"
                    placeholder="12345678"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">
                  {submitting ? 'Requesting...' : 'Request Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout history */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Payout History</h2>
        </div>
        {payouts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Banknote className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No payouts yet. Request your first payout when you have a balance.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payouts.map((p: any) => (
              <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    p.status === 'PAID' ? 'bg-green-50' :
                    p.status === 'REJECTED' ? 'bg-red-50' :
                    'bg-amber-50'
                  }`}>
                    {p.status === 'PAID' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                     p.status === 'REJECTED' ? <XCircle className="w-4 h-4 text-red-600" /> :
                     <Clock className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">£{p.amount.toFixed(2)}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{new Date(p.createdAt).toLocaleDateString('en-GB')}</span>
                      {p.bankName && <span>{p.bankName}</span>}
                      {p.reference && <span>Ref: {p.reference}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-600'}`}>
                    {p.status}
                  </span>
                  {p.paidAt && <span className="text-xs text-gray-400">Paid {new Date(p.paidAt).toLocaleDateString('en-GB')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
