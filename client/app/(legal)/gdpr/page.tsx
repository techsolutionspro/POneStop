import Link from 'next/link';

export default function GdprPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">GDPR &amp; Data Rights</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: 29 April 2026</p>

      <h2>1. Your Data Rights</h2>
      <p>Under the UK General Data Protection Regulation (UK GDPR), you have the following rights regarding your personal data:</p>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {[
          { title: 'Right of Access', desc: 'Request a copy of all personal data we hold about you. Available instantly via Account > Export My Data.' },
          { title: 'Right to Rectification', desc: 'Correct any inaccurate personal data. Update your profile directly in your account settings.' },
          { title: 'Right to Erasure', desc: 'Request deletion of your personal data. Available via Account > Delete My Account. Data is anonymised within 30 days.' },
          { title: 'Right to Portability', desc: 'Export your data in machine-readable format (CSV, JSON). One-click export from your account.' },
          { title: 'Right to Object', desc: 'Object to processing based on legitimate interests. Contact privacy@pharmacyonestop.co.uk.' },
          { title: 'Right to Restrict Processing', desc: 'Request that we limit how we use your data while a complaint is being investigated.' },
          { title: 'Right to Withdraw Consent', desc: 'Withdraw marketing consent at any time. Toggle in Account > Profile > Notification Preferences.' },
          { title: 'Right Not to Be Subject to Automated Decisions', desc: 'All clinical decisions are made by qualified human pharmacists/prescribers, never by algorithms alone.' },
        ].map(right => (
          <div key={right.title} className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{right.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{right.desc}</p>
          </div>
        ))}
      </div>

      <h2>2. How to Exercise Your Rights</h2>

      <h3>Self-Service (Instant)</h3>
      <ul>
        <li><strong>Export data:</strong> Login &gt; Account &gt; Profile &gt; Export My Data</li>
        <li><strong>Delete account:</strong> Login &gt; Account &gt; Profile &gt; Delete My Account</li>
        <li><strong>Update profile:</strong> Login &gt; Account &gt; Profile</li>
        <li><strong>Marketing opt-out:</strong> Login &gt; Account &gt; Profile &gt; Notification Preferences</li>
      </ul>

      <h3>By Request</h3>
      <p>For requests that cannot be handled via self-service, email <strong>privacy@pharmacyonestop.co.uk</strong> with:</p>
      <ul>
        <li>Your full name and email address associated with your account</li>
        <li>A description of what you are requesting</li>
        <li>Proof of identity (to prevent unauthorised access to your data)</li>
      </ul>
      <p>We will respond within <strong>30 calendar days</strong> as required by UK GDPR.</p>

      <h2>3. Data Processing Activities</h2>
      <p>We maintain a Record of Processing Activities (ROPA) as required by Article 30 of UK GDPR. Key processing activities include:</p>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2 bg-gray-50">Activity</th>
            <th className="text-left p-2 bg-gray-50">Data Subjects</th>
            <th className="text-left p-2 bg-gray-50">Legal Basis</th>
            <th className="text-left p-2 bg-gray-50">Retention</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="p-2 border-t">Platform account management</td><td className="p-2 border-t">All users</td><td className="p-2 border-t">Contract</td><td className="p-2 border-t">Active + 30 days</td></tr>
          <tr><td className="p-2 border-t">Clinical consultations</td><td className="p-2 border-t">Patients</td><td className="p-2 border-t">Legal obligation</td><td className="p-2 border-t">8 years</td></tr>
          <tr><td className="p-2 border-t">Identity verification</td><td className="p-2 border-t">Online patients</td><td className="p-2 border-t">Legal obligation</td><td className="p-2 border-t">12 months</td></tr>
          <tr><td className="p-2 border-t">Payment processing</td><td className="p-2 border-t">Patients, tenants</td><td className="p-2 border-t">Contract</td><td className="p-2 border-t">7 years (HMRC)</td></tr>
          <tr><td className="p-2 border-t">Marketing communications</td><td className="p-2 border-t">Opted-in users</td><td className="p-2 border-t">Consent</td><td className="p-2 border-t">Until withdrawn</td></tr>
          <tr><td className="p-2 border-t">Audit logging</td><td className="p-2 border-t">All users</td><td className="p-2 border-t">Legitimate interest</td><td className="p-2 border-t">7 years</td></tr>
        </tbody>
      </table>

      <h2>4. Data Protection Impact Assessments</h2>
      <p>We conduct DPIAs for high-risk processing activities, including:</p>
      <ul>
        <li>Processing of special category health data (clinical consultations)</li>
        <li>Identity verification with biometric liveness checks</li>
        <li>Automated processing of medical questionnaires</li>
      </ul>

      <h2>5. International Transfers</h2>
      <p>All personal data is stored in UK-based data centres (AWS eu-west-2, London). We do not transfer personal data outside the UK except where necessary for service delivery (e.g., Stripe processes payments in the EEA under adequate UK GDPR safeguards).</p>

      <h2>6. Data Breach Notification</h2>
      <p>In the event of a personal data breach:</p>
      <ul>
        <li>We will notify the ICO within 72 hours if the breach is likely to result in a risk to individuals.</li>
        <li>We will notify affected individuals without undue delay if the breach is likely to result in a high risk.</li>
        <li>We maintain a breach register and conduct post-incident reviews.</li>
      </ul>

      <h2>7. Data Protection Officer</h2>
      <p><strong>Email:</strong> dpo@pharmacyonestop.co.uk</p>
      <p>Our DPO oversees compliance with UK GDPR, handles data subject requests, and advises on data protection impact assessments.</p>

      <h2>8. Supervisory Authority</h2>
      <p>The UK&apos;s supervisory authority for data protection is the Information Commissioner&apos;s Office (ICO):</p>
      <ul>
        <li><strong>Website:</strong> <a href="https://ico.org.uk" className="text-teal-600">ico.org.uk</a></li>
        <li><strong>Phone:</strong> 0303 123 1113</li>
      </ul>

      <p className="mt-8 text-sm">For the full privacy policy, see our <Link href="/privacy" className="text-teal-600 font-medium">Privacy Policy</Link>.</p>
    </article>
  );
}
