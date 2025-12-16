'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui';

const tiers = [
  {
    name: 'Community',
    monthlyPrice: 'Free',
    yearlyPrice: 'Free',
    period: 'forever',
    description: 'Perfect for individual developers and small projects.',
    highlighted: false,
    cta: 'Get Started Free',
    ctaVariant: 'outline' as const,
  },
  {
    name: 'Team',
    monthlyPrice: '$99',
    yearlyPrice: '$82',
    period: '/month',
    yearlyTotal: '$990/year',
    description: 'For growing teams that need more power and control.',
    highlighted: true,
    cta: 'Start Free Trial',
    ctaVariant: 'default' as const,
  },
  {
    name: 'Enterprise',
    monthlyPrice: '$299',
    yearlyPrice: '$249',
    period: '/month',
    yearlyTotal: '$2,990/year',
    description: 'For organizations with advanced security and compliance needs.',
    highlighted: false,
    cta: 'Contact Sales',
    ctaVariant: 'default' as const,
  },
];

const featureCategories = [
  {
    name: 'Usage Limits',
    features: [
      { label: 'Users', community: '5', team: '25', enterprise: 'Unlimited' },
      { label: 'Cloud Instances', community: '10', team: '50', enterprise: 'Unlimited' },
      { label: 'Concurrent Sessions', community: '3', team: '10', enterprise: 'Unlimited' },
      { label: 'Session History', community: '7 days', team: '90 days', enterprise: 'Unlimited' },
    ],
  },
  {
    name: 'Core Features',
    features: [
      { label: 'Browser-based VNC', community: true, team: true, enterprise: true },
      { label: 'SSH Tunnel Encryption', community: true, team: true, enterprise: true },
      { label: 'Multi-cloud Support', community: true, team: true, enterprise: true },
      { label: 'Docker Deployment', community: true, team: true, enterprise: true },
      { label: 'Helm Chart (Kubernetes)', community: true, team: true, enterprise: true },
    ],
  },
  {
    name: 'Team & Security',
    features: [
      { label: 'Team Management', community: false, team: true, enterprise: true },
      { label: 'Role-based Permissions', community: false, team: true, enterprise: true },
      { label: 'Audit Logging', community: false, team: true, enterprise: true },
      { label: 'SSO (SAML)', community: false, team: true, enterprise: true },
      { label: 'Custom SAML/OIDC', community: false, team: false, enterprise: true },
      { label: 'IP Allowlisting', community: false, team: false, enterprise: true },
    ],
  },
  {
    name: 'Analytics & Reporting',
    features: [
      { label: 'Basic Usage Stats', community: true, team: true, enterprise: true },
      { label: 'Session Analytics', community: false, team: true, enterprise: true },
      { label: 'User Activity Reports', community: false, team: true, enterprise: true },
      { label: 'Custom Dashboards', community: false, team: false, enterprise: true },
      { label: 'API Access', community: false, team: false, enterprise: true },
      { label: 'Data Export', community: false, team: true, enterprise: true },
    ],
  },
  {
    name: 'Support & SLA',
    features: [
      { label: 'Community Support', community: true, team: true, enterprise: true },
      { label: 'Email Support', community: false, team: 'Priority', enterprise: '24/7' },
      { label: 'Phone Support', community: false, team: false, enterprise: true },
      { label: 'Dedicated Account Manager', community: false, team: false, enterprise: true },
      { label: 'SLA Guarantee', community: false, team: '99.5%', enterprise: '99.9%' },
      { label: 'Custom Integrations', community: false, team: false, enterprise: true },
    ],
  },
];

