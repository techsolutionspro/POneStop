'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { tenantApi, serviceApi, pgdApi, staffApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Palette, Building2, Stethoscope, Truck, CreditCard, Users, Rocket,
  ChevronRight, ChevronLeft, Check, Plus, Trash2,
} from 'lucide-react';

const STEPS = [
  { id: 'branding', label: 'Branding', icon: Palette, desc: 'Logo, colours, and pharmacy identity' },
  { id: 'branches', label: 'Branches', icon: Building2, desc: 'Add your pharmacy locations' },
  { id: 'services', label: 'Services', icon: Stethoscope, desc: 'Choose clinical services to offer' },
  { id: 'fulfilment', label: 'Fulfilment', icon: Truck, desc: 'In-branch, online, or both' },
  { id: 'payments', label: 'Payments', icon: CreditCard, desc: 'Connect Stripe for payments' },
  { id: 'team', label: 'Team', icon: Users, desc: 'Invite your staff' },
  { id: 'golive', label: 'Go Live', icon: Rocket, desc: 'Review and launch your pharmacy' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [pgds, setPgds] = useState<any[]>([]);

  // Form state
  const [branding, setBranding] = useState({ primaryColor: '#0d9488', secondaryColor: '#6366f1', gphcNumber: '' });
  const [branches, setBranches] = useState([{ name: '', address: '', city: '', postcode: '', phone: '' }]);
  const [selectedPgds, setSelectedPgds] = useState<string[]>([]);
  const [fulfilment, setFulfilment] = useState({ inBranch: true, online: false, clickCollect: false });
  const [teamInvites, setTeamInvites] = useState([{ email: '', firstName: '', lastName: '', role: 'PHARMACIST' }]);

  useEffect(() => {
    pgdApi.list({ status: 'PUBLISHED' }).then(res => setPgds(res.data.data)).catch(() => {});
  }, []);

  const tenantId = user?.tenantId;

  async function saveStep() {
    if (!tenantId) return;
    setSaving(true);
    try {
      switch (step) {
        case 0: // Branding
          await tenantApi.update(tenantId, { primaryColor: branding.primaryColor, secondaryColor: branding.secondaryColor, gphcNumber: branding.gphcNumber || undefined, onboardingStep: 1 });
          break;
        case 1: // Branches
          for (const b of branches) {
            if (b.name && b.address && b.city && b.postcode) {
              try { await tenantApi.createBranch(tenantId, b); } catch {}
            }
          }
          await tenantApi.update(tenantId, { onboardingStep: 2 });
          break;
        case 2: // Services
          for (const pgdId of selectedPgds) {
            const pgd = pgds.find((p: any) => p.id === pgdId);
            if (pgd) {
              try {
                const defaultPrices: Record<string, number> = { 'Weight Management': 199, 'Travel Health': 35, 'Seasonal Vaccination': 14.99, 'Sexual Health': 29, 'Skincare': 39 };
                const price = defaultPrices[pgd.therapyArea] || 49.99;
                const modes = fulfilment.online && pgd.fulfilmentModes?.includes('ONLINE_DELIVERY')
                  ? ['IN_BRANCH', 'ONLINE_DELIVERY'] : ['IN_BRANCH'];
                await serviceApi.create({
                  pgdId,
                  name: pgd.title.replace(' - ', ': ').replace('Seasonal Influenza Vaccination', 'Flu Vaccination'),
                  description: `Professional ${pgd.therapyArea.toLowerCase()} service delivered by qualified pharmacists.`,
                  price,
                  category: 'POM_PGD',
                  fulfilmentModes: modes,
                  requiresQuestionnaire: true,
                  requiresIdv: modes.includes('ONLINE_DELIVERY'),
                });
              } catch {}
            }
          }
          await tenantApi.update(tenantId, { onboardingStep: 3 });
          break;
        case 3: // Fulfilment
          await tenantApi.update(tenantId, { onboardingStep: 4 });
          break;
        case 4: // Payments
          await tenantApi.update(tenantId, { onboardingStep: 5 });
          break;
        case 5: // Team
          for (const invite of teamInvites) {
            if (invite.email && invite.firstName && invite.lastName) {
              try { await staffApi.invite(invite); } catch {}
            }
          }
          await tenantApi.update(tenantId, { onboardingStep: 6 });
          break;
        case 6: // Go Live
          await tenantApi.goLive(tenantId);
          await fetchUser();
          router.push('/admin');
          return;
      }
      setStep(s => s + 1);
    } catch (err) {
      console.error('Save error:', err);
    } finally { setSaving(false); }
  }

  function addBranch() { setBranches(b => [...b, { name: '', address: '', city: '', postcode: '', phone: '' }]); }
  function updateBranch(i: number, field: string, value: string) { setBranches(b => b.map((br, j) => j === i ? { ...br, [field]: value } : br)); }
  function removeBranch(i: number) { if (branches.length > 1) setBranches(b => b.filter((_, j) => j !== i)); }

  function addInvite() { setTeamInvites(t => [...t, { email: '', firstName: '', lastName: '', role: 'PHARMACIST' }]); }
  function updateInvite(i: number, field: string, value: string) { setTeamInvites(t => t.map((inv, j) => j === i ? { ...inv, [field]: value } : inv)); }
  function removeInvite(i: number) { if (teamInvites.length > 1) setTeamInvites(t => t.filter((_, j) => j !== i)); }

  const currentStep = STEPS[step];

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Set Up Your Pharmacy</h1>
            <p className="text-sm text-gray-500 mt-1">Step {step + 1} of {STEPS.length}: {currentStep.desc}</p>
          </div>
          <span className="text-sm text-gray-400">{Math.round(((step) / STEPS.length) * 100)}% complete</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`flex-1 h-2 rounded-full transition-all ${i < step ? 'bg-teal-500' : i === step ? 'bg-teal-400' : 'bg-gray-200'}`} />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => i < step && setStep(i)}
              className={`flex flex-col items-center gap-1 ${i <= step ? 'cursor-pointer' : 'cursor-default'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-teal-600 text-white' : i === step ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] ${i <= step ? 'text-teal-700 font-medium' : 'text-gray-400'}`}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {/* STEP 0: Branding */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Branding & Identity</h2>
            <p className="text-sm text-gray-500">Customise how your pharmacy appears to patients.</p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Palette className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drag & drop your logo here, or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">PNG, SVG, or JPG. Recommended: 200x200px</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Primary Colour</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={branding.primaryColor} onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))} className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer" />
                  <input className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm" value={branding.primaryColor} onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Secondary Colour</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={branding.secondaryColor} onChange={e => setBranding(b => ({ ...b, secondaryColor: e.target.value }))} className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer" />
                  <input className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm" value={branding.secondaryColor} onChange={e => setBranding(b => ({ ...b, secondaryColor: e.target.value }))} />
                </div>
              </div>
            </div>
            <Input label="GPhC Registration Number" placeholder="e.g. 1234567" value={branding.gphcNumber} onChange={e => setBranding(b => ({ ...b, gphcNumber: e.target.value }))} hint="7-digit number from your GPhC certificate" />
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-2">Preview</div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: branding.primaryColor }}>{user?.tenant?.name?.charAt(0) || 'P'}</div>
                <div><div className="font-semibold text-sm">{user?.tenant?.name || 'Your Pharmacy'}</div><div className="text-xs text-gray-400">GPhC: {branding.gphcNumber || '—'}</div></div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Branches */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Your Branches</h2>
            <p className="text-sm text-gray-500">Add each pharmacy location. You can add more later.</p>
            {branches.map((b, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Branch {i + 1}</span>
                  {branches.length > 1 && <button onClick={() => removeBranch(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <Input label="Branch Name" required placeholder="e.g. Manchester Central" value={b.name} onChange={e => updateBranch(i, 'name', e.target.value)} />
                <Input label="Address" required placeholder="123 High Street" value={b.address} onChange={e => updateBranch(i, 'address', e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="City" required placeholder="Manchester" value={b.city} onChange={e => updateBranch(i, 'city', e.target.value)} />
                  <Input label="Postcode" required placeholder="M1 1AA" value={b.postcode} onChange={e => updateBranch(i, 'postcode', e.target.value)} />
                </div>
                <Input label="Phone" placeholder="0161 123 4567" value={b.phone} onChange={e => updateBranch(i, 'phone', e.target.value)} />
              </div>
            ))}
            <button onClick={addBranch} className="flex items-center gap-2 text-teal-600 text-sm font-medium hover:text-teal-700"><Plus className="w-4 h-4" /> Add Another Branch</button>
          </div>
        )}

        {/* STEP 2: Services */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Choose Your Services</h2>
            <p className="text-sm text-gray-500">Select clinical services to offer. Each comes with ready-made PGDs, questionnaires, and consent flows. You can add more later.</p>
            <div className="grid grid-cols-2 gap-3">
              {pgds.map((p: any) => (
                <button key={p.id} type="button" onClick={() => setSelectedPgds(s => s.includes(p.id) ? s.filter(x => x !== p.id) : [...s, p.id])}
                  className={`text-left border-2 rounded-xl p-4 transition-all ${selectedPgds.includes(p.id) ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedPgds.includes(p.id) ? 'bg-teal-600 border-teal-600' : 'border-gray-300'}`}>
                      {selectedPgds.includes(p.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{p.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.therapyArea} | {p.version}</div>
                      <div className="flex gap-1.5 mt-2">{p.fulfilmentModes?.map((m: string) => (
                        <span key={m} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{m.replace(/_/g, ' ')}</span>
                      ))}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500">{selectedPgds.length} service{selectedPgds.length !== 1 ? 's' : ''} selected</div>
          </div>
        )}

        {/* STEP 3: Fulfilment */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Fulfilment Modes</h2>
            <p className="text-sm text-gray-500">How will you deliver services to patients?</p>
            {[
              { key: 'inBranch', label: 'In-Branch Consultations', desc: 'Patients book and attend your pharmacy in person.', always: true },
              { key: 'online', label: 'Online Ordering + Home Delivery', desc: 'Sell POM products online with prescriber review, dispensing, and courier dispatch. Requires DSP registration.' },
              { key: 'clickCollect', label: 'Click & Collect', desc: 'Patients order and pay online, collect from your pharmacy.' },
            ].map(mode => (
              <label key={mode.key} className={`flex items-start gap-4 border-2 rounded-xl p-5 cursor-pointer transition-all ${(fulfilment as any)[mode.key] ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="checkbox" checked={(fulfilment as any)[mode.key]} disabled={mode.always}
                  onChange={e => setFulfilment(f => ({ ...f, [mode.key]: e.target.checked }))}
                  className="w-5 h-5 accent-teal-600 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">{mode.label} {mode.always && <span className="text-xs text-gray-400">(always on)</span>}</div>
                  <div className="text-xs text-gray-500 mt-1">{mode.desc}</div>
                </div>
              </label>
            ))}
            {fulfilment.online && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                <strong>Note:</strong> Online POM selling requires a GPhC Distance-Selling Pharmacy (DSP) licence. You can enable it now and complete DSP verification later.
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Payments */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Payment Setup</h2>
            <p className="text-sm text-gray-500">Connect Stripe to accept patient payments. Funds go directly to your account.</p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">Connect with Stripe</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Stripe handles all payment processing. We never touch your funds — they go directly to your Stripe account.</p>
              <Button className="mt-4">Connect Stripe Account</Button>
              <p className="text-xs text-gray-400 mt-3">You can skip this and set up payments later.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
              <div className="font-medium text-gray-700 mb-1">How payments work:</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Patients pay via Apple Pay, Google Pay, or card</li>
                <li>Funds route to your Stripe account instantly</li>
                <li>Platform fee: 0.5% automatically deducted</li>
                <li>PSD2/SCA compliant (3D Secure handled by Stripe)</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 5: Team */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Invite Your Team</h2>
            <p className="text-sm text-gray-500">Add staff members with appropriate roles. They&apos;ll receive an email invite.</p>
            {teamInvites.map((inv, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Team Member {i + 1}</span>
                  {teamInvites.length > 1 && <button onClick={() => removeInvite(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name" placeholder="First name" value={inv.firstName} onChange={e => updateInvite(i, 'firstName', e.target.value)} />
                  <Input label="Last Name" placeholder="Last name" value={inv.lastName} onChange={e => updateInvite(i, 'lastName', e.target.value)} />
                </div>
                <Input label="Email" type="email" placeholder="staff@pharmacy.co.uk" value={inv.email} onChange={e => updateInvite(i, 'email', e.target.value)} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <select className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900" value={inv.role} onChange={e => updateInvite(i, 'role', e.target.value)}>
                    <option value="PHARMACIST">Pharmacist</option>
                    <option value="PRESCRIBER">Prescribing Pharmacist (IP)</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="DISPENSER">Dispenser</option>
                    <option value="DISPATCH_CLERK">Dispatch Clerk</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                  </select>
                </div>
              </div>
            ))}
            <button onClick={addInvite} className="flex items-center gap-2 text-teal-600 text-sm font-medium hover:text-teal-700"><Plus className="w-4 h-4" /> Add Another Team Member</button>
            <p className="text-xs text-gray-400">You can skip this and invite team members later from Settings &gt; Team.</p>
          </div>
        )}

        {/* STEP 6: Go Live */}
        {step === 6 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Ready to Go Live!</h2>
            <p className="text-sm text-gray-500">Review your setup and launch your pharmacy on Pharmacy One Stop.</p>

            <div className="space-y-3">
              {[
                { label: 'Branding', value: branding.gphcNumber ? `GPhC: ${branding.gphcNumber}` : 'Colours set', done: true },
                { label: 'Branches', value: `${branches.filter(b => b.name).length} branch(es)`, done: branches.some(b => b.name) },
                { label: 'Services', value: `${selectedPgds.length} service(s) activated`, done: selectedPgds.length > 0 },
                { label: 'Fulfilment', value: [fulfilment.inBranch && 'In-Branch', fulfilment.online && 'Online', fulfilment.clickCollect && 'Click & Collect'].filter(Boolean).join(', '), done: true },
                { label: 'Payments', value: 'Stripe — set up later', done: false },
                { label: 'Team', value: `${teamInvites.filter(t => t.email).length} invite(s)`, done: teamInvites.some(t => t.email) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.done ? 'bg-teal-100 text-teal-600' : 'bg-gray-200 text-gray-400'}`}>
                      {item.done ? <Check className="w-3.5 h-3.5" /> : <span className="text-xs">—</span>}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-teal-800 mb-1">What happens when you go live:</h3>
              <ul className="text-xs text-teal-700 space-y-1 list-disc list-inside">
                <li>Your storefront goes live at <strong>{user?.tenant?.slug}.pharmacyonestop.co.uk</strong></li>
                <li>Patients can browse services, book appointments, and (if enabled) order online</li>
                <li>You can edit everything from your admin dashboard at any time</li>
                <li>Your 14-day free trial starts now</li>
              </ul>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-3">
          {step < STEPS.length - 1 && (
            <Button variant="ghost" onClick={() => setStep(s => s + 1)}>Skip</Button>
          )}
          <Button onClick={saveStep} disabled={saving}>
            {saving ? 'Saving...' : step === STEPS.length - 1 ? 'Go Live!' : 'Save & Continue'}
            {step < STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
            {step === STEPS.length - 1 && <Rocket className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
