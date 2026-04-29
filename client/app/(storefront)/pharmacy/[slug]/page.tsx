'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { serviceApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PharmacyService {
  id: string;
  name: string;
  therapyArea: string;
  price: number;
  fulfilmentModes: string[];
  shortDescription?: string;
  duration?: number;
}

interface PharmacyData {
  pharmacy: {
    name: string;
    slug: string;
    logoUrl?: string;
    primaryColor?: string;
    gphcNumber?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  services: PharmacyService[];
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'OTC', label: 'Over the Counter' },
  { value: 'PHARMACY_MEDICINE', label: 'Pharmacy Medicine' },
  { value: 'POM_PGD', label: 'Clinical Service' },
  { value: 'POM_PRESCRIBING', label: 'Prescription' },
  { value: 'BASIC_CONSULTATION', label: 'Consultation' },
];

const FULFILMENT_OPTIONS = [
  { value: '', label: 'All Fulfilment' },
  { value: 'IN_BRANCH', label: 'In-Branch' },
  { value: 'ONLINE_DELIVERY', label: 'Online Delivery' },
  { value: 'CLICK_AND_COLLECT', label: 'Click & Collect' },
];

export default function PharmacyStorefrontPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<PharmacyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fulfilmentFilter, setFulfilmentFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await serviceApi.storefront(slug);
        setData(res.data.data);
      } catch {
        setError('Pharmacy not found or unavailable.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading pharmacy...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pharmacy Not Found</h2>
          <p className="text-gray-500">{error || 'This pharmacy page is unavailable.'}</p>
        </div>
      </div>
    );
  }

  const { pharmacy, services } = data;
  const accentColor = pharmacy.primaryColor || '#0d9488';

  const filteredServices = services.filter((service: any) => {
    const matchesSearch = !searchQuery || service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || (service.category || 'POM_PGD') === categoryFilter;
    const matchesFulfilment = !fulfilmentFilter || service.fulfilmentModes.includes(fulfilmentFilter);
    return matchesSearch && matchesCategory && matchesFulfilment;
  });

  const lowestPrice = services.length > 0 ? Math.min(...services.map(s => s.price)) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient animation keyframes */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .hero-gradient {
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }
      `}</style>

      {/* Trust Bar */}
      <div className="bg-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-6 text-xs sm:text-sm">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            GPhC Registered
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            256-bit Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Qualified Pharmacists
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pharmacy.logoUrl ? (
              <img src={pharmacy.logoUrl} alt={pharmacy.name} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: accentColor }}>
                {pharmacy.name.charAt(0)}
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900">{pharmacy.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign In</Link>
            <Link href="/signup" className="text-sm font-medium text-teal-600 hover:text-teal-700">Register</Link>
            <Link href={`/pharmacy/${slug}/book`}>
              <Button size="sm">Book Now</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Welcome to {pharmacy.name}
          </h2>
          <p className="text-teal-100 text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
            Professional healthcare services delivered by qualified pharmacists. Book a consultation or order treatments online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/pharmacy/${slug}/book`}>
              <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50 hover:-translate-y-1 hover:shadow-lg transition-all px-8 py-4 text-base w-full sm:w-auto">
                Book a Consultation
              </Button>
            </Link>
            <Link href={`/pharmacy/${slug}/order`}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg transition-all px-8 py-4 text-base w-full sm:w-auto">
                Order Online
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Qualified Pharmacists</h4>
            <p className="text-sm text-gray-500">All consultations are carried out by GPhC-registered pharmacists with clinical expertise.</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Fast Delivery</h4>
            <p className="text-sm text-gray-500">Treatments dispatched quickly with tracked delivery straight to your door.</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">100% Confidential</h4>
            <p className="text-sm text-gray-500">Your health information is encrypted and handled with complete discretion.</p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Our Services</h3>
          <p className="text-gray-500 max-w-xl mx-auto">
            Browse our range of pharmacy services and clinical consultations.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8 sticky top-0 z-20 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={fulfilmentFilter}
              onChange={(e) => setFulfilmentFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            >
              {FULFILMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            Showing {filteredServices.length} of {services.length} services
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <p className="text-gray-500">
              {services.length === 0
                ? 'No services are currently available. Please check back soon.'
                : 'No services match your filters. Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service: any) => {
              const cat = service.category || 'POM_PGD';
              const catLabels: Record<string, { label: string; color: string }> = {
                BASIC_CONSULTATION: { label: 'Consultation', color: 'bg-blue-50 text-blue-700' },
                OTC: { label: 'Over the Counter', color: 'bg-green-50 text-green-700' },
                PHARMACY_MEDICINE: { label: 'Pharmacy Medicine', color: 'bg-amber-50 text-amber-700' },
                POM_PGD: { label: 'Clinical Service', color: 'bg-teal-50 text-teal-700' },
                POM_PRESCRIBING: { label: 'Prescription', color: 'bg-purple-50 text-purple-700' },
              };
              const catInfo = catLabels[cat] || catLabels.POM_PGD;
              const hasOnline = service.fulfilmentModes.includes('ONLINE_DELIVERY');
              const hasInBranch = service.fulfilmentModes.includes('IN_BRANCH');
              const hasClickCollect = service.fulfilmentModes.includes('CLICK_AND_COLLECT');
              const needsIdv = service.requiresIdv;
              const needsRx = service.requiresPrescriberReview;

              return (
                <div key={service.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200">
                  {/* Category + Price */}
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${catInfo.color}`}>
                      {catInfo.label}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-bold" style={{ color: accentColor }}>{formatCurrency(service.price)}</span>
                      {service.duration && <div className="text-[10px] text-gray-400">{service.duration} min</div>}
                    </div>
                  </div>

                  {/* Name + Description */}
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h4>
                  {service.description && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{service.description}</p>}

                  {/* Fulfilment modes */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {hasInBranch && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-full">In-Branch</span>}
                    {hasOnline && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] rounded-full">Home Delivery</span>}
                    {hasClickCollect && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[11px] rounded-full">Click & Collect</span>}
                    {service.isDiscreet && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 text-white text-[11px] rounded-full">Discreet</span>}
                  </div>

                  {/* Requirements info */}
                  {(needsIdv || needsRx) && (
                    <div className="text-[11px] text-gray-400 mb-3 flex items-center gap-2">
                      {needsIdv && <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>ID required</span>}
                      {needsRx && <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Prescriber reviewed</span>}
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {hasInBranch && (
                      <Link href={`/pharmacy/${slug}/book?serviceId=${service.id}`} className="flex-1">
                        <button className="w-full py-2.5 border-2 rounded-lg text-sm font-semibold transition-colors" style={{ borderColor: accentColor, color: accentColor }}>
                          Book Appointment
                        </button>
                      </Link>
                    )}
                    {hasOnline && (
                      <Link href={`/pharmacy/${slug}/order?serviceId=${service.id}`} className="flex-1">
                        <button className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors" style={{ backgroundColor: accentColor }}>
                          {cat === 'OTC' ? 'Buy Now' : cat === 'PHARMACY_MEDICINE' ? 'Order Online' : 'Order & Deliver'}
                        </button>
                      </Link>
                    )}
                    {!hasInBranch && !hasOnline && hasClickCollect && (
                      <Link href={`/pharmacy/${slug}/order?serviceId=${service.id}`} className="flex-1">
                        <button className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors" style={{ backgroundColor: accentColor }}>
                          Order & Collect
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reviews Section */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">What Our Patients Say</h3>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
              <span className="text-lg font-bold text-gray-900">4.9</span>
              <span className="text-sm text-gray-500">average rating</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', text: 'Incredibly professional service. The pharmacist was thorough with the consultation and my treatment arrived the next day. Highly recommend!', date: '2 weeks ago' },
              { name: 'James R.', text: 'So easy to use. Booked online, had my video consultation, and the prescription was sorted within hours. Discreet packaging too.', date: '1 month ago' },
              { name: 'Emily T.', text: 'Finally a pharmacy that takes online healthcare seriously. The whole process was smooth, confidential, and the pharmacist really listened.', date: '3 weeks ago' },
            ].map((review, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-6">
                <div className="flex mb-3">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">&ldquo;{review.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{review.name}</span>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 sm:hidden border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]" style={{ backgroundColor: accentColor }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-white">
            <div className="text-xs opacity-80">Services from</div>
            {lowestPrice !== null && <div className="text-lg font-bold">{formatCurrency(lowestPrice)}</div>}
          </div>
          <Link href={`/pharmacy/${slug}/book`}>
            <button className="bg-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors" style={{ color: accentColor }}>
              Book Today
            </button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 pb-20 sm:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h5 className="text-white font-semibold mb-3">{pharmacy.name}</h5>
              {pharmacy.address && <p className="text-sm mb-2">{pharmacy.address}</p>}
              {pharmacy.phone && <p className="text-sm mb-2">Tel: {pharmacy.phone}</p>}
              {pharmacy.email && <p className="text-sm mb-3">{pharmacy.email}</p>}
              {pharmacy.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pharmacy.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  View on Google Maps
                </a>
              )}
              {/* Social Media */}
              <div className="flex items-center gap-3 mt-4">
                <a href="#" className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors" aria-label="Facebook">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="#" className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors" aria-label="Instagram">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
                <a href="#" className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors" aria-label="Twitter">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
              </div>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-3">Opening Hours</h5>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span>Monday - Friday</span><span className="text-white">9:00 - 18:00</span></div>
                <div className="flex justify-between"><span>Saturday</span><span className="text-white">9:00 - 13:00</span></div>
                <div className="flex justify-between"><span>Sunday</span><span className="text-white">Closed</span></div>
                <div className="flex justify-between"><span>Bank Holidays</span><span className="text-white">Closed</span></div>
              </div>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-3">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href={`/pharmacy/${slug}`} className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href={`/pharmacy/${slug}/book`} className="hover:text-white transition-colors">Book Consultation</Link></li>
                <li><Link href={`/pharmacy/${slug}/order`} className="hover:text-white transition-colors">Order Online</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Patient Login</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-3">Regulatory</h5>
              <div className="space-y-3 text-sm">
                {pharmacy.gphcNumber && (
                  <p>GPhC Registration: <span className="text-white">{pharmacy.gphcNumber}</span></p>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">MHRA</div>
                  <span>MHRA Registered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">ICO</div>
                  <span>ICO Data Protection</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} {pharmacy.name}. Powered by Pharmacy One Stop.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
