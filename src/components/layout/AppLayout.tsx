
"use client";

import type React from 'react';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import SidebarNav from './SidebarNav';
// import { Brain } from 'lucide-react'; // Ícono Brain eliminado previamente
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/contexts/I18nContext'; 
import LanguageSwitcher from './LanguageSwitcher'; 

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { t } = useI18n();

  const getDynamicHeaderTitle = (currentPathname: string): string => {
    if (currentPathname.startsWith('/dashboard')) return t("appLayout.dashboardTitle");
    if (currentPathname.startsWith('/upload')) return t("appLayout.uploadTitle");
    if (currentPathname.startsWith('/configure')) return t("appLayout.configureTitle");
    if (currentPathname.startsWith('/community')) return t("appLayout.communityTitle");
    if (currentPathname.startsWith('/custom-courses')) return t("appLayout.createCourseTitle");
    if (currentPathname.startsWith('/profile')) return t("appLayout.profileTitle");
    if (currentPathname.startsWith('/pricing')) return t("appLayout.pricingTitle");
    if (currentPathname.startsWith('/payment/paypal')) return t("appLayout.paypalPaymentTitle");
    if (currentPathname.startsWith('/account/subscription')) return t("appLayout.subscriptionManagementTitle");
    if (currentPathname.startsWith('/admin/app-settings')) return t("appLayout.adminAppSettingsTitle");
    if (currentPathname.startsWith('/admin/community-management')) return t("appLayout.adminCommunityManagementTitle");
    if (currentPathname.startsWith('/admin')) return t("appLayout.adminTitle");
    // Fallback title for other cases within AppLayout
    return t("appLayout.defaultTitle"); 
  };
  
  const headerTitle = getDynamicHeaderTitle(pathname);


  return (
    <SidebarProvider defaultOpen={!isMobile} open={isMobile ? false : undefined}>
      {/* Desktop sidebar: starts open, can be collapsed to icons */}
      <Sidebar variant="sidebar" collapsible="icon"> 
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 text-sidebar-primary hover:text-sidebar-primary/90 transition-colors">
            {/* Ícono Brain eliminado, mantenemos solo el texto */}
            <h1 className="text-2xl font-semibold">
              Zeinte
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
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
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <div className="md:hidden"> {/* This trigger is for mobile off-canvas */}
              <SidebarTrigger />
            </div>
            {/* Desktop trigger can be added here if needed for icon mode, or rely on rail */}
            <h2 className="text-lg font-semibold text-foreground">
              {headerTitle}
            </h2>
          </div>
          <LanguageSwitcher /> 
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
