'use client';
import { useEffect, useState } from 'react';
import { serviceApi, pgdApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { Plus, X, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [pgds, setPgds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ pgdId: '', name: '', description: '', price: '', depositAmount: '', duration: '', capacity: '1', bufferTime: '0', fulfilmentModes: ['IN_BRANCH'] as string[], isDiscreet: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const [sRes, pRes] = await Promise.all([serviceApi.list(), pgdApi.list({ status: 'PUBLISHED' })]);
      setServices(sRes.data.data);
      setPgds(pRes.data.data);
    } catch {} finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await serviceApi.create({ ...form, price: parseFloat(form.price), depositAmount: form.depositAmount ? parseFloat(form.depositAmount) : undefined, duration: form.duration ? parseInt(form.duration) : undefined, capacity: parseInt(form.capacity), bufferTime: parseInt(form.bufferTime) });
      setShowAdd(false); load();
    } catch {} finally { setSaving(false); }
  }

  async function toggleService(id: string, active: boolean) {
    await serviceApi.update(id, { isActive: !active });
    toast.success(active ? 'Service deactivated' : 'Service activated');
    load();
  }

  const modes = ['IN_BRANCH', 'ONLINE_DELIVERY', 'CLICK_AND_COLLECT'];
  function toggleMode(m: string) {
    setForm(f => ({ ...f, fulfilmentModes: f.fulfilmentModes.includes(m) ? f.fulfilmentModes.filter(x => x !== m) : [...f.fulfilmentModes, m] }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Services</h1><p className="text-sm text-gray-500 mt-1">Manage clinical services offered at your pharmacy</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Service</Button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white"><h3 className="text-lg font-semibold">Activate Service</h3><button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">PGD <span className="text-red-500">*</span></label>
                <select className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" required value={form.pgdId} onChange={e => { const p = pgds.find((x: any) => x.id === e.target.value); setForm(f => ({ ...f, pgdId: e.target.value, name: p?.title || '' })); }}>
                  <option value="">Select PGD...</option>
                  {pgds.map((p: any) => <option key={p.id} value={p.id}>{p.title} ({p.therapyArea}) - {p.version}</option>)}
                </select>
              </div>
              <Input label="Service Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-gray-700">Description</label><textarea className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Price (GBP)" type="number" step="0.01" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                <Input label="Deposit (GBP)" type="number" step="0.01" value={form.depositAmount} onChange={e => setForm(f => ({ ...f, depositAmount: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Duration (min)" type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
                <Input label="Capacity/slot" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
                <Input label="Buffer (min)" type="number" value={form.bufferTime} onChange={e => setForm(f => ({ ...f, bufferTime: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Fulfilment Modes</label>
                <div className="flex gap-2">{modes.map(m => (<button key={m} type="button" onClick={() => toggleMode(m)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${form.fulfilmentModes.includes(m) ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-gray-300 text-gray-500'}`}>{m.replace(/_/g, ' ')}</button>))}</div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isDiscreet} onChange={e => setForm(f => ({ ...f, isDiscreet: e.target.checked }))} className="accent-teal-600" /> Discreet service (plain packaging, sensitive language)</label>
              <div className="flex justify-end gap-3 pt-2"><Button variant="outline" type="button" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Activate Service'}</Button></div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s: any) => (
          <Card key={s.id} className="hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><Stethoscope className="w-5 h-5" /></div><div><h3 className="font-semibold text-sm">{s.name}</h3><p className="text-xs text-gray-400">{s.pgd?.therapyArea} | {s.pgd?.version}</p></div></div>
                <Badge status={s.isActive ? 'ACTIVE' : 'SUSPENDED'} />
              </div>
              {s.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.description}</p>}
              <div className="flex flex-wrap gap-1.5 mb-3">{s.fulfilmentModes?.map((m: string) => (<span key={m} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[10px] font-medium">{m.replace(/_/g, ' ')}</span>))}</div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div><span className="text-lg font-bold text-teal-700">{formatCurrency(s.price)}</span>{s.duration && <span className="text-xs text-gray-400 ml-1">/ {s.duration} min</span>}</div>
                <div className="flex gap-1"><span className="text-xs text-gray-400">{s._count?.bookings || 0} bookings</span><span className="text-xs text-gray-400">| {s._count?.onlineOrders || 0} orders</span></div>
              </div>
              <div className="flex gap-2 mt-3"><Button variant="outline" size="sm" className="flex-1">Edit</Button><Button variant={s.isActive ? 'danger' : 'success'} size="sm" className="flex-1" onClick={() => toggleService(s.id, s.isActive)}>{s.isActive ? 'Deactivate' : 'Activate'}</Button></div>
            </div>
          </Card>
        ))}
        {services.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center py-16 text-center">
            <Stethoscope className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-base font-semibold">No services yet</h3>
            <p className="text-sm text-gray-500 mt-1">Activate your first clinical service from the PGD library.</p>
            <Button className="mt-4" onClick={() => setShowAdd(true)}>Add Service</Button>
          </div>
        )}
      </div>
    </div>
  );
}
