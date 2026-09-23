'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Auth/onboarding routes: no sidebar
  const isAuthRoute =
    pathname.startsWith('/auth') || pathname === '/onboarding';

  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Main app: fixed height, sidebar stays, content scrolls
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}