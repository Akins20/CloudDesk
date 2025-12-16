import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | CloudDesk',
  description: 'CloudDesk Terms of Service - Read our terms and conditions for using the CloudDesk platform.',
};

export default function TermsOfServicePage() {
  const lastUpdated = 'December 13, 2025';
  const effectiveDate = 'December 13, 2025';

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-card border border-border text-sm text-muted-foreground mb-6">
            Legal
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated} | Effective: {effectiveDate}
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Agreement to Terms</h2>
              <p className="mb-4">
                By accessing or using CloudDesk (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of these terms, you may not access the Service.
              </p>
              <p>
                These Terms apply to all visitors, users, and others who access or use the Service. By using the Service, you represent that you are at least 18 years old and have the legal capacity to enter into these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
              <p className="mb-4">
                CloudDesk provides a browser-based remote desktop service that enables users to connect to their own cloud infrastructure (e.g., AWS EC2, Google Cloud, Azure VMs) through secure VNC connections tunneled over SSH.
              </p>
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-foreground font-medium">BYOC Model:</p>
                <p>CloudDesk operates on a "Bring Your Own Cloud" model. We facilitate connections to YOUR servers — we do not provide virtual machines or cloud infrastructure. You are responsible for the security, configuration, and operation of your own cloud instances.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
              <h3 className="text-xl font-medium text-foreground mb-3">3.1 Account Creation</h3>
              <p className="mb-4">
                You must create an account to use CloudDesk. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">3.2 Account Security</h3>
              <p className="mb-4">
                You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">3.3 Account Termination</h3>
              <p>
                We reserve the right to suspend or terminate your account at any time for violations of these Terms or for any other reason at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Acceptable Use</h2>
              <p className="mb-4">You agree NOT to use CloudDesk to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any laws or regulations</li>
                <li>Access systems or data without authorization</li>
                <li>Distribute malware, viruses, or harmful code</li>
                <li>Engage in any form of hacking, cracking, or unauthorized access</li>
                <li>Mine cryptocurrency without proper authorization</li>
                <li>Send spam or unsolicited communications</li>
                <li>Infringe on intellectual property rights</li>
                <li>Harass, abuse, or harm others</li>
                <li>Attempt to gain unauthorized access to CloudDesk systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Your Responsibilities</h2>
              <p className="mb-4">As a CloudDesk user, you are solely responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The security and configuration of your own cloud instances</li>
                <li>The content stored on and activities performed through your servers</li>
                <li>Compliance with your cloud provider's terms of service</li>
                <li>Maintaining backups of your data</li>
                <li>Ensuring you have proper authorization to access connected systems</li>
                <li>Any costs incurred from your cloud providers (AWS, GCP, Azure, etc.)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Intellectual Property</h2>
              <p className="mb-4">
                The Service and its original content, features, and functionality are owned by CloudDesk and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p>
                You retain all rights to any content you access through your own cloud instances. CloudDesk does not claim ownership of your data or content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Privacy</h2>
              <p>
                Your use of CloudDesk is also governed by our <Link href="/privacy" className="text-foreground underline">Privacy Policy</Link>, which describes how we collect, use, and protect your information. By using the Service, you consent to our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Service Availability</h2>
              <p className="mb-4">
                We strive to provide reliable service but cannot guarantee uninterrupted availability. The Service may be temporarily unavailable due to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Scheduled maintenance (we will provide advance notice when possible)</li>
                <li>Emergency maintenance or security updates</li>
                <li>Factors beyond our control (internet outages, cloud provider issues)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Disclaimer of Warranties</h2>
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-foreground">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
                </p>
              </div>
              <p className="mt-4">
                We do not warrant that the Service will be uninterrupted, timely, secure, or error-free, or that defects will be corrected.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitation of Liability</h2>
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLOUDDESK SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR THE USE OF THE SERVICE.
                </p>
              </div>
              <p className="mt-4">
                In no event shall our total liability exceed the amount you paid us, if any, in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless CloudDesk and its officers, directors, employees, and agents from any claims, damages, obligations, losses, liabilities, costs, or debt arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) your content or activities on your cloud instances.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Modifications to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these Terms at any time. We will notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posting the updated Terms on this page</li>
                <li>Updating the "Last updated" date</li>
                <li>Sending an email to registered users (for significant changes)</li>
              </ul>
              <p className="mt-4">
                Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the courts of Delaware.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">14. Severability</h2>
              <p>
                If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, and the remaining provisions will continue in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">15. Entire Agreement</h2>
              <p>
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and CloudDesk regarding the Service and supersede all prior agreements and understandings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">16. Contact Us</h2>
              <p className="mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-foreground font-medium">CloudDesk Legal Team</p>
                <p>Email: <a href="mailto:legal@clouddesk.io" className="text-foreground underline">legal@clouddesk.io</a></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
