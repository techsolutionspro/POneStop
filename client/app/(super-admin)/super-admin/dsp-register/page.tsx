'use client';
import { useEffect, useState } from 'react';
import { tenantApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { ClipboardCheck, Check, X } from 'lucide-react';

export default function DspRegisterPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    try { const res = await tenantApi.list({ limit: 100 }); setTenants(res.data.data.filter((t: any) => t.dspStatus !== 'NOT_APPLICABLE')); } catch {} finally { setLoading(false); }
  }

  async function verify(id: string) {
    await tenantApi.updateDsp(id, { dspStatus: 'VERIFIED', dspNextReviewDate: new Date(Date.now() + 180 * 86400000).toISOString() });
    load();
  }
  async function reject(id: string) {
    await tenantApi.updateDsp(id, { dspStatus: 'REJECTED' }); load();
  }

  const verified = tenants.filter(t => t.dspStatus === 'VERIFIED');
  const pending = tenants.filter(t => t.dspStatus === 'PENDING_VERIFICATION');

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">DSP Licence Register</h1><p className="text-sm text-gray-500 mt-1">Distance-Selling Pharmacy verification and monitoring</p></div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5"><div className="text-sm text-gray-500">Verified DSPs</div><div className="text-3xl font-bold text-green-600 mt-1">{verified.length}</div></div>
        <div className="bg-white border border-gray-200 rounded-xl p-5"><div className="text-sm text-gray-500">Pending Verification</div><div className="text-3xl font-bold text-yellow-600 mt-1">{pending.length}</div></div>
        <div className="bg-white border border-gray-200 rounded-xl p-5"><div className="text-sm text-gray-500">Total DSP-Enabled</div><div className="text-3xl font-bold text-gray-900 mt-1">{tenants.length}</div></div>
      </div>

      {pending.length > 0 && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-yellow-700">Pending Verification ({pending.length})</h3></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-yellow-50"><th className="text-left px-4 py-2.5 text-xs font-medium text-yellow-700 uppercase">Pharmacy</th><th className="text-left px-4 py-2.5 text-xs font-medium text-yellow-700 uppercase">DSP Number</th><th className="text-left px-4 py-2.5 text-xs font-medium text-yellow-700 uppercase">Evidence</th><th className="text-left px-4 py-2.5 text-xs font-medium text-yellow-700 uppercase">Submitted</th><th className="text-right px-4 py-2.5 text-xs font-medium text-yellow-700 uppercase">Actions</th></tr></thead>
              <tbody>
                {pending.map((t: any) => (
                  <tr key={t.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-gray-600">{t.dspNumber || 'Not provided'}</td>
                    <td className="px-4 py-3">{t.dspEvidenceUrl ? <a href={t.dspEvidenceUrl} className="text-teal-600 text-xs hover:underline">View Document</a> : <span className="text-xs text-gray-400">No document</span>}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.updatedAt)}</td>
                    <td className="px-4 py-3 text-right flex gap-1 justify-end">
                      <Button size="sm" variant="success" onClick={() => verify(t.id)}><Check className="w-3 h-3" /> Verify</Button>
                      <Button size="sm" variant="danger" onClick={() => reject(t.id)}><X className="w-3 h-3" /> Reject</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader><h3 className="text-sm font-semibold">All DSP Registrations</h3><span className="text-xs text-gray-500">{tenants.length} entries</span></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50"><th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Pharmacy</th><th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">GPhC DSP No.</th><th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th><th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Online POM</th><th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Verified</th><th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Next Review</th><th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">MHRA Logo</th></tr></thead>
            <tbody>
              {tenants.map((t: any) => (
                <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.dspNumber || '-'}</td>
                  <td className="px-4 py-3"><Badge status={t.dspStatus} /></td>
                  <td className="px-4 py-3">{t.dspStatus === 'VERIFIED' ? <Badge status="ACTIVE" label={`Yes`} /> : <Badge status="SUSPENDED" label="Blocked" />}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.dspVerifiedAt ? formatDate(t.dspVerifiedAt) : '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.dspNextReviewDate ? formatDate(t.dspNextReviewDate) : '-'}</td>
                  <td className="px-4 py-3 text-xs">{t.dspStatus === 'VERIFIED' ? <span className="text-green-600">Injected</span> : <span className="text-gray-400">Pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
