'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, MapPin, Phone, Clock, Truck, Shield, Pill, Loader2 } from 'lucide-react';
import { marketplaceApi } from '@/lib/api';

const CATEGORY_LABELS: Record<string, string> = {
  BASIC_CONSULTATION: 'Consultations',
  OTC: 'Over the Counter',
  PHARMACY_MEDICINE: 'Pharmacy Medicines',
  POM_PGD: 'PGD Services',
  POM_PRESCRIBING: 'Prescriber Services',
};

export default function PharmacyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    if (!slug) return;
    marketplaceApi.pharmacy(slug)
      .then(res => setPharmacy(res.data.data))
      .catch(() => setPharmacy(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy not found</h1>
          <Link href="/browse" className="text-teal-600 hover:underline mt-4 inline-block">Back to browse</Link>
        </div>
      </div>
    );
  }

  // Group services by category
  const servicesByCategory = pharmacy.services.reduce((acc: any, svc: any) => {
    if (!acc[svc.category]) acc[svc.category] = [];
    acc[svc.category].push(svc);
    return acc;
  }, {} as Record<string, any[]>);

  const categories = Object.keys(servicesByCategory);
  const filteredServices = activeCategory
    ? servicesByCategory[activeCategory] || []
    : pharmacy.services;

  const mainBranch = pharmacy.branches[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14">
          <Link href="/browse" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to results
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pharmacy header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <div className="flex items-start gap-5">
            {pharmacy.logoUrl ? (
              <img src={pharmacy.logoUrl} alt={pharmacy.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0"
                style={{ backgroundColor: pharmacy.primaryColor || '#0d9488' }}
              >
                {pharmacy.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{pharmacy.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                {pharmacy.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium text-gray-700">{pharmacy.rating}</span>
                    ({pharmacy.reviewCount} reviews)
                  </span>
                )}
                {pharmacy.gphcNumber && (
                  <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-teal-600" /> GPhC: {pharmacy.gphcNumber}</span>
                )}
                {pharmacy.dspStatus === 'VERIFIED' && (
                  <span className="flex items-center gap-1 text-green-600"><Shield className="w-4 h-4" /> DSP Verified</span>
                )}
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mainBranch && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{mainBranch.name}</p>
                  <p className="text-gray-500">{mainBranch.address}, {mainBranch.city}</p>
                  <p className="text-gray-500">{mainBranch.postcode}</p>
                  {mainBranch.phone && (
                    <a href={`tel:${mainBranch.phone}`} className="text-teal-600 hover:underline flex items-center gap-1 mt-1">
                      <Phone className="w-3.5 h-3.5" /> {mainBranch.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Truck className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">Delivery</p>
                {pharmacy.deliveryFee !== null ? (
                  <p className="text-gray-500">{pharmacy.deliveryFee === 0 ? 'Free delivery' : `£${pharmacy.deliveryFee} delivery fee`}</p>
                ) : (
                  <p className="text-gray-500">Contact for delivery info</p>
                )}
                {pharmacy.deliveryRadius && <p className="text-gray-500">Within {pharmacy.deliveryRadius} miles</p>}
                {pharmacy.minOrderAmount && <p className="text-gray-500">Min order: £{pharmacy.minOrderAmount}</p>}
              </div>
            </div>
            {mainBranch?.openingHours && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Opening Hours</p>
                  {Object.entries(mainBranch.openingHours as Record<string, any>).slice(0, 3).map(([day, hours]: [string, any]) => (
                    <p key={day} className="text-gray-500 capitalize">{day}: {hours.open} - {hours.close}</p>
                  ))}
                  {Object.keys(mainBranch.openingHours as Record<string, any>).length > 3 && (
                    <p className="text-gray-400 text-xs">+ more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Services */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Services ({pharmacy.services.length})</h2>

          {/* Category filter tabs */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setActiveCategory('')}
                className={`text-sm px-4 py-2 rounded-lg border transition ${
                  !activeCategory ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                }`}
              >
                All ({pharmacy.services.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-sm px-4 py-2 rounded-lg border transition ${
                    activeCategory === cat ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                  }`}
                >
                  {CATEGORY_LABELS[cat] || cat} ({servicesByCategory[cat].length})
                </button>
              ))}
            </div>
          )}

          {/* Service cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredServices.map((svc: any) => (
              <div key={svc.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-200 transition">
                <div className="flex items-start gap-4">
                  {svc.heroImageUrl ? (
                    <img src={svc.heroImageUrl} alt={svc.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <Pill className="w-7 h-7 text-teal-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                    <span className="text-xs text-gray-400 mt-0.5 inline-block">{CATEGORY_LABELS[svc.category] || svc.category}</span>
                    {svc.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{svc.description}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">£{svc.price.toFixed(2)}</span>
                      {svc.duration && <span className="text-xs text-gray-400">{svc.duration} min</span>}
                    </div>
                    {svc.fulfilmentModes && svc.fulfilmentModes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {svc.fulfilmentModes.map((mode: string) => (
                          <span key={mode} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                            {mode.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No services found in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
