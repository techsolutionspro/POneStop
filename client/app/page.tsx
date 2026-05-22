'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, Clock, Truck, Shield, ChevronRight, Pill, Stethoscope, Heart, Syringe, ArrowRight } from 'lucide-react';
import { marketplaceApi } from '@/lib/api';

const CATEGORIES = [
  { id: 'BASIC_CONSULTATION', name: 'Consultations', icon: Stethoscope, color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { id: 'OTC', name: 'Over the Counter', icon: Pill, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'PHARMACY_MEDICINE', name: 'Pharmacy Medicines', icon: Heart, color: 'bg-rose-50 text-rose-600 border-rose-200' },
  { id: 'POM_PRESCRIBING', name: 'Prescription Services', icon: Shield, color: 'bg-amber-50 text-amber-600 border-amber-200' },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Enter your postcode', desc: 'Find pharmacies near you that offer the services you need.' },
  { step: '2', title: 'Browse & choose', desc: 'Compare services, prices, ratings, and delivery options.' },
  { step: '3', title: 'Order & pay', desc: 'Place your order securely. Track it from pharmacy to your door.' },
];

export default function MarketplaceHomePage() {
  const router = useRouter();
  const [postcode, setPostcode] = useState('');
  const [featured, setFeatured] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    marketplaceApi.featured().then(res => setFeatured(res.data.data || [])).catch(() => {});
    marketplaceApi.categories().then(res => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postcode.trim()) return;
    router.push(`/browse?postcode=${encodeURIComponent(postcode.trim())}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Pharmacy One Stop</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/browse" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">Browse</Link>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Log in</Link>
            <Link href="/signup" className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
              List your pharmacy
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-blue-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Pharmacy services,{' '}
              <span className="text-teal-600">delivered to you</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Find trusted pharmacies near you. Order consultations, medicines, and health services — all from one place.
            </p>

            {/* Postcode Search */}
            <form onSubmit={handleSearch} className="mt-10 max-w-xl mx-auto">
              <div className="flex items-center bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-200 p-2 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition">
                <MapPin className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="Enter your postcode (e.g. SW1A 1AA)"
                  className="flex-1 px-3 py-3 text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none text-lg"
                />
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 flex-shrink-0"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </form>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-teal-600" /> GPhC Registered</span>
              <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-teal-600" /> Next Day Delivery</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-teal-600" /> Clinician Reviewed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Browse by category</h2>
          <p className="mt-2 text-gray-500 text-center">Find the service you need from pharmacies near you</p>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => {
              const apiCat = categories.find((c: any) => c.id === cat.id);
              return (
                <Link
                  key={cat.id}
                  href={`/browse?category=${cat.id}`}
                  className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border ${cat.color} hover:shadow-md transition`}
                >
                  <cat.icon className="w-8 h-8" />
                  <span className="font-medium text-sm text-center">{cat.name}</span>
                  {apiCat && <span className="text-xs opacity-70">{apiCat.count} services</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Pharmacies */}
      {featured.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Featured pharmacies</h2>
                <p className="mt-1 text-gray-500">Trusted pharmacies delivering quality healthcare</p>
              </div>
              <Link href="/browse" className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 6).map((item: any) => (
                <Link
                  key={item.adId}
                  href={`/pharmacy/${item.pharmacy.slug}`}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition group"
                >
                  <div className="flex items-start gap-4">
                    {item.pharmacy.logoUrl ? (
                      <img src={item.pharmacy.logoUrl} alt={item.pharmacy.name} className="w-14 h-14 rounded-xl object-cover" />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: item.pharmacy.primaryColor || '#0d9488' }}
                      >
                        {item.pharmacy.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-teal-600 transition">{item.pharmacy.name}</h3>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Sponsored</span>
                      </div>
                      {item.pharmacy.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium text-gray-700">{item.pharmacy.rating}</span>
                          <span className="text-sm text-gray-400">({item.pharmacy.reviewCount})</span>
                        </div>
                      )}
                      {item.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>}
                    </div>
                  </div>
                  {(item.pharmacy.deliveryFee !== null || item.pharmacy.minOrderAmount !== null) && (
                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                      {item.pharmacy.deliveryFee !== null && (
                        <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {item.pharmacy.deliveryFee === 0 ? 'Free delivery' : `£${item.pharmacy.deliveryFee} delivery`}</span>
                      )}
                      {item.pharmacy.minOrderAmount !== null && (
                        <span>Min. £{item.pharmacy.minOrderAmount}</span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center">How it works</h2>
          <p className="mt-2 text-gray-500 text-center">Order pharmacy services in 3 simple steps</p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for Pharmacies */}
      <section className="py-16 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Own a pharmacy?</h2>
          <p className="mt-4 text-teal-100 text-lg max-w-2xl mx-auto">
            List your pharmacy on Pharmacy One Stop and reach thousands of patients in your area.
            Early bird pricing: just £50/month + 10% commission.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-white text-teal-700 px-8 py-3 rounded-xl font-semibold hover:bg-teal-50 transition flex items-center gap-2"
            >
              List your pharmacy <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="text-teal-200 text-sm">
              First 100 pharmacies get Early Bird pricing — £50/mo
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4">For Patients</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/browse" className="hover:text-white transition">Browse Pharmacies</Link></li>
                <li><Link href="/browse?category=BASIC_CONSULTATION" className="hover:text-white transition">Consultations</Link></li>
                <li><Link href="/browse?category=OTC" className="hover:text-white transition">OTC Medicines</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Pharmacies</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/signup" className="hover:text-white transition">List Your Pharmacy</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Pharmacy Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition">About</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-center">
            &copy; {new Date().getFullYear()} Pharmacy One Stop. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
