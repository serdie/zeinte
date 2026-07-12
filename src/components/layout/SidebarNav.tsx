
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, UploadCloud, Settings, User, Users, Home, LogIn, LogOut, UserPlus, ShieldCheck, Lightbulb, ArrowUpCircle, Edit, LifeBuoy, History, GraduationCap, FileText } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext'; 
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import SupportFormDialog from '@/components/support/SupportFormDialog';

export const navItems = [
    { href: '/dashboard', labelKey: 'sidebar.dashboard', icon: BookOpenText, protected: true },
    { href: '/upload', labelKey: 'sidebar.createExam', icon: UploadCloud, protected: true },
    { href: '/custom-courses/create', labelKey: 'sidebar.createCourse', icon: Lightbulb, protected: true },
    { href: '/summarize', labelKey: 'sidebar.createSummary', icon: FileText, protected: true },
    { href: '/community', labelKey: 'sidebar.community', icon: Users, protected: true },
    { href: '/profile', labelKey: 'sidebar.profile', icon: User, protected: true },
    { href: '/history', labelKey: 'sidebar.history', icon: History, protected: true, isSubItem: true },
    { href: '/history/courses', labelKey: 'sidebar.courseHistory', icon: GraduationCap, protected: true, isSubItem: true },
    { href: '/history/summaries', labelKey: 'sidebar.summaryHistory', icon: History, protected: true, isSubItem: true },
    { href: '/configure', labelKey: 'sidebar.configureExam', icon: Settings, protected: true, isSubItem: true },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { currentUser, logout, loading, isFirebaseConfigured, isAdmin, userTier } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n(); 
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);

  const mainNavItems = navItems.filter(item => !item.isSubItem);
  const secondaryNavItems = navItems.filter(item => item.isSubItem);

  const authNavItems = {
    login: { href: '/login', labelKey: 'sidebar.login', icon: LogIn },
    signup: { href: '/signup', labelKey: 'sidebar.signup', icon: UserPlus },
  };

  const handleLogout = async () => {
    const result = await logout();
    if (typeof result === 'string') { 
      toast({ title: t('authContext.logoutErrorToastTitle'), description: result, variant: "destructive" });
    } else { 
      toast({ title: t('authContext.logoutSuccessToastTitle'), description: t('authContext.logoutSuccessToastDescription'), variant: "default" });
    }
  };

  const getTierLabel = (tier: typeof userTier) => {
    if (tier === 'admin') return t('sidebar.tierAdmin');
    if (tier === 'pro') return t('sidebar.tierPro');
    if (tier === 'free') return t('sidebar.tierFree');
    return '';
  };

  const isNavItemActive = (itemHref: string) => {
    if (itemHref === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(itemHref);
  }

  return (
    <>
    <SidebarMenu className="flex flex-col justify-between h-full p-2 space-y-2">
      <div className="space-y-1">
        {mainNavItems.map((item) => {
          if (item.protected && isFirebaseConfigured && !currentUser) return null;
          
          const label = t(item.labelKey);
          return (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isNavItemActive(item.href)}
                  tooltip={label}
                  className={cn(
                    "justify-start w-full",
                    isNavItemActive(item.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {label}
                    </span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}

        <hr className="my-2 border-border/50 group-data-[collapsible=icon]:hidden" />
        
        {secondaryNavItems.map((item) => {
          if (item.protected && isFirebaseConfigured && !currentUser) return null;
          
          const label = t(item.labelKey);
          return (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isNavItemActive(item.href)}
                  tooltip={label}
                  className={cn(
                    "justify-start w-full text-muted-foreground",
                    isNavItemActive(item.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {label}
                    </span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}


        {isAdmin && currentUser && isFirebaseConfigured && (
          <SidebarMenuItem key="/admin">
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/admin")}
                tooltip={t('sidebar.adminPanel')}
                className={cn(
                  "justify-start w-full",
                  pathname.startsWith("/admin")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Link href="/admin">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {t('sidebar.adminPanel')}
                  </span>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </div>

      <div className="mt-auto space-y-1">
         <div className="px-2 py-1 group-data-[collapsible=icon]:hidden space-y-1">
          {loading && <p className="text-xs text-sidebar-foreground/70">{t('sidebar.userLoading')}</p>}
          {!loading && currentUser && (
            <>
              <p className="text-xs text-sidebar-foreground/70 truncate" title={currentUser.email || t('sidebar.userConnected')}>
                {currentUser.email || t('sidebar.userConnected')}
              </p>
              {userTier && (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={userTier === 'admin' ? 'destructive' : userTier === 'pro' ? 'default' : 'secondary'}
                    className={cn(
                      userTier === 'pro' && 'bg-green-500 text-white',
                      userTier === 'admin' && 'bg-red-600 text-white',
                      'text-xs px-1.5 py-0.5'
                    )}
                  >
                    {getTierLabel(userTier)}
                  </Badge>
                  {userTier === 'free' && (
                    <Link href="/pricing">
                      <Button variant="link" size="sm" className="text-xs p-0 h-auto text-sidebar-accent hover:text-sidebar-accent/80">
                        <ArrowUpCircle className="h-3.5 w-3.5 mr-1"/>{t('sidebar.upgradeToPro')}
                      </Button>
                    </Link>
                  )}
                  {userTier === 'pro' && (
                     <Link href="/account/subscription">
                       <Button variant="link" size="sm" className="text-xs p-0 h-auto text-sidebar-accent hover:text-sidebar-accent/80">
                         <Edit className="h-3.5 w-3.5 mr-1"/>{t('sidebar.manageSubscription')}
                       </Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
          {!isFirebaseConfigured && !loading && <p className="text-xs text-destructive">{t('sidebar.firebaseNotConfigured')}</p>}
        </div>
        {currentUser && isFirebaseConfigured ? (
          <>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setIsSupportDialogOpen(true)}
                tooltip={t('sidebar.support')}
                className="justify-start w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LifeBuoy className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {t('sidebar.support')}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip={t('sidebar.logout')}
                className="justify-start w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                disabled={loading}
              >
                <LogOut className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {t('sidebar.logout')}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </>
        ) : (
          !loading && isFirebaseConfigured ? (
            <>
              <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === authNavItems.login.href}
                    tooltip={t(authNavItems.login.labelKey)}
                    className={cn(
                      "justify-start w-full",
                      pathname === authNavItems.login.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Link href={authNavItems.login.href}>
                      <authNavItems.login.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {t(authNavItems.login.labelKey)}
                      </span>
                    </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === authNavItems.signup.href}
                    tooltip={t(authNavItems.signup.labelKey)}
                    className={cn(
                      "justify-start w-full",
                      pathname === authNavItems.signup.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Link href={authNavItems.signup.href}>
                      <authNavItems.signup.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {t(authNavItems.signup.labelKey)}
                      </span>
                    </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : null
        )}
      </div>
    </SidebarMenu>
    {currentUser && (
      <SupportFormDialog
        open={isSupportDialogOpen}
        onOpenChange={setIsSupportDialogOpen}
        userEmail={currentUser.email || "N/A"}
      />
    )}
    </>
  );
}
