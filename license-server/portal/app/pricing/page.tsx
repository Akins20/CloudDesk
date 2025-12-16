import Link from 'next/link';
import { Button } from '@/components/ui';

const tiers = [
  {
    name: 'Community',
    price: 'Free',
    description: 'For individuals and small projects',
    features: {
      users: '5 users',
      instances: '10 instances',
      sessions: '3 concurrent sessions',
      support: 'Community support',
      analytics: 'Basic analytics',
      updates: 'Community updates',
    },
    cta: 'Get Started Free',
    ctaVariant: 'outline' as const,
  },
  {
    name: 'Team',
    price: '$99',
    period: '/month',
    yearlyPrice: '$990/year',
    description: 'For growing teams',
    features: {
      users: '25 users',
      instances: '50 instances',
      sessions: '10 concurrent sessions',
      support: 'Priority email support',
      analytics: 'Advanced analytics',
      updates: 'Priority updates',
    },
    cta: 'Start Free Trial',
    ctaVariant: 'default' as const,
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$299',
    period: '/month',
    yearlyPrice: '$2,990/year',
    description: 'For large organizations',
    features: {
      users: 'Unlimited users',
      instances: 'Unlimited instances',
      sessions: 'Unlimited sessions',
      support: '24/7 dedicated support',
      analytics: 'Custom analytics',
      updates: 'Early access to features',
    },
    extras: ['Custom integrations', 'SLA guarantee', 'Dedicated account manager'],
    cta: 'Contact Sales',
    ctaVariant: 'default' as const,
  },
];

const featureList = [
  { key: 'users', label: 'Users' },
  { key: 'instances', label: 'Instances' },
  { key: 'sessions', label: 'Concurrent Sessions' },
  { key: 'support', label: 'Support' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'updates', label: 'Updates' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            CloudDesk
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Pricing Header */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that best fits your team. All plans include a 14-day free trial.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-8 ${
                tier.highlighted
                  ? 'border-primary ring-2 ring-primary'
                  : 'bg-card'
              }`}
            >
              {tier.highlighted && (
                <div className="text-xs font-semibold text-primary mb-4">
                  MOST POPULAR
                </div>
              )}
              <h2 className="text-2xl font-bold mb-2">{tier.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {tier.description}
              </p>
              <div className="mb-2">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.period && (
                  <span className="text-muted-foreground">{tier.period}</span>
                )}
              </div>
              {tier.yearlyPrice && (
                <p className="text-sm text-muted-foreground mb-6">
                  or {tier.yearlyPrice} (save 17%)
                </p>
              )}
              {!tier.yearlyPrice && <div className="mb-6" />}

              <Link href="/register">
                <Button
                  className="w-full mb-6"
                  variant={tier.ctaVariant}
                >
                  {tier.cta}
                </Button>
              </Link>

              <ul className="space-y-3">
                {Object.values(tier.features).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
                {tier.extras?.map((extra, i) => (
                  <li key={`extra-${i}`} className="flex items-center gap-2 text-sm">
                    <CheckIcon />
                    {extra}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4">Feature</th>
                {tiers.map((tier) => (
                  <th key={tier.name} className="text-center py-4 px-4">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureList.map((feature) => (
                <tr key={feature.key} className="border-b">
                  <td className="py-4 px-4 text-muted-foreground">
                    {feature.label}
                  </td>
                  {tiers.map((tier) => (
                    <td key={tier.name} className="text-center py-4 px-4">
                      {tier.features[feature.key as keyof typeof tier.features]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <FAQItem
            question="Can I change plans later?"
            answer="Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the difference."
          />
          <FAQItem
            question="What happens when I hit my limits?"
            answer="You'll receive a notification when approaching limits. You can either upgrade your plan or remove resources to stay within your current plan."
          />
          <FAQItem
            question="Is there a free trial?"
            answer="Yes! All paid plans include a 14-day free trial. No credit card required to start."
          />
          <FAQItem
            question="How does the license key work?"
            answer="After subscribing, you'll receive a license key to add to your self-hosted CloudDesk installation. The key validates on startup and then works offline."
          />
          <FAQItem
            question="What payment methods do you accept?"
            answer="We accept all major credit cards through Stripe. Enterprise customers can also pay via invoice."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-muted-foreground mb-8">
          Start your free trial today. No credit card required.
        </p>
        <Link href="/register">
          <Button size="lg">Create Free Account</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CloudDesk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-green-600 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-sm text-muted-foreground">{answer}</p>
    </div>
  );
}
