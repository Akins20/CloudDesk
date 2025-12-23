import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UpgradeModalProvider } from '@/components/providers/UpgradeModalProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CloudDesk - Remote Desktop Management',
  description: 'Manage and connect to your cloud instances through a secure remote desktop interface.',
  keywords: ['remote desktop', 'cloud', 'VNC', 'EC2', 'Oracle Cloud'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <UpgradeModalProvider />
      </body>
    </html>
  );
}
