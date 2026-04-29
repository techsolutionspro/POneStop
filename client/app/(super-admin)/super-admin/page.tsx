'use client';

import { useEffect, useState } from 'react';
import { dashboardApi, auditApi, tenantApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { StatCard, Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import {
  Building2, FileText, ClipboardCheck, Shield, Users, BarChart3,
  AlertTriangle, TrendingUp, Globe, CreditCard, Activity, Clock,
  CheckCircle, XCircle, Truck, ShoppingBag, Calendar,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [auditData, setAuditData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.platform(),
      auditApi.list({ limit: 8 }),
    ]).then(([dRes, aRes]) => {
      setData(dRes.data.data);
      setAuditData(aRes.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-5 gap-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const s = data?.stats || {};

  const actionIcons: Record<string, { icon: any; bg: string; color: string }> = {
    CREATE: { icon: CheckCircle, bg: 'bg-green-50', color: 'text-green-600' },
    APPROVE: { icon: CheckCircle, bg: 'bg-green-50', color: 'text-green-600' },
    REJECT: { icon: XCircle, bg: 'bg-red-50', color: 'text-red-600' },
    REFUND: { icon: CreditCard, bg: 'bg-yellow-50', color: 'text-yellow-600' },
    LOGIN: { icon: Users, bg: 'bg-gray-100', color: 'text-gray-500' },
    IMPERSONATE: { icon: Shield, bg: 'bg-purple-50', color: 'text-purple-600' },
    UPDATE: { icon: Activity, bg: 'bg-blue-50', color: 'text-blue-600' },
    DISPATCH: { icon: Truck, bg: 'bg-blue-50', color: 'text-blue-600' },
    DELETE: { icon: XCircle, bg: 'bg-red-50', color: 'text-red-600' },
    EXPORT: { icon: Globe, bg: 'bg-gray-100', color: 'text-gray-500' },
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.firstName}. Here&apos;s your platform overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/super-admin/tenants"><Button variant="outline" size="sm"><Building2 className="w-3.5 h-3.5" /> Tenants</Button></Link>
          <Link href="/super-admin/pgds"><Button variant="outline" size="sm"><FileText className="w-3.5 h-3.5" /> PGDs</Button></Link>
          <Link href="/super-admin/tenants"><Button size="sm"><Users className="w-3.5 h-3.5" /> Onboard Tenant</Button></Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Tenants" value={s.totalTenants || 0} change={`${s.activeTenants || 0} active`} trend="neutral" />
        <StatCard label="Active Storefronts" value={s.activeTenants || 0} change={s.totalTenants ? `${Math.round(((s.activeTenants || 0)/(s.totalTenants || 1))*100)}% activation` : '—'} trend="up" />
        <StatCard label="Monthly Revenue" value={formatCurrency(s.monthRevenue || 0)} change="+18% MoM" trend="up" />
        <StatCard label="Today's Orders" value={s.todayOrders || 0} change="+22% vs avg" trend="up" />
        <StatCard label="Prescriber SLA" value={`${s.avgPrescriberSla || 0}h`} change="Target: 4h" trend="up" />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { href: '/super-admin/tenants', icon: Building2, label: 'Tenants', desc: `${s.totalTenants || 0} total`, color: 'bg-teal-50 text-teal-600' },
          { href: '/super-admin/pgds', icon: FileText, label: 'PGD Library', desc: `${s.publishedPgds || 0} published`, color: 'bg-indigo-50 text-indigo-600' },
          { href: '/super-admin/dsp-register', icon: ClipboardCheck, label: 'DSP Register', desc: `${s.dspPending || 0} pending`, color: s.dspPending > 0 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600' },
          { href: '/super-admin/audit', icon: Shield, label: 'Audit Logs', desc: 'View activity', color: 'bg-gray-100 text-gray-600' },
          { href: '/super-admin/team', icon: Users, label: 'Platform Team', desc: 'Manage admins', color: 'bg-blue-50 text-blue-600' },
          { href: '/super-admin/monitoring', icon: Activity, label: 'Monitoring', desc: 'System health', color: 'bg-emerald-50 text-emerald-600' },
        ].map(item => (
          <Link key={item.href} href={item.href} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-teal-300 transition-all">
            <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
              <item.icon className="w-4.5 h-4.5" />
            </div>
            <div className="text-sm font-semibold text-gray-900">{item.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {(s.dspPending > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-yellow-800">{s.dspPending} DSP verification{s.dspPending > 1 ? 's' : ''} pending</div>
            <div className="text-xs text-yellow-600 mt-0.5">Pharmacies are waiting to enable online POM fulfilment.</div>
          </div>
          <Link href="/super-admin/dsp-register"><Button size="sm" variant="outline">Review Now</Button></Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Tenants */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Recent Tenants</h3>
              <Link href="/super-admin/tenants" className="text-xs text-teal-600 font-medium hover:underline">View All</Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Pharmacy</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Tier</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">DSP</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentTenants || []).slice(0, 8).map((t: any) => (
                    <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{t.name}</div>
                            <div className="text-[10px] text-gray-400">{t._count?.branches || 0} branches | {t._count?.users || 0} users</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge status={t.tier} /></td>
                      <td className="px-4 py-3"><Badge status={t.status} /></td>
                      <td className="px-4 py-3"><Badge status={t.dspStatus} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/super-admin/tenants/${t.id}`}>
                          <Button size="sm" variant="ghost">Manage</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!data?.recentTenants || data.recentTenants.length === 0) && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No tenants yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: System Health + Activity */}
        <div className="space-y-4">
          {/* System Health */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-gray-900">System Health</h3></CardHeader>
            <div className="p-4 space-y-2.5">
              {[
                { name: 'API Uptime', status: 'green', value: '99.98%' },
                { name: 'Stripe Payments', status: 'green', value: '99.9%' },
                { name: 'SMS Delivery', status: 'green', value: '98.2%' },
                { name: 'IDV Provider', status: 'amber', value: 'Degraded' },
                { name: 'Courier APIs', status: 'green', value: 'OK' },
                { name: 'SSL Certificates', status: 'green', value: '0 expiring' },
                { name: 'Published PGDs', status: 'green', value: String(s.publishedPgds || 0) },
                { name: 'DSP Verified', status: 'green', value: String(s.dspVerified || 0) },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      item.status === 'green' ? 'bg-green-500' : item.status === 'amber' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    {item.name}
                  </div>
                  <span className={`text-xs font-medium ${
                    item.status === 'green' ? 'text-green-600' : item.status === 'amber' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
              <Link href="/super-admin/audit" className="text-xs text-teal-600 font-medium hover:underline">All Logs</Link>
            </CardHeader>
            <div className="divide-y divide-gray-100">
              {auditData.slice(0, 6).map((log: any) => {
                const ai = actionIcons[log.action] || { icon: Activity, bg: 'bg-gray-100', color: 'text-gray-500' };
                const Icon = ai.icon;
                return (
                  <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full ${ai.bg} ${ai.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-700">
                        <span className="font-medium">{log.user?.firstName} {log.user?.lastName}</span>
                        {' '}<span className="text-gray-400">{log.action.toLowerCase()}d</span>
                        {' '}<span className="text-gray-500">{log.resource}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(log.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
              {auditData.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-gray-400">No recent activity</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
