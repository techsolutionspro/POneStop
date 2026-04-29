'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Request mode state
  const [email, setEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState('');

  // Reset mode state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const passwordStrength = (() => {
    const p = password;
    if (!p) return { score: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  })();

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setRequestError('');
    setRequestLoading(true);
    try {
      await api.post('/security/forgot-password', { email });
      setRequestSent(true);
    } catch (err: any) {
      // Always show success message to prevent email enumeration
      setRequestSent(true);
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError('');

    if (password !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setResetError('Password must be at least 8 characters.');
      return;
    }

    setResetLoading(true);
    try {
      await api.post('/security/reset-password', { token, password });
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Invalid or expired reset link. Please request a new one.');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600 text-white font-bold text-lg mb-4">
            P1S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy One Stop</h1>
          <p className="text-gray-500 mt-1">
            {token ? 'Set your new password' : 'Reset your password'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          {/* MODE A: Request Reset (no token) */}
          {!token && !requestSent && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              {requestError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {requestError}
                </div>
              )}

              <p className="text-sm text-gray-600">
                Enter the email address associated with your account and we will send you a link to reset your password.
              </p>

              <Input
                id="email"
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@pharmacy.co.uk"
                autoComplete="email"
              />

              <Button type="submit" className="w-full" size="lg" disabled={requestLoading || !email}>
                {requestLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          {/* Request Sent Success */}
          {!token && requestSent && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500">
                If this email exists, we&apos;ve sent a reset link. Please check your inbox and spam folder.
              </p>
            </div>
          )}

          {/* MODE B: Set New Password (has token) */}
          {token && !resetSuccess && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {resetError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {resetError}
                </div>
              )}

              <div>
                <Input
                  id="password"
                  label="New Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  autoComplete="new-password"
                />
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-xs ${passwordStrength.score <= 2 ? 'text-red-500' : passwordStrength.score <= 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {passwordStrength.label}
                      </span>
                      <div className="flex gap-2 text-[10px] text-gray-400">
                        <span className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>ABC</span>
                        <span className={/[a-z]/.test(password) ? 'text-green-500' : ''}>abc</span>
                        <span className={/[0-9]/.test(password) ? 'text-green-500' : ''}>123</span>
                        <span className={password.length >= 8 ? 'text-green-500' : ''}>8+</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Input
                id="confirmPassword"
                label="Confirm New Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />

              <Button type="submit" className="w-full" size="lg" disabled={resetLoading || !password || !confirmPassword}>
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {/* Reset Success */}
          {token && resetSuccess && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Password Reset Successful</h2>
              <p className="text-sm text-gray-500 mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link href="/login">
                <Button className="w-full" size="lg">Go to Login</Button>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
