'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('error');
        setErrorMessage('No verification token provided. Please check your email link.');
        return;
      }

      try {
        await api.post('/security/verify-email', { token });
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(
          err.response?.data?.error || 'Verification failed. The link may have expired or already been used.'
        );
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600 text-white font-bold text-lg mb-4">
            P1S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy One Stop</h1>
          <p className="text-gray-500 mt-1">Email Verification</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          {/* Loading */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Verifying your email...</h2>
              <p className="text-sm text-gray-500">Please wait while we confirm your email address.</p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Your email address has been successfully verified. You can now log in to your account.
              </p>
              <Link href="/login">
                <Button className="w-full" size="lg">Go to Login</Button>
              </Link>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-sm text-gray-500 mb-6">{errorMessage}</p>
              <Link href="/login">
                <Button variant="outline" className="w-full" size="lg">Go to Login</Button>
              </Link>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500 mt-6 text-center">
          <Link href="/login" className="text-teal-600 font-semibold hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
