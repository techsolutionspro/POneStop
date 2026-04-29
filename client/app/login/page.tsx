'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, getDefaultRoute } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user) router.push(getDefaultRoute(user.role));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
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
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

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

            <Input
              id="password"
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded accent-teal-600" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <a href="/reset-password" className="text-teal-600 hover:text-teal-700 font-medium">Forgot password?</a>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
          <div className="font-semibold text-gray-700 mb-2">Demo Accounts:</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setEmail('admin@pharmacyonestop.co.uk'); setPassword('SuperAdmin1!'); }}
              className="text-left p-2 rounded hover:bg-gray-50 transition">
              <div className="font-medium text-gray-700">Super Admin</div>
              <div className="text-gray-400">Platform operations</div>
            </button>
            <button onClick={() => { setEmail('amir@highstreetpharmacy.co.uk'); setPassword('Owner123!'); }}
              className="text-left p-2 rounded hover:bg-gray-50 transition">
              <div className="font-medium text-gray-700">Pharmacy Owner</div>
              <div className="text-gray-400">Tenant admin</div>
            </button>
            <button onClick={() => { setEmail('sarah.chen@highstreetpharmacy.co.uk'); setPassword('Pharma123!'); }}
              className="text-left p-2 rounded hover:bg-gray-50 transition">
              <div className="font-medium text-gray-700">Prescriber</div>
              <div className="text-gray-400">Clinical dashboard</div>
            </button>
            <button onClick={() => { setEmail('james.davies@email.com'); setPassword('Patient123!'); }}
              className="text-left p-2 rounded hover:bg-gray-50 transition">
              <div className="font-medium text-gray-700">Patient</div>
              <div className="text-gray-400">Patient account</div>
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-teal-600 font-semibold hover:underline">Start your free trial</a>
        </p>
      </div>
    </div>
  );
}
