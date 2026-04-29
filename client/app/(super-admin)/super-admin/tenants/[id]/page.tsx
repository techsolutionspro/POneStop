'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tenantApi } from '@/lib/api';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  ArrowLeft, Building2, Globe, MapPin, Shield, Users, Calendar,
  ShoppingBag, Check, AlertTriangle, Palette, ExternalLink, Ban,
} from 'lucide-react';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [tenantRes, branchesRes] = await Promise.all([
        tenantApi.get(id),
        tenantApi.listBranches(id),
      ]);
      setTenant(tenantRes.data.data);
      setBranches(branchesRes.data.data || []);
    } catch {} finally { setLoading(false); }
  }

  async function handleTierChange() {
    if (!selectedTier) return;
    setActionLoading(true);
    try {
      await tenantApi.updateTier(id, selectedTier);
      setShowTierModal(false);
      load();
    } catch {} finally { setActionLoading(false); }
  }

  async function handleStatusChange(status?: string) {
    const newStatus = status || selectedStatus;
    if (!newStatus) return;
    setActionLoading(true);
    try {
      await tenantApi.updateStatus(id, newStatus);
      setShowStatusModal(false);
      load();
    } catch {} finally { setActionLoading(false); }
  }

  async function handleDspVerify() {
    setActionLoading(true);
    try {
      await tenantApi.updateDsp(id, { dspStatus: 'VERIFIED' });
      load();
    } catch {} finally { setActionLoading(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-700">Tenant not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Tenants
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold">
              {tenant.name?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> {tenant.slug}.pharmacyonestop.co.uk
                </span>
                <Badge status={tenant.tier} />
                <Badge status={tenant.status} />
                <Badge status={tenant.dspStatus} label={`DSP: ${(tenant.dspStatus || 'PENDING').replace(/_/g, ' ')}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Users" value={tenant._count?.users ?? 0} />
        <StatCard label="Branches" value={tenant._count?.branches ?? branches.length ?? 0} />
        <StatCard label="Bookings" value={tenant._count?.bookings ?? 0} />
        <StatCard label="Orders" value={tenant._count?.orders ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Preview */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4 text-gray-400" /> Branding Preview
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {tenant.logo && (
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-medium mb-2">Logo</div>
                  <img src={tenant.logo} alt="Tenant Logo" className="h-12 object-contain" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-medium mb-2">Primary Color</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ backgroundColor: tenant.primaryColor || '#0d9488' }} />
                    <span className="text-sm font-mono text-gray-600">{tenant.primaryColor || '#0d9488'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-medium mb-2">Secondary Color</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ backgroundColor: tenant.secondaryColor || '#6366f1' }} />
                    <span className="text-sm font-mono text-gray-600">{tenant.secondaryColor || '#6366f1'}</span>
                  </div>
                </div>
              </div>
              {tenant.gphcNumber && (
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-medium">GPhC Number</div>
                  <div className="text-sm font-medium mt-1">{tenant.gphcNumber}</div>
                </div>
              )}
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-medium">Created</div>
                <div className="text-sm font-medium mt-1">{tenant.createdAt ? formatDate(tenant.createdAt) : '-'}</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Quick Actions</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => { setSelectedTier(tenant.tier); setShowTierModal(true); }}>
                <Shield className="w-4 h-4 text-gray-400" />
                Change Tier
                <span className="ml-auto text-xs text-gray-400">Currently: {tenant.tier}</span>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => { setSelectedStatus(tenant.status); setShowStatusModal(true); }}>
                <Check className="w-4 h-4 text-gray-400" />
                Change Status
                <span className="ml-auto text-xs text-gray-400">Currently: {tenant.status}</span>
              </Button>
              {tenant.dspStatus !== 'VERIFIED' && (
                <Button variant="outline" className="w-full justify-start text-green-600" onClick={handleDspVerify} disabled={actionLoading}>
                  <Shield className="w-4 h-4" />
                  Verify DSP
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="w-4 h-4 text-gray-400" />
                Impersonate Owner
              </Button>
            </div>

            {/* Danger Zone */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs font-semibold text-red-600 uppercase mb-3 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Danger Zone
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleStatusChange('SUSPENDED')}
                  disabled={actionLoading || tenant.status === 'SUSPENDED'}
                >
                  <Ban className="w-3.5 h-3.5" /> Suspend
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={actionLoading || tenant.status === 'CANCELLED'}
                >
                  Cancel Tenant
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Branches List */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" /> Branches
          </h3>
          <span className="text-xs text-gray-400">{branches.length} branches</span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Branch Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Address</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b: any) => (
                <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{b.address || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{b.phone || '-'}</td>
                  <td className="px-4 py-3"><Badge status={b.status || 'ACTIVE'} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{b.createdAt ? formatDate(b.createdAt) : '-'}</td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No branches configured</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tier Change Modal */}
      {showTierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Change Tier</h3>
              <button onClick={() => setShowTierModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <select
                value={selectedTier}
                onChange={e => setSelectedTier(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="STARTER">Starter</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowTierModal(false)}>Cancel</Button>
                <Button onClick={handleTierChange} disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Update Tier'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Change Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="ONBOARDING">Onboarding</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowStatusModal(false)}>Cancel</Button>
                <Button onClick={() => handleStatusChange()} disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
