'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { serviceApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  therapyArea: string;
  price: number;
  duration?: number;
  fulfilmentModes: string[];
  questionnaireSchema?: any[];
  pharmacy: {
    name: string;
    slug: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

const FAQ_ITEMS = [
  { q: 'How long does the consultation take?', a: 'Most consultations take between 10-20 minutes depending on the service. Your pharmacist will ensure all your questions are answered.' },
  { q: 'Do I need a prescription?', a: 'Not for most of our services. Our pharmacists can supply treatments under Patient Group Directions (PGDs) or via independent prescriber consultations.' },
  { q: 'Is my information kept confidential?', a: 'Absolutely. All your data is encrypted and stored securely in compliance with NHS data standards and GDPR regulations.' },
  { q: 'Can I get a refund?', a: 'Please refer to our refund policy. In most cases, consultations are non-refundable once completed, but unused medication orders may be eligible.' },
];

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const serviceId = params.serviceId as string;
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await serviceApi.get(serviceId);
        setService(res.data.data);
      } catch {
        setError('Service not found.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [serviceId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Not Found</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link href={`/pharmacy/${slug}`}>
            <Button variant="outline">Back to Pharmacy</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasInBranch = service.fulfilmentModes.includes('IN_BRANCH');
  const hasOnline = service.fulfilmentModes.includes('ONLINE');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/pharmacy/${slug}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="font-medium">Back to {service.pharmacy?.name || 'Pharmacy'}</span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 text-sm font-medium rounded-full mb-4">
              {service.therapyArea}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{service.name}</h1>

            {/* Star Rating Placeholder */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400' : 'text-yellow-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-medium text-gray-900">4.9</span>
              <span className="text-sm text-gray-500">(127 reviews)</span>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About This Service</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {service.description || service.shortDescription || 'Full details about this service will be provided during your consultation with the pharmacist.'}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <svg className="w-6 h-6 text-teal-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-gray-500">Price</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(service.price)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <svg className="w-6 h-6 text-teal-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-lg font-bold text-gray-900">{service.duration ? `${service.duration} min` : 'Varies'}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <svg className="w-6 h-6 text-teal-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <p className="text-sm text-gray-500">Available</p>
                <p className="text-lg font-bold text-gray-900">
                  {hasInBranch && hasOnline ? 'Both' : hasInBranch ? 'In-Branch' : 'Online'}
                </p>
              </div>
            </div>

            {/* Fulfilment Modes */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Access This Service</h2>
              <div className="space-y-4">
                {hasInBranch && (
                  <div className="flex items-start gap-4 p-4 bg-teal-50 rounded-lg">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">In-Branch Consultation</h3>
                      <p className="text-sm text-gray-600 mt-1">Visit the pharmacy for a face-to-face consultation with a qualified pharmacist. Book a convenient time slot.</p>
                    </div>
                  </div>
                )}
                {hasOnline && (
                  <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-lg">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Order Online</h3>
                      <p className="text-sm text-gray-600 mt-1">Complete a medical questionnaire online, get clinically reviewed, and have your treatment delivered to your door.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-2">
                {FAQ_ITEMS.map((item, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-lg">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 text-sm">{item.q}</span>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {openFaq === idx && (
                      <div className="px-4 pb-4 text-sm text-gray-600">{item.a}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
              <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(service.price)}</p>
              <p className="text-sm text-gray-500 mb-6">
                {service.duration ? `${service.duration} minute consultation` : 'Per treatment'}
              </p>
              <div className="space-y-3">
                {hasInBranch && (
                  <Link href={`/pharmacy/${slug}/book?serviceId=${service.id}`} className="block">
                    <Button size="lg" className="w-full">Book In-Branch</Button>
                  </Link>
                )}
                {hasOnline && (
                  <Link href={`/pharmacy/${slug}/order?serviceId=${service.id}`} className="block">
                    <Button size="lg" variant={hasInBranch ? 'outline' : 'primary'} className="w-full">Order Online</Button>
                  </Link>
                )}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  GPhC registered pharmacists
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Secure & confidential
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Clinically approved protocols
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
