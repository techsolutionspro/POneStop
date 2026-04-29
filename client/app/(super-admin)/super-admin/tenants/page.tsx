'use client';
import { useEffect, useState } from 'react';
import { tenantApi } from '@/lib/api';
import { Card, CardHeader, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Building2, Plus, X, Search } from 'lucide-react';
import Link from 'next/link';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', ownerEmail: '', ownerPassword: '', ownerFirstName: '', ownerLastName: '', ownerPhone: '', tier: 'STARTER', gphcNumber: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, [page, search, statusFilter, tierFilter]);
  async function load() {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (tierFilter) params.tier = tierFilter;
      const res = await tenantApi.list(params);
      setTenants(res.data.data); setMeta(res.data.meta);
    } catch {} finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await tenantApi.create(form);
      setShowCreate(false); setForm({ name: '', ownerEmail: '', ownerPassword: '', ownerFirstName: '', ownerLastName: '', ownerPhone: '', tier: 'STARTER', gphcNumber: '' });
      load();
    } catch (err: any) { setError(err.response?.data?.error || 'Failed'); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Tenants</h1><p className="text-sm text-gray-500 mt-1">{meta.total || 0} pharmacies on the platform</p></div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Onboard Tenant</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-64"><Search className="w-4 h-4 text-gray-400" /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm outline-none w-full" placeholder="Search pharmacies..." /></div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"><option value="">All Statuses</option><option value="ONBOARDING">Onboarding</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="CANCELLED">Cancelled</option></select>
        <select value={tierFilter} onChange={e => { setTierFilter(e.target.value); setPage(1); }} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"><option value="">All Tiers</option><option value="STARTER">Starter</option><option value="PROFESSIONAL">Professional</option><option value="ENTERPRISE">Enterprise</option></select>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white"><h3 className="text-lg font-semibold">Onboard New Pharmacy</h3><button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
              <h4 className="text-sm font-semibold text-gray-700">Pharmacy Details</h4>
              <Input label="Pharmacy Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. High Street Pharmacy" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="GPhC Number" value={form.gphcNumber} onChange={e => setForm(f => ({ ...f, gphcNumber: e.target.value }))} />
                <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-gray-700">Tier</label><select className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}><option value="STARTER">Starter (£99/mo)</option><option value="PROFESSIONAL">Professional (£199/mo)</option><option value="ENTERPRISE">Enterprise (£399/mo)</option></select></div>
              </div>
              <h4 className="text-sm font-semibold text-gray-700 pt-2">Owner Account</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" required value={form.ownerFirstName} onChange={e => setForm(f => ({ ...f, ownerFirstName: e.target.value }))} />
                <Input label="Last Name" required value={form.ownerLastName} onChange={e => setForm(f => ({ ...f, ownerLastName: e.target.value }))} />
              </div>
              <Input label="Email" type="email" required value={form.ownerEmail} onChange={e => setForm(f => ({ ...f, ownerEmail: e.target.value }))} />
              <Input label="Password" type="password" required value={form.ownerPassword} onChange={e => setForm(f => ({ ...f, ownerPassword: e.target.value }))} hint="Min 8 chars, uppercase, lowercase, number" />
              <Input label="Phone" value={form.ownerPhone} onChange={e => setForm(f => ({ ...f, ownerPhone: e.target.value }))} />
              <div className="flex justify-end gap-3 pt-2"><Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Tenant'}</Button></div>
            </form>
          </div>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Pharmacy</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Tier</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Branches</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">DSP</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Users</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase"></th>
            </tr></thead>
            <tbody>
              {tenants.map((t: any) => (
                <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">{t.name.charAt(0)}</div><div><div className="font-medium">{t.name}</div><div className="text-[10px] text-gray-400">{t.slug}.pharmacyonestop.co.uk</div></div></div></td>
                  <td className="px-4 py-3"><Badge status={t.tier} /></td>
                  <td className="px-4 py-3 text-gray-600">{t._count?.branches || 0}</td>
                  <td className="px-4 py-3"><Badge status={t.dspStatus} /></td>
                  <td className="px-4 py-3"><Badge status={t.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{t._count?.users || 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3 text-right"><Link href={`/super-admin/tenants/${t.id}`}><Button size="sm" variant="ghost">Manage</Button></Link></td>
                </tr>
              ))}
              {tenants.length === 0 && !loading && <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No tenants found</td></tr>}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 1 && <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100"><div className="text-xs text-gray-500">Page {meta.page} of {meta.totalPages}</div><div className="flex gap-1"><Button size="sm" variant="outline" disabled={!meta.hasPrev} onClick={() => setPage(p => p-1)}>Prev</Button><Button size="sm" variant="outline" disabled={!meta.hasNext} onClick={() => setPage(p => p+1)}>Next</Button></div></div>}
      </Card>
    </div>
  );
}
