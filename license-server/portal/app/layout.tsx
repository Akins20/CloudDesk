import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui';

export const metadata: Metadata = {
  title: 'CloudDesk - License Portal',
  description: 'Manage your CloudDesk licenses and subscriptions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
