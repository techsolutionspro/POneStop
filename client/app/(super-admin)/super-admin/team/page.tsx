'use client';

import { useEffect, useState } from 'react';
import { staffApi, authApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { UserPlus, X, Shield, HeadphonesIcon } from 'lucide-react';

export default function PlatformTeamPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', role: 'SUPPORT_AGENT',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      const res = await staffApi.platformUsers();
      setUsers(res.data.data);
    } catch {} finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreateLoading(true);
    try {
      await authApi.createPlatformUser(form);
      setShowCreate(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'SUPPORT_AGENT' });
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally { setCreateLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Team</h1>
          <p className="text-sm text-gray-500 mt-1">Manage super admins and customer support agents</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4" /> Add Platform User
        </Button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Super Admin</h3>
            <p className="text-xs text-gray-500 mt-1">Full platform access. Can onboard tenants, manage PGDs, verify DSP licences, access audit logs, configure tiers, and impersonate tenant accounts for support.</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <HeadphonesIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Support Agent</h3>
            <p className="text-xs text-gray-500 mt-1">Customer service access. Can view tenants, impersonate for troubleshooting (time-boxed, audited), respond to tickets, and assist with onboarding. Cannot modify PGDs or platform config.</p>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Create Platform User</h3>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" required value={form.firstName}
                  onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} />
                <Input label="Last Name" required value={form.lastName}
                  onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
              <Input label="Email" type="email" required value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="name@pharmacyonestop.co.uk" />
              <Input label="Password" type="password" required value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                hint="Min 8 chars, uppercase, lowercase, number" />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
                <select className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                  value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="SUPPORT_AGENT">Support Agent</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold">Platform Users ({users.length})</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={u.firstName} lastName={u.lastName} size="sm"
                        color={u.role === 'SUPER_ADMIN' ? 'teal' : 'indigo'} />
                      <div>
                        <div className="font-medium">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge status={u.role} /></td>
                  <td className="px-4 py-3"><Badge status={u.isActive ? 'ACTIVE' : 'SUSPENDED'} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No platform users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
