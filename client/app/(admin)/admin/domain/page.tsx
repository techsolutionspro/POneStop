'use client';
import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Shield, RefreshCw, Mail, Plus, Trash2, X, Copy, CheckCircle } from 'lucide-react';

export default function DomainPage() {
  const [subdomain] = useState('mypharmacy');
  const [customDomain, setCustomDomain] = useState('');
  const [domainVerified, setDomainVerified] = useState(false);
  const [sslStatus] = useState<'active' | 'pending' | 'none'>('active');
  const [autoRenew, setAutoRenew] = useState(true);
  const [copied, setCopied] = useState('');

  // Mailboxes
  const [mailboxes, setMailboxes] = useState([
    { id: '1', address: 'info@mypharmacy.pharmacyonestop.co.uk', type: 'Primary' },
    { id: '2', address: 'prescriptions@mypharmacy.pharmacyonestop.co.uk', type: 'Orders' },
  ]);
  const [showMailboxForm, setShowMailboxForm] = useState(false);
  const [mailboxForm, setMailboxForm] = useState({ prefix: '', type: 'General' });

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }

  function addMailbox() {
    if (!mailboxForm.prefix) return;
    const domain = customDomain || `${subdomain}.pharmacyonestop.co.uk`;
    setMailboxes(prev => [...prev, {
      id: Date.now().toString(),
      address: `${mailboxForm.prefix}@${domain}`,
      type: mailboxForm.type,
    }]);
    setMailboxForm({ prefix: '', type: 'General' });
    setShowMailboxForm(false);
  }

  function removeMailbox(id: string) {
    setMailboxes(prev => prev.filter(m => m.id !== id));
  }

  const dnsRecords = [
    { type: 'CNAME', name: 'www', value: 'proxy.pharmacyonestop.co.uk', purpose: 'Website' },
    { type: 'A', name: '@', value: '76.223.105.230', purpose: 'Root domain' },
    { type: 'TXT', name: '@', value: 'v=spf1 include:pharmacyonestop.co.uk ~all', purpose: 'Email auth' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Domain & Email</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your custom domain and email mailboxes</p>
        </div>
      </div>

      {/* Current Subdomain */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold">Your Subdomain</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
              <span className="text-sm font-medium text-gray-900">{subdomain}</span>
              <span className="text-sm text-gray-400">.pharmacyonestop.co.uk</span>
            </div>
            <Badge status="ACTIVE" label="Live" dot />
          </div>
        </CardBody>
      </Card>

      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold">Custom Domain</h3>
          </div>
          {domainVerified && <Badge status="VERIFIED" label="Verified" dot />}
        </CardHeader>
        <CardBody>
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-3">
              <Input
                placeholder="e.g. www.mypharmacy.co.uk"
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value)}
                className="flex-1"
              />
              <Button variant="primary" size="sm" onClick={() => setDomainVerified(true)}>
                Verify Domain
              </Button>
            </div>

            {customDomain && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">DNS Configuration Required</h4>
                <p className="text-xs text-gray-500 mb-3">Add the following DNS records at your domain registrar:</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-2 font-medium text-gray-500">Type</th>
                      <th className="pb-2 font-medium text-gray-500">Name</th>
                      <th className="pb-2 font-medium text-gray-500">Value</th>
                      <th className="pb-2 font-medium text-gray-500">Purpose</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dnsRecords.map((r, i) => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="py-2 font-mono font-medium text-teal-700">{r.type}</td>
                        <td className="py-2 font-mono text-gray-600">{r.name}</td>
                        <td className="py-2 font-mono text-gray-600 max-w-[200px] truncate">{r.value}</td>
                        <td className="py-2 text-gray-500">{r.purpose}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => copyToClipboard(r.value, `dns-${i}`)}>
                            {copied === `dns-${i}` ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* SSL & Auto-Renewal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold">SSL Certificate</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between max-w-xl">
            <div className="flex items-center gap-4">
              <Badge
                status={sslStatus === 'active' ? 'ACTIVE' : sslStatus === 'pending' ? 'PENDING' : 'DRAFT'}
                label={sslStatus === 'active' ? 'SSL Active' : sslStatus === 'pending' ? 'Provisioning' : 'Not Configured'}
                dot
              />
              {sslStatus === 'active' && <span className="text-xs text-gray-500">Auto-provisioned via Let&apos;s Encrypt</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Auto-Renewal</span>
              <button
                onClick={() => setAutoRenew(!autoRenew)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoRenew ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  autoRenew ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Email Mailboxes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold">Email Mailboxes</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowMailboxForm(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Mailbox
          </Button>
        </CardHeader>
        <CardBody>
          {showMailboxForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">New Mailbox</span>
                <button onClick={() => setShowMailboxForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="flex items-center gap-2">
                <Input placeholder="e.g. enquiries" value={mailboxForm.prefix}
                  onChange={e => setMailboxForm(f => ({ ...f, prefix: e.target.value }))} />
                <span className="text-sm text-gray-400 whitespace-nowrap">@{customDomain || `${subdomain}.pharmacyonestop.co.uk`}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Purpose</label>
                <select
                  value={mailboxForm.type}
                  onChange={e => setMailboxForm(f => ({ ...f, type: e.target.value }))}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option>General</option>
                  <option>Orders</option>
                  <option>Support</option>
                  <option>Marketing</option>
                </select>
              </div>
              <Button size="sm" onClick={addMailbox}>Create Mailbox</Button>
            </div>
          )}
          <div className="space-y-3">
            {mailboxes.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{m.address}</div>
                    <div className="text-[10px] text-gray-400">{m.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyToClipboard(m.address, m.id)}>
                    {copied === m.id ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />}
                  </button>
                  <button onClick={() => removeMailbox(m.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {mailboxes.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">No mailboxes configured.</div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
