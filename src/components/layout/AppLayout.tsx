
"use client";

import type React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import MobileLayout from './MobileLayout';
import DesktopLayout from './DesktopLayout';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  // Show a skeleton loader while determining the device type to avoid layout shifts
  if (isMobile === undefined) {
    return (
        <div className="flex h-screen w-screen">
            <Skeleton className="hidden md:block h-full w-[16rem]" />
            <div className="flex-1 flex flex-col">
                <Skeleton className="h-16 w-full" />
                <div className="flex-1 p-8">
                    <Skeleton className="h-full w-full" />
                </div>
                 <Skeleton className="md:hidden h-16 w-full" />
            </div>
        </div>
    );
  }

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
}
