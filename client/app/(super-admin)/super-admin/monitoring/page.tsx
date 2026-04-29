'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Server, Database, Globe, CreditCard, MessageSquare, Shield, Truck, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const services = [
  { name: 'API Server', icon: Server, status: 'operational', uptime: '99.98%', latency: '45ms', lastIncident: 'None' },
  { name: 'PostgreSQL Database', icon: Database, status: 'operational', uptime: '99.99%', latency: '12ms', lastIncident: 'None' },
  { name: 'Redis Cache', icon: Database, status: 'operational', uptime: '100%', latency: '2ms', lastIncident: 'None' },
  { name: 'Stripe Payments', icon: CreditCard, status: 'operational', uptime: '99.9%', latency: '320ms', lastIncident: '12 Apr 2026' },
  { name: 'Twilio SMS', icon: MessageSquare, status: 'operational', uptime: '98.2%', latency: '180ms', lastIncident: '20 Apr 2026' },
  { name: 'Twilio Video', icon: Activity, status: 'operational', uptime: '99.5%', latency: '95ms', lastIncident: 'None' },
  { name: 'IDV Provider (Onfido)', icon: Shield, status: 'degraded', uptime: '97.8%', latency: '2.1s', lastIncident: 'Now' },
  { name: 'Email (SES/Postmark)', icon: Globe, status: 'operational', uptime: '99.7%', latency: '210ms', lastIncident: 'None' },
  { name: 'Royal Mail API', icon: Truck, status: 'operational', uptime: '99.1%', latency: '450ms', lastIncident: '15 Apr 2026' },
  { name: 'DPD API', icon: Truck, status: 'operational', uptime: '99.5%', latency: '380ms', lastIncident: 'None' },
  { name: 'Cold-Chain Partner', icon: Truck, status: 'operational', uptime: '99.8%', latency: '290ms', lastIncident: 'None' },
  { name: 'SSL/DNS (Let\'s Encrypt)', icon: Globe, status: 'operational', uptime: '100%', latency: 'N/A', lastIncident: 'None' },
];

const errorBudgets = [
  { name: 'API (99.9% SLO)', used: 12, total: 43.2, unit: 'min/month' },
  { name: 'Payments (99.9% SLO)', used: 8, total: 43.2, unit: 'min/month' },
  { name: 'Prescriber SLA (4h)', avg: 2.1, target: 4, unit: 'hours' },
  { name: 'SMS Delivery (98% SLO)', rate: 98.2, target: 98, unit: '%' },
];

export default function MonitoringPage() {
  const [refreshing, setRefreshing] = useState(false);
  const operationalCount = services.filter(s => s.status === 'operational').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">System health, uptime, and error budgets</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }}>
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl p-4 flex items-center gap-3 ${degradedCount > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
        {degradedCount > 0 ? <AlertTriangle className="w-5 h-5 text-yellow-600" /> : <CheckCircle className="w-5 h-5 text-green-600" />}
        <div>
          <div className={`text-sm font-semibold ${degradedCount > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
            {degradedCount > 0 ? `${degradedCount} service${degradedCount > 1 ? 's' : ''} degraded` : 'All Systems Operational'}
          </div>
          <div className={`text-xs ${degradedCount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {operationalCount}/{services.length} services operational | Last checked: just now
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {services.map(svc => (
          <div key={svc.name} className={`bg-white border rounded-xl p-4 ${svc.status === 'degraded' ? 'border-yellow-300' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svc.icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{svc.name}</span>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${svc.status === 'operational' ? 'bg-green-500' : svc.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div><div className="text-gray-400">Uptime</div><div className="font-medium text-gray-700">{svc.uptime}</div></div>
              <div><div className="text-gray-400">Latency</div><div className="font-medium text-gray-700">{svc.latency}</div></div>
              <div><div className="text-gray-400">Last Issue</div><div className="font-medium text-gray-700">{svc.lastIncident}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Budgets */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-gray-900">Error Budgets & SLAs</h3></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {errorBudgets.map(eb => (
              <div key={eb.name}>
                <div className="text-xs text-gray-500 mb-2">{eb.name}</div>
                {'used' in eb && eb.used !== undefined && eb.total !== undefined ? (
                  <>
                    <div className="flex items-baseline gap-1"><span className="text-xl font-bold text-gray-900">{eb.used}</span><span className="text-xs text-gray-400">/ {eb.total} {eb.unit}</span></div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${(eb.used / (eb.total || 1)) * 100}%` }} />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">{Math.round((1 - eb.used / (eb.total || 1)) * 100)}% budget remaining</div>
                  </>
                ) : 'avg' in eb && eb.avg !== undefined ? (
                  <>
                    <div className="flex items-baseline gap-1"><span className="text-xl font-bold text-green-600">{eb.avg}h</span><span className="text-xs text-gray-400">avg (target: {eb.target}h)</span></div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${(eb.avg / (eb.target || 1)) * 100}%` }} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1"><span className="text-xl font-bold text-green-600">{(eb as any).rate}%</span><span className="text-xs text-gray-400">target: {eb.target}%</span></div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${eb.rate}%` }} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Recent Incidents */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-gray-900">Recent Incidents</h3></CardHeader>
        <div className="divide-y divide-gray-100">
          <div className="px-5 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center"><AlertTriangle className="w-3.5 h-3.5" /></div>
            <div className="flex-1"><div className="text-sm text-gray-700"><strong>IDV Provider Degraded</strong> — Onfido reporting increased latency (2.1s avg). Fallback to Stripe Identity active.</div><div className="text-[10px] text-gray-400 mt-0.5">Ongoing | Started 27 Apr 2026, 09:15</div></div>
            <Badge status="IN_PROGRESS" label="Monitoring" />
          </div>
          <div className="px-5 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5" /></div>
            <div className="flex-1"><div className="text-sm text-gray-700"><strong>SMS Delivery Dip</strong> — Twilio reported temporary routing issue for UK mobiles. Resolved in 45 minutes.</div><div className="text-[10px] text-gray-400 mt-0.5">Resolved | 20 Apr 2026, 14:30 - 15:15</div></div>
            <Badge status="COMPLETED" label="Resolved" />
          </div>
          <div className="px-5 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5" /></div>
            <div className="flex-1"><div className="text-sm text-gray-700"><strong>Stripe Webhook Delay</strong> — Payment confirmations delayed by 8 minutes due to Stripe infrastructure update.</div><div className="text-[10px] text-gray-400 mt-0.5">Resolved | 12 Apr 2026, 10:00 - 10:08</div></div>
            <Badge status="COMPLETED" label="Resolved" />
          </div>
        </div>
      </Card>
    </div>
  );
}
