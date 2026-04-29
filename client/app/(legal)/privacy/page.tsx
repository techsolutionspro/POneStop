export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: 29 April 2026</p>

      <h2>1. Introduction</h2>
      <p>Pharmacy One Stop (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a UK-based B2B healthcare enablement platform operated by TSP. We are committed to protecting the privacy and security of your personal data in compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
      <p>This policy explains how we collect, use, store, and share personal data when you use our platform — whether you are a pharmacy owner (tenant), pharmacy staff member, patient, or visitor.</p>

      <h2>2. Data Controller</h2>
      <p><strong>Controller:</strong> Pharmacy One Stop (TSP)<br />
      <strong>Contact:</strong> privacy@pharmacyonestop.co.uk<br />
      <strong>Data Protection Officer:</strong> dpo@pharmacyonestop.co.uk</p>
      <p>For patient data processed through pharmacy storefronts, the relevant pharmacy (tenant) is the data controller and Pharmacy One Stop acts as the data processor.</p>

      <h2>3. Data We Collect</h2>
      <h3>3.1 Account Data</h3>
      <ul>
        <li>Name, email address, phone number</li>
        <li>Pharmacy name, GPhC registration number, company details</li>
        <li>Staff role, GPhC/GMC registration numbers</li>
        <li>Login credentials (passwords stored as bcrypt hashes, never in plain text)</li>
      </ul>

      <h3>3.2 Patient Data (processed on behalf of pharmacy tenants)</h3>
      <ul>
        <li>Name, date of birth, gender, address, contact details</li>
        <li>NHS number (optional), GP practice details</li>
        <li>Medical questionnaire responses and clinical consultation records</li>
        <li>Identity verification documents (passport, driving licence) and selfie images</li>
        <li>Prescription and dispensing records</li>
        <li>Payment information (processed by Stripe — we do not store card numbers)</li>
        <li>Booking and order history</li>
      </ul>

      <h3>3.3 Technical Data</h3>
      <ul>
        <li>IP address, browser type, device information</li>
        <li>Pages visited, actions taken (audit logs)</li>
        <li>Cookies and similar tracking technologies</li>
      </ul>

      <h2>4. How We Use Your Data</h2>
      <table className="w-full text-sm">
        <thead><tr><th className="text-left p-2 bg-gray-50">Purpose</th><th className="text-left p-2 bg-gray-50">Legal Basis</th></tr></thead>
        <tbody>
          <tr><td className="p-2 border-t">Providing the platform service</td><td className="p-2 border-t">Contract performance</td></tr>
          <tr><td className="p-2 border-t">Processing clinical consultations and prescriptions</td><td className="p-2 border-t">Legitimate interests / Legal obligation (healthcare)</td></tr>
          <tr><td className="p-2 border-t">Identity verification for POM products</td><td className="p-2 border-t">Legal obligation (MHRA requirements)</td></tr>
          <tr><td className="p-2 border-t">Sending booking confirmations and reminders</td><td className="p-2 border-t">Contract performance</td></tr>
          <tr><td className="p-2 border-t">Processing payments via Stripe</td><td className="p-2 border-t">Contract performance</td></tr>
          <tr><td className="p-2 border-t">Marketing communications (optional)</td><td className="p-2 border-t">Consent</td></tr>
          <tr><td className="p-2 border-t">Platform improvement and analytics</td><td className="p-2 border-t">Legitimate interests</td></tr>
          <tr><td className="p-2 border-t">Complying with GPhC, MHRA, CQC requirements</td><td className="p-2 border-t">Legal obligation</td></tr>
          <tr><td className="p-2 border-t">Fraud prevention and security</td><td className="p-2 border-t">Legitimate interests</td></tr>
        </tbody>
      </table>

      <h2>5. Data Storage and Security</h2>
      <ul>
        <li><strong>UK Data Residency:</strong> All production data is stored in UK-based data centres (AWS eu-west-2, London).</li>
        <li><strong>Encryption:</strong> AES-256 encryption at rest, TLS 1.2+ in transit. Field-level encryption for clinical notes and ID documents.</li>
        <li><strong>Access Control:</strong> Role-based access control (RBAC) with 10 distinct roles. MFA available for all users.</li>
        <li><strong>Audit Trail:</strong> All access to production data is logged, justified, and time-boxed.</li>
        <li><strong>Backups:</strong> Automated daily backups with 30-day retention.</li>
      </ul>

      <h2>6. Data Sharing</h2>
      <p>We share data only with:</p>
      <ul>
        <li><strong>Stripe:</strong> Payment processing (PCI DSS Level 1 certified)</li>
        <li><strong>Twilio:</strong> SMS delivery (booking reminders, order updates)</li>
        <li><strong>Onfido/Yoti:</strong> Identity verification for online POM orders</li>
        <li><strong>Courier partners:</strong> Delivery name and address only (Royal Mail, DPD, Evri)</li>
        <li><strong>AWS:</strong> Cloud infrastructure hosting (data processing agreement in place)</li>
      </ul>
      <p>We do not sell personal data to third parties. We do not share patient data with GPs unless the patient explicitly consents.</p>

      <h2>7. Data Retention</h2>
      <ul>
        <li><strong>Clinical records:</strong> Retained per GPhC/CQC requirements (typically 8 years for adults)</li>
        <li><strong>Identity verification documents:</strong> Retained for the validity window (default 12 months), then auto-purged</li>
        <li><strong>Account data:</strong> Retained while account is active + 30 days after deletion request</li>
        <li><strong>Audit logs:</strong> Retained for 7 years</li>
        <li><strong>Marketing consent records:</strong> Retained indefinitely as proof of consent</li>
      </ul>

      <h2>8. Your Rights</h2>
      <p>Under UK GDPR, you have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of your personal data (available via Account &gt; Export My Data)</li>
        <li><strong>Rectification:</strong> Correct inaccurate data via your profile settings</li>
        <li><strong>Erasure:</strong> Request deletion of your data (Account &gt; Delete My Account)</li>
        <li><strong>Portability:</strong> Export your data in CSV/JSON format</li>
        <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
        <li><strong>Withdraw consent:</strong> Withdraw marketing consent at any time</li>
      </ul>
      <p>To exercise these rights, email <strong>privacy@pharmacyonestop.co.uk</strong> or use the self-service options in your account.</p>

      <h2>9. Children</h2>
      <p>Our platform is not directed at children under 16. Patient services may be available to those 16+ depending on the clinical service and PGD requirements.</p>

      <h2>10. Changes to This Policy</h2>
      <p>We may update this policy from time to time. We will notify you of material changes by email or platform notification. The &quot;last updated&quot; date at the top indicates the latest revision.</p>

      <h2>11. Complaints</h2>
      <p>If you have concerns about how your data is handled, please contact us at <strong>privacy@pharmacyonestop.co.uk</strong>. You also have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) at <strong>ico.org.uk</strong>.</p>
    </article>
  );
}
