'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Eye, MousePointerClick, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { adApi } from '@/lib/api';

export default function SuperAdminAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { loadData(); }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const [adsRes, statsRes] = await Promise.all([
        adApi.list({ status: filter || undefined }),
        adApi.stats(),
      ]);
      setAds(adsRes.data.data || []);
      setStats(statsRes.data.data);
    } catch {}
    setLoading(false);
  }

  const STATUS_STYLES: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    ACTIVE: 'bg-green-100 text-green-700',
    PAUSED: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ad Revenue Overview</h1>
        <p className="text-gray-500 mt-1">Monitor all pharmacy advertising campaigns and revenue</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Campaigns</div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCampaigns}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-1 text-sm text-gray-500"><Megaphone className="w-3.5 h-3.5" /> Active</div>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeCampaigns}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-1 text-sm text-gray-500"><DollarSign className="w-3.5 h-3.5" /> Revenue</div>
            <p className="text-2xl font-bold text-gray-900 mt-1">£{stats.totalSpent.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-1 text-sm text-gray-500"><Eye className="w-3.5 h-3.5" /> Impressions</div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalImpressions.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-1 text-sm text-gray-500"><MousePointerClick className="w-3.5 h-3.5" /> Clicks</div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalClicks.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">CTR: {stats.avgCtr}%</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'ACTIVE', 'PAUSED', 'DRAFT', 'COMPLETED'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg transition ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Ad list */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" /></div>
        ) : ads.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No ads found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Pharmacy</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Budget</th>
                <th className="px-5 py-3 font-medium text-right">Spent</th>
                <th className="px-5 py-3 font-medium text-right">Impr.</th>
                <th className="px-5 py-3 font-medium text-right">Clicks</th>
                <th className="px-5 py-3 font-medium text-right">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ads.map((ad: any) => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{ad.title}</p>
                    {ad.targetPostcode && <p className="text-xs text-gray-400">Target: {ad.targetPostcode}</p>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{ad.tenant?.name || '-'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[ad.status]}`}>{ad.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-900">£{ad.budget}</td>
                  <td className="px-5 py-3 text-right text-gray-900">£{ad.spent.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{ad.impressions.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{ad.clicks}</td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    {ad.impressions > 0 ? `${((ad.clicks / ad.impressions) * 100).toFixed(1)}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
