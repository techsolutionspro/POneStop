export default function ComplaintsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Complaints Procedure</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: 29 April 2026</p>

      <h2>1. Our Commitment</h2>
      <p>Pharmacy One Stop is committed to providing a high-quality service. If something goes wrong, we want to know about it so we can put it right and learn from it.</p>

      <h2>2. How to Complain</h2>

      <h3>2.1 Platform / Technical Complaints</h3>
      <p>For issues with the Pharmacy One Stop platform, billing, or technical problems:</p>
      <ul>
        <li><strong>Email:</strong> support@pharmacyonestop.co.uk</li>
        <li><strong>Response time:</strong> We aim to acknowledge within 24 hours and resolve within 5 working days.</li>
      </ul>

      <h3>2.2 Clinical / Pharmacy Service Complaints</h3>
      <p>For complaints about a clinical service, consultation, or order received through a pharmacy storefront:</p>
      <ul>
        <li>Contact the pharmacy directly using the details on their storefront page.</li>
        <li>Each pharmacy is independently registered with the GPhC and has its own complaints procedure.</li>
        <li>If the pharmacy does not resolve your complaint satisfactorily, you may escalate to the GPhC.</li>
      </ul>

      <h3>2.3 GPhC Escalation</h3>
      <p>You can raise concerns about a pharmacy with the General Pharmaceutical Council:</p>
      <ul>
        <li><strong>Website:</strong> <a href="https://www.pharmacyregulation.org/raising-concerns" className="text-teal-600">pharmacyregulation.org/raising-concerns</a></li>
        <li><strong>Phone:</strong> 0203 713 8000</li>
      </ul>

      <h3>2.4 Data Protection Complaints</h3>
      <p>If you are unhappy with how your personal data has been handled:</p>
      <ul>
        <li><strong>Email:</strong> privacy@pharmacyonestop.co.uk</li>
        <li><strong>ICO:</strong> You have the right to complain to the Information Commissioner&apos;s Office at <a href="https://ico.org.uk/make-a-complaint/" className="text-teal-600">ico.org.uk</a></li>
      </ul>

      <h2>3. What Happens Next</h2>
      <ol>
        <li><strong>Acknowledgement:</strong> We acknowledge your complaint within 24 hours (1 working day).</li>
        <li><strong>Investigation:</strong> We investigate thoroughly, which may involve reviewing audit logs, consulting with the relevant pharmacy, or speaking with clinical staff.</li>
        <li><strong>Response:</strong> We aim to provide a full response within 5 working days. Complex complaints may take up to 20 working days — we will keep you updated.</li>
        <li><strong>Resolution:</strong> We will explain our findings, any actions taken, and what we will do to prevent recurrence.</li>
        <li><strong>Escalation:</strong> If you are not satisfied with our response, we will direct you to the appropriate regulatory body.</li>
      </ol>

      <h2>4. Adverse Events</h2>
      <p>If you experience a side effect or adverse event from a medicine supplied through the Platform:</p>
      <ul>
        <li>Contact the dispensing pharmacy immediately.</li>
        <li>The pharmacy&apos;s Responsible Pharmacist will assess and, where appropriate, report via the MHRA Yellow Card scheme.</li>
        <li>You can also report directly at <a href="https://yellowcard.mhra.gov.uk" className="text-teal-600">yellowcard.mhra.gov.uk</a>.</li>
      </ul>

      <h2>5. Contact</h2>
      <p><strong>Pharmacy One Stop (TSP)</strong><br />
      Email: support@pharmacyonestop.co.uk<br />
      Privacy: privacy@pharmacyonestop.co.uk</p>
    </article>
  );
}
