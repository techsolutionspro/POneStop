'use client';

import { useEffect, useState } from 'react';
import { packageApi } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { Check, X, Edit3, Plus, Save, Trash2, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const FEATURE_FLAGS = [
  { key: 'onlineOrdering', label: 'Online Ordering + Delivery' },
  { key: 'customDomain', label: 'Custom Domain' },
  { key: 'customMailbox', label: 'Custom Mailbox' },
  { key: 'videoConsults', label: 'Video Consultations' },
  { key: 'marketingTools', label: 'Marketing Tools' },
  { key: 'groupManagement', label: 'Group Management / SSO' },
  { key: 'apiAccess', label: 'API Access' },
  { key: 'dedicatedSupport', label: 'Dedicated Support' },
  { key: 'customWebsite', label: 'Custom Website Build' },
];

export default function TiersPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => { load(); checkStripe(); }, []);

  async function load() {
    try {
      const res = await packageApi.listAll();
      setPackages(res.data.data);
    } catch {} finally { setLoading(false); }
  }

  async function checkStripe() {
    try {
      const res = await (await fetch('/api/packages/stripe-status', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })).json();
      setStripeStatus(res.data);
    } catch {}
  }

  function startEdit(pkg: any) {
    setEditing(pkg.id);
    setEditForm({ ...pkg, features: [...(pkg.features || [])] });
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      await packageApi.update(editing, editForm);
      toast.success('Package updated');
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  }

  async function syncStripe() {
    setSyncing(true);
    try {
      const res = await fetch('/api/packages/sync-stripe', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Synced ${data.data.length} packages to Stripe`);
        load();
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch { toast.error('Sync failed'); } finally { setSyncing(false); }
  }

  function addFeature() {
    if (!featureInput.trim()) return;
    setEditForm((f: any) => ({ ...f, features: [...(f.features || []), featureInput.trim()] }));
    setFeatureInput('');
  }

  function removeFeature(index: number) {
    setEditForm((f: any) => ({ ...f, features: f.features.filter((_: any, i: number) => i !== index) }));
  }

  function toggleFlag(key: string) {
    setEditForm((f: any) => ({ ...f, [key]: !f[key] }));
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Package Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage subscription tiers, pricing, feature access, and Stripe billing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={syncStripe} disabled={syncing}>
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync to Stripe
          </Button>
        </div>
      </div>

      {/* Stripe Status */}
      <div className={`rounded-xl p-4 flex items-center gap-3 ${stripeStatus?.isLive ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        {stripeStatus?.isLive ? <Zap className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-yellow-600" />}
        <div>
          <div className={`text-sm font-medium ${stripeStatus?.isLive ? 'text-green-800' : 'text-yellow-800'}`}>
            {stripeStatus?.isLive ? 'Stripe Connected' : 'Stripe Not Connected'}
          </div>
          <div className={`text-xs ${stripeStatus?.isLive ? 'text-green-600' : 'text-yellow-600'}`}>
            {stripeStatus?.message || 'Checking...'}
          </div>
        </div>
        {!stripeStatus?.isLive && (
          <div className="ml-auto text-xs text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">
            Add STRIPE_SECRET_KEY to server/.env
          </div>
        )}
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {packages.map(pkg => {
          const isEditing = editing === pkg.id;
          const form = isEditing ? editForm : pkg;

          return (
            <Card key={pkg.id} className={`relative ${isEditing ? 'ring-2 ring-teal-500' : ''} ${!pkg.isActive ? 'opacity-60' : ''}`}>
              {pkg.isPopular && !isEditing && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">MOST POPULAR</div>
              )}

              <CardHeader>
                <div>
                  {isEditing ? (
                    <Input value={form.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} className="text-lg font-bold" />
                  ) : (
                    <h3 className="text-lg font-bold">{pkg.name}</h3>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge status={pkg.tier} />
                    {!pkg.isActive && <Badge status="SUSPENDED" label="Inactive" />}
                    {pkg.stripeProductId && <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Stripe synced</span>}
                  </div>
                </div>
                {!isEditing ? (
                  <Button variant="ghost" size="sm" onClick={() => startEdit(pkg)}><Edit3 className="w-3.5 h-3.5" /></Button>
                ) : (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(null)}><X className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" onClick={saveEdit}><Save className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </CardHeader>

              <CardBody>
                {/* Price */}
                <div className="mb-4">
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Monthly (£)" type="number" step="0.01" value={form.price} onChange={e => setEditForm((f: any) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
                      <Input label="Annual (£)" type="number" step="0.01" value={form.annualPrice || ''} onChange={e => setEditForm((f: any) => ({ ...f, annualPrice: parseFloat(e.target.value) || null }))} />
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-extrabold">{formatCurrency(pkg.price)}</span>
                      <span className="text-gray-400">/month</span>
                      {pkg.annualPrice && <div className="text-xs text-teal-600">or {formatCurrency(pkg.annualPrice)}/year</div>}
                    </div>
                  )}
                </div>

                {/* Description */}
                {isEditing ? (
                  <div className="mb-4">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2}
                      value={form.description} onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))} />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>
                )}

                {/* Limits */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Limits</div>
                  {isEditing ? (
                    <div className="grid grid-cols-3 gap-2">
                      <Input label="Branches" type="number" value={form.maxBranches} onChange={e => setEditForm((f: any) => ({ ...f, maxBranches: parseInt(e.target.value) || 1 }))} />
                      <Input label="PGDs" type="number" value={form.maxPgds} onChange={e => setEditForm((f: any) => ({ ...f, maxPgds: parseInt(e.target.value) || 1 }))} />
                      <Input label="Staff" type="number" value={form.maxStaff} onChange={e => setEditForm((f: any) => ({ ...f, maxStaff: parseInt(e.target.value) || 1 }))} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded"><div className="font-bold">{pkg.maxBranches === 999 ? '∞' : pkg.maxBranches}</div><div className="text-[10px] text-gray-400">Branches</div></div>
                      <div className="text-center p-2 bg-gray-50 rounded"><div className="font-bold">{pkg.maxPgds === 999 ? '∞' : pkg.maxPgds}</div><div className="text-[10px] text-gray-400">PGDs</div></div>
                      <div className="text-center p-2 bg-gray-50 rounded"><div className="font-bold">{pkg.maxStaff === 999 ? '∞' : pkg.maxStaff}</div><div className="text-[10px] text-gray-400">Staff</div></div>
                    </div>
                  )}
                </div>

                {/* Feature Flags */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Feature Access</div>
                  <div className="space-y-1">
                    {FEATURE_FLAGS.map(flag => (
                      <div key={flag.key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{flag.label}</span>
                        {isEditing ? (
                          <button onClick={() => toggleFlag(flag.key)}
                            className={`w-8 h-5 rounded-full transition-colors ${form[flag.key] ? 'bg-teal-600' : 'bg-gray-300'}`}>
                            <span className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform ${form[flag.key] ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                          </button>
                        ) : (
                          form[flag.key] ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature List (displayed on pricing page) */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pricing Card Features</div>
                  <div className="space-y-1">
                    {(form.features || []).map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                        <span className="flex-1 text-gray-700">{f}</span>
                        {isEditing && (
                          <button onClick={() => removeFeature(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <div className="flex gap-1 mt-2">
                        <input className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Add feature..."
                          value={featureInput} onChange={e => setFeatureInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} />
                        <Button size="sm" variant="outline" onClick={addFeature}><Plus className="w-3 h-3" /></Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Usage Charges */}
                {isEditing && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Usage Charges</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Per consultation (£)" type="number" step="0.01" value={form.consultationFee}
                        onChange={e => setEditForm((f: any) => ({ ...f, consultationFee: parseFloat(e.target.value) || 0 }))} />
                      <Input label="Per dispatch (£)" type="number" step="0.01" value={form.dispatchFee}
                        onChange={e => setEditForm((f: any) => ({ ...f, dispatchFee: parseFloat(e.target.value) || 0 }))} />
                      <Input label="Per SMS (£)" type="number" step="0.001" value={form.smsFee}
                        onChange={e => setEditForm((f: any) => ({ ...f, smsFee: parseFloat(e.target.value) || 0 }))} />
                      <Input label="Payment uplift (%)" type="number" step="0.1" value={form.paymentUplift}
                        onChange={e => setEditForm((f: any) => ({ ...f, paymentUplift: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  </div>
                )}

                {/* Meta */}
                {isEditing && (
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.isPopular} onChange={() => setEditForm((f: any) => ({ ...f, isPopular: !f.isPopular }))} className="accent-teal-600" />
                      Mark as "Most Popular"
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.isActive} onChange={() => setEditForm((f: any) => ({ ...f, isActive: !f.isActive }))} className="accent-teal-600" />
                      Active (visible on pricing page)
                    </label>
                    <Input label="CTA Button Text" value={form.ctaText} onChange={e => setEditForm((f: any) => ({ ...f, ctaText: e.target.value }))} />
                    <Input label="Sort Order" type="number" value={form.sortOrder} onChange={e => setEditForm((f: any) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
                  </div>
                )}

                {/* Stripe IDs */}
                {pkg.stripeProductId && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400">
                    <div>Product: {pkg.stripeProductId}</div>
                    <div>Price: {pkg.stripePriceId}</div>
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Usage Charges Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Usage Charges (All Tiers)</h3>
          <span className="text-xs text-gray-400">Billed monthly in arrears</span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">Charge</th>
              {packages.filter(p => p.isActive).map(p => (
                <th key={p.id} className="text-center px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">{p.name}</th>
              ))}
            </tr></thead>
            <tbody>
              {[
                { label: 'Per consultation', key: 'consultationFee', prefix: '£' },
                { label: 'Per dispatch', key: 'dispatchFee', prefix: '£' },
                { label: 'Per SMS', key: 'smsFee', prefix: '£' },
                { label: 'Payment uplift', key: 'paymentUplift', suffix: '%' },
              ].map(charge => (
                <tr key={charge.key} className="border-t border-gray-100">
                  <td className="px-5 py-3 font-medium text-gray-700">{charge.label}</td>
                  {packages.filter(p => p.isActive).map(p => (
                    <td key={p.id} className="text-center px-5 py-3 text-gray-900 font-semibold">
                      {charge.prefix || ''}{p[charge.key]}{charge.suffix || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
