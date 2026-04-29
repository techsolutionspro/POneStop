'use client';
import { useEffect, useState } from 'react';
import { tenantApi, authApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, X, MapPin, Phone, Users, Pencil } from 'lucide-react';

const EMPTY_BRANCH = {
  name: '', addressLine1: '', addressLine2: '', city: '', postcode: '', phone: '', email: '', openingHours: '',
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_BRANCH });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const me = await authApi.me();
        const tid = me.data.data.tenantId;
        setTenantId(tid);
        await loadBranches(tid);
      } catch {} finally { setLoading(false); }
    }
    init();
  }, []);

  async function loadBranches(tid?: string) {
    try {
      const res = await tenantApi.listBranches(tid || tenantId);
      setBranches(res.data.data || []);
    } catch {}
  }

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_BRANCH });
    setError('');
    setShowModal(true);
  }

  function openEdit(branch: any) {
    setEditingId(branch.id);
    setForm({
      name: branch.name || '',
      addressLine1: branch.addressLine1 || '',
      addressLine2: branch.addressLine2 || '',
      city: branch.city || '',
      postcode: branch.postcode || '',
      phone: branch.phone || '',
      email: branch.email || '',
      openingHours: branch.openingHours || '',
    });
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);
    try {
      if (editingId) {
        await tenantApi.updateBranch(tenantId, editingId, form);
      } else {
        await tenantApi.createBranch(tenantId, form);
      }
      setShowModal(false);
      loadBranches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save branch');
    } finally { setSubmitLoading(false); }
  }

  async function toggleActive(branch: any) {
    try {
      await tenantApi.updateBranch(tenantId, branch.id, { isActive: !branch.isActive });
      loadBranches();
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your pharmacy locations</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Branch
        </Button>
      </div>

      {/* Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit Branch' : 'Add Branch'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
              )}
              <Input label="Branch Name" required value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              <Input label="Address Line 1" required value={form.addressLine1}
                onChange={(e) => setForm(f => ({ ...f, addressLine1: e.target.value }))} />
              <Input label="Address Line 2" value={form.addressLine2}
                onChange={(e) => setForm(f => ({ ...f, addressLine2: e.target.value }))} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" required value={form.city}
                  onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
                <Input label="Postcode" required value={form.postcode}
                  onChange={(e) => setForm(f => ({ ...f, postcode: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone" value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
                <Input label="Email" type="email" value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <Input label="Opening Hours" placeholder="e.g. Mon-Fri 9am-6pm, Sat 9am-1pm" value={form.openingHours}
                onChange={(e) => setForm(f => ({ ...f, openingHours: e.target.value }))} />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading ? 'Saving...' : editingId ? 'Update Branch' : 'Create Branch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b: any) => (
          <Card key={b.id}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{b.name}</div>
                    <Badge status={b.isActive ? 'ACTIVE' : 'SUSPENDED'} />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{b.addressLine1}{b.city ? `, ${b.city}` : ''} {b.postcode}</span>
                </div>
                {b.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{b.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span>{b.staffCount ?? 0} staff</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{b.activeServicesCount ?? 0} active services</span>
                <Button variant="ghost" size="sm"
                  onClick={() => toggleActive(b)}
                  className={b.isActive ? 'text-red-600 text-xs' : 'text-green-600 text-xs'}>
                  {b.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {branches.length === 0 && !loading && (
        <div className="text-center py-16">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <div className="font-semibold text-gray-700">No branches yet</div>
          <div className="text-sm text-gray-500 mt-1">Add your first pharmacy branch to get started.</div>
        </div>
      )}
    </div>
  );
}
