import Link from 'next/link';
import { Button } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground">
            CloudDesk
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground">
          Remote Desktop<br />Management Made Simple
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Connect to your cloud instances securely via VNC. Self-hosted solution
          with enterprise-grade features for teams of any size.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg">Start Free Trial</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg">View Pricing</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Everything you need</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Self-Hosted"
            description="Deploy on your own infrastructure. Full control over your data and security."
            icon={<ServerIcon />}
          />
          <FeatureCard
            title="Multi-Cloud"
            description="Connect to AWS, Oracle Cloud, or any SSH-accessible server with VNC support."
            icon={<CloudIcon />}
          />
          <FeatureCard
            title="Team Management"
            description="Invite team members, manage permissions, and track usage across your organization."
            icon={<UsersIcon />}
          />
        </div>
      </section>

      {/* Tiers */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Simple, transparent pricing</h2>
        <p className="text-muted-foreground text-center mb-12">
          Choose the plan that fits your needs
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <TierCard
            name="Community"
            price="Free"
            description="For individuals and small projects"
            features={[
              'Up to 5 users',
              'Up to 10 instances',
              '3 concurrent sessions',
              'Community support',
            ]}
          />
          <TierCard
            name="Team"
            price="$99"
            period="/month"
            description="For growing teams"
            features={[
              'Up to 25 users',
              'Up to 50 instances',
              '10 concurrent sessions',
              'Priority email support',
              'Advanced analytics',
            ]}
            highlighted
          />
          <TierCard
            name="Enterprise"
            price="$299"
            period="/month"
            description="For large organizations"
            features={[
              'Unlimited users',
              'Unlimited instances',
              'Unlimited sessions',
              '24/7 dedicated support',
              'Custom integrations',
              'SLA guarantee',
            ]}
          />
        </div>
        <div className="text-center mt-8">
          <Link href="/pricing">
            <Button variant="link">View full comparison</Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to get started?</h2>
        <p className="text-muted-foreground mb-8">
          Deploy CloudDesk today and take control of your remote desktop infrastructure.
        </p>
        <Link href="/register">
          <Button size="lg">Create Free Account</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CloudDesk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4 text-foreground">
        {icon}
      </div>
      <h3 className="font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TierCard({
  name,
  price,
  period,
  description,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div className={`border rounded-lg p-6 ${highlighted ? 'border-primary ring-2 ring-primary' : 'border-border bg-card'}`}>
      <h3 className="font-semibold text-lg mb-1 text-foreground">{name}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="mb-6">
        <span className="text-3xl font-bold text-foreground">{price}</span>
        {period && <span className="text-muted-foreground">{period}</span>}
      </div>
      <ul className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="text-sm flex items-center gap-2 text-foreground">
            <CheckIcon />
            {feature}
          </li>
        ))}
      </ul>
      <Link href="/register" className="block">
        <Button className="w-full" variant={highlighted ? 'default' : 'outline'}>
          Get Started
        </Button>
      </Link>
    </div>
  );
}

function ServerIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