const faqs = [
  {
    q: 'Can I change plans later?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate the difference.',
  },
  {
    q: 'What happens when I hit my limits?',
    a: 'You\'ll receive a notification and see an upgrade prompt. Your existing sessions continue working - you just can\'t create new ones until you upgrade or reduce usage.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'Yes! All paid plans include a 14-day free trial. No credit card required to start.',
  },
  {
    q: 'How does the license key work?',
    a: 'After subscribing, you\'ll receive a license key to add to your self-hosted CloudDesk installation. The key validates on startup and then works offline.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards through Stripe. Enterprise customers can also pay via invoice or wire transfer.',
  },
  {
    q: 'Can I get a refund?',
    a: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact us for a full refund.',
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <span className="text-lg">&#9729;</span>
              </div>
              <span className="text-xl font-bold text-white">CloudDesk</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-sm text-white/70 hover:text-white transition-colors">Features</Link>
              <Link href="/pricing" className="text-sm text-white transition-colors">Pricing</Link>
              <Link href="/#roadmap" className="text-sm text-white/70 hover:text-white transition-colors">Roadmap</Link>
              <Link href="/#faq" className="text-sm text-white/70 hover:text-white transition-colors">FAQ</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm text-white/60 mb-6">
            Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
            Start free, upgrade when you need more. No hidden fees, no surprises.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${!isYearly ? 'text-white' : 'text-white/50'}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isYearly ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${isYearly ? 'text-white' : 'text-white/50'}`}>
              Yearly
              <span className="ml-2 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                Save 17%
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tiers.map((tier, idx) => (
              <div
                key={idx}
                className={`relative p-8 rounded-2xl backdrop-blur-xl transition-all duration-300 ${
                  tier.highlighted
                    ? 'bg-white/10 border-2 border-blue-500/50 scale-105 shadow-xl shadow-blue-500/10'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-sm font-medium text-white">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {isYearly ? tier.yearlyPrice : tier.monthlyPrice}
                    </span>
                    <span className="text-white/60">{tier.period}</span>
                  </div>
                  {tier.yearlyTotal && isYearly && (
                    <p className="text-sm text-white/40 mt-1">Billed as {tier.yearlyTotal}</p>
                  )}
                  <p className="text-white/60 mt-3">{tier.description}</p>
                </div>

                <Link href="/register" className="block mb-6">
                  <Button
                    className={`w-full ${
                      tier.highlighted
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0'
                        : ''
                    }`}
                    variant={tier.ctaVariant}
                  >
                    {tier.cta}
                  </Button>
                </Link>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-white/80 mb-2">Includes:</p>
                  {featureCategories[0].features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3 text-sm text-white/70">
                      <span className="text-green-400">&#10003;</span>
                      {feature.label}: {
                        tier.name === 'Community' ? feature.community :
                        tier.name === 'Team' ? feature.team : feature.enterprise
                      }
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Compare all features
            </h2>
            <p className="text-lg text-white/60">
              Detailed breakdown of what&apos;s included in each plan.
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-white font-medium">Feature</th>
                  <th className="text-center py-4 px-4 text-white font-medium">Community</th>
                  <th className="text-center py-4 px-4 text-white font-medium">
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">Team</span>
                  </th>
                  <th className="text-center py-4 px-4 text-white font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {featureCategories.map((category, catIdx) => (
                  <>
                    <tr key={`cat-${catIdx}`} className="bg-white/5">
                      <td colSpan={4} className="py-3 px-4 font-semibold text-white text-sm uppercase tracking-wider">
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map((feature, fIdx) => (
                      <tr key={`${catIdx}-${fIdx}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-white/70 text-sm">{feature.label}</td>
                        <td className="py-3 px-4 text-center">
                          <FeatureValue value={feature.community} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <FeatureValue value={feature.team} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <FeatureValue value={feature.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <span className={`text-white/60 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`}>
                    &#9660;
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-200 ${openFaq === idx ? 'max-h-48' : 'max-h-0'}`}>
                  <div className="px-6 pb-4 text-white/60">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Start your free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 bg-white text-black hover:bg-white/90">
                Create Free Account
              </Button>
            </Link>
            <Link href="/#features">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-white/20">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-black/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <span className="text-lg">&#9729;</span>
              </div>
              <span className="text-xl font-bold text-white">CloudDesk</span>
            </div>
            <p className="text-sm text-white/40">
              &copy; 2025 CloudDesk. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/60">
              <Link href="/#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/#" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <span className="text-green-400">&#10003;</span>;
  }
  if (value === false) {
    return <span className="text-white/30">&#8212;</span>;
  }
  return <span className="text-white/70 text-sm">{value}</span>;
}
