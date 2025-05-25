
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
import { Brain } from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/contexts/I18nContext'; // Import useI18n
import LanguageSwitcher from './LanguageSwitcher'; // Import LanguageSwitcher

interface AppLayoutProps {
  children: React.ReactNode;
}

// No need for getHeaderTitle function here, as it's handled by SidebarNav for active state
// and titles are managed by each page or a more robust i18n routing solution for metadata.

export default function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { t } = useI18n();

  const getDynamicHeaderTitle = (currentPathname: string): string => {
    if (currentPathname.startsWith('/dashboard')) return t("appLayout.dashboardTitle");
    if (currentPathname.startsWith('/upload')) return t("appLayout.uploadTitle");
    if (currentPathname.startsWith('/configure')) return t("appLayout.configureTitle");
    if (currentPathname.startsWith('/community')) return t("appLayout.communityTitle");
    if (currentPathname.startsWith('/profile')) return t("appLayout.profileTitle");
    if (currentPathname.startsWith('/admin/app-settings')) return t("appLayout.adminAppSettingsTitle");
    if (currentPathname.startsWith('/admin/community-management')) return t("appLayout.adminCommunityManagementTitle");
    if (currentPathname.startsWith('/admin')) return t("appLayout.adminTitle");
    return t("appLayout.defaultTitle");
  };
  
  const headerTitle = getDynamicHeaderTitle(pathname);


  return (
    <SidebarProvider defaultOpen={!isMobile} open={isMobile ? false : undefined}>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 text-sidebar-primary hover:text-sidebar-primary/90 transition-colors">
            <Brain className="h-8 w-8" />
            <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden">
              AdivinaExamen
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-sidebar-foreground/70">
            © {new Date().getFullYear()} Search and Make S.L (CIF: B45786787)
          </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {headerTitle}
            </h2>
          </div>
          <LanguageSwitcher /> {/* Add LanguageSwitcher to the header */}
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
