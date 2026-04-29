'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi, packageApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Check, ArrowRight, Shield, Globe, Zap, Lock } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState<'forward' | 'back'>('forward');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [form, setForm] = useState({
    pharmacyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    tier: 'STARTER',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
    setFieldErrors(e => ({ ...e, [field]: '' }));
  }

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!form.pharmacyName.trim()) errs.pharmacyName = 'Pharmacy name is required';
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must contain an uppercase letter';
    else if (!/[a-z]/.test(form.password)) errs.password = 'Must contain a lowercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Must contain a number';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return { score: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (!validateStep1()) return;
      setStepDirection('forward');
      setStep(2);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.signup(form);
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      setUser(data.data.user);
      router.push('/admin/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const [tiers, setTiers] = useState([
    { id: 'STARTER', tier: 'STARTER', name: 'Starter', price: 99, description: '1 branch, 20 PGDs, template site', features: ['1 branch', 'Template website', 'Up to 20 PGDs', 'Booking engine', 'Stripe payments'], isPopular: false, ctaText: 'Start Free Trial' },
    { id: 'PROFESSIONAL', tier: 'PROFESSIONAL', name: 'Professional', price: 199, description: 'Full platform with online ordering', features: ['Up to 3 branches', 'Full 100+ PGD library', 'Online ordering + delivery', 'Custom domain + mailbox', 'Marketing tools'], isPopular: true, ctaText: 'Start Free Trial' },
    { id: 'ENTERPRISE', tier: 'ENTERPRISE', name: 'Enterprise', price: 399, description: 'For pharmacy groups', features: ['Unlimited branches + SSO', 'Custom website design', 'Video consultations', 'Group benchmarking', 'Dedicated account manager'], isPopular: false, ctaText: 'Book a Demo' },
  ] as any[]);

  useEffect(() => {
    packageApi.list().then(res => {
      if (res.data.data?.length > 0) {
        setTiers(res.data.data.map((p: any) => ({ ...p, id: p.tier })));
      }
    }).catch(() => {});
    // Pre-select tier from URL
    const params = new URLSearchParams(window.location.search);
    const urlTier = params.get('tier');
    if (urlTier) setForm(f => ({ ...f, tier: urlTier }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-sm">P1S</div>
            <span className="text-xl font-bold text-gray-900">Pharmacy One Stop</span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 text-sm font-medium ${step >= 1 ? 'text-teal-700' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              Your Details
            </div>
            <div className="flex-1 h-0.5 bg-gray-200"><div className={`h-full bg-teal-500 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} /></div>
            <div className={`flex items-center gap-2 text-sm font-medium ${step >= 2 ? 'text-teal-700' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
              Choose Plan
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">{error}</div>
            )}

            {/* STEP 1: Details */}
            {step === 1 && (
              <div className={`space-y-4 ${stepDirection === 'back' ? 'step-enter-back' : 'step-enter'}`}>
                <h2 className="text-2xl font-bold text-gray-900">Start your free trial</h2>
                <p className="text-sm text-gray-500 mb-6">14 days free, no credit card required. Set up in under 45 minutes.</p>

                <Input label="Pharmacy Name" required placeholder="e.g. High Street Pharmacy"
                  value={form.pharmacyName} onChange={e => update('pharmacyName', e.target.value)}
                  error={fieldErrors.pharmacyName} />

                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name" required placeholder="Your first name"
                    value={form.firstName} onChange={e => update('firstName', e.target.value)}
                    error={fieldErrors.firstName} />
                  <Input label="Last Name" required placeholder="Your last name"
                    value={form.lastName} onChange={e => update('lastName', e.target.value)}
                    error={fieldErrors.lastName} />
                </div>

                <Input label="Email" type="email" required placeholder="you@pharmacy.co.uk"
                  value={form.email} onChange={e => update('email', e.target.value)}
                  error={fieldErrors.email} />

                <div>
                  <Input label="Password" type="password" required placeholder="Create a secure password"
                    value={form.password} onChange={e => update('password', e.target.value)}
                    error={fieldErrors.password} />
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5,6].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-xs ${passwordStrength.score <= 2 ? 'text-red-500' : passwordStrength.score <= 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {passwordStrength.label}
                        </span>
                        <div className="flex gap-2 text-[10px] text-gray-400">
                          <span className={/[A-Z]/.test(form.password) ? 'text-green-500' : ''}>ABC</span>
                          <span className={/[a-z]/.test(form.password) ? 'text-green-500' : ''}>abc</span>
                          <span className={/[0-9]/.test(form.password) ? 'text-green-500' : ''}>123</span>
                          <span className={form.password.length >= 8 ? 'text-green-500' : ''}>8+</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Input label="Phone (optional)" type="tel" placeholder="07xxx xxxxxx"
                  value={form.phone} onChange={e => update('phone', e.target.value)} />

                <Button type="submit" className="w-full" size="lg"
                  disabled={!form.pharmacyName || !form.firstName || !form.lastName || !form.email || !form.password}>
                  Continue to Plan Selection <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* STEP 2: Choose Plan */}
            {step === 2 && (
              <div className={`space-y-4 ${stepDirection === 'forward' ? 'step-enter' : 'step-enter-back'}`}>
                <h2 className="text-2xl font-bold text-gray-900">Choose your plan</h2>
                <p className="text-sm text-gray-500 mb-2">All plans include a 14-day free trial. Upgrade or downgrade anytime.</p>

                {/* Billing period toggle */}
                <div className="flex items-center justify-center gap-3 py-2">
                  <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod(b => b === 'monthly' ? 'annual' : 'monthly')}
                    className={`relative w-11 h-6 rounded-full transition-colors ${billingPeriod === 'annual' ? 'bg-teal-600' : 'bg-gray-300'}`}
                    aria-label="Toggle billing period"
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${billingPeriod === 'annual' ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>Annual</span>
                  {billingPeriod === 'annual' && (
                    <span className="text-xs bg-teal-100 text-teal-700 font-semibold px-2 py-0.5 rounded-full">Save 20%</span>
                  )}
                </div>

                <div className="space-y-3">
                  {tiers.map((t: any) => {
                    const tierId = t.tier || t.id;
                    const features = Array.isArray(t.features) ? t.features : [];
                    const monthlyPrice = t.price;
                    const annualMonthlyPrice = Math.round(monthlyPrice * 0.8);
                    const displayPrice = billingPeriod === 'annual' ? annualMonthlyPrice : monthlyPrice;
                    return (
                      <button key={tierId} type="button" onClick={() => update('tier', tierId)}
                        className={`w-full text-left border-2 rounded-xl p-4 transition-all ${form.tier === tierId ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{t.name}</span>
                            {t.isPopular && <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-medium badge-pulse">POPULAR</span>}
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-gray-900">&pound;{displayPrice}</span>
                            <span className="text-xs text-gray-400">/month</span>
                            {billingPeriod === 'annual' && (
                              <div className="text-[10px] text-teal-600 line-through inline ml-1">&pound;{monthlyPrice}</div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{t.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {features.map((f: string) => (
                            <div key={f} className="flex items-center gap-1 text-xs text-gray-600">
                              <Check className="w-3 h-3 text-teal-500" /> {f}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setStepDirection('back'); setStep(1); }}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" size="lg" disabled={loading}>
                    {loading ? 'Creating your pharmacy...' : 'Start Free Trial'}
                  </Button>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  No credit card required. Cancel anytime. Your data is always yours.
                </p>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  {[
                    { icon: Shield, label: 'GPhC Compliant' },
                    { icon: Lock, label: 'GDPR Secure' },
                    { icon: Check, label: 'Cancel Anytime' },
                  ].map(badge => (
                    <div key={badge.label} className="flex items-center gap-1.5 text-xs text-gray-400">
                      <badge.icon className="w-3.5 h-3.5 text-teal-500" />
                      <span>{badge.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Already have an account? <Link href="/login" className="text-teal-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right: Benefits (desktop only) */}
      <div className="hidden lg:flex w-[480px] bg-gradient-to-br from-teal-700 to-teal-900 text-white p-12 flex-col justify-center">
        <h2 className="text-3xl font-bold mb-3">Launch your pharmacy services in 24 hours</h2>
        <p className="text-teal-200 mb-10">One platform replaces Pharmadoctor + your website + WhatsApp + paper diaries.</p>

        <div className="space-y-6">
          {[
            { icon: Zap, title: 'Go live in 24 hours', desc: 'Template website with booking, payments, and clinical engine — ready same day.' },
            { icon: Globe, title: 'Your brand, everywhere', desc: 'Custom domain, branded emails and SMS. Patients never see our name.' },
            { icon: Shield, title: 'GPhC compliant', desc: '100+ PGDs, clinical audit trail, MHRA-ready. Built for inspections.' },
          ].map(b => (
            <div key={b.title} className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <b.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold mb-1">{b.title}</div>
                <div className="text-sm text-teal-200">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-teal-600">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex -space-x-2">
              {['AH', 'SP', 'RK'].map(initials => (
                <div key={initials} className="w-8 h-8 rounded-full bg-teal-600 border-2 border-teal-800 flex items-center justify-center text-xs font-bold">{initials}</div>
              ))}
            </div>
            <div className="text-sm"><strong>120+ pharmacies</strong> already growing with us</div>
          </div>
          <p className="text-sm text-teal-300 italic">&ldquo;We went from zero online presence to &pound;6,000/month in weight-loss orders within 8 weeks.&rdquo;</p>
          <p className="text-xs text-teal-400 mt-1">&mdash; Dr. Amir Hussain, High Street Pharmacy</p>
        </div>
      </div>
    </div>
  );
}
