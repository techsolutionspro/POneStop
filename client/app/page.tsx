'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Shield, Globe, Zap, BarChart3, Users, Truck, Star } from 'lucide-react';
import { packageApi } from '@/lib/api';

const FEATURES = [
  { icon: Shield, title: 'Clinical Services Engine', desc: '100+ ready-made PGDs, guided eConsultation tool, consent capture, and immutable clinical audit trail.', color: 'bg-teal-50 text-teal-600' },
  { icon: Globe, title: 'Pharmacy Website Builder', desc: 'Mobile-first templates with drag-and-drop editor. Booking engine, payments, and patient intake baked in.', color: 'bg-indigo-50 text-indigo-600' },
  { icon: Zap, title: 'White-Label & Domains', desc: 'Your domain, your brand everywhere. Automated DNS, SSL, branded emails, SMS, and PDFs.', color: 'bg-amber-50 text-amber-600' },
  { icon: Truck, title: 'Online Orders & Delivery', desc: 'Distance-selling engine with ID verification, prescriber review, cold-chain dispatch, and subscriptions.', color: 'bg-rose-50 text-rose-600' },
];

// Fallback tiers (used if API unavailable)
const FALLBACK_TIERS = [
  { name: 'Starter', price: 99, description: 'For pharmacies getting started', features: ['1 branch', 'Template website', 'Up to 20 PGDs', 'Booking engine + payments', 'SMS & email reminders'], ctaText: 'Start Free Trial', isPopular: false },
  { name: 'Professional', price: 199, description: 'Full platform with online ordering', features: ['Up to 3 branches', 'Full 100+ PGD library', 'Online ordering + delivery', 'Custom domain + mailbox', 'Marketing tools + reports'], ctaText: 'Start Free Trial', isPopular: true },
  { name: 'Enterprise', price: 399, description: 'For pharmacy groups', features: ['Unlimited branches + SSO', 'Custom website design', 'Video consultations', 'Group benchmarking', 'Dedicated account manager'], ctaText: 'Book a Demo', isPopular: false },
];

const COMPARISONS = [
  { feature: '100+ PGDs & Clinical Engine', us: true, pharmadoctor: true, deltera: 'Partial', pharmacyMentor: false },
  { feature: 'Self-Service Website Builder', us: true, pharmadoctor: false, deltera: 'Partial', pharmacyMentor: false },
  { feature: 'Online Ordering + Home Delivery', us: true, pharmadoctor: false, deltera: false, pharmacyMentor: false },
  { feature: 'ID Verification', us: true, pharmadoctor: false, deltera: false, pharmacyMentor: false },
  { feature: 'Prescription + Label Generation', us: true, pharmadoctor: false, deltera: 'Partial', pharmacyMentor: false },
  { feature: 'Cold-Chain Courier Dispatch', us: true, pharmadoctor: false, deltera: false, pharmacyMentor: false },
  { feature: 'Domain Reselling + DNS/SSL', us: true, pharmadoctor: false, deltera: false, pharmacyMentor: false },
  { feature: 'Repeat Subscriptions', us: true, pharmadoctor: false, deltera: false, pharmacyMentor: false },
  { feature: 'Multi-Branch + SSO', us: true, pharmadoctor: false, deltera: false, pharmacyMentor: false },
];

