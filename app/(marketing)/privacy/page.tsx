import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | CloudDesk',
  description: 'CloudDesk Privacy Policy - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'December 13, 2025';

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-card border border-border text-sm text-muted-foreground mb-6">
            Legal
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p className="mb-4">
                CloudDesk ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our cloud remote desktop service.
              </p>
              <p>
                Please read this privacy policy carefully. By using CloudDesk, you consent to the practices described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-medium text-foreground mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong className="text-foreground">Account Information:</strong> Email address, password (hashed), and name when you create an account.</li>
                <li><strong className="text-foreground">Instance Configuration:</strong> Server hostnames, IP addresses, SSH usernames, and authentication credentials you provide to connect to your cloud instances.</li>
                <li><strong className="text-foreground">Support Communications:</strong> Information you provide when contacting our support team.</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Usage Data:</strong> Connection times, session duration, and feature usage.</li>
                <li><strong className="text-foreground">Device Information:</strong> Browser type, operating system, and device identifiers.</li>
                <li><strong className="text-foreground">Log Data:</strong> IP addresses, access times, and error logs for debugging purposes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Authenticate your identity and manage your account</li>
                <li>Establish secure connections to your cloud instances</li>
                <li>Send you service-related communications</li>
                <li>Respond to your support requests</li>
                <li>Detect, prevent, and address security issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Security</h2>
              <p className="mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Encryption in Transit:</strong> All connections use TLS/SSL encryption.</li>
                <li><strong className="text-foreground">Encryption at Rest:</strong> Sensitive credentials are encrypted using AES-256.</li>
                <li><strong className="text-foreground">SSH Tunnels:</strong> VNC connections are secured through encrypted SSH tunnels.</li>
                <li><strong className="text-foreground">Access Controls:</strong> Strict access controls limit who can access your data.</li>
              </ul>
              <div className="mt-4 p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-foreground font-medium">Important:</p>
                <p>CloudDesk operates on a "Bring Your Own Cloud" (BYOC) model. Your files, applications, and data remain on YOUR cloud instances. We only facilitate the connection — we never have access to the content on your servers.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Sharing</h2>
              <p className="mb-4">
                We do not sell, trade, or rent your personal information. We may share your information only in these circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Service Providers:</strong> With third-party services that help us operate (e.g., hosting, analytics), under strict confidentiality agreements.</li>
                <li><strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our rights.</li>
                <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
                <li><strong className="text-foreground">With Your Consent:</strong> When you explicitly authorize us to share information.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Retention</h2>
              <p className="mb-4">
                We retain your information for as long as necessary to provide our services and fulfill the purposes described in this policy. Specifically:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Account Data:</strong> Retained until you delete your account.</li>
                <li><strong className="text-foreground">Session Logs:</strong> Retained for 90 days for security and debugging.</li>
                <li><strong className="text-foreground">Usage Analytics:</strong> Aggregated and anonymized data may be retained indefinitely.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Your Rights</h2>
              <p className="mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate data.</li>
                <li><strong className="text-foreground">Deletion:</strong> Request deletion of your personal data.</li>
                <li><strong className="text-foreground">Portability:</strong> Request a machine-readable copy of your data.</li>
                <li><strong className="text-foreground">Objection:</strong> Object to certain processing of your data.</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at <a href="mailto:privacy@clouddesk.io" className="text-foreground underline">privacy@clouddesk.io</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Cookies and Tracking</h2>
              <p className="mb-4">
                We use essential cookies to operate our service:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Authentication Cookies:</strong> To keep you logged in.</li>
                <li><strong className="text-foreground">Session Cookies:</strong> To maintain your session state.</li>
                <li><strong className="text-foreground">Preference Cookies:</strong> To remember your settings.</li>
              </ul>
              <p className="mt-4">
                We do not use third-party advertising cookies or sell your data to advertisers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by relevant data protection authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Children's Privacy</h2>
              <p>
                CloudDesk is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of CloudDesk after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contact Us</h2>
              <p className="mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-foreground font-medium">CloudDesk Privacy Team</p>
                <p>Email: <a href="mailto:privacy@clouddesk.io" className="text-foreground underline">privacy@clouddesk.io</a></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
