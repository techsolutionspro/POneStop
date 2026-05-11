'use client';

import { useEffect, useState } from 'react';
import { packageApi } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Check, X, CreditCard, ArrowUpRight, Zap, Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const [plan, setPlan] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([packageApi.myPlan(), packageApi.list()])
      .then(([planRes, pkgRes]) => { setPlan(planRes.data.data); setPackages(pkgRes.data.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSubscribe(pkgId: string) {
    setUpgrading(pkgId);
    try {
      const res = await packageApi.subscribe(pkgId);
      toast.success(`Plan changed to ${res.data.data.tier}`);
      const planRes = await packageApi.myPlan();
      setPlan(planRes.data.data);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); } finally { setUpgrading(null); }
  }

  async function openBillingPortal() {
    try {
      const res = await packageApi.billingPortal();
      if (res.data.data?.url) window.open(res.data.data.url, '_blank');
      else toast.error(res.data.error || 'Billing portal not available');
    } catch { toast.error('Could not open billing portal'); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full" /></div>;

  const currentPkg = plan?.package;
  const usage = plan?.usage || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Billing & Plan</h1><p className="text-sm text-gray-500 mt-1">Manage your subscription, view usage, and upgrade</p></div>
        {plan?.stripeIsLive && <Button variant="outline" onClick={openBillingPortal}><CreditCard className="w-4 h-4" /> Manage Payment Method</Button>}
      </div>

      {/* Current Plan Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-teal-200 text-sm font-medium mb-1">Current Plan</div>
            <div className="text-3xl font-bold">{currentPkg?.name || plan?.currentTier}</div>
            <div className="text-teal-100 text-lg mt-1">{currentPkg ? formatCurrency(currentPkg.price) : '—'}/month</div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${plan?.subscriptionStatus === 'active' ? 'bg-green-500/20 text-green-200' : plan?.subscriptionStatus === 'trialing' ? 'bg-yellow-500/20 text-yellow-200' : 'bg-white/15 text-white/80'}`}>
              {plan?.subscriptionStatus === 'trialing' && <Clock className="w-3.5 h-3.5" />}
              {plan?.subscriptionStatus === 'active' && <Zap className="w-3.5 h-3.5" />}
              {(plan?.subscriptionStatus || 'none').replace('_', ' ').toUpperCase()}
            </div>
            {plan?.trialEndsAt && <div className="text-teal-200 text-xs mt-2">Trial ends: {new Date(plan.trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
          </div>
        </div>
      </div>

      {/* Usage */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-gray-900">Plan Usage</h3></CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Branches', used: usage.branches || 0, max: usage.maxBranches || 1 },
              { label: 'Active Services', used: usage.services || 0, max: usage.maxServices || 20 },
              { label: 'Staff Members', used: usage.staff || 0, max: usage.maxStaff || 10 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className="text-sm text-gray-500">{item.used} / {item.max === 999 ? '∞' : item.max}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.max !== 999 && item.used / item.max > 0.8 ? 'bg-red-500' : 'bg-teal-500'}`}
                    style={{ width: `${item.max === 999 ? 5 : Math.min((item.used / item.max) * 100, 100)}%` }} />
                </div>
                {item.max !== 999 && item.used >= item.max && <div className="text-xs text-red-600 mt-1 font-medium">Limit reached — upgrade</div>}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Feature Access */}
      {currentPkg && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-gray-900">Feature Access</h3></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'onlineOrdering', label: 'Online Ordering + Delivery' },
                { key: 'customDomain', label: 'Custom Domain' },
                { key: 'customMailbox', label: 'Custom Mailbox' },
                { key: 'videoConsults', label: 'Video Consultations' },
                { key: 'marketingTools', label: 'Marketing Tools' },
                { key: 'groupManagement', label: 'Group Management / SSO' },
                { key: 'apiAccess', label: 'API Access' },
                { key: 'dedicatedSupport', label: 'Dedicated Support' },
                { key: 'customWebsite', label: 'Custom Website' },
              ].map(f => (
                <div key={f.key} className={`flex items-center gap-2 text-sm p-2 rounded ${currentPkg[f.key] ? 'text-gray-900' : 'text-gray-400'}`}>
                  {currentPkg[f.key] ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-gray-300" />}
                  {f.label}
                  {!currentPkg[f.key] && <span className="text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full ml-auto">Upgrade</span>}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Plans */}
      <h2 className="text-lg font-bold text-gray-900">{plan?.currentTier === 'ENTERPRISE' ? 'All Plans' : 'Upgrade Your Plan'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map(pkg => {
          const isCurrent = pkg.tier === plan?.currentTier;
          return (
            <div key={pkg.id} className={`bg-white border-2 rounded-2xl p-6 relative ${isCurrent ? 'border-teal-500' : pkg.isPopular ? 'border-teal-300' : 'border-gray-200'}`}>
              {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">CURRENT</div>}
              {!isCurrent && pkg.isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">RECOMMENDED</div>}
              <div className="text-lg font-bold mb-1">{pkg.name}</div>
              <div className="text-sm text-gray-500 mb-4">{pkg.description}</div>
              <div className="text-3xl font-extrabold mb-4">{formatCurrency(pkg.price)}<span className="text-sm font-normal text-gray-400">/mo</span></div>
              <div className="space-y-2 mb-6">
                {(pkg.features || []).slice(0, 5).map((f: string) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-700"><Check className="w-3.5 h-3.5 text-teal-500" /> {f}</div>
                ))}
              </div>
              {isCurrent
                ? <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                : <Button className="w-full" variant={pkg.isPopular ? 'primary' : 'outline'} disabled={upgrading === pkg.id} onClick={() => handleSubscribe(pkg.id)}>
                    {upgrading === pkg.id ? 'Processing...' : <>{pkg.price > (currentPkg?.price || 0) ? 'Upgrade' : 'Downgrade'} <ArrowUpRight className="w-3.5 h-3.5" /></>}
                  </Button>}
            </div>
          );
        })}
      </div>

      {!plan?.stripeIsLive && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-yellow-600" />
          <div className="text-sm text-yellow-800"><strong>Demo mode.</strong> Plan changes apply instantly but no real charges. Connect Stripe to enable billing.</div>
        </div>
      )}
    </div>
  );
}
