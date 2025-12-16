import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Link href="/" className="text-2xl font-bold mb-8">
        CloudDesk
      </Link>
      {children}
    </div>
  );
}
