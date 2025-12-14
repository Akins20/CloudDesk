'use client';

import { useEffect, useState, useRef } from 'react';
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
  Terminal,
  Check,
  Play,
  Users,
  Clock,
  DollarSign,
  Cpu,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { ROUTES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/helpers';

const features = [
  {
    icon: Monitor,
    title: 'Browser-Based Access',
    description: 'No downloads, no installations. Access your cloud desktops directly from any modern web browser.',
  },
  {
    icon: Shield,
    title: 'Secure SSH Tunnels',
    description: 'Encrypted SSH connections protect your data in transit. Your credentials are stored securely.',
  },
  {
    icon: Zap,
    title: 'Fast Connection',
    description: 'Optimized WebSocket connections for responsive remote desktop streaming.',
  },
  {
    icon: Globe,
    title: 'Any Linux Server',
    description: 'Works with any Linux server via SSH. Tested with AWS EC2 and Oracle Cloud (OCI).',
  },
  {
    icon: Server,
    title: 'Auto-Provisioning',
    description: 'We automatically install and configure VNC on your instances. Zero manual setup required.',
  },
  {
    icon: Lock,
    title: 'Your Cloud, Your Data',
    description: 'BYOC model means your data stays in YOUR cloud account. We never store your files.',
  },
];

const stats = [
  { value: 'Beta', label: 'Free Access', icon: CheckCircle2 },
  { value: 'SSH', label: 'Encrypted Tunnel', icon: Shield },
  { value: 'XFCE', label: 'Desktop Environment', icon: Zap },
  { value: '24/7', label: 'Always Available', icon: Clock },
];

const comparisonFeatures = [
  { feature: 'Browser-based access', clouddesk: true, workspaces: true, guacamole: true },
  { feature: 'Use your own cloud instances', clouddesk: true, workspaces: false, guacamole: true },
  { feature: 'Auto-provision VNC/Desktop', clouddesk: true, workspaces: true, guacamole: false },
  { feature: 'No server setup required', clouddesk: true, workspaces: true, guacamole: false },
  { feature: 'Multi-cloud support', clouddesk: true, workspaces: false, guacamole: true },
  { feature: 'Pay only for your cloud costs', clouddesk: true, workspaces: false, guacamole: true },
  { feature: 'Starting price', clouddesk: 'Free', workspaces: '$21/mo', guacamole: 'Free*' },
];

// Example use cases - what CloudDesk enables
const useCaseExamples = [
  {
    quote: "Access EC2 dev environments from any browser - no local setup required.",
    useCase: "Remote Development",
    icon: "💻",
  },
  {
    quote: "Connect to Oracle Cloud instances for testing and administration.",
    useCase: "Cloud Administration",
    icon: "☁️",
  },
  {
    quote: "Quick setup: add your instance details and connect in seconds.",
    useCase: "Fast Onboarding",
    icon: "⚡",
  },
];

const faqs = [
  {
    q: "What cloud providers are supported?",
    a: "CloudDesk works with any Linux server that has SSH access. We've tested and verified it with AWS EC2 and Oracle Cloud Infrastructure (OCI), but it should work with any provider offering Linux instances.",
  },
  {
    q: "Do I need to install anything on my server?",
    a: "No! CloudDesk automatically provisions VNC and a desktop environment (XFCE) on your Linux instances when you first connect. It's completely hands-off.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. All connections use encrypted SSH tunnels. Your credentials are encrypted with AES-256. We never have access to your server data — it stays entirely in your cloud account.",
  },
  {
    q: "What's the difference between CloudDesk and Amazon WorkSpaces?",
    a: "WorkSpaces provides managed VMs that Amazon controls. CloudDesk lets you use YOUR OWN instances, giving you full control and typically 50-80% lower costs since you're not paying DaaS markup.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! CloudDesk is currently free while in beta. We're focused on building the best product before introducing pricing tiers.",
  },
];

const useCases = [
  {
    icon: Cpu,
    title: "Developers",
    description: "Access powerful cloud dev environments from anywhere. Code on a beefy EC2 from your lightweight laptop.",
  },
  {
    icon: Users,
    title: "Remote Teams",
    description: "Give your team secure access to shared cloud resources without VPN complexity.",
  },
  {
    icon: DollarSign,
    title: "Cost-Conscious Orgs",
    description: "Cut DaaS costs by 50-80% by using your own cloud infrastructure.",
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "Work from anywhere with just a browser. No software to install or update.",
  },
];

export function LandingPage() {
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const observerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    Object.values(observerRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const setRef = (id: string) => (el: HTMLDivElement | null) => {
    observerRefs.current[id] = el;
  };

  return (
    <div className="bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-foreground/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-foreground/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
              </span>
              <span className="text-sm text-foreground">Now in Public Beta — Free to Use</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tight mb-6 animate-slide-up">
              Your Cloud.
              <br />
              <span className="bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent animate-pulse">
                Your Desktop.
              </span>
              <br />
              <span className="text-muted-foreground">Anywhere.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Access your AWS EC2 and Oracle Cloud instances through a
              <span className="text-foreground font-medium"> secure, browser-based </span>
              remote desktop. No client software. No VPN. No hassle.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href={ROUTES.REGISTER}>
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 group">
                  Start Free — No Credit Card
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 group">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm">SSH Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="text-sm">Secure Connections</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                <span className="text-sm">BYOC Architecture</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div
            id="hero-visual"
            ref={setRef('hero-visual')}
            className={cn(
              "mt-20 relative transition-all duration-1000",
              isVisible['hero-visual'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            )}
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-foreground/10 via-transparent to-foreground/10 rounded-2xl blur-xl" />
            <div className="relative rounded-xl overflow-hidden border border-border bg-card/80 backdrop-blur-sm shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-status-error hover:bg-status-error/80 transition-colors cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-status-warning hover:bg-status-warning/80 transition-colors cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-status-success hover:bg-status-success/80 transition-colors cursor-pointer" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-background/50 border border-border text-xs text-muted-foreground">
                    app.clouddesk.io/desktop/prod-server-1
                  </div>
                </div>
              </div>

              {/* Dashboard mockup */}
              <div className="p-6 bg-gradient-to-br from-background to-card">
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {stats.map((stat, idx) => (
                    <div
                      key={stat.label}
                      className="text-center p-4 rounded-lg bg-card/50 border border-border hover:border-foreground/30 transition-all duration-300 hover:scale-105"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <stat.icon className="w-5 h-5 mx-auto mb-2 text-foreground/70" />
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Instance cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'prod-api-server', status: 'connected', provider: 'AWS EC2' },
                    { name: 'dev-environment', status: 'available', provider: 'Oracle Cloud' },
                    { name: 'staging-server', status: 'available', provider: 'AWS EC2' },
                  ].map((instance, i) => (
                    <div
                      key={instance.name}
                      className="p-4 rounded-lg bg-background/50 border border-border flex items-center gap-3 hover:border-foreground/30 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Server className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{instance.name}</p>
                        <p className="text-xs text-muted-foreground">{instance.provider}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          instance.status === 'connected' ? 'bg-status-success animate-pulse' : 'bg-muted-foreground'
                        )} />
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Cloud / Social Proof */}
      <section className="py-12 border-y border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8">Currently verified with these cloud providers</p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {['AWS EC2', 'Oracle Cloud (OCI)'].map((provider) => (
              <div key={provider} className="text-lg font-semibold text-foreground">
                {provider}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">More providers coming soon</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            id="features-header"
            ref={setRef('features-header')}
            className={cn(
              "text-center mb-16 transition-all duration-700",
              isVisible['features-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            )}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-card border border-border text-sm text-muted-foreground mb-4">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for developers, teams, and enterprises who demand security and simplicity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                id={`feature-${idx}`}
                ref={setRef(`feature-${idx}`)}
                className={cn(
                  "group p-6 rounded-xl bg-card/50 border border-border hover:border-foreground/30 transition-all duration-500 hover:bg-card hover:shadow-xl hover:-translate-y-1",
                  isVisible[`feature-${idx}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                )}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg border border-border bg-background flex items-center justify-center mb-4 group-hover:border-foreground/30 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            id="how-header"
            ref={setRef('how-header')}
            className={cn(
              "text-center mb-16 transition-all duration-700",
              isVisible['how-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            )}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-background border border-border text-sm text-muted-foreground mb-4">
              Simple Setup
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Connected in 60 Seconds
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No complex configuration. No manual VNC setup. Just add your instance and connect.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />

            {[
              {
                step: '01',
                icon: Server,
                title: 'Add Your Instance',
                description: 'Enter your server IP, username, and SSH key or password. We support any Linux server.',
              },
              {
                step: '02',
                icon: Terminal,
                title: 'We Handle the Rest',
                description: 'CloudDesk automatically installs VNC and XFCE desktop on your instance via SSH.',
              },
              {
                step: '03',
                icon: Monitor,
                title: 'Connect & Work',
                description: 'Click connect and your remote desktop streams instantly to your browser. That\'s it.',
              },
            ].map((item, index) => (
              <div
                key={item.step}
                id={`step-${index}`}
                ref={setRef(`step-${index}`)}
                className={cn(
                  "relative text-center transition-all duration-700",
                  isVisible[`step-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                )}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-foreground text-background text-3xl font-bold mb-6 hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <div className="w-16 h-16 rounded-xl bg-card border border-border flex items-center justify-center mx-auto mb-4 hover:border-foreground/30 transition-colors">
                  <item.icon className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            id="usecases-header"
            ref={setRef('usecases-header')}
            className={cn(
              "text-center mb-16 transition-all duration-700",
              isVisible['usecases-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            )}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-card border border-border text-sm text-muted-foreground mb-4">
              Use Cases
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Built for Everyone
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, idx) => (
              <div
                key={useCase.title}
                className="p-6 rounded-xl bg-card/50 border border-border hover:border-foreground/30 transition-all duration-300 hover:-translate-y-1 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-foreground/10 flex items-center justify-center mx-auto mb-4">
                  <useCase.icon className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-24 bg-card/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            id="comparison-header"
            ref={setRef('comparison-header')}
            className={cn(
              "text-center mb-16 transition-all duration-700",
              isVisible['comparison-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            )}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-background border border-border text-sm text-muted-foreground mb-4">
              Comparison
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Why CloudDesk?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how we compare to alternatives. The best of both worlds.
            </p>
          </div>

          <div className="rounded-xl border border-border overflow-hidden bg-card/50">
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-border bg-card">
              <div className="font-medium text-foreground">Feature</div>
              <div className="text-center font-bold text-foreground">CloudDesk</div>
              <div className="text-center text-muted-foreground">AWS WorkSpaces</div>
              <div className="text-center text-muted-foreground">Guacamole</div>
            </div>
            {comparisonFeatures.map((row, idx) => (
              <div
                key={row.feature}
                className={cn(
                  "grid grid-cols-4 gap-4 p-4 items-center",
                  idx !== comparisonFeatures.length - 1 && "border-b border-border"
                )}
              >
                <div className="text-sm text-muted-foreground">{row.feature}</div>
                <div className="text-center">
                  {typeof row.clouddesk === 'boolean' ? (
                    row.clouddesk ? (
                      <Check className="w-5 h-5 text-status-success mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  ) : (
                    <span className="font-bold text-foreground">{row.clouddesk}</span>
                  )}
                </div>
                <div className="text-center">
                  {typeof row.workspaces === 'boolean' ? (
                    row.workspaces ? (
                      <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">{row.workspaces}</span>
                  )}
                </div>
                <div className="text-center">
                  {typeof row.guacamole === 'boolean' ? (
                    row.guacamole ? (
                      <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  ) : (
                    <span className="text-muted-foreground text-xs">{row.guacamole}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            * Guacamole is free but requires significant self-hosted infrastructure and manual configuration.
          </p>
        </div>
      </section>

      {/* Use Cases Section - What You Can Do */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            id="testimonials-header"
            ref={setRef('testimonials-header')}
            className={cn(
              "text-center mb-16 transition-all duration-700",
              isVisible['testimonials-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            )}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-card border border-border text-sm text-muted-foreground mb-4">
              What You Can Do
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Simple & Effective
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCaseExamples.map((example, idx) => (
              <div
                key={example.useCase}
                className="p-6 rounded-xl bg-card/50 border border-border hover:border-foreground/30 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{example.icon}</div>
                <p className="text-foreground mb-4">{example.quote}</p>
                <p className="text-sm font-medium text-muted-foreground">{example.useCase}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-card/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            id="faq-header"
            ref={setRef('faq-header')}
            className={cn(
              "text-center mb-16 transition-all duration-700",
              isVisible['faq-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            )}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-background border border-border text-sm text-muted-foreground mb-4">
              FAQ
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Questions? Answers.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-card/50 overflow-hidden"
              >
                <button
                  onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-card/80 transition-colors"
                >
                  <span className="font-medium text-foreground pr-4">{faq.q}</span>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform duration-300",
                    activeAccordion === idx && "rotate-180"
                  )} />
                </button>
                <div className={cn(
                  "overflow-hidden transition-all duration-300",
                  activeAccordion === idx ? "max-h-96" : "max-h-0"
                )}>
                  <p className="px-6 pb-6 text-muted-foreground">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-background mb-6">
            Ready to Simplify Cloud Access?
          </h2>
          <p className="text-xl text-background/70 mb-10 max-w-2xl mx-auto">
            Join developers and teams who've ditched complex VPNs and expensive DaaS for CloudDesk's elegant simplicity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={ROUTES.REGISTER}>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-background text-foreground hover:bg-background/90 text-lg px-8 py-6 group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-background/30 text-background hover:bg-background/10 text-lg px-8 py-6"
              >
                Learn More About Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
