'use client';
import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Upload, Palette, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [pharmacy, setPharmacy] = useState({
    name: '',
    gphcNumber: '',
    vatNumber: '',
    primaryColor: '#0D9488',
    secondaryColor: '#4F46E5',
    logoUrl: '',
  });

  const [notifications, setNotifications] = useState({
    emailReminders: true,
    smsReminders: true,
    aftercareEmails: true,
    aftercareSms: false,
    marketingEmails: true,
    marketingSms: false,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  }

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Pharmacy configuration and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-sm text-green-700">
          Settings saved successfully.
        </div>
      )}

      {/* Pharmacy Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold">Pharmacy Details</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4 max-w-xl">
            <Input
              label="Pharmacy Name"
              value={pharmacy.name}
              onChange={e => setPharmacy(f => ({ ...f, name: e.target.value }))}
              placeholder="My Pharmacy"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="GPhC Registration Number"
                value={pharmacy.gphcNumber}
                onChange={e => setPharmacy(f => ({ ...f, gphcNumber: e.target.value }))}
                placeholder="e.g. 9012345"
              />
              <Input
                label="VAT Number"
                value={pharmacy.vatNumber}
                onChange={e => setPharmacy(f => ({ ...f, vatNumber: e.target.value }))}
                placeholder="e.g. GB123456789"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold">Branding</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-5 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Primary Colour</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={pharmacy.primaryColor}
                    onChange={e => setPharmacy(f => ({ ...f, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={pharmacy.primaryColor}
                    onChange={e => setPharmacy(f => ({ ...f, primaryColor: e.target.value }))}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white w-28 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="w-20 h-10 rounded-lg" style={{ backgroundColor: pharmacy.primaryColor }} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Secondary Colour</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={pharmacy.secondaryColor}
                    onChange={e => setPharmacy(f => ({ ...f, secondaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={pharmacy.secondaryColor}
                    onChange={e => setPharmacy(f => ({ ...f, secondaryColor: e.target.value }))}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white w-28 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="w-20 h-10 rounded-lg" style={{ backgroundColor: pharmacy.secondaryColor }} />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Logo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-400 transition-colors">
                {pharmacy.logoUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">Preview</div>
                    <Button variant="ghost" size="sm" onClick={() => setPharmacy(f => ({ ...f, logoUrl: '' }))}>Remove</Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-300" />
                    <div className="text-sm text-gray-500">Drag and drop your logo, or click to browse</div>
                    <div className="text-[10px] text-gray-400">PNG, JPG, SVG up to 2MB. Recommended: 400x100px</div>
                    <Button variant="outline" size="sm" onClick={() => setPharmacy(f => ({ ...f, logoUrl: 'placeholder' }))}>
                      Upload Logo
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold">Notification Settings</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-1 max-w-xl">
            {([
              { key: 'emailReminders' as const, label: 'Email Appointment Reminders', desc: 'Send email reminders before bookings' },
              { key: 'smsReminders' as const, label: 'SMS Appointment Reminders', desc: 'Send SMS reminders before bookings' },
              { key: 'aftercareEmails' as const, label: 'Aftercare Emails', desc: 'Send aftercare instructions post-consultation' },
              { key: 'aftercareSms' as const, label: 'Aftercare SMS', desc: 'Send aftercare via SMS' },
              { key: 'marketingEmails' as const, label: 'Marketing Emails', desc: 'Allow marketing email broadcasts' },
              { key: 'marketingSms' as const, label: 'Marketing SMS', desc: 'Allow marketing SMS broadcasts' },
            ]).map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-700">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[item.key] ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
