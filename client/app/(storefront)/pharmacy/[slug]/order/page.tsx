'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { serviceApi, orderApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Service {
  id: string;
  name: string;
  price: number;
  therapyArea: string;
  fulfilmentModes: string[];
  questionnaireSchema?: any[];
}

interface PharmacyData {
  pharmacy: {
    name: string;
    slug: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  services: Service[];
}

const STEPS = ['Indication', 'Questionnaire', 'ID Verify', 'Consent & Pay', 'Tracking'];

export default function OrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const preSelectedServiceId = searchParams.get('serviceId');

  // Auth / Guest state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState<'choose' | 'guest' | 'proceed'>('choose');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestAddress, setGuestAddress] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      setIsAuthenticated(true);
      setAuthMode('proceed');
    }
    setAuthChecked(true);
  }, []);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pharmacyData, setPharmacyData] = useState<PharmacyData | null>(null);

  // Step 1
  const [selectedServiceId, setSelectedServiceId] = useState<string>(preSelectedServiceId || '');
  // Step 2: Medical questionnaire
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [medications, setMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [additionalAnswers, setAdditionalAnswers] = useState<Record<string, any>>({});
  // Step 3
  const [idVerified, setIdVerified] = useState(false);
  // Step 4
  const [consentClinical, setConsentClinical] = useState(false);
  const [consentRemote, setConsentRemote] = useState(false);
  const [consentDelivery, setConsentDelivery] = useState(false);
  const [consentNoReturn, setConsentNoReturn] = useState(false);
  const [gpSharing, setGpSharing] = useState(false);
  // Step 5
  const [confirmation, setConfirmation] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await serviceApi.storefront(slug);
        setPharmacyData(res.data.data);
        if (preSelectedServiceId) {
          setSelectedServiceId(preSelectedServiceId);
          setStep(2);
        }
      } catch {
        setError('Unable to load pharmacy services.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, preSelectedServiceId]);

  const selectedService = pharmacyData?.services.find((s) => s.id === selectedServiceId);

  const bmi = height && weight ? (parseFloat(weight) / ((parseFloat(height) / 100) ** 2)).toFixed(1) : '';

  const handleAdditionalAnswer = useCallback((key: string, value: any) => {
    setAdditionalAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    setError('');
    try {
      const guestData = authMode === 'guest' ? {
        guestName,
        guestEmail,
        guestAddress,
      } : {};
      const payload = {
        serviceId: selectedServiceId,
        questionnaireAnswers: {
          height: parseFloat(height),
          weight: parseFloat(weight),
          bmi: parseFloat(bmi || '0'),
          medications,
          allergies,
          conditions,
          ...additionalAnswers,
        },
        consents: {
          clinical: consentClinical,
          remoteConsultation: consentRemote,
          delivery: consentDelivery,
          noReturn: consentNoReturn,
          gpSharing,
        },
        idVerified,
        ...guestData,
      };
      const res = await orderApi.create(payload);
      setConfirmation(res.data.data);
      setStep(5);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine if selected service is POM (requires account)
  const isPomService = selectedService && ['POM_PGD', 'POM_PRESCRIBING'].includes((selectedService as any).category || 'POM_PGD');

  const canAdvance = (s: number): boolean => {
    switch (s) {
      case 1: return !!selectedServiceId && (authMode !== 'guest' || (!!guestName && !!guestEmail && !!guestAddress));
      case 2: return !!height && !!weight;
      case 3: return idVerified;
      case 4: return consentClinical && consentRemote && consentDelivery && consentNoReturn;
      default: return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !pharmacyData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link href={`/pharmacy/${slug}`}><Button variant="outline">Back to Pharmacy</Button></Link>
        </div>
      </div>
    );
  }

  const pharmacy = pharmacyData?.pharmacy;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/pharmacy/${slug}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="font-medium">{pharmacy?.name || 'Pharmacy'}</span>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Order Online</h1>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isDone = step > stepNum;
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${isDone ? 'bg-teal-600 text-white' : isActive ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {isDone ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : stepNum}
                  </div>
                  <span className={`text-xs hidden sm:block ${isActive ? 'text-teal-700 font-medium' : 'text-gray-400'}`}>{label}</span>
                  {idx < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${isDone ? 'bg-teal-600' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && step !== 5 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-sm">{error}</div>
        )}

        {/* Auth Gate */}
        {authChecked && authMode === 'choose' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">How would you like to continue?</h2>
            <p className="text-gray-500 text-sm text-center mb-6">Choose an option to start your order.</p>
            <div className="space-y-3">
              <button
                onClick={() => setAuthMode('guest')}
                className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-teal-500 transition-all"
              >
                <p className="font-semibold text-gray-900">Continue as Guest</p>
                <p className="text-sm text-gray-500 mt-0.5">For OTC products. Just provide your name, email, and delivery address.</p>
              </button>
              <Link href={`/login?redirect=/pharmacy/${slug}/order${preSelectedServiceId ? `?serviceId=${preSelectedServiceId}` : ''}`} className="block">
                <div className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-teal-500 transition-all">
                  <p className="font-semibold text-gray-900">Sign In</p>
                  <p className="text-sm text-gray-500 mt-0.5">Already have an account? Sign in for a faster checkout.</p>
                </div>
              </Link>
              <Link href={`/signup`} className="block">
                <div className="w-full text-left p-4 rounded-xl border-2 border-teal-500 bg-teal-50 hover:bg-teal-100 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Create Account</p>
                      <p className="text-sm text-gray-500 mt-0.5">Required for prescription (POM) orders. Includes ID verification.</p>
                    </div>
                    <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full font-medium">Recommended</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Guest Details Form (OTC only) */}
        {authMode === 'guest' && step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-1">Your Details</h3>
            <p className="text-xs text-gray-400 mb-4">Guest checkout is available for OTC products only. Prescription items require an account.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address <span className="text-red-500">*</span></label>
                <textarea
                  value={guestAddress}
                  onChange={(e) => setGuestAddress(e.target.value)}
                  placeholder="Full delivery address including postcode"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* POM Warning for guest users */}
        {authMode === 'guest' && isPomService && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-6 text-sm">
            <p className="font-semibold mb-1">Account Required for Prescription Items</p>
            <p>This is a prescription-only medicine (POM) that requires identity verification. Please <Link href="/signup" className="underline font-medium">create an account</Link> to proceed with this order.</p>
          </div>
        )}

        {/* Step 1: Indication */}
        {(authMode === 'proceed' || authMode === 'guest') && step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">What would you like to order?</h2>
            <p className="text-gray-500 mb-6">Select the treatment or service you need.</p>
            <div className="space-y-3">
              {pharmacyData?.services
                .filter((s) => s.fulfilmentModes.includes('ONLINE'))
                .map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedServiceId === service.id ? 'border-teal-600 bg-teal-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{service.therapyArea}</p>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(service.price)}</span>
                    </div>
                  </button>
                ))}
            </div>
            {pharmacyData?.services.filter((s) => s.fulfilmentModes.includes('ONLINE')).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No online services are currently available.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Medical Questionnaire */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Medical Questionnaire</h2>
            <p className="text-gray-500 mb-6">Please answer these questions accurately. This information is reviewed by a qualified pharmacist.</p>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              {/* Height & Weight with BMI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 175"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 70"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">BMI (auto-calculated)</label>
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                    {bmi || '-'}
                  </div>
                </div>
              </div>

              {/* Medications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
                <textarea
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  placeholder="List any medications you are currently taking, or write 'None'"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                />
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Known Allergies</label>
                <textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="List any known allergies, or write 'None'"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                />
              </div>

              {/* Existing Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Existing Medical Conditions</label>
                <textarea
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="List any existing medical conditions, or write 'None'"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                />
              </div>

              {/* Dynamic Additional Questions */}
              {selectedService?.questionnaireSchema?.map((field: any) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={additionalAnswers[field.key] || ''}
                      onChange={(e) => handleAdditionalAnswer(field.key, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  )}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      value={additionalAnswers[field.key] || ''}
                      onChange={(e) => handleAdditionalAnswer(field.key, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  )}
                  {field.type === 'boolean' && (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={field.key}
                          checked={additionalAnswers[field.key] === true}
                          onChange={() => handleAdditionalAnswer(field.key, true)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={field.key}
                          checked={additionalAnswers[field.key] === false}
                          onChange={() => handleAdditionalAnswer(field.key, false)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: ID Verification */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Identity Verification</h2>
            <p className="text-gray-500 mb-6">We need to verify your identity before we can process your order. This is a regulatory requirement.</p>

            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
              </div>
              <p className="text-sm text-gray-500 mb-1">Powered by</p>
              <p className="text-lg font-bold text-gray-900 mb-4">Onfido</p>

              {/* Upload placeholder */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6">
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-sm text-gray-600 mb-1">Upload a photo of your government-issued ID</p>
                <p className="text-xs text-gray-400">Passport, driving licence, or national ID card</p>
              </div>

              {!idVerified ? (
                <Button size="lg" onClick={() => setIdVerified(true)} className="w-full max-w-xs">
                  Verify Identity
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-semibold">Identity Verified</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Consent & Pay */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Consent & Payment</h2>
            <p className="text-gray-500 mb-6">Please review all consent statements carefully before proceeding.</p>

            {/* Consent Checkboxes */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Required Consents</h3>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={consentClinical} onChange={(e) => setConsentClinical(e.target.checked)} className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500 rounded" />
                <span className="text-sm text-gray-600">
                  I confirm that the medical information I have provided is accurate and complete. I understand this will be used for clinical assessment by a qualified pharmacist.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={consentRemote} onChange={(e) => setConsentRemote(e.target.checked)} className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500 rounded" />
                <span className="text-sm text-gray-600">
                  I consent to a remote clinical consultation. I understand this means a pharmacist will review my questionnaire without a face-to-face meeting and may contact me if further information is needed.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={consentDelivery} onChange={(e) => setConsentDelivery(e.target.checked)} className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500 rounded" />
                <span className="text-sm text-gray-600">
                  I authorise delivery of the medication to my registered address. I confirm someone aged 18+ will be available to receive and sign for the delivery.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={consentNoReturn} onChange={(e) => setConsentNoReturn(e.target.checked)} className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500 rounded" />
                <span className="text-sm text-gray-600">
                  I understand that pharmaceutical products cannot be returned once dispatched, in accordance with medicines regulations. Refunds are only available if the pharmacist rejects the order during clinical review.
                </span>
              </label>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Optional</h4>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={gpSharing} onChange={(e) => setGpSharing(e.target.checked)} className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500 rounded" />
                  <span className="text-sm text-gray-600">
                    I consent to sharing my consultation details with my registered GP practice to update my medical records.
                  </span>
                </label>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Treatment</span>
                  <span className="text-gray-900 font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Clinical Review</span>
                  <span className="text-gray-900 font-medium">Included</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span className="text-gray-900 font-medium">Royal Mail Tracked</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="text-gray-900 font-semibold">Total</span>
                  <span className="text-gray-900 font-bold text-lg">{formatCurrency(selectedService?.price || 0)}</span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!canAdvance(4) || submitting}
              onClick={handleSubmitOrder}
            >
              {submitting ? 'Processing...' : `Pay ${formatCurrency(selectedService?.price || 0)}`}
            </Button>
          </div>
        )}

        {/* Step 5: Confirmation & Tracking */}
        {step === 5 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Submitted!</h2>
            <p className="text-gray-500 mb-8">Your order is now with our clinical team for review.</p>

            {confirmation?.reference && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md mx-auto mb-6">
                <p className="text-sm text-gray-500">Order Reference</p>
                <p className="text-2xl font-mono font-bold text-teal-600 mb-4">{confirmation.reference}</p>
                <Link href={`/track/${confirmation.reference}`}>
                  <Button variant="outline" size="sm" className="w-full">Track Your Order</Button>
                </Link>
              </div>
            )}

            {/* What Happens Next Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md mx-auto text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">What Happens Next</h3>
              <div className="space-y-4">
                {[
                  { title: 'Clinical Review', desc: 'A qualified pharmacist will review your questionnaire within 24 hours.' },
                  { title: 'Approval or Query', desc: 'If approved, your order moves to dispensing. We may contact you if we need more information.' },
                  { title: 'Dispensing', desc: 'Your medication is prepared and safety-checked by our team.' },
                  { title: 'Dispatch', desc: 'Your order is dispatched via tracked delivery service.' },
                  { title: 'Delivery', desc: 'Track your order in real-time until it arrives at your door.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center text-xs font-bold text-teal-700">{idx + 1}</div>
                      {idx < 4 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link href={`/pharmacy/${slug}`}>
              <Button variant="outline" size="lg">Back to Pharmacy</Button>
            </Link>
          </div>
        )}

        {/* Navigation */}
        {step > 1 && step < 5 && (
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
            {step < 4 && (
              <Button disabled={!canAdvance(step)} onClick={() => setStep(step + 1)}>Continue</Button>
            )}
          </div>
        )}
        {step === 1 && (
          <div className="flex justify-end mt-8">
            <Button disabled={!canAdvance(1)} onClick={() => setStep(2)}>Continue</Button>
          </div>
        )}
      </div>
    </div>
  );
}
