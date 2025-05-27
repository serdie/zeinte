
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, UploadCloud, Settings, User, Users, Home, LogIn, LogOut, UserPlus, ShieldCheck, Lightbulb } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext'; 

export default function SidebarNav() {
  const pathname = usePathname();
  const { currentUser, logout, loading, isFirebaseConfigured, isAdmin } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n(); 

  const navItems = [
    { href: '/', labelKey: 'sidebar.home', icon: Home, public: true },
    { href: '/dashboard', labelKey: 'sidebar.dashboard', icon: BookOpenText, protected: true },
    { href: '/upload', labelKey: 'sidebar.upload', icon: UploadCloud, protected: true },
    { href: '/configure', labelKey: 'sidebar.configureExam', icon: Settings, protected: true },
    { href: '/community', labelKey: 'sidebar.community', icon: Users, protected: true },
    { href: '/custom-courses/create', labelKey: 'sidebar.createCourse', icon: Lightbulb, protected: true }, // Removed adminOnly: true
    { href: '/profile', labelKey: 'sidebar.profile', icon: User, protected: true },
  ];

  const adminNavItem = { href: '/admin', labelKey: 'sidebar.adminPanel', icon: ShieldCheck };

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
      // Router will redirect via ConditionalLayout or AuthContext effect
    }
  };

  return (
    <SidebarMenu className="flex flex-col justify-between h-full p-2 space-y-2">
      <div className="space-y-1">
        {navItems.map((item) => {
          if (item.protected && isFirebaseConfigured && !currentUser) return null;
          // Removed item.adminOnly check for custom courses
          
          const label = t(item.labelKey);
          return (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href === '/custom-courses/create' && pathname.startsWith('/custom-courses'))}
                  tooltip={label}
                  className={cn(
                    "justify-start w-full",
                    (pathname === item.href || (item.href === '/custom-courses/create' && pathname.startsWith('/custom-courses')))
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <a>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {label}
                    </span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        })}
        {isAdmin && currentUser && isFirebaseConfigured && (
          <SidebarMenuItem key={adminNavItem.href}>
            <Link href={adminNavItem.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(adminNavItem.href)}
                tooltip={t(adminNavItem.labelKey)}
                className={cn(
                  "justify-start w-full",
                  pathname.startsWith(adminNavItem.href) 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <a>
                  <adminNavItem.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {t(adminNavItem.labelKey)}
                  </span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        )}
      </div>

      <div className="mt-auto space-y-1">
         <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
          {loading && <p className="text-xs text-sidebar-foreground/70">{t('sidebar.userLoading')}</p>}
          {!loading && currentUser && (
            <p className="text-xs text-sidebar-foreground/70 truncate" title={currentUser.email || t('sidebar.userConnected')}>
              {currentUser.email || t('sidebar.userConnected')}
              {isAdmin && <span className="text-accent ml-1">(Admin)</span>}
            </p>
          )}
          {!isFirebaseConfigured && !loading && <p className="text-xs text-destructive">{t('sidebar.firebaseNotConfigured')}</p>}
        </div>
        {currentUser && isFirebaseConfigured ? (
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
        ) : !loading && isFirebaseConfigured && (
          <>
            <SidebarMenuItem>
              <Link href={authNavItems.login.href} passHref legacyBehavior>
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
                  <a>
                    <authNavItems.login.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {t(authNavItems.login.labelKey)}
                    </span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={authNavItems.signup.href} passHref legacyBehavior>
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
                  <a>
                    <authNavItems.signup.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {t(authNavItems.signup.labelKey)}
                    </span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </>
        )}
      </div>
    </SidebarMenu>
  );
}
