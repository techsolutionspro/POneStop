'use client';

import { useEffect, useState } from 'react';
import { staffApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'TENANT_OWNER', label: 'Owner' },
  { value: 'BRANCH_MANAGER', label: 'Branch Manager' },
  { value: 'PHARMACIST', label: 'Pharmacist' },
  { value: 'PRESCRIBER', label: 'Prescribing Pharmacist (IP)' },
  { value: 'DISPENSER', label: 'Dispenser' },
  { value: 'DISPATCH_CLERK', label: 'Dispatch Clerk' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
];

export default function TeamPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '', firstName: '', lastName: '', phone: '', role: 'PHARMACIST',
    gphcNumber: '', gmcNumber: '', prescribingCategory: '', branchId: '',
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    try {
      const res = await staffApi.list();
      setStaff(res.data.data);
    } catch {} finally { setLoading(false); }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);
    try {
      await staffApi.invite({
        ...inviteForm,
        gphcNumber: inviteForm.gphcNumber || undefined,
        gmcNumber: inviteForm.gmcNumber || undefined,
        prescribingCategory: inviteForm.prescribingCategory || undefined,
        branchId: inviteForm.branchId || undefined,
      });
      setShowInvite(false);
      setInviteForm({ email: '', firstName: '', lastName: '', phone: '', role: 'PHARMACIST', gphcNumber: '', gmcNumber: '', prescribingCategory: '', branchId: '' });
      toast.success('Staff member invited');
      loadStaff();
    } catch (err: any) {
      setInviteError(err.response?.data?.error || 'Failed to invite');
    } finally { setInviteLoading(false); }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      await staffApi.update(id, { isActive: !currentActive });
      loadStaff();
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff, roles, and permissions</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus className="w-4 h-4" /> Invite Staff
        </Button>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Invite Staff Member</h3>
              <button onClick={() => setShowInvite(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{inviteError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" required value={inviteForm.firstName}
                  onChange={(e) => setInviteForm(f => ({ ...f, firstName: e.target.value }))} />
                <Input label="Last Name" required value={inviteForm.lastName}
                  onChange={(e) => setInviteForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
              <Input label="Email" type="email" required value={inviteForm.email}
                onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))} />
              <Input label="Phone" value={inviteForm.phone}
                onChange={(e) => setInviteForm(f => ({ ...f, phone: e.target.value }))} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
                <select className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                  value={inviteForm.role} onChange={(e) => setInviteForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {['PHARMACIST', 'PRESCRIBER'].includes(inviteForm.role) && (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="GPhC Number" value={inviteForm.gphcNumber}
                    onChange={(e) => setInviteForm(f => ({ ...f, gphcNumber: e.target.value }))} />
                  {inviteForm.role === 'PRESCRIBER' && (
                    <Input label="Prescribing Category" value={inviteForm.prescribingCategory}
                      placeholder="e.g. Independent Prescriber"
                      onChange={(e) => setInviteForm(f => ({ ...f, prescribingCategory: e.target.value }))} />
                  )}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowInvite(false)}>Cancel</Button>
                <Button type="submit" disabled={inviteLoading}>
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold">Staff ({staff.length})</h3>
          <div className="flex gap-2">
            <select className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
              <option>All Roles</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Branch</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">GPhC</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s: any) => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={s.firstName} lastName={s.lastName} size="sm" />
                      <div>
                        <div className="font-medium">{s.firstName} {s.lastName}</div>
                        <div className="text-xs text-gray-400">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge status={s.role} /></td>
                  <td className="px-4 py-3 text-gray-600">{s.staffProfile?.branch?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{s.staffProfile?.gphcNumber || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge status={s.isActive ? 'ACTIVE' : 'SUSPENDED'} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {s.lastLoginAt ? formatDate(s.lastLoginAt) : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm"
                        onClick={() => toggleActive(s.id, s.isActive)}
                        className={s.isActive ? 'text-red-600' : 'text-green-600'}>
                        {s.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No staff members yet. Invite your first team member to get started.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
