
"use client";

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import SidebarNav from './SidebarNav';
import { useI18n } from '@/contexts/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { BookOpenText } from 'lucide-react';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
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
    if (currentPathname.startsWith('/admin/app-settings')) return t("appLayout.adminAppSettingsTitle");
    if (currentPathname.startsWith('/admin/community-management')) return t("appLayout.adminCommunityManagementTitle");
    if (currentPathname.startsWith('/admin/email-templates')) return t("appLayout.adminEmailTemplatesTitle");
    if (currentPathname.startsWith('/admin')) return t("appLayout.adminTitle");
    if (currentPathname.startsWith('/legal')) return t("appLayout.legalTitle");
    return t("appLayout.defaultTitle");
  };

  const headerTitle = getDynamicHeaderTitle(pathname);

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="none" side="left">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 text-sidebar-primary hover:text-sidebar-primary/90 transition-colors">
            <BookOpenText className="h-8 w-8" />
            <h1 className="text-2xl font-semibold">
              Zeinte
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4">
          <p className="text-xs text-sidebar-foreground/70">
            &copy; {new Date().getFullYear()} Search and Make S.L (CIF: B45786787) - Zeinte.
          </p>
          <div className="mt-1 space-x-2 text-xs text-sidebar-foreground/60">
            <Link href="/legal/privacy" className="hover:text-sidebar-primary">{t('legal.privacyPolicy')}</Link>
            <span>|</span>
            <Link href="/legal/cookies" className="hover:text-sidebar-primary">{t('legal.cookiesPolicy')}</Link>
            <span>|</span>
            <Link href="/legal/terms" className="hover:text-sidebar-primary">{t('legal.legalNotice')}</Link>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {headerTitle}
          </h2>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
