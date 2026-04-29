'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Sliders, Edit3 } from 'lucide-react';

const TIERS = [
  {
    name: 'Starter',
    price: 99,
    color: 'bg-gray-100 text-gray-700',
    tenantCount: 68,
    features: {
      'Max branches': '1',
      'PGD library': 'Up to 20',
      'Template website': true,
      'Custom domain': false,
      'Booking engine': true,
      'Stripe payments': true,
      'SMS/email reminders': true,
      'Online ordering': false,
      'Home delivery': false,
      'ID verification': false,
      'Prescriber queue': false,
      'Prescription generation': false,
      'Courier integration': false,
      'Subscription/repeats': false,
      'Custom mailbox': false,
      'Marketing tools': false,
      'Reports': 'Basic',
      'Video consultations': false,
      'Group management/SSO': false,
      'Dedicated support': false,
    },
  },
  {
    name: 'Professional',
    price: 199,
    color: 'bg-teal-100 text-teal-700',
    tenantCount: 62,
    popular: true,
    features: {
      'Max branches': '3',
      'PGD library': 'Full (100+)',
      'Template website': true,
      'Custom domain': true,
      'Booking engine': true,
      'Stripe payments': true,
      'SMS/email reminders': true,
      'Online ordering': true,
      'Home delivery': true,
      'ID verification': true,
      'Prescriber queue': true,
      'Prescription generation': true,
      'Courier integration': true,
      'Subscription/repeats': true,
      'Custom mailbox': '1 mailbox',
      'Marketing tools': true,
      'Reports': 'Full',
      'Video consultations': false,
      'Group management/SSO': false,
      'Dedicated support': 'Email',
    },
  },
  {
    name: 'Enterprise',
    price: 399,
    color: 'bg-indigo-100 text-indigo-700',
    tenantCount: 18,
    features: {
      'Max branches': 'Unlimited',
      'PGD library': 'Full (100+)',
      'Template website': 'Custom build',
      'Custom domain': true,
      'Booking engine': true,
      'Stripe payments': true,
      'SMS/email reminders': true,
      'Online ordering': true,
      'Home delivery': true,
      'ID verification': true,
      'Prescriber queue': true,
      'Prescription generation': true,
      'Courier integration': true,
      'Subscription/repeats': true,
      'Custom mailbox': '5 mailboxes',
      'Marketing tools': true,
      'Reports': 'Full + benchmarking',
      'Video consultations': true,
      'Group management/SSO': true,
      'Dedicated support': 'Dedicated AM',
    },
  },
];

const USAGE_CHARGES = [
  { name: 'Online consultation fee', price: '£0.50', per: 'per consultation' },
  { name: 'Dispatch fee', price: '£1.50', per: 'per dispatch' },
  { name: 'SMS', price: '£0.05', per: 'per message' },
  { name: 'IDV check', price: '£1.20', per: 'per verification' },
  { name: 'Payment uplift', price: '0.5%', per: 'per transaction' },
  { name: 'Additional mailbox', price: '£5/mo', per: 'per mailbox' },
];

export default function TiersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Tiers & Feature Gating</h1><p className="text-sm text-gray-500 mt-1">Manage subscription tiers, feature entitlements, and usage charges</p></div>
        <Button size="sm"><Edit3 className="w-3.5 h-3.5" /> Edit Tiers</Button>
      </div>

      {/* Tier comparison */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase w-1/4">Feature</th>
                {TIERS.map(t => (
                  <th key={t.name} className="text-center px-5 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${t.color}`}>{t.name}</span>
                      <span className="text-lg font-bold text-gray-900">£{t.price}<span className="text-xs font-normal text-gray-400">/mo</span></span>
                      <span className="text-[10px] text-gray-400">{t.tenantCount} tenants</span>
                      {t.popular && <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-full">Most Popular</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(TIERS[0].features).map(feature => (
                <tr key={feature} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-700 font-medium">{feature}</td>
                  {TIERS.map(t => {
                    const val = t.features[feature as keyof typeof t.features];
                    return (
                      <td key={t.name} className="text-center px-5 py-3">
                        {val === true ? <Check className="w-4 h-4 text-green-500 mx-auto" /> :
                         val === false ? <X className="w-4 h-4 text-gray-300 mx-auto" /> :
                         <span className="text-xs text-gray-700">{String(val)}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Usage Charges */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-gray-900">Usage-Based Charges (All Tiers)</h3></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">Charge</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">Billing</th>
              </tr>
            </thead>
            <tbody>
              {USAGE_CHARGES.map(c => (
                <tr key={c.name} className="border-t border-gray-100">
                  <td className="px-5 py-3 font-medium text-gray-700">{c.name}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900">{c.price}</td>
                  <td className="px-5 py-3 text-gray-500">{c.per}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Per-Tenant Feature Overrides</h3>
          <span className="text-xs text-gray-500">Override tier features for individual tenants</span>
        </CardHeader>
        <CardBody>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <Sliders className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <div className="text-sm font-medium text-gray-700">Feature Flag Management</div>
            <div className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Enable or disable specific features for individual tenants. Useful for beta testing, custom agreements, or temporary access grants.</div>
            <Button variant="outline" size="sm" className="mt-4">Manage Overrides</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
