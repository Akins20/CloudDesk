'use client';

import { usePathname } from 'next/navigation';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader transparent={isHomePage} />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
