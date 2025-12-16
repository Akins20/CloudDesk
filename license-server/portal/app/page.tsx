'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui';

const features = [
  {
    icon: '🖥️',
    title: 'Browser-Based VNC',
    description: 'Access your cloud desktops directly from any browser. No client software needed.',
  },
  {
    icon: '🔐',
    title: 'End-to-End Encryption',
    description: 'SSH tunnels + TLS encryption. Your credentials never touch our servers.',
  },
  {
    icon: '☁️',
    title: 'Multi-Cloud Support',
    description: 'AWS EC2, Oracle Cloud, Google Cloud, Azure - connect to any VNC-enabled server.',
  },
  {
    icon: '👥',
    title: 'Team Management',
    description: 'Invite team members, manage permissions, and track usage across your organization.',
  },
  {
    icon: '📊',
    title: 'Session Analytics',
    description: 'Monitor connection times, usage patterns, and generate compliance reports.',
  },
  {
    icon: '🚀',
    title: 'One-Click Deploy',
    description: 'Docker Compose or Helm chart - deploy to your infrastructure in minutes.',
  },
];

const tiers = [
  {
    name: 'Community',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for individual developers and small projects.',
    features: [
      '5 users',
      '10 instances',
      '3 concurrent sessions',
      'Basic VNC access',
      'Community support',
      'Docker deployment',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Team',
    price: '$99',
    period: '/month',
    description: 'For growing teams that need more power and control.',
    features: [
      '25 users',
      '50 instances',
      '10 concurrent sessions',
      'SSO Integration (SAML)',
      'Audit logging',
      'Priority email support',
      'Team management',
      'Usage analytics',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$299',
    period: '/month',
    description: 'For organizations with advanced security and compliance needs.',
    features: [
      'Unlimited users',
      'Unlimited instances',
      'Unlimited sessions',
      'Custom SAML/OIDC',
      'Advanced audit logs',
      '24/7 phone support',
      'SLA guarantee (99.9%)',
      'Dedicated account manager',
      'Custom integrations',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const roadmap = [
  {
    quarter: 'Q1 2025',
    status: 'completed',
    items: [
      'Browser-based VNC viewer',
      'SSH tunnel encryption',
      'Multi-cloud support (AWS, OCI)',
      'Self-hosted deployment',
    ],
  },
  {
    quarter: 'Q2 2025',
    status: 'in-progress',
    items: [
      'SSO/SAML integration',
      'Team management & permissions',
      'Audit logging',
      'Session recording',
    ],
  },
  {
    quarter: 'Q3 2025',
    status: 'planned',
    items: [
      'Mobile app (iOS/Android)',
      'File transfer support',
      'Clipboard sync',
      'Multi-monitor support',
    ],
  },
  {
    quarter: 'Q4 2025',
    status: 'planned',
    items: [
      'GPU acceleration',
      'Custom branding',
      'API access',
      'Terraform provider',
    ],
  },
];

const faqs = [
  {
    q: 'What is CloudDesk?',
    a: 'CloudDesk is a self-hosted remote desktop solution that lets you access your cloud servers (AWS, Oracle, GCP, Azure) through a browser-based VNC client with SSH tunnel encryption.',
  },
  {
    q: 'How does the BYOC model work?',
    a: 'Bring Your Own Cloud means you deploy CloudDesk on YOUR infrastructure. Your data, credentials, and servers stay under your control. We just provide the software.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All connections are encrypted via SSH tunnels + TLS. Credentials are encrypted client-side before storage. We operate on zero-knowledge principles.',
  },
  {
    q: 'Can I try before I buy?',
    a: 'Absolutely! The Community tier is free forever with generous limits. Team tier includes a 14-day free trial.',
  },
  {
    q: 'What happens if I exceed my limits?',
    a: 'You\'ll see an upgrade prompt. Your existing sessions continue working - you just can\'t create new ones until you upgrade or reduce usage.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No long-term contracts. Cancel anytime and your subscription ends at the billing period.',
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <span className="text-lg">☁️</span>
              </div>
              <span className="text-xl font-bold text-white">CloudDesk</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">Pricing</a>
              <a href="#roadmap" className="text-sm text-white/70 hover:text-white transition-colors">Roadmap</a>
              <a href="#faq" className="text-sm text-white/70 hover:text-white transition-colors">FAQ</a>
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
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-white/70">v1.0.0 Released — Self-hosted &amp; Enterprise Ready</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Remote Desktop
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Without Boundaries
              </span>
            </h1>

            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              Access your cloud servers from any browser. Self-hosted, secure, and blazing fast.
              No VPNs. No client software. Just your infrastructure, your way.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-white text-black hover:bg-white/90">
                  Start Free Forever
                  <span className="ml-2">→</span>
                </Button>
              </Link>
              <a href="https://github.com/Akins20/CloudDesk" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-white/20 hover:bg-white/10">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  View on GitHub
                </Button>
              </a>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> No credit card required
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Self-hosted
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Open source
              </div>
            </div>
          </div>

          {/* Hero Image/Preview */}
          <div className="mt-20 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-2xl" />
            <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 text-center text-sm text-white/40">CloudDesk — Connected to prod-server-01</div>
              </div>
              <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🖥️</div>
                  <p className="text-white/60">Your remote desktop, in your browser</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm text-white/60 mb-4">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Everything you need
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Powerful features designed for developers and teams who value security and control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm text-white/60 mb-4">
              Pricing
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees.
            </p>
          </div>

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
                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                    <span className="text-white/60">{tier.period}</span>
                  </div>
                  <p className="text-white/60 mt-2">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3 text-white/80">
                      <span className="text-green-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href="/register" className="block">
                  <Button
                    className={`w-full ${tier.highlighted ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0' : ''}`}
                    variant={tier.highlighted ? 'default' : 'outline'}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm text-white/60 mb-4">
              Roadmap
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              What&apos;s coming next
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              We&apos;re constantly improving CloudDesk. Here&apos;s what&apos;s on the horizon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roadmap.map((quarter, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg font-bold text-white">{quarter.quarter}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    quarter.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    quarter.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-white/10 text-white/60 border border-white/20'
                  }`}>
                    {quarter.status === 'completed' ? 'Completed' :
                     quarter.status === 'in-progress' ? 'In Progress' : 'Planned'}
                  </span>
                </div>
                <ul className="space-y-2">
                  {quarter.items.map((item, iIdx) => (
                    <li key={iIdx} className="flex items-start gap-2 text-sm text-white/70">
                      <span className={quarter.status === 'completed' ? 'text-green-400' : 'text-white/40'}>
                        {quarter.status === 'completed' ? '✓' : '○'}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm text-white/60 mb-4">
              FAQ
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
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
                    ▼
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
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to take control?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Deploy CloudDesk on your infrastructure today. Free forever for individuals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 bg-white text-black hover:bg-white/90">
                Get Started Free
              </Button>
            </Link>
            <Link href="#pricing">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-white/20">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-black/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <span className="text-lg">☁️</span>
                </div>
                <span className="text-xl font-bold text-white">CloudDesk</span>
              </div>
              <p className="text-sm text-white/40">
                Self-hosted remote desktop for the modern cloud.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#roadmap" className="hover:text-white transition-colors">Roadmap</a></li>
                <li><a href="https://github.com/Akins20/CloudDesk" className="hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Self-Hosting Guide</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">License</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © 2025 CloudDesk. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/Akins20/CloudDesk" className="text-white/40 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://twitter.com/clouddesk" className="text-white/40 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
