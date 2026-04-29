'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface Subscription {
  id: string;
  serviceName: string;
  pharmacyName?: string;
  status: string;
  price: number;
  frequency: string;
  nextDeliveryDate?: string;
  rescreenDueDate?: string;
  startedAt: string;
  pausedAt?: string;
}

interface SubscriptionHistory {
  id: string;
  subscriptionId: string;
  action: string;
  date: string;
  note?: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/subscriptions/me');
        const data = res.data.data;
        setSubscriptions(data?.subscriptions || data || []);
        setHistory(data?.history || []);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAction = async (subId: string, action: 'pause' | 'resume' | 'skip' | 'cancel') => {
    if (action === 'cancel' && !confirm('Are you sure you want to cancel this subscription? This cannot be undone.')) return;
    setActionLoading(subId);
    try {
      await api.post(`/subscriptions/${subId}/${action}`);
      setSubscriptions((prev) =>
        prev.map((s) => {
          if (s.id !== subId) return s;
          if (action === 'pause') return { ...s, status: 'PAUSED', pausedAt: new Date().toISOString() };
          if (action === 'resume') return { ...s, status: 'ACTIVE', pausedAt: undefined };
          if (action === 'cancel') return { ...s, status: 'CANCELLED' };
          return s;
        })
      );
    } catch {
      alert('Failed to update subscription. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Subscriptions</h1>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const active = subscriptions.filter((s) => ['ACTIVE', 'PAUSED'].includes(s.status));
  const inactive = subscriptions.filter((s) => !['ACTIVE', 'PAUSED'].includes(s.status));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Subscriptions</h3>
          <p className="text-gray-500 text-sm">You don&apos;t have any active subscriptions.</p>
        </div>
      ) : (
        <>
          {/* Active Subscriptions */}
          {active.length > 0 && (
            <div className="space-y-4 mb-8">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Active Subscriptions</h2>
              {active.map((sub) => (
                <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{sub.serviceName}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </div>
                      {sub.pharmacyName && <p className="text-sm text-gray-500">{sub.pharmacyName}</p>}
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(sub.price)}<span className="text-sm font-normal text-gray-500">/{sub.frequency}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {sub.nextDeliveryDate && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-0.5">Next Delivery</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(sub.nextDeliveryDate)}</p>
                      </div>
                    )}
                    {sub.rescreenDueDate && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-0.5">Re-screen Due</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(sub.rescreenDueDate)}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Started</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(sub.startedAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {sub.status === 'ACTIVE' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === sub.id}
                          onClick={() => handleAction(sub.id, 'pause')}
                        >
                          Pause
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === sub.id}
                          onClick={() => handleAction(sub.id, 'skip')}
                        >
                          Skip Next Delivery
                        </Button>
                      </>
                    )}
                    {sub.status === 'PAUSED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={actionLoading === sub.id}
                        onClick={() => handleAction(sub.id, 'resume')}
                      >
                        Resume
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={actionLoading === sub.id}
                      onClick={() => handleAction(sub.id, 'cancel')}
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inactive Subscriptions */}
          {inactive.length > 0 && (
            <div className="space-y-4 mb-8">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Past Subscriptions</h2>
              {inactive.map((sub) => (
                <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-5 opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{sub.serviceName}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Started {formatDate(sub.startedAt)}</p>
                    </div>
                    <p className="font-medium text-gray-700">{formatCurrency(sub.price)}/{sub.frequency}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History Table */}
          {history.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Subscription History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">{formatDate(h.date)}</td>
                        <td className="px-6 py-3 text-sm text-gray-700">{h.action.replace(/_/g, ' ')}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">{h.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
