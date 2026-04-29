'use client';

import { useEffect, useState } from 'react';
import { patientApi } from '@/lib/api';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';

interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  nhsNumber?: string;
  gpPractice?: string;
  gpSharingConsent: boolean;
  marketingConsent: boolean;
  idvStatus?: string;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [nhsNumber, setNhsNumber] = useState('');
  const [gpPractice, setGpPractice] = useState('');
  const [gpSharingConsent, setGpSharingConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // GDPR dialogs
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await patientApi.myProfile();
        const p = res.data.data;
        setProfile(p);
        setFirstName(p.firstName || '');
        setLastName(p.lastName || '');
        setEmail(p.email || '');
        setPhone(p.phone || '');
        setDob(p.dateOfBirth || '');
        setAddressLine1(p.address?.line1 || '');
        setAddressLine2(p.address?.line2 || '');
        setCity(p.address?.city || '');
        setPostcode(p.address?.postcode || '');
        setNhsNumber(p.nhsNumber || '');
        setGpPractice(p.gpPractice || '');
        setGpSharingConsent(p.gpSharingConsent || false);
        setMarketingConsent(p.marketingConsent || false);
      } catch {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await patientApi.update(profile!.id, {
        firstName,
        lastName,
        phone,
        dateOfBirth: dob,
        address: { line1: addressLine1, line2: addressLine2, city, postcode },
        nhsNumber,
        gpPractice,
        gpSharingConsent,
        marketingConsent,
      });
      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get('/patients/me/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'my-data-export.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExportConfirm(false);
    } catch {
      alert('Failed to export data. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      await api.delete('/patients/me');
      useAuthStore.getState().logout();
      window.location.href = '/';
    } catch {
      alert('Failed to delete account. Please contact support.');
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-10 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 text-sm">{success}</div>
      )}

      {/* Personal Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Contact support to change your email address.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44 7700 900000"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Medical / NHS */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NHS Number</label>
            <input
              type="text"
              value={nhsNumber}
              onChange={(e) => setNhsNumber(e.target.value)}
              placeholder="e.g. 485 777 3456"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GP Practice</label>
            <input
              type="text"
              value={gpPractice}
              onChange={(e) => setGpPractice(e.target.value)}
              placeholder="e.g. The Surgery, 1 High Street"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* IDV Status */}
        {profile?.idvStatus && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profile.idvStatus === 'VERIFIED' ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {profile.idvStatus === 'VERIFIED' ? (
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Identity Verification</p>
              <p className="text-xs text-gray-500">{profile.idvStatus === 'VERIFIED' ? 'Your identity has been verified.' : `Status: ${profile.idvStatus.replace(/_/g, ' ')}`}</p>
            </div>
          </div>
        )}
      </div>

      {/* Consent Toggles */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900">GP Sharing Consent</p>
              <p className="text-xs text-gray-500">Allow pharmacies to share consultation details with your GP.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={gpSharingConsent}
              onClick={() => setGpSharingConsent(!gpSharingConsent)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gpSharingConsent ? 'bg-teal-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gpSharingConsent ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900">Marketing Communications</p>
              <p className="text-xs text-gray-500">Receive emails about offers, health tips, and service updates.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={marketingConsent}
              onClick={() => setMarketingConsent(!marketingConsent)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${marketingConsent ? 'bg-teal-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${marketingConsent ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end mb-8">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* GDPR Section */}
      <div id="export" className="bg-white rounded-xl border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Data & Privacy (GDPR)</h2>
        <p className="text-sm text-gray-500 mb-6">Manage your personal data in accordance with your rights under GDPR.</p>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Export */}
          {!showExportConfirm ? (
            <Button variant="outline" onClick={() => setShowExportConfirm(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export My Data
            </Button>
          ) : (
            <div className="flex-1 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-3">This will download all your personal data as a JSON file.</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleExportData}>Confirm Export</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowExportConfirm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Delete */}
          {!showDeleteConfirm ? (
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete My Account
            </Button>
          ) : (
            <div className="flex-1 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700 font-medium mb-1">This action is permanent and cannot be undone.</p>
              <p className="text-sm text-red-600 mb-3">All your data, bookings, orders, and subscriptions will be permanently deleted. Type <strong>DELETE</strong> to confirm.</p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-2.5 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm mb-3"
              />
              <div className="flex gap-2">
                <Button variant="danger" size="sm" disabled={deleteConfirmText !== 'DELETE'} onClick={handleDeleteAccount}>
                  Permanently Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
