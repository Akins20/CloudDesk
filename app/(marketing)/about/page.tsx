import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Heart,
  Target,
  Users,
  Lightbulb,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';
import { Button } from '@/components/ui';

export const metadata: Metadata = {
  title: 'About Us | CloudDesk',
  description: 'Learn about CloudDesk - our mission to simplify cloud remote desktop access for developers and teams worldwide.',
};

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'Every decision we make prioritizes the security of your data and credentials. We use industry-standard encryption and never store your files.',
  },
  {
    icon: Lightbulb,
    title: 'Simplicity',
    description: 'Complex problems deserve elegant solutions. We believe powerful tools should be easy to use, not require a manual.',
  },
  {
    icon: Users,
    title: 'Developer-Centric',
    description: 'Built by developers, for developers. We understand the workflows and pain points because we live them every day.',
  },
  {
    icon: Heart,
    title: 'Transparency',
    description: 'No hidden fees, no vendor lock-in. Your cloud, your control. We\'re here to enable, not to extract.',
  },
];

const milestones = [
  { year: '2024', title: 'The Idea', description: 'Frustrated with expensive DaaS solutions and complex VPN setups, we started building CloudDesk.' },
  { year: '2024', title: 'First Prototype', description: 'Built the core VNC-over-WebSocket technology and proved browser-based remote desktop was viable.' },
  { year: '2025', title: 'Public Beta', description: 'Launched CloudDesk to the public, offering free access while we refine the platform.' },
  { year: 'Future', title: 'Team Features', description: 'Multi-user support, SSO, audit logs, and enterprise features on the roadmap.' },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-card border border-border text-sm text-muted-foreground mb-6">
            About CloudDesk
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
            Simplifying Cloud Access
            <br />
            <span className="text-muted-foreground">One Desktop at a Time</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We believe accessing your cloud infrastructure should be as simple as opening a browser tab.
            No VPNs. No client software. No complexity.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-1 rounded-full bg-background border border-border text-sm text-muted-foreground mb-6">
                Our Mission
              </span>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Democratizing Remote Desktop Access
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Enterprise-grade remote desktop solutions have traditionally been expensive, complex, and locked to specific vendors. We're changing that.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                CloudDesk is built on a simple principle: <span className="text-foreground font-medium">your cloud, your control</span>. We provide the bridge between your browser and your infrastructure, while you maintain complete ownership of your data and servers.
              </p>
              <p className="text-lg text-muted-foreground">
                Whether you're a solo developer accessing a dev environment, or a team managing production servers, CloudDesk gives you secure, instant access from anywhere in the world.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-foreground/5 to-foreground/10 rounded-2xl blur-xl" />
              <div className="relative rounded-xl border border-border bg-card p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 rounded-lg bg-background/50 border border-border">
                    <Globe className="w-8 h-8 mx-auto mb-3 text-foreground" />
                    <p className="text-3xl font-bold text-foreground">2</p>
                    <p className="text-sm text-muted-foreground">Verified Providers</p>
                  </div>
                  <div className="text-center p-6 rounded-lg bg-background/50 border border-border">
                    <Users className="w-8 h-8 mx-auto mb-3 text-foreground" />
                    <p className="text-3xl font-bold text-foreground">Beta</p>
                    <p className="text-sm text-muted-foreground">Currently Free</p>
                  </div>
                  <div className="text-center p-6 rounded-lg bg-background/50 border border-border">
                    <Zap className="w-8 h-8 mx-auto mb-3 text-foreground" />
                    <p className="text-3xl font-bold text-foreground">SSH</p>
                    <p className="text-sm text-muted-foreground">Encrypted Tunnels</p>
                  </div>
                  <div className="text-center p-6 rounded-lg bg-background/50 border border-border">
                    <Shield className="w-8 h-8 mx-auto mb-3 text-foreground" />
                    <p className="text-3xl font-bold text-foreground">BYOC</p>
                    <p className="text-sm text-muted-foreground">Your Data, Your Cloud</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-card border border-border text-sm text-muted-foreground mb-6">
              Our Values
            </span>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              What We Believe In
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              These principles guide every feature we build and every decision we make.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="p-8 rounded-xl bg-card/50 border border-border hover:border-foreground/30 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-lg bg-foreground/10 flex items-center justify-center mb-6">
                  <value.icon className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-lg">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-card/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-background border border-border text-sm text-muted-foreground mb-6">
              Our Journey
            </span>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              The CloudDesk Story
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-12">
              {milestones.map((milestone, idx) => (
                <div key={idx} className="relative pl-20">
                  {/* Timeline dot */}
                  <div className="absolute left-6 w-5 h-5 rounded-full bg-foreground border-4 border-background" />

                  <div className="p-6 rounded-xl bg-card/50 border border-border">
                    <span className="inline-block px-3 py-1 rounded-full bg-foreground/10 text-sm text-foreground font-medium mb-3">
                      {milestone.year}
                    </span>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-card border border-border text-sm text-muted-foreground mb-6">
            The Team
          </span>
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Built by Engineers, for Engineers
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            CloudDesk is built by a small, passionate team of engineers who've experienced the pain of complex remote access solutions firsthand. We're building the tool we wished existed.
          </p>

          <div className="inline-flex items-center gap-8 p-6 rounded-xl bg-card/50 border border-border">
            <div className="w-20 h-20 rounded-full bg-foreground text-background flex items-center justify-center text-2xl font-bold">
              EO
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-foreground">Elijah Ogunbiyi</h3>
              <p className="text-muted-foreground">Founder & Lead Engineer</p>
              <div className="flex items-center gap-4 mt-3">
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Linkedin className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-card via-card/50 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_50%)]" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/10 border border-foreground/20 mb-8">
            <Shield className="w-4 h-4 text-foreground" />
            <span className="text-sm text-foreground">Free during beta</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Ready to Experience CloudDesk?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join developers and teams who've simplified their cloud access. No credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-6 group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-6"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
