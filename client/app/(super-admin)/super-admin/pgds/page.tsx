'use client';
import { useEffect, useState } from 'react';
import { pgdApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { FileText, Plus, X, Check, ArrowRight } from 'lucide-react';

export default function PgdLibraryPage() {
  const [pgds, setPgds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', version: 'v1.0', therapyArea: '', indication: '', fulfilmentModes: ['IN_BRANCH'] as string[] });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); loadAreas(); }, [statusFilter, areaFilter]);
  async function load() {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (areaFilter) params.therapyArea = areaFilter;
      const res = await pgdApi.list(params);
      setPgds(res.data.data);
    } catch {} finally { setLoading(false); }
  }
  async function loadAreas() { try { const res = await pgdApi.therapyAreas(); setAreas(res.data.data); } catch {} }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await pgdApi.create({ ...form, inclusionCriteria: [], exclusionCriteria: [], redFlags: [], authorisedProducts: [], doseRegimen: {} });
      setShowCreate(false); load();
    } catch {} finally { setSaving(false); }
  }

  async function handlePublish(id: string) {
    if (!confirm('Publish this PGD? It will become available to all tenants.')) return;
    await pgdApi.publish(id); load();
  }

  const statusFlow = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">PGD Library</h1><p className="text-sm text-gray-500 mt-1">Patient Group Directions — clinical governance</p></div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Draft New PGD</Button>
      </div>

      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <option value="">All Statuses</option>
          {['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'SUPERSEDED', 'RETIRED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <option value="">All Therapy Areas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="ml-auto text-xs text-gray-500">{pgds.length} PGDs</div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h3 className="text-lg font-semibold">Draft New PGD</h3><button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <Input label="Title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Weight Management" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Version" required value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
                <Input label="Therapy Area" required value={form.therapyArea} onChange={e => setForm(f => ({ ...f, therapyArea: e.target.value }))} placeholder="e.g. Weight Management" />
              </div>
              <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-gray-700">Indication</label><textarea className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" rows={2} value={form.indication} onChange={e => setForm(f => ({ ...f, indication: e.target.value }))} /></div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Fulfilment Modes</label>
                <div className="flex gap-2">{['IN_BRANCH', 'ONLINE_DELIVERY', 'CLICK_AND_COLLECT'].map(m => (<button key={m} type="button" onClick={() => setForm(f => ({ ...f, fulfilmentModes: f.fulfilmentModes.includes(m) ? f.fulfilmentModes.filter(x => x !== m) : [...f.fulfilmentModes, m] }))} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${form.fulfilmentModes.includes(m) ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-gray-300 text-gray-500'}`}>{m.replace(/_/g, ' ')}</button>))}</div>
              </div>
              <div className="flex justify-end gap-3 pt-2"><Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Draft'}</Button></div>
            </form>
          </div>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">PGD</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Version</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Therapy Area</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Workflow</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Modes</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Review Date</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase"></th>
            </tr></thead>
            <tbody>
              {pgds.map((p: any) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /><span className="font-medium">{p.title}</span></div></td>
                  <td className="px-4 py-3 text-gray-600">{p.version}</td>
                  <td className="px-4 py-3 text-gray-600">{p.therapyArea}</td>
                  <td className="px-4 py-3"><Badge status={p.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {statusFlow.map((s, i) => (<>
                        <span key={s} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusFlow.indexOf(p.status) >= i ? (p.status === s ? 'bg-teal-100 text-teal-700' : 'bg-green-50 text-green-700') : 'bg-gray-100 text-gray-400'}`}>{s.split('_').pop()}</span>
                        {i < statusFlow.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300" />}
                      </>))}
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="flex gap-1">{p.fulfilmentModes?.map((m: string) => <span key={m} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">{m === 'IN_BRANCH' ? 'IB' : m === 'ONLINE_DELIVERY' ? 'OD' : 'CC'}</span>)}</div></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.reviewDate ? formatDate(p.reviewDate) : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {p.status === 'APPROVED' && <Button size="sm" variant="success" onClick={() => handlePublish(p.id)}><Check className="w-3 h-3" /> Publish</Button>}
                      <Button size="sm" variant="ghost">Edit</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
