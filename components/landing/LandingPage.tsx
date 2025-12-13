'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Monitor,
  Shield,
  Zap,
  Globe,
  Server,
  Lock,
  ArrowRight,
  ChevronDown,
  Cloud,
  Terminal,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/lib/stores';
import { ROUTES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/helpers';

const features = [
  {
    icon: Monitor,
    title: 'Remote Desktop Access',
    description: 'Connect to your cloud instances through a seamless VNC-based remote desktop experience.',
  },
  {
    icon: Shield,
    title: 'Secure Connections',
    description: 'End-to-end encrypted SSH tunnels ensure your data stays private and protected.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized WebSocket connections deliver responsive, low-latency desktop streaming.',
  },
  {
    icon: Globe,
    title: 'Multi-Cloud Support',
    description: 'Manage instances across AWS EC2, Oracle Cloud, and more from a single dashboard.',
  },
  {
    icon: Server,
    title: 'Instance Management',
    description: 'Add, configure, and organize your cloud servers with an intuitive interface.',
  },
  {
    icon: Lock,
    title: 'Credential Security',
    description: 'SSH keys and passwords are encrypted at rest using industry-standard encryption.',
  },
];

const stats = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<50ms', label: 'Latency' },
  { value: '256-bit', label: 'Encryption' },
  { value: '24/7', label: 'Access' },
];

export function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'bg-background/80 backdrop-blur-lg border-b border-border' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-background font-bold text-sm">CD</span>
              </div>
              <span className="font-semibold text-foreground text-lg">CloudDesk</span>
            </div>
            <div className="flex items-center gap-4">
              {isInitialized && isAuthenticated ? (
                <Button onClick={() => router.push(ROUTES.DASHBOARD)}>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Link href={ROUTES.LOGIN}>
                    <Button variant="ghost">Sign in</Button>
                  </Link>
                  <Link href={ROUTES.REGISTER}>
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-foreground/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-foreground/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border mb-8">
              <Cloud className="w-4 h-4 text-foreground" />
              <span className="text-sm text-foreground">Cloud Desktop Management Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6">
              Access Your Cloud
              <br />
              <span className="text-muted-foreground">From Anywhere</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Connect to your EC2, Oracle Cloud, and other cloud instances through a secure,
              browser-based remote desktop. No client software needed.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={ROUTES.REGISTER}>
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Learn More
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image / Demo */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="relative rounded-xl overflow-hidden border border-border bg-card/50 backdrop-blur-sm shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/80">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-status-error/60" />
                  <div className="w-3 h-3 rounded-full bg-status-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-status-success/60" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-muted-foreground">CloudDesk Dashboard</span>
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-card/50 to-background">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center p-4 rounded-lg bg-background/50 border border-border">
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg bg-background/50 border border-border flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center">
                        <Server className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="h-3 w-24 bg-muted rounded mb-2" />
                        <div className="h-2 w-16 bg-muted/50 rounded" />
                      </div>
                      <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features to manage your cloud infrastructure with ease and security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl bg-card/50 border border-border hover:border-foreground/30 transition-all duration-300 hover:bg-card"
              >
                <div className="w-12 h-12 rounded-lg border border-border bg-background flex items-center justify-center mb-4 group-hover:border-foreground/30 transition-colors">
                  <feature.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get connected to your cloud desktops in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Server,
                title: 'Add Your Instance',
                description: 'Enter your cloud server details including host, credentials, and connection settings.',
              },
              {
                step: '02',
                icon: Terminal,
                title: 'Connect Securely',
                description: 'We establish an encrypted SSH tunnel and start a VNC session on your server.',
              },
              {
                step: '03',
                icon: Monitor,
                title: 'Access Desktop',
                description: 'Your remote desktop streams directly to your browser. No software to install.',
              },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-foreground text-background text-2xl font-bold mb-6">
                    {item.step}
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-background mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-background/70 mb-8 max-w-2xl mx-auto">
            Join thousands of developers and teams who trust CloudDesk for secure remote access to their cloud infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={ROUTES.REGISTER}>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-background text-foreground hover:bg-background/90"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-background font-bold text-xs">CD</span>
              </div>
              <span className="font-semibold text-foreground">CloudDesk</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CloudDesk. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
