import { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  FileText,
  Cookie,
  Copyright,
  AlertTriangle,
  Scale,
  Globe,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Legal | CloudDesk',
  description: 'CloudDesk Legal Information - Cookie Policy, DMCA, and other legal notices.',
};

const legalSections = [
  {
    id: 'cookie-policy',
    title: 'Cookie Policy',
    icon: Cookie,
  },
  {
    id: 'dmca',
    title: 'DMCA Policy',
    icon: Copyright,
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use Policy',
    icon: AlertTriangle,
  },
  {
    id: 'data-processing',
    title: 'Data Processing Agreement',
    icon: FileText,
  },
  {
    id: 'compliance',
    title: 'Compliance & Certifications',
    icon: Shield,
  },
];

export default function LegalPage() {
  const lastUpdated = 'December 13, 2025';

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-block px-4 py-1 rounded-full bg-card border border-border text-sm text-muted-foreground mb-6">
            Legal
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Legal Information
          </h1>
          <p className="text-xl text-muted-foreground">
            Important legal policies and information about CloudDesk.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 border-y border-border bg-card/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-muted-foreground">Quick links:</span>
            {legalSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-sm text-foreground hover:underline"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Legal Pages Links */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Primary Legal Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/privacy"
              className="p-6 rounded-xl bg-card/50 border border-border hover:border-foreground/30 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Privacy Policy</h3>
                    <p className="text-sm text-muted-foreground">How we handle your data</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
            <Link
              href="/terms"
              className="p-6 rounded-xl bg-card/50 border border-border hover:border-foreground/30 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center">
                    <Scale className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Terms of Service</h3>
                    <p className="text-sm text-muted-foreground">Rules for using CloudDesk</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16 text-muted-foreground">
            {/* Cookie Policy */}
            <section id="cookie-policy" className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-foreground" />
                </div>
                <h2 className="text-3xl font-semibold text-foreground">Cookie Policy</h2>
              </div>

              <div className="space-y-6">
                <p>
                  CloudDesk uses cookies and similar technologies to provide and improve our service. This policy explains what cookies are, how we use them, and your choices regarding their use.
                </p>

                <h3 className="text-xl font-medium text-foreground">What Are Cookies?</h3>
                <p>
                  Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and understand how you interact with the service.
                </p>

                <h3 className="text-xl font-medium text-foreground">Cookies We Use</h3>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-card">
                      <tr>
                        <th className="text-left p-4 text-foreground font-medium">Cookie Type</th>
                        <th className="text-left p-4 text-foreground font-medium">Purpose</th>
                        <th className="text-left p-4 text-foreground font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="p-4 text-foreground">Authentication</td>
                        <td className="p-4">Keeps you logged in</td>
                        <td className="p-4">Session / 7 days</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-4 text-foreground">Session</td>
                        <td className="p-4">Maintains your session state</td>
                        <td className="p-4">Session</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-4 text-foreground">Preferences</td>
                        <td className="p-4">Remembers your settings</td>
                        <td className="p-4">1 year</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-4 text-foreground">Analytics</td>
                        <td className="p-4">Helps us improve the service</td>
                        <td className="p-4">2 years</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-xl font-medium text-foreground">Managing Cookies</h3>
                <p>
                  You can control cookies through your browser settings. Note that disabling certain cookies may affect CloudDesk functionality, particularly authentication.
                </p>
              </div>
            </section>

            {/* DMCA Policy */}
            <section id="dmca" className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center">
                  <Copyright className="w-6 h-6 text-foreground" />
                </div>
                <h2 className="text-3xl font-semibold text-foreground">DMCA Policy</h2>
              </div>

              <div className="space-y-6">
                <p>
                  CloudDesk respects intellectual property rights and expects users to do the same. We respond to valid DMCA takedown notices in accordance with the Digital Millennium Copyright Act.
                </p>

                <h3 className="text-xl font-medium text-foreground">Important Note</h3>
                <div className="p-4 rounded-lg bg-card/50 border border-border">
                  <p className="text-foreground">
                    CloudDesk provides connection services to YOUR infrastructure. We do not host user content. If you believe content on a server accessed through CloudDesk infringes your copyright, you should contact the server owner or their hosting provider directly.
                  </p>
                </div>

                <h3 className="text-xl font-medium text-foreground">Filing a DMCA Notice</h3>
                <p>
                  If you believe CloudDesk-hosted content (such as our website or documentation) infringes your copyright, please send a DMCA notice to:
                </p>
                <div className="p-4 rounded-lg bg-card/50 border border-border">
                  <p className="text-foreground font-medium">DMCA Agent</p>
                  <p>CloudDesk Legal</p>
                  <p>Email: <a href="mailto:dmca@clouddesk.io" className="text-foreground underline">dmca@clouddesk.io</a></p>
                </div>

                <p>Your notice must include:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>A physical or electronic signature of the copyright owner or authorized agent</li>
                  <li>Identification of the copyrighted work claimed to be infringed</li>
                  <li>Identification of the material to be removed with sufficient information to locate it</li>
                  <li>Your contact information (address, phone, email)</li>
                  <li>A statement of good faith belief that the use is unauthorized</li>
                  <li>A statement, under penalty of perjury, that the information is accurate</li>
                </ul>
              </div>
            </section>

            {/* Acceptable Use Policy */}
            <section id="acceptable-use" className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-foreground" />
                </div>
                <h2 className="text-3xl font-semibold text-foreground">Acceptable Use Policy</h2>
              </div>

              <div className="space-y-6">
                <p>
                  This Acceptable Use Policy outlines prohibited uses of CloudDesk. Violation may result in account suspension or termination.
                </p>

                <h3 className="text-xl font-medium text-foreground">Prohibited Activities</h3>
                <p>You may NOT use CloudDesk to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access systems without proper authorization</li>
                  <li>Conduct illegal activities or facilitate others doing so</li>
                  <li>Distribute malware, viruses, or malicious code</li>
                  <li>Engage in hacking, cracking, or unauthorized system access</li>
                  <li>Launch DDoS attacks or other disruptive activities</li>
                  <li>Mine cryptocurrency on systems without authorization</li>
                  <li>Send spam or conduct phishing activities</li>
                  <li>Host or distribute illegal content</li>
                  <li>Violate export control laws</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Harass, threaten, or abuse others</li>
                  <li>Resell CloudDesk services without authorization</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground">Reporting Violations</h3>
                <p>
                  If you become aware of any violations, please report them to <a href="mailto:abuse@clouddesk.io" className="text-foreground underline">abuse@clouddesk.io</a>.
                </p>
              </div>
            </section>

            {/* Data Processing Agreement */}
            <section id="data-processing" className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-foreground" />
                </div>
                <h2 className="text-3xl font-semibold text-foreground">Data Processing Agreement</h2>
              </div>

              <div className="space-y-6">
                <p>
                  For enterprise customers and organizations subject to GDPR or similar data protection regulations, we offer a Data Processing Agreement (DPA).
                </p>

                <h3 className="text-xl font-medium text-foreground">Key Points</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>CloudDesk acts as a data processor when handling your account information</li>
                  <li>Content on your servers remains under your control — we are not a processor for that data</li>
                  <li>We implement appropriate technical and organizational security measures</li>
                  <li>Sub-processors are engaged only with appropriate safeguards</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground">Requesting a DPA</h3>
                <p>
                  Enterprise customers can request a signed DPA by contacting <a href="mailto:legal@clouddesk.io" className="text-foreground underline">legal@clouddesk.io</a>.
                </p>
              </div>
            </section>

            {/* Compliance */}
            <section id="compliance" className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-foreground" />
                </div>
                <h2 className="text-3xl font-semibold text-foreground">Compliance & Certifications</h2>
              </div>

              <div className="space-y-6">
                <p>
                  CloudDesk is committed to maintaining the highest security and compliance standards.
                </p>

                <h3 className="text-xl font-medium text-foreground">Security Practices</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All data encrypted in transit (TLS 1.3)</li>
                  <li>Sensitive credentials encrypted at rest (AES-256)</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Secure development practices (OWASP guidelines)</li>
                  <li>24/7 infrastructure monitoring</li>
                  <li>Incident response procedures</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground">Compliance Frameworks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card/50 border border-border">
                    <h4 className="font-medium text-foreground mb-2">GDPR</h4>
                    <p className="text-sm">Compliant with EU data protection requirements</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border">
                    <h4 className="font-medium text-foreground mb-2">CCPA</h4>
                    <p className="text-sm">Compliant with California privacy regulations</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border">
                    <h4 className="font-medium text-foreground mb-2">SOC 2 Type II</h4>
                    <p className="text-sm">Certification in progress</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border">
                    <h4 className="font-medium text-foreground mb-2">ISO 27001</h4>
                    <p className="text-sm">Planned for 2025</p>
                  </div>
                </div>

                <h3 className="text-xl font-medium text-foreground">Questions?</h3>
                <p>
                  For compliance inquiries, contact <a href="mailto:compliance@clouddesk.io" className="text-foreground underline">compliance@clouddesk.io</a>.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="pt-8 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Legal Contact</h2>
              <p className="mb-4">
                For legal inquiries, please contact:
              </p>
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-foreground font-medium">CloudDesk Legal Team</p>
                <p>Email: <a href="mailto:legal@clouddesk.io" className="text-foreground underline">legal@clouddesk.io</a></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
