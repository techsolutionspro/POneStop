'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { serviceApi, bookingApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Service {
  id: string;
  name: string;
  price: number;
  duration?: number;
  therapyArea: string;
  fulfilmentModes: string[];
  questionnaireSchema?: QuestionField[];
}

interface QuestionField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean';
  required?: boolean;
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

const STEPS = ['Service', 'Date & Time', 'Questionnaire', 'Consent & Pay', 'Confirmed'];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00',
];

export default function BookingPage() {
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
  const [guestPhone, setGuestPhone] = useState('');
  const [guestDob, setGuestDob] = useState('');

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
  // Step 2
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  // Step 3
  const [answers, setAnswers] = useState<Record<string, any>>({});
  // Step 4
  const [consentClinical, setConsentClinical] = useState(false);
  const [consentData, setConsentData] = useState(false);
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

  const handleAnswer = useCallback((key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmitBooking = async () => {
    setSubmitting(true);
    setError('');
    try {
      const guestData = authMode === 'guest' ? {
        guestName,
        guestEmail,
        guestPhone,
        guestDob,
      } : {};
      const payload = {
        serviceId: selectedServiceId,
        date: selectedDate,
        time: selectedTime,
        questionnaireAnswers: answers,
        ...guestData,
      };
      const res = await bookingApi.create(payload);
      setConfirmation(res.data.data);
      setStep(5);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canAdvance = (s: number): boolean => {
    switch (s) {
      case 1: return !!selectedServiceId && (authMode !== 'guest' || (!!guestName && !!guestEmail && !!guestPhone && !!guestDob));
      case 2: return !!selectedDate && !!selectedTime;
      case 3: {
        const schema = selectedService?.questionnaireSchema || [];
        return schema.filter((f) => f.required).every((f) => answers[f.key] !== undefined && answers[f.key] !== '');
      }
      case 4: return consentClinical && consentData;
      default: return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading booking...</p>
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
          <h1 className="text-lg font-semibold text-gray-900">Book a Consultation</h1>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
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

      {/* Step Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && step !== 5 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-sm">{error}</div>
        )}

        {/* Auth Gate */}
        {authChecked && authMode === 'choose' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">How would you like to continue?</h2>
            <p className="text-gray-500 text-sm text-center mb-6">You can book as a guest or sign in for a faster experience.</p>
            <div className="space-y-3">
              <button
                onClick={() => setAuthMode('guest')}
                className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-teal-500 transition-all"
              >
                <p className="font-semibold text-gray-900">Continue as Guest</p>
                <p className="text-sm text-gray-500 mt-0.5">No account needed. Just provide your details.</p>
              </button>
              <Link href={`/login?redirect=/pharmacy/${slug}/book${preSelectedServiceId ? `?serviceId=${preSelectedServiceId}` : ''}`} className="block">
                <div className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-teal-500 transition-all">
                  <p className="font-semibold text-gray-900">Sign In</p>
                  <p className="text-sm text-gray-500 mt-0.5">Already have an account? Sign in for a faster checkout.</p>
                </div>
              </Link>
              <Link href={`/signup`} className="block">
                <div className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-teal-500 transition-all">
                  <p className="font-semibold text-gray-900">Create Account</p>
                  <p className="text-sm text-gray-500 mt-0.5">Register for easy rebooking and order history.</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Guest Details Form */}
        {authMode === 'guest' && step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Your Details</h3>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="07xxx xxxxxx"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={guestDob}
                  onChange={(e) => setGuestDob(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Service Selection */}
        {(authMode === 'proceed' || authMode === 'guest') && step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Select a Service</h2>
            <p className="text-gray-500 mb-6">Choose the consultation you would like to book.</p>
            <div className="space-y-3">
              {pharmacyData?.services
                .filter((s) => s.fulfilmentModes.includes('IN_BRANCH'))
                .map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedServiceId === service.id ? 'border-teal-600 bg-teal-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{service.therapyArea}{service.duration ? ` - ${service.duration} min` : ''}</p>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(service.price)}</span>
                    </div>
                  </button>
                ))}
            </div>
            {pharmacyData?.services.filter((s) => s.fulfilmentModes.includes('IN_BRANCH')).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No in-branch services are currently available.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Choose Date & Time</h2>
            <p className="text-gray-500 mb-6">Select a convenient date and time for your consultation.</p>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>

            {selectedDate && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Available Times</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 px-2 rounded-lg text-sm font-medium border transition-all ${selectedTime === time ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Questionnaire */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pre-Consultation Questionnaire</h2>
            <p className="text-gray-500 mb-6">Please answer the following questions to help the pharmacist prepare for your consultation.</p>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              {selectedService?.questionnaireSchema && selectedService.questionnaireSchema.length > 0 ? (
                selectedService.questionnaireSchema.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={answers[field.key] || ''}
                        onChange={(e) => handleAnswer(field.key, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    )}
                    {field.type === 'number' && (
                      <input
                        type="number"
                        value={answers[field.key] || ''}
                        onChange={(e) => handleAnswer(field.key, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    )}
                    {field.type === 'boolean' && (
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={field.key}
                            checked={answers[field.key] === true}
                            onChange={() => handleAnswer(field.key, true)}
                            className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={field.key}
                            checked={answers[field.key] === false}
                            onChange={() => handleAnswer(field.key, false)}
                            className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p>No pre-consultation questionnaire is required for this service.</p>
                  <p className="text-sm mt-1">You can proceed to the next step.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Consent & Pay */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Consent & Payment</h2>
            <p className="text-gray-500 mb-6">Please review and confirm the following before proceeding.</p>

            {/* Order Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service</span>
                  <span className="text-gray-900 font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900 font-medium">{selectedDate ? formatDate(selectedDate) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="text-gray-900 font-medium">{selectedTime}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="text-gray-900 font-semibold">Total</span>
                  <span className="text-gray-900 font-bold text-lg">{formatCurrency(selectedService?.price || 0)}</span>
                </div>
              </div>
            </div>

            {/* Consent */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-2">Consent</h3>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentClinical}
                  onChange={(e) => setConsentClinical(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500 rounded"
                />
                <span className="text-sm text-gray-600">
                  I consent to a clinical consultation and confirm the information I have provided is accurate to the best of my knowledge. I understand the pharmacist may ask further questions.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentData}
                  onChange={(e) => setConsentData(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500 rounded"
                />
                <span className="text-sm text-gray-600">
                  I consent to the processing of my personal and health data in accordance with the privacy policy and GDPR regulations.
                </span>
              </label>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!canAdvance(4) || submitting}
              onClick={handleSubmitBooking}
            >
              {submitting ? 'Processing...' : `Pay ${formatCurrency(selectedService?.price || 0)}`}
            </Button>
          </div>
        )}

        {/* Step 5: Confirmed */}
        {step === 5 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-500 mb-8">Your consultation has been booked successfully.</p>

            <div className="bg-white rounded-xl border border-gray-200 p-6 text-left mb-6 max-w-md mx-auto">
              {confirmation?.reference && (
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500">Reference Number</p>
                  <p className="text-2xl font-mono font-bold text-teal-600">{confirmation.reference}</p>
                </div>
              )}
              <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service</span>
                  <span className="text-gray-900 font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900 font-medium">{selectedDate ? formatDate(selectedDate) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="text-gray-900 font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(selectedService?.price || 0)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <Button variant="outline" size="lg" className="flex-1">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Add to Calendar
              </Button>
              <Link href={`/pharmacy/${slug}`} className="flex-1">
                <Button variant="outline" size="lg" className="w-full">Back to Pharmacy</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
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
