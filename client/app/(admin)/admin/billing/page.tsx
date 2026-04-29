'use client';
import { useState } from 'react';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, Download, ArrowUpRight, Zap, MessageSquare, Stethoscope, Truck } from 'lucide-react';

export default function BillingPage() {
  const [currentPlan] = useState({
    name: 'Professional',
    price: 149,
    interval: 'month',
    features: ['Unlimited branches', 'Up to 10 staff', '500 SMS/month', 'Online ordering', 'Priority support'],
  });

  const [usage] = useState({
    smsUsed: 342,
    smsLimit: 500,
    consultations: 156,
    dispatchFees: 87.50,
  });

  const [invoices] = useState([
    { id: '1', reference: 'INV-2026-0004', amount: 149, status: 'PAID', date: '2026-04-01', downloadUrl: '#' },
    { id: '2', reference: 'INV-2026-0003', amount: 149, status: 'PAID', date: '2026-03-01', downloadUrl: '#' },
    { id: '3', reference: 'INV-2026-0002', amount: 149, status: 'PAID', date: '2026-02-01', downloadUrl: '#' },
    { id: '4', reference: 'INV-2026-0001', amount: 99, status: 'PAID', date: '2026-01-01', downloadUrl: '#' },
    { id: '5', reference: 'INV-2025-0012', amount: 99, status: 'REFUNDED', date: '2025-12-01', downloadUrl: '#' },
  ]);

  const tiers = [
    { name: 'Starter', price: 49, highlight: false },
    { name: 'Professional', price: 149, highlight: true },
    { name: 'Enterprise', price: 349, highlight: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your plan, usage, and invoices</p>
        </div>
      </div>

      {/* Current Plan */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <Zap className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{currentPlan.name} Plan</h3>
                  <Badge status="ACTIVE" label="Active" dot />
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{formatCurrency(currentPlan.price)}/{currentPlan.interval}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Downgrade</Button>
              <Button variant="primary" size="sm">
                <ArrowUpRight className="w-4 h-4" /> Upgrade Plan
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {currentPlan.features.map(f => (
              <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{f}</span>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <MessageSquare className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">SMS Usage</div>
                <div className="text-xs text-gray-400">{usage.smsUsed} / {usage.smsLimit} this month</div>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(usage.smsUsed / usage.smsLimit) * 100}%` }} />
            </div>
            <div className="text-[10px] text-gray-400 mt-1.5">{usage.smsLimit - usage.smsUsed} remaining</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                <Stethoscope className="w-4.5 h-4.5 text-teal-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Consultations</div>
                <div className="text-xs text-gray-400">{usage.consultations} this month</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{usage.consultations}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Truck className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Dispatch Fees</div>
                <div className="text-xs text-gray-400">Accumulated this month</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(usage.dispatchFees)}</div>
          </CardBody>
        </Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold">Invoices</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{inv.reference}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.amount)}</td>
                  <td className="px-4 py-3"><Badge status={inv.status === 'PAID' ? 'COMPLETED' : inv.status} label={inv.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(inv.date)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
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
