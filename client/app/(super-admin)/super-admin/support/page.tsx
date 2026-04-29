'use client';

import { useState } from 'react';
import { Card, CardHeader, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { HeadphonesIcon, Search, MessageSquare, Clock, CheckCircle, AlertTriangle, User, ExternalLink, Shield } from 'lucide-react';

const SAMPLE_TICKETS = [
  { id: 'TK-001', tenant: 'High Street Pharmacy', subject: 'Cannot activate online ordering', status: 'OPEN', priority: 'HIGH', assignee: 'Sarah Support', createdAt: '2026-04-27T10:30:00', lastReply: '2026-04-27T11:15:00', category: 'Onboarding' },
  { id: 'TK-002', tenant: 'CareFirst Pharmacy', subject: 'DSP verification document rejected — need guidance', status: 'OPEN', priority: 'MEDIUM', assignee: null, createdAt: '2026-04-27T09:00:00', lastReply: null, category: 'DSP' },
  { id: 'TK-003', tenant: 'MediQuick', subject: 'Cold-chain order dispatched but tracking not updating', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'Sarah Support', createdAt: '2026-04-26T16:00:00', lastReply: '2026-04-27T08:45:00', category: 'Dispatch' },
  { id: 'TK-004', tenant: 'Wellness Pharmacy', subject: 'How to add a second branch?', status: 'RESOLVED', priority: 'LOW', assignee: 'Sarah Support', createdAt: '2026-04-25T14:00:00', lastReply: '2026-04-25T14:30:00', category: 'General' },
  { id: 'TK-005', tenant: 'High Street Pharmacy', subject: 'Patient refund not processed after clinical rejection', status: 'OPEN', priority: 'URGENT', assignee: null, createdAt: '2026-04-27T12:00:00', lastReply: null, category: 'Billing' },
];

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-gray-100 text-gray-600',
};

export default function SupportPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = SAMPLE_TICKETS.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.tenant.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const open = SAMPLE_TICKETS.filter(t => t.status === 'OPEN').length;
  const inProgress = SAMPLE_TICKETS.filter(t => t.status === 'IN_PROGRESS').length;
  const unassigned = SAMPLE_TICKETS.filter(t => !t.assignee && t.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Support</h1><p className="text-sm text-gray-500 mt-1">Customer support tickets and tenant assistance</p></div>
        <Button size="sm"><MessageSquare className="w-3.5 h-3.5" /> Create Ticket</Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Open Tickets" value={open} trend={open > 3 ? 'down' : 'up'} change={open > 3 ? 'Above target' : 'On track'} />
        <StatCard label="In Progress" value={inProgress} trend="neutral" change="Being handled" />
        <StatCard label="Unassigned" value={unassigned} trend={unassigned > 0 ? 'down' : 'up'} change={unassigned > 0 ? 'Needs attention' : 'All assigned'} />
        <StatCard label="Avg Response" value="28m" trend="up" change="Target: 1h" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full text-gray-900" placeholder="Search tickets..." />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700">
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {unassigned > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-red-800">{unassigned} unassigned ticket{unassigned > 1 ? 's' : ''} — including {SAMPLE_TICKETS.filter(t => !t.assignee && t.priority === 'URGENT').length > 0 ? 'URGENT priority' : 'new requests'}</div>
          </div>
          <Button size="sm" variant="danger">Assign to Me</Button>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Ticket</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Pharmacy</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Assignee</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className={`border-t border-gray-100 hover:bg-gray-50 ${t.priority === 'URGENT' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.id}</td>
                  <td className="px-4 py-3 text-gray-700">{t.tenant}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-[250px] truncate">{t.subject}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.category}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority]}`}>{t.priority}</span></td>
                  <td className="px-4 py-3"><Badge status={t.status === 'RESOLVED' ? 'COMPLETED' : t.status} /></td>
                  <td className="px-4 py-3">
                    {t.assignee ? <span className="text-xs text-gray-600">{t.assignee}</span> : <span className="text-xs text-red-500 font-medium">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost">View</Button>
                      {!t.assignee && <Button size="sm" variant="outline">Claim</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Impersonation Tool */}
      <Card>
        <CardHeader>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Tenant Impersonation</h3>
            <p className="text-xs text-gray-500 mt-0.5">Access a tenant&apos;s admin console for troubleshooting. Sessions are time-boxed (30 min) and audited.</p>
          </div>
        </CardHeader>
        <div className="p-5">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input placeholder="Search for a tenant to impersonate..." />
            </div>
            <Button variant="outline">
              <ExternalLink className="w-3.5 h-3.5" /> Start Session
            </Button>
          </div>
          <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
            <Shield className="w-3 h-3" /> All impersonation sessions are logged in the audit trail and limited to 30 minutes.
          </div>
        </div>
      </Card>
    </div>
  );
}
