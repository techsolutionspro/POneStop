'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Star, Truck, Filter, X, ArrowLeft, Pill, Loader2 } from 'lucide-react';
import { marketplaceApi, adApi } from '@/lib/api';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'BASIC_CONSULTATION', label: 'Consultations' },
  { value: 'OTC', label: 'Over the Counter' },
  { value: 'PHARMACY_MEDICINE', label: 'Pharmacy Medicines' },
  { value: 'POM_PRESCRIBING', label: 'Prescription Services' },
];

const RADIUS_OPTIONS = [5, 10, 15, 25, 50];

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [postcode, setPostcode] = useState(searchParams.get('postcode') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('postcode') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [radius, setRadius] = useState(Number(searchParams.get('radius')) || 10);
  const [results, setResults] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [meta, setMeta] = useState<any>(null);

  const doSearch = useCallback(async (pc: string, cat: string, rad: number) => {
    if (!pc) return;
    setLoading(true);
    setSearched(true);
    try {
      const [searchRes, featuredRes] = await Promise.all([
        marketplaceApi.search({ postcode: pc, radius: rad, category: cat || undefined }),
        marketplaceApi.featured(pc),
      ]);
      setResults(searchRes.data.data || []);
      setMeta(searchRes.data.meta || null);
      setFeatured(featuredRes.data.data || []);
    } catch {
      setResults([]);
      setFeatured([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const pc = searchParams.get('postcode');
    const cat = searchParams.get('category') || '';
    if (pc) {
      setPostcode(pc);
      setSearchInput(pc);
      setCategory(cat);
      doSearch(pc, cat, radius);
    }
  }, [searchParams, radius, doSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setPostcode(searchInput.trim());
    router.push(`/browse?postcode=${encodeURIComponent(searchInput.trim())}${category ? `&category=${category}` : ''}&radius=${radius}`);
  };

  const handleAdClick = async (adId: string, slug: string) => {
    try { await adApi.click(adId); } catch {}
    router.push(`/pharmacy/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 hidden sm:block">Pharmacy One Stop</span>
            </Link>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="flex items-center bg-gray-100 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition">
                <MapPin className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter postcode"
                  className="flex-1 px-2 py-2.5 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
                />
                <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg m-1 text-sm font-medium transition">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-2"
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>

          {/* Filters bar */}
          {showFilters && (
            <div className="pb-4 flex flex-wrap gap-4 items-center border-t border-gray-100 pt-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); if (postcode) doSearch(postcode, e.target.value, radius); }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                >
                  {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Radius (miles)</label>
                <select
                  value={radius}
                  onChange={(e) => { setRadius(Number(e.target.value)); if (postcode) doSearch(postcode, category, Number(e.target.value)); }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                >
                  {RADIUS_OPTIONS.map(r => <option key={r} value={r}>{r} miles</option>)}
                </select>
              </div>
              {category && (
                <button onClick={() => { setCategory(''); if (postcode) doSearch(postcode, '', radius); }} className="text-xs text-red-500 flex items-center gap-1 mt-4">
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* No search yet */}
        {!searched && !loading && (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">Enter your postcode to find nearby pharmacies</h2>
            <p className="mt-2 text-gray-500">We&apos;ll show you pharmacies that deliver to your area</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Searching pharmacies near {postcode}...</p>
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <>
            {meta && (
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">
                  {results.length} {results.length === 1 ? 'pharmacy' : 'pharmacies'} near {meta.searchPostcode}
                </h1>
                <p className="text-sm text-gray-500">Within {meta.radius} miles</p>
              </div>
            )}

            {/* Sponsored results */}
            {featured.length > 0 && (
              <div className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.slice(0, 3).map((item: any) => (
                    <button
                      key={item.adId}
                      onClick={() => handleAdClick(item.adId, item.pharmacy.slug)}
                      className="bg-white rounded-xl border-2 border-amber-200 p-5 hover:shadow-md transition text-left w-full"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                          style={{ backgroundColor: item.pharmacy.primaryColor || '#0d9488' }}
                        >
                          {item.pharmacy.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 truncate">{item.pharmacy.name}</h3>
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Ad</span>
                          </div>
                          {item.pharmacy.rating && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs text-gray-600">{item.pharmacy.rating} ({item.pharmacy.reviewCount})</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {item.title && <p className="text-sm text-gray-600 mt-2">{item.title}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pharmacy cards */}
            {results.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <Search className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="mt-4 text-lg font-semibold text-gray-700">No pharmacies found</h3>
                <p className="mt-2 text-gray-500">Try a different postcode or increase the search radius</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.map((pharmacy: any) => (
                  <Link
                    key={pharmacy.id}
                    href={`/pharmacy/${pharmacy.slug}`}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-teal-200 transition group"
                  >
                    <div className="flex items-start gap-4">
                      {pharmacy.logoUrl ? (
                        <img src={pharmacy.logoUrl} alt={pharmacy.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                          style={{ backgroundColor: pharmacy.primaryColor || '#0d9488' }}
                        >
                          {pharmacy.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition truncate">{pharmacy.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          {pharmacy.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                              {pharmacy.rating} ({pharmacy.reviewCount})
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {pharmacy.distance} mi
                          </span>
                        </div>

                        {/* Services preview */}
                        {pharmacy.services.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {pharmacy.services.slice(0, 4).map((svc: any) => (
                              <span key={svc.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                                {svc.name}
                              </span>
                            ))}
                            {pharmacy.serviceCount > 4 && (
                              <span className="text-xs text-gray-400 px-1 py-1">+{pharmacy.serviceCount - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        {pharmacy.deliveryFee !== null && pharmacy.deliveryFee !== undefined && (
                          <span className="flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" /> {pharmacy.deliveryFee === 0 ? 'Free delivery' : `£${pharmacy.deliveryFee}`}
                          </span>
                        )}
                        {pharmacy.minOrderAmount && <span>Min. £{pharmacy.minOrderAmount}</span>}
                      </div>
                      <span className="text-teal-600 font-medium group-hover:underline">View pharmacy →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
