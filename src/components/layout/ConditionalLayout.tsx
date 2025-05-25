
"use client";

import { usePathname } from 'next/navigation';
import type React from 'react';
import AppLayout from '@/components/layout/AppLayout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  if (isHomePage) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}
