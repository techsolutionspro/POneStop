export default function TermsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: 29 April 2026</p>

      <h2>1. Agreement</h2>
      <p>By accessing or using Pharmacy One Stop (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. The Platform is operated by TSP (&quot;we&quot;, &quot;our&quot;). If you do not agree to these terms, do not use the Platform.</p>

      <h2>2. Definitions</h2>
      <ul>
        <li><strong>Tenant:</strong> A pharmacy business that subscribes to the Platform.</li>
        <li><strong>User:</strong> Any individual who accesses the Platform, including tenant staff and patients.</li>
        <li><strong>Patient:</strong> An end user who books services or orders products through a tenant&apos;s storefront.</li>
        <li><strong>Services:</strong> The clinical services, booking, ordering, and related features provided through the Platform.</li>
      </ul>

      <h2>3. Eligibility</h2>
      <ul>
        <li>Tenants must be registered with the General Pharmaceutical Council (GPhC) as a pharmacy premises.</li>
        <li>Tenants offering online POM fulfilment must hold a valid GPhC Distance-Selling Pharmacy (DSP) licence.</li>
        <li>Staff with clinical roles must hold valid GPhC or GMC registration.</li>
        <li>Patients must be aged 16 or over (or 18+ for certain services as determined by the PGD).</li>
      </ul>

      <h2>4. Subscription and Payment</h2>
      <ul>
        <li>Tenants subscribe to the Platform on a monthly or annual basis at the advertised tier price.</li>
        <li>A 14-day free trial is available for new tenants. No credit card is required during the trial.</li>
        <li>Payments are processed via Stripe. Tenants are responsible for maintaining a valid payment method.</li>
        <li>Usage charges (per consultation, per dispatch, per SMS) are billed monthly in arrears.</li>
        <li>All prices are in GBP and exclude VAT unless stated otherwise.</li>
        <li>We reserve the right to change pricing with 30 days&apos; notice.</li>
      </ul>

      <h2>5. Cancellation</h2>
      <ul>
        <li>Tenants may cancel their subscription at any time from their admin dashboard (Billing &gt; Cancel).</li>
        <li>Cancellation takes effect at the end of the current billing period.</li>
        <li>No refunds are given for partial billing periods.</li>
        <li>Upon cancellation, tenants retain access until the end of the paid period, after which the storefront is taken offline.</li>
        <li>Tenants may export all data (patients, bookings, orders, clinical records) before cancellation.</li>
      </ul>

      <h2>6. Data Ownership and Portability</h2>
      <ul>
        <li><strong>Tenant data:</strong> Tenants own their pharmacy data, patient lists, and clinical records. We act as a data processor.</li>
        <li><strong>Domain ownership:</strong> Domains purchased through the Platform belong to the tenant and may be transferred out at any time.</li>
        <li><strong>Export:</strong> One-click export is available for all data in CSV, JSON, or PDF format.</li>
        <li><strong>No lock-in:</strong> There are no exit fees, transfer fees, or data retention charges upon cancellation.</li>
      </ul>

      <h2>7. Clinical Governance</h2>
      <ul>
        <li>Patient Group Directions (PGDs) are authored, reviewed, and approved by registered clinical professionals under our clinical governance framework.</li>
        <li>Tenants are responsible for ensuring their pharmacists have the competencies required for each PGD they activate.</li>
        <li>The Platform provides the clinical decision support tool; the pharmacist/prescriber retains clinical responsibility for each supply decision.</li>
        <li>All consultation records are immutable and retained per GPhC/CQC requirements.</li>
      </ul>

      <h2>8. Distance-Selling Pharmacy Compliance</h2>
      <ul>
        <li>Tenants enabling online POM fulfilment must provide their GPhC DSP registration for verification.</li>
        <li>The MHRA Internet Pharmacy common logo is automatically displayed on storefront pages offering POMs.</li>
        <li>POM products are not advertised to the public; access is gated behind clinical questionnaires.</li>
        <li>The Platform enforces consumer protection rules including the no-return disclosure for prescription medicines under Consumer Contracts Regulations 2013.</li>
      </ul>

      <h2>9. Patient Terms</h2>
      <ul>
        <li>Patients consent to a remote clinical consultation when ordering POMs online.</li>
        <li>Patients must provide accurate medical information. Providing false information may result in clinical harm and order rejection.</li>
        <li>POMs cannot be returned once dispatched (Consumer Contracts Regulations 2013 exemption). This is disclosed before purchase.</li>
        <li>Patients receive a full automatic refund if their order is clinically rejected.</li>
        <li>Subscription orders include a clinical re-screen before each dispatch. Subscriptions can be paused, skipped, or cancelled at any time — one click, no phone calls required.</li>
      </ul>

      <h2>10. Acceptable Use</h2>
      <p>You must not:</p>
      <ul>
        <li>Use the Platform for any unlawful purpose</li>
        <li>Attempt to access another user&apos;s account or data</li>
        <li>Circumvent security measures, rate limits, or access controls</li>
        <li>Upload malicious code, spam, or harmful content</li>
        <li>Scrape, crawl, or automate access without permission</li>
        <li>Use the Platform to supply medicines outside of the authorised PGD or prescription framework</li>
      </ul>

      <h2>11. Intellectual Property</h2>
      <ul>
        <li>The Platform, including its design, code, PGD content, and documentation, is owned by TSP.</li>
        <li>Tenants retain ownership of their branding, content, and patient data.</li>
        <li>Tenants grant us a limited licence to display their branding on their storefront.</li>
      </ul>

      <h2>12. Limitation of Liability</h2>
      <ul>
        <li>The Platform is provided &quot;as is&quot; without warranty of any kind.</li>
        <li>We are not liable for clinical decisions made by pharmacists or prescribers using the Platform.</li>
        <li>Our total liability is limited to the fees paid by the tenant in the 12 months preceding the claim.</li>
        <li>We are not liable for indirect, consequential, or incidental damages.</li>
      </ul>

      <h2>13. Governing Law</h2>
      <p>These terms are governed by the laws of England and Wales. Disputes will be subject to the exclusive jurisdiction of the English courts.</p>

      <h2>14. Contact</h2>
      <p>For questions about these terms, contact <strong>legal@pharmacyonestop.co.uk</strong>.</p>
    </article>
  );
}