function CellIcon({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 text-green-500 mx-auto" />;
  if (value === false) return <span className="text-gray-300 text-lg mx-auto block text-center">&times;</span>;
  return <span className="text-xs text-yellow-600 mx-auto block text-center">{value}</span>;
}

export default function LandingPage() {
  const [tiers, setTiers] = useState<any[]>(FALLBACK_TIERS);

  useEffect(() => {
    packageApi.list()
      .then(res => {
        if (res.data.data?.length > 0) setTiers(res.data.data);
      })
      .catch(() => {}); // Fall back to hardcoded
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Urgency Banner */}
      <div className="bg-teal-700 text-white text-center py-2.5 px-4 text-sm font-medium">
        Launch offer: <strong>First 50 pharmacies get 3 months free</strong> + free custom website setup.{' '}
        <Link href="/signup" className="underline ml-1">Claim your spot &rarr;</Link>
      </div>

      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Pharmacy One Stop" className="w-9 h-9" />
            <span className="text-lg font-bold">Pharmacy One Stop</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#compare" className="hover:text-gray-900">Compare</a>
            <a href="#pricing" className="hover:text-gray-900">Pricing</a>
            <a href="#faq" className="hover:text-gray-900">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Login</Link>
            <Link href="/signup" className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-4 bg-gradient-to-b from-white to-teal-50/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            Now onboarding UK pharmacies
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6">
            One platform to <span className="text-teal-600">launch, run, and scale</span> your pharmacy services
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Replace Pharmadoctor + your website agency + WhatsApp + paper diaries with one subscription. Go live in 24 hours.
          </p>
          <div className="flex gap-3 justify-center mb-6">
            <Link href="/signup" className="px-8 py-3.5 bg-teal-600 text-white text-base font-semibold rounded-xl hover:bg-teal-700 transition-all hover:shadow-lg hover:-translate-y-0.5">
              Start Free 14-Day Trial
            </Link>
            <a href="#features" className="px-8 py-3.5 border border-gray-300 text-gray-700 text-base font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
              See How It Works <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <p className="text-sm text-gray-400">No credit card required. Cancel anytime. Your data, always.</p>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-4 mt-10 pt-8 border-t border-gray-200 max-w-md mx-auto">
            <div className="flex -space-x-2">
              {['AH', 'SP', 'RK', 'EM'].map((initials, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 border-2 border-white flex items-center justify-center text-xs font-bold">{initials}</div>
              ))}
            </div>
            <div className="text-left text-sm">
              <div className="font-semibold text-gray-900">120+ pharmacies</div>
              <div className="text-gray-500">Avg. £4,200/mo extra revenue</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stop juggling 6 different tools</h2>
          <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">Most pharmacies run services using a patchwork that wastes hours every week.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Pharmadoctor', desc: 'PGDs but no website or booking' },
              { name: 'Wix / Squarespace', desc: 'Generic site, no clinical tools' },
              { name: 'WhatsApp / Phone', desc: 'No audit trail or compliance' },
              { name: 'Paper Diary', desc: 'Double bookings, no reminders' },
              { name: 'Manual Dispatch', desc: 'No tracking or cold-chain' },
              { name: '£500+/mo Combined', desc: '6 tools that don\'t talk' },
            ].map(p => (
              <div key={p.name} className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-sm font-semibold text-white/70 line-through mb-1">{p.name}</div>
                <div className="text-xs text-gray-400">{p.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-teal-400 font-semibold">Replace all of this with one platform &darr;</div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Everything your pharmacy needs. One subscription.</h2>
            <p className="text-gray-500 text-lg">Four integrated layers that work together.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl p-7 hover:shadow-lg hover:-translate-y-1 transition-all relative overflow-hidden">
                <div className="text-6xl font-extrabold text-gray-100 absolute top-4 right-6">0{i + 1}</div>
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">See how we compare</h2>
            <p className="text-gray-500">No competitor combines all four layers.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-5 py-4 font-medium text-gray-500 w-1/3">Capability</th>
                  <th className="text-center px-3 py-4 font-medium text-gray-500">Pharmadoctor</th>
                  <th className="text-center px-3 py-4 font-medium text-gray-500">Deltera</th>
                  <th className="text-center px-3 py-4 font-medium text-gray-500">Pharmacy Mentor</th>
                  <th className="text-center px-3 py-4 bg-teal-600 text-white font-bold rounded-t-lg">Pharmacy One Stop</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISONS.map((row) => (
                  <tr key={row.feature} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-700">{row.feature}</td>
                    <td className="px-3 py-3"><CellIcon value={row.pharmadoctor} /></td>
                    <td className="px-3 py-3"><CellIcon value={row.deltera} /></td>
                    <td className="px-3 py-3"><CellIcon value={row.pharmacyMentor} /></td>
                    <td className="px-3 py-3 bg-teal-50"><CellIcon value={row.us} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Trusted by pharmacies across the UK</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: 'We went from zero online presence to £6,000/month in weight-loss orders within 8 weeks. The onboarding was done in an afternoon.', name: 'Dr. Amir Hussain', role: 'Owner, High Street Pharmacy' },
              { text: 'We replaced Pharmadoctor, our Wix site, and a booking tool. One login, one bill, everything connected. My team saves 8 hours a week.', name: 'Sarah Patel', role: 'Superintendent, CareFirst' },
              { text: 'The cold-chain dispatch and subscription management is a game-changer. We ship 200+ Wegovy pens a month now.', name: 'Raj Kaur', role: 'Clinical Lead, MediQuick' },
            ].map((t, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex gap-0.5 text-yellow-400 mb-3">{[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}</div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="text-sm"><div className="font-semibold">{t.name}</div><div className="text-gray-500 text-xs">{t.role}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Simple, transparent pricing</h2>
            <p className="text-gray-500">No hidden fees. No contracts. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((t: any) => {
              const features = Array.isArray(t.features) ? t.features : [];
              const popular = t.isPopular || false;
              return (
                <div key={t.name} className={`bg-white rounded-2xl p-7 relative ${popular ? 'border-2 border-teal-500 shadow-lg' : 'border border-gray-200'}`}>
                  {popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>}
                  <div className="text-lg font-bold mb-1">{t.name}</div>
                  <div className="text-sm text-gray-500 mb-5">{t.description}</div>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold">£{t.price}</span><span className="text-gray-400">/month</span>
                    {t.annualPrice && <div className="text-xs text-teal-600 mt-1">or £{t.annualPrice}/year (save {Math.round((1 - t.annualPrice / (t.price * 12)) * 100)}%)</div>}
                  </div>
                  <div className="space-y-2.5 mb-7">
                    {features.map((f: string) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-teal-500 flex-shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                  <Link href={`/signup?tier=${t.tier || t.name?.toUpperCase()}`} className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${popular ? 'bg-teal-600 text-white hover:bg-teal-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    {t.ctaText || 'Start Free Trial'}
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            All plans include: Stripe payments, clinical audit trail, GDPR compliance, WCAG 2.1 AA.
            {tiers[0]?.consultationFee && ` Additional: £${tiers[0].consultationFee}/consultation, £${tiers[0].dispatchFee}/dispatch, £${tiers[0].smsFee}/SMS.`}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Common questions</h2>
          {[
            ['How quickly can I go live?', 'Template plans go live in 24 hours. Custom builds take 2-4 weeks. The onboarding wizard takes under 45 minutes.'],
            ['Can I transfer my existing domain?', 'Yes. Transfer your domain with zero downtime. We handle DNS, SSL, and email setup.'],
            ['Do I need DSP registration for online sales?', 'Yes, for POM products. We verify your GPhC DSP registration before enabling online fulfilment.'],
            ['What happens to my data if I cancel?', 'Your domain and data are always yours. One-click export for patients, bookings, orders, clinical records. No lock-in.'],
            ['Is it GPhC / MHRA compliant?', 'Yes. PGDs authored by registered professionals. MHRA Internet Pharmacy logo auto-injects. Immutable audit trail. Built for inspections.'],
            ['I use Pharmadoctor. Can I switch?', 'Yes. Our PGD library covers the same services and more. Most pharmacies switch fully within 2 weeks.'],
          ].map(([q, a]) => (
            <details key={q} className="border-b border-gray-200 py-5 group">
              <summary className="flex items-center justify-between cursor-pointer text-base font-semibold text-gray-900 list-none">
                {q}
                <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed max-w-xl">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-teal-700 to-teal-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-4">Ready to grow your pharmacy?</h2>
          <p className="text-teal-200 text-lg mb-8">Join 120+ UK pharmacies already using Pharmacy One Stop. Go live this week.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/signup" className="px-8 py-3.5 bg-white text-teal-800 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-base">
              Start Free 14-Day Trial
            </Link>
            <Link href="/signup" className="px-8 py-3.5 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-base">
              Book a Personal Demo
            </Link>
          </div>
          <div className="mt-5 text-sm text-teal-300 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> No credit card required. No contracts. Cancel anytime.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.svg" alt="" className="w-7 h-7" />
              <span className="text-white font-bold text-sm">Pharmacy One Stop</span>
            </div>
            <p className="text-xs leading-relaxed">UK B2B healthcare enablement platform for community pharmacies.</p>
          </div>
          <div>
            <div className="text-white font-semibold text-sm mb-3">Product</div>
            <div className="space-y-2 text-xs"><a href="#features" className="block hover:text-white">Features</a><a href="#pricing" className="block hover:text-white">Pricing</a><a href="#compare" className="block hover:text-white">Compare</a><Link href="/signup" className="block hover:text-white">Free Trial</Link></div>
          </div>
          <div>
            <div className="text-white font-semibold text-sm mb-3">Resources</div>
            <div className="space-y-2 text-xs"><a href="#faq" className="block hover:text-white">FAQ</a><a href="#" className="block hover:text-white">Documentation</a><a href="#" className="block hover:text-white">API Reference</a><a href="#" className="block hover:text-white">Status</a></div>
          </div>
          <div>
            <div className="text-white font-semibold text-sm mb-3">Legal</div>
            <div className="space-y-2 text-xs"><a href="#" className="block hover:text-white">Privacy Policy</a><a href="#" className="block hover:text-white">Terms of Service</a><a href="#" className="block hover:text-white">Cookie Policy</a><a href="#" className="block hover:text-white">GDPR</a></div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto pt-6 border-t border-gray-800 flex items-center justify-between text-xs">
          <span>&copy; 2026 Pharmacy One Stop. All rights reserved.</span>
          <span>Built by TSP</span>
        </div>
      </footer>
    </div>
  );
}
