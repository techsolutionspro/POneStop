'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, getDefaultRoute } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Globe, Zap, Eye, EyeOff, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel (desktop only) */}
      <div className="hidden lg:flex w-[480px] bg-gradient-to-br from-teal-700 to-teal-900 text-white p-12 flex-col justify-center">
        <Link href="/" className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm">P1S</div>
          <span className="text-xl font-bold">Pharmacy One Stop</span>
        </Link>

        <h2 className="text-3xl font-bold mb-3">Welcome back</h2>
        <p className="text-teal-200 mb-10">Sign in to manage your pharmacy services, bookings, and orders.</p>

        <div className="space-y-6 mb-12">
          {[
            { icon: Zap, title: 'Real-time dashboard', desc: 'Monitor bookings, orders, and revenue at a glance.' },
            { icon: Globe, title: 'Manage your website', desc: 'Update services, content, and availability instantly.' },
            { icon: Shield, title: 'Clinical compliance', desc: 'Access your audit trail and clinical records securely.' },
          ].map(b => (
            <div key={b.title} className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <b.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold mb-1">{b.title}</div>
                <div className="text-sm text-teal-200">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-teal-600">
          <div className="flex gap-0.5 text-yellow-400 mb-3">{[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}</div>
          <p className="text-sm text-teal-100 italic mb-2">&ldquo;We replaced Pharmadoctor, our Wix site, and a booking tool. One login, one bill, everything connected. My team saves 8 hours a week.&rdquo;</p>
          <p className="text-xs text-teal-400">&mdash; Sarah Patel, Superintendent, CareFirst</p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo (mobile) */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600 text-white font-bold text-lg mb-4">
              P1S
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Pharmacy One Stop</h1>
            <p className="text-gray-500 mt-1">Sign in to your account</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Sign in to your account</h1>
            <p className="text-gray-500 mt-1">Enter your credentials below</p>
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

              <div className="relative">
                <Input
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded accent-teal-600" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <a href="/reset-password" className="text-teal-600 hover:text-teal-700 font-medium">Forgot password?</a>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
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
    </div>
  );
}
