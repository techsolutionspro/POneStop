'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ArrowDownRight, Wallet, Clock, Loader2 } from 'lucide-react';
import { earningsApi } from '@/lib/api';

export default function EarningsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        earningsApi.summary(),
        earningsApi.history({ type: filter || undefined }),
      ]);
      setSummary(summaryRes.data.data);
      setHistory(historyRes.data.data || []);
    } catch {}
    setLoading(false);
  }

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-500 mt-1">Track your sales, commissions, and available balance</p>
      </div>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">£{summary.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Commission Paid</p>
                <p className="text-2xl font-bold text-gray-900">£{summary.totalCommission.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Available Balance</p>
                <p className="text-2xl font-bold text-teal-600">£{summary.availableBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Payouts</p>
                <p className="text-2xl font-bold text-gray-900">£{summary.totalPayouts.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending info */}
      {summary && summary.pendingPayouts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-800">
            You have <strong>£{summary.pendingPayouts.toFixed(2)}</strong> in pending payouts awaiting approval.
          </p>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Transaction History</h2>
          <div className="flex gap-2">
            {['', 'order', 'payout'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg transition ${
                  filter === f ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === '' ? 'All' : f === 'order' ? 'Orders' : 'Payouts'}
              </button>
            ))}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No transactions yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((tx: any) => (
              <div key={tx.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.type === 'ORDER' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {tx.type === 'ORDER' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{new Date(tx.date).toLocaleDateString('en-GB')}</span>
                      {tx.reference && <span>Ref: {tx.reference}</span>}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        tx.status === 'DELIVERED' || tx.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        tx.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{tx.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount >= 0 ? '+' : ''}£{Math.abs(tx.amount).toFixed(2)}
                  </p>
                  {tx.commission > 0 && (
                    <p className="text-[10px] text-gray-400">-£{tx.commission.toFixed(2)} commission</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
