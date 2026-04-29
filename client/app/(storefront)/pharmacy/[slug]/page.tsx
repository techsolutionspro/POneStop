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

  return (
    <div className="min-h-screen bg-gray-50">
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
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Welcome to {pharmacy.name}
          </h2>
          <p className="text-teal-100 text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
            Professional healthcare services delivered by qualified pharmacists. Book a consultation or order treatments online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/pharmacy/${slug}/book`}>
              <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50 w-full sm:w-auto">
                Book a Consultation
              </Button>
            </Link>
            <Link href={`/pharmacy/${slug}/order`}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                Order Online
              </Button>
            </Link>
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
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8">
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
                <div key={service.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all">
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

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <h5 className="text-white font-semibold mb-3">{pharmacy.name}</h5>
              {pharmacy.address && <p className="text-sm mb-2">{pharmacy.address}</p>}
              {pharmacy.phone && <p className="text-sm mb-2">Tel: {pharmacy.phone}</p>}
              {pharmacy.email && <p className="text-sm">{pharmacy.email}</p>}
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
