'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  MessageSquare,
  HelpCircle,
  Bug,
  Lightbulb,
  Building2,
  Send,
  CheckCircle,
  Twitter,
  Github,
  Linkedin,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils/helpers';

const contactReasons = [
  { id: 'support', label: 'Technical Support', icon: HelpCircle, description: 'Get help with using CloudDesk' },
  { id: 'bug', label: 'Report a Bug', icon: Bug, description: 'Found something broken?' },
  { id: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'Suggest a new feature' },
  { id: 'enterprise', label: 'Enterprise Inquiry', icon: Building2, description: 'Team or enterprise plans' },
  { id: 'other', label: 'General Inquiry', icon: MessageSquare, description: 'Something else' },
];

export default function ContactPage() {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="pt-32 pb-20">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-status-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-status-success" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Message Sent!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Thanks for reaching out. We&apos;ll get back to you within 24-48 hours.
          </p>
          <Link href="/">
            <Button size="lg">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-card border border-border text-sm text-muted-foreground mb-6">
            Contact Us
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question, suggestion, or need help? We&apos;re here for you.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6">Send us a message</h2>

              {/* Reason Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  What can we help you with?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {contactReasons.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all duration-200",
                        selectedReason === reason.id
                          ? "border-foreground bg-card"
                          : "border-border bg-card/50 hover:border-foreground/30"
                      )}
                    >
                      <reason.icon className={cn(
                        "w-5 h-5 mb-2",
                        selectedReason === reason.id ? "text-foreground" : "text-muted-foreground"
                      )} />
                      <p className={cn(
                        "text-sm font-medium",
                        selectedReason === reason.id ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {reason.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Brief description of your inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us more about how we can help..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6">Other ways to reach us</h2>

              <div className="space-y-6">
                {/* Email */}
                <div className="p-6 rounded-xl bg-card/50 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email Us</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        For general inquiries and support
                      </p>
                      <a href="mailto:hello@clouddesk.io" className="text-foreground hover:underline">
                        hello@clouddesk.io
                      </a>
                    </div>
                  </div>
                </div>

                {/* Support */}
                <div className="p-6 rounded-xl bg-card/50 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Technical Support</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Need help with CloudDesk?
                      </p>
                      <a href="mailto:support@clouddesk.io" className="text-foreground hover:underline">
                        support@clouddesk.io
                      </a>
                    </div>
                  </div>
                </div>

                {/* Enterprise */}
                <div className="p-6 rounded-xl bg-card/50 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Enterprise Sales</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Interested in team or enterprise plans?
                      </p>
                      <a href="mailto:enterprise@clouddesk.io" className="text-foreground hover:underline">
                        enterprise@clouddesk.io
                      </a>
                    </div>
                  </div>
                </div>

                {/* Social */}
                <div className="p-6 rounded-xl bg-card/50 border border-border">
                  <h3 className="font-semibold text-foreground mb-4">Follow Us</h3>
                  <div className="flex items-center gap-4">
                    <a
                      href="#"
                      className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                {/* Response Time */}
                <div className="p-4 rounded-lg bg-foreground/5 border border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Response time:</strong> We typically respond within 24-48 hours during business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Link */}
      <section className="py-12 bg-card/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Looking for quick answers?
          </h2>
          <p className="text-muted-foreground mb-6">
            Check out our FAQ section for answers to common questions.
          </p>
          <Link href="/#faq">
            <Button variant="outline" size="lg">
              View FAQ
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
