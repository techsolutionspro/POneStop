'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Eye, MousePointerClick, TrendingUp, Loader2, Pause, Play } from 'lucide-react';
import { adApi } from '@/lib/api';

export default function AdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', budget: '', cpc: '0.50',
    targetPostcode: '', targetRadius: '',
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [adsRes, statsRes] = await Promise.all([adApi.list(), adApi.stats()]);
      setAds(adsRes.data.data || []);
      setStats(statsRes.data.data);
    } catch {}
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adApi.create({
        title: form.title,
        description: form.description || undefined,
        budget: parseFloat(form.budget),
        cpc: parseFloat(form.cpc),
        targetPostcode: form.targetPostcode || undefined,
        targetRadius: form.targetRadius ? parseFloat(form.targetRadius) : undefined,
      });
      setShowForm(false);
      setForm({ title: '', description: '', budget: '', cpc: '0.50', targetPostcode: '', targetRadius: '' });
      loadData();
    } catch {}
    setSubmitting(false);
  }

  async function toggleStatus(ad: any) {
    const newStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await adApi.update(ad.id, { status: newStatus });
      loadData();
    } catch {}
  }

  const STATUS_STYLES: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    ACTIVE: 'bg-green-100 text-green-700',
    PAUSED: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advertising</h1>
          <p className="text-gray-500 mt-1">Promote your pharmacy to more patients</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500"><Megaphone className="w-4 h-4" /> Active</div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeCampaigns}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500"><Eye className="w-4 h-4" /> Impressions</div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalImpressions.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500"><MousePointerClick className="w-4 h-4" /> Clicks</div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalClicks.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500"><TrendingUp className="w-4 h-4" /> CTR</div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgCtr}%</p>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Ad Campaign</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Campaign Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" placeholder="e.g. Summer Weight Loss" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 h-20 resize-none" placeholder="Ad copy shown to patients" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Budget (£)</label>
                  <input type="number" step="1" required min="5" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" placeholder="50" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Cost per Click (£)</label>
                  <input type="number" step="0.01" min="0.10" value={form.cpc} onChange={e => setForm({ ...form, cpc: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Target Postcode</label>
                  <input type="text" value={form.targetPostcode} onChange={e => setForm({ ...form, targetPostcode: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" placeholder="SW1A" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Radius (miles)</label>
                  <input type="number" value={form.targetRadius} onChange={e => setForm({ ...form, targetRadius: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" placeholder="10" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ad list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Campaigns</h2>
        </div>
        {ads.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Megaphone className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No campaigns yet. Create your first ad to reach more patients.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ads.map((ad: any) => (
              <div key={ad.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{ad.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[ad.status]}`}>{ad.status}</span>
                    </div>
                    {ad.description && <p className="text-sm text-gray-500 mt-1">{ad.description}</p>}
                  </div>
                  {(ad.status === 'ACTIVE' || ad.status === 'PAUSED' || ad.status === 'DRAFT') && (
                    <button
                      onClick={() => toggleStatus(ad)}
                      className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5"
                    >
                      {ad.status === 'ACTIVE' ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Activate</>}
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>Budget: £{ad.budget}</span>
                  <span>Spent: £{ad.spent.toFixed(2)}</span>
                  <span>CPC: £{ad.cpc}</span>
                  <span>{ad.impressions.toLocaleString()} impressions</span>
                  <span>{ad.clicks} clicks</span>
                  {ad.impressions > 0 && <span>CTR: {((ad.clicks / ad.impressions) * 100).toFixed(1)}%</span>}
                </div>
                {/* Budget bar */}
                <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                  <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${Math.min((ad.spent / ad.budget) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
