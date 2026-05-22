'use client';

import { useState, useEffect } from 'react';
import { Wallet, Clock, CheckCircle, XCircle, Banknote, Loader2, DollarSign } from 'lucide-react';
import { payoutApi } from '@/lib/api';

export default function SuperAdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [processing, setProcessing] = useState<string | null>(null);
  const [payModal, setPayModal] = useState<any>(null);
  const [payForm, setPayForm] = useState({ paymentMethod: 'BANK_TRANSFER', reference: '' });

  useEffect(() => { loadData(); }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const [payoutsRes, statsRes] = await Promise.all([
        payoutApi.list({ status: filter || undefined }),
        payoutApi.stats(),
      ]);
      setPayouts(payoutsRes.data.data || []);
      setStats(statsRes.data.data);
    } catch {}
    setLoading(false);
  }

  async function handleApprove(id: string) {
    setProcessing(id);
    try {
      await payoutApi.approve(id);
      loadData();
    } catch {}
    setProcessing(null);
  }

  async function handleReject(id: string) {
    const notes = prompt('Reason for rejection:');
    if (notes === null) return;
    setProcessing(id);
    try {
      await payoutApi.reject(id, notes);
      loadData();
    } catch {}
    setProcessing(null);
  }

  async function handleMarkPaid(e: React.FormEvent) {
    e.preventDefault();
    if (!payModal) return;
    setProcessing(payModal.id);
    try {
      await payoutApi.markPaid(payModal.id, {
        paymentMethod: payForm.paymentMethod,
        reference: payForm.reference || undefined,
      });
      setPayModal(null);
      setPayForm({ paymentMethod: 'BANK_TRANSFER', reference: '' });
      loadData();
    } catch {}
    setProcessing(null);
  }

  const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    REJECTED: 'bg-red-100 text-red-700',
    PAID: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payout Management</h1>
        <p className="text-gray-500 mt-1">Approve and process pharmacy withdrawal requests</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500"><Clock className="w-4 h-4 text-amber-500" /> Pending</div>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500"><CheckCircle className="w-4 h-4 text-blue-500" /> Approved</div>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500"><Banknote className="w-4 h-4 text-green-500" /> Paid</div>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.paid}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500"><DollarSign className="w-4 h-4 text-teal-500" /> Total Paid</div>
            <p className="text-2xl font-bold text-gray-900 mt-1">£{stats.totalPaidAmount.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['PENDING', 'APPROVED', 'PAID', 'REJECTED', ''].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg transition ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Mark Paid modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPayModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Record Payment</h2>
            <p className="text-sm text-gray-500 mb-4">
              £{payModal.amount.toFixed(2)} to {payModal.tenant?.name}
            </p>
            <form onSubmit={handleMarkPaid} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Payment Method</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Reference Number</label>
                <input
                  type="text"
                  value={payForm.reference}
                  onChange={e => setPayForm({ ...payForm, reference: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900"
                  placeholder="e.g. BACS ref, cheque number"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPayModal(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600">Cancel</button>
                <button type="submit" disabled={!!processing} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">
                  {processing ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout list */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" /></div>
        ) : payouts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No payouts found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payouts.map((p: any) => (
              <div key={p.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">£{p.amount.toFixed(2)}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{p.tenant?.name}</div>
                    <div className="flex gap-3 text-xs text-gray-400 mt-1">
                      <span>Requested: {new Date(p.createdAt).toLocaleDateString('en-GB')}</span>
                      {p.bankName && <span>Bank: {p.bankName}</span>}
                      {p.sortCode && <span>Sort: {p.sortCode}</span>}
                      {p.accountNumber && <span>Acc: ****{p.accountNumber.slice(-4)}</span>}
                      {p.approvedBy && <span>Approved by: {p.approvedBy.firstName} {p.approvedBy.lastName}</span>}
                      {p.reference && <span>Ref: {p.reference}</span>}
                    </div>
                    {p.notes && <p className="text-xs text-red-500 mt-1">Note: {p.notes}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {p.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(p.id)}
                          disabled={!!processing}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(p.id)}
                          disabled={!!processing}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {p.status === 'APPROVED' && (
                      <button
                        onClick={() => setPayModal(p)}
                        className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
