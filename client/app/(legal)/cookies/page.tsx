export default function CookiePolicyPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: 29 April 2026</p>

      <h2>1. What Are Cookies</h2>
      <p>Cookies are small text files placed on your device when you visit a website. They help the site remember your preferences and understand how you use it. Pharmacy One Stop uses cookies to provide a secure, functional, and improved experience.</p>

      <h2>2. Cookies We Use</h2>

      <h3>2.1 Essential Cookies (Always Active)</h3>
      <p>These are required for the Platform to function. You cannot opt out of these.</p>
      <table className="w-full text-sm">
        <thead><tr><th className="text-left p-2 bg-gray-50">Cookie</th><th className="text-left p-2 bg-gray-50">Purpose</th><th className="text-left p-2 bg-gray-50">Duration</th></tr></thead>
        <tbody>
          <tr><td className="p-2 border-t font-mono text-xs">accessToken</td><td className="p-2 border-t">Authentication — keeps you logged in</td><td className="p-2 border-t">15 minutes</td></tr>
          <tr><td className="p-2 border-t font-mono text-xs">refreshToken</td><td className="p-2 border-t">Session refresh — extends your login session</td><td className="p-2 border-t">7 days</td></tr>
          <tr><td className="p-2 border-t font-mono text-xs">__stripe_mid</td><td className="p-2 border-t">Stripe fraud prevention</td><td className="p-2 border-t">1 year</td></tr>
          <tr><td className="p-2 border-t font-mono text-xs">__stripe_sid</td><td className="p-2 border-t">Stripe payment session</td><td className="p-2 border-t">30 minutes</td></tr>
        </tbody>
      </table>

      <h3>2.2 Functional Cookies</h3>
      <p>These remember your preferences and improve your experience.</p>
      <table className="w-full text-sm">
        <thead><tr><th className="text-left p-2 bg-gray-50">Cookie</th><th className="text-left p-2 bg-gray-50">Purpose</th><th className="text-left p-2 bg-gray-50">Duration</th></tr></thead>
        <tbody>
          <tr><td className="p-2 border-t font-mono text-xs">theme</td><td className="p-2 border-t">Remembers your display preferences</td><td className="p-2 border-t">1 year</td></tr>
          <tr><td className="p-2 border-t font-mono text-xs">sidebar_state</td><td className="p-2 border-t">Remembers sidebar open/closed state</td><td className="p-2 border-t">Session</td></tr>
          <tr><td className="p-2 border-t font-mono text-xs">cookie_consent</td><td className="p-2 border-t">Records your cookie consent choice</td><td className="p-2 border-t">1 year</td></tr>
        </tbody>
      </table>

      <h3>2.3 Analytics Cookies (Optional)</h3>
      <p>These help us understand how you use the Platform so we can improve it. They are only set if you consent.</p>
      <table className="w-full text-sm">
        <thead><tr><th className="text-left p-2 bg-gray-50">Cookie</th><th className="text-left p-2 bg-gray-50">Purpose</th><th className="text-left p-2 bg-gray-50">Duration</th></tr></thead>
        <tbody>
          <tr><td className="p-2 border-t font-mono text-xs">_ga</td><td className="p-2 border-t">Google Analytics — distinguishes users</td><td className="p-2 border-t">2 years</td></tr>
          <tr><td className="p-2 border-t font-mono text-xs">_ga_*</td><td className="p-2 border-t">Google Analytics — session state</td><td className="p-2 border-t">2 years</td></tr>
        </tbody>
      </table>

      <h3>2.4 Marketing Cookies (Optional)</h3>
      <p>We do not currently use marketing cookies. If we introduce them in the future, we will update this policy and request your consent.</p>

      <h2>3. Managing Cookies</h2>
      <p>You can manage cookies through:</p>
      <ul>
        <li><strong>Our cookie banner:</strong> Appears on your first visit. Choose &quot;Accept All&quot; or &quot;Essential Only&quot;.</li>
        <li><strong>Browser settings:</strong> Most browsers allow you to block or delete cookies. Note that blocking essential cookies may prevent the Platform from functioning.</li>
        <li><strong>Google Analytics opt-out:</strong> Install the <a href="https://tools.google.com/dlpage/gaoptout" className="text-teal-600">Google Analytics Opt-out Browser Add-on</a>.</li>
      </ul>

      <h2>4. Third-Party Cookies</h2>
      <p>Some cookies are set by third-party services we use:</p>
      <ul>
        <li><strong>Stripe:</strong> Payment processing and fraud prevention</li>
        <li><strong>Google Analytics:</strong> Website usage analytics (if consented)</li>
        <li><strong>Onfido:</strong> Identity verification (session cookies during IDV process only)</li>
      </ul>

      <h2>5. Updates</h2>
      <p>We may update this policy when we add or remove cookies. The &quot;last updated&quot; date at the top indicates the latest revision.</p>

      <h2>6. Contact</h2>
      <p>For questions about our use of cookies, contact <strong>privacy@pharmacyonestop.co.uk</strong>.</p>
    </article>
  );
}
