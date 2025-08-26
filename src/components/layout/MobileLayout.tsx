
"use client";

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import BottomNavBar from './BottomNavBar';
import { BookOpenText } from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const pathname = usePathname();
  const { t } = useI18n();

    const getDynamicHeaderTitle = (currentPathname: string): string => {
    if (currentPathname.startsWith('/dashboard')) return t("appLayout.dashboardTitle");
    if (currentPathname.startsWith('/upload')) return t("appLayout.createExamTitle");
    if (currentPathname.startsWith('/exam/result')) return t("appLayout.examResultTitle");
    if (currentPathname.startsWith('/history/courses')) return t("appLayout.courseHistoryTitle");
    if (currentPathname.startsWith('/history')) return t("appLayout.historyTitle");
    if (currentPathname.startsWith('/configure')) return t("appLayout.configureTitle");
    if (currentPathname.startsWith('/community')) return t("appLayout.communityTitle");
    if (currentPathname.startsWith('/custom-courses')) return t("appLayout.createCourseTitle");
    if (currentPathname.startsWith('/profile')) return t("appLayout.profileTitle");
    if (currentPathname.startsWith('/pricing')) return t("appLayout.pricingTitle");
    if (currentPathname.startsWith('/payment/paypal')) return t("appLayout.paypalPaymentTitle");
    if (currentPathname.startsWith('/account/subscription')) return t("appLayout.subscriptionManagementTitle");
    if (currentPathname.startsWith('/admin')) return t("appLayout.adminTitle");
    if (currentPathname.startsWith('/legal')) return t("appLayout.legalTitle");
    return t("appLayout.defaultTitle");
  };

  const headerTitle = getDynamicHeaderTitle(pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-2 sm:px-4 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <BookOpenText className="h-7 w-7" />
          <span className="text-xl font-semibold">Zeinte</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 p-4 pb-24">
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
}
