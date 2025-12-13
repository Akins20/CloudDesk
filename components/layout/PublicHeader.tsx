'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/lib/stores';
import { ROUTES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/helpers';

interface PublicHeaderProps {
  transparent?: boolean;
}

export function PublicHeader({ transparent = false }: PublicHeaderProps) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!transparent) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparent]);

  const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/#comparison', label: 'Compare' },
    { href: '/about', label: 'About' },
  ];

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled || !transparent
            ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-lg'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-background font-bold text-sm">CD</span>
              </div>
              <span className="font-semibold text-foreground text-lg">CloudDesk</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {isInitialized && isAuthenticated ? (
                <Button onClick={() => router.push(ROUTES.DASHBOARD)}>
                  Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Link href={ROUTES.LOGIN}>
                    <Button variant="ghost">Sign in</Button>
                  </Link>
                  <Link href={ROUTES.REGISTER}>
                    <Button>
                      Get Started Free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-background/95 backdrop-blur-xl md:hidden transition-all duration-300',
          mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
      >
        <div className="pt-20 px-6">
          <div className="space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-lg text-foreground border-b border-border"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            {isInitialized && isAuthenticated ? (
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  router.push(ROUTES.DASHBOARD);
                  setMobileMenuOpen(false);
                }}
              >
                Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <>
                <Link href={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full" size="lg">
                    Sign in
                  </Button>
                </Link>
                <Link href={ROUTES.REGISTER} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" size="lg">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
