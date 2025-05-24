
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, UploadCloud, Settings, User, Users, LogIn, LogOut, UserPlus } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '../ui/button'; // For logout button

const navItems = [
  { href: '/', label: 'Panel de Estudio', icon: BookOpenText, authRequired: false },
  { href: '/upload', label: 'Subir Documentos', icon: UploadCloud, authRequired: false }, // Consider if this should be authRequired
  { href: '/configure', label: 'Configura tu examen', icon: Settings, authRequired: false }, // Consider if this should be authRequired
  { href: '/community', label: 'Comunidad', icon: Users, authRequired: true },
  { href: '/profile', label: 'Mi Perfil', icon: User, authRequired: true },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { currentUser, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Router will redirect via AuthContext effect or page-level check
  };

  if (loading) {
    // Optional: show a loading state for the sidebar nav
    return (
      <SidebarMenu>
        {[...Array(5)].map((_, i) => (
            <SidebarMenuItem key={i} className="p-2">
                 <div className="h-8 w-full bg-sidebar-accent/20 animate-pulse rounded-md"></div>
            </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu className="flex flex-col justify-between h-full">
      <div>
        {navItems.map((item) => {
          if (item.authRequired && !currentUser) {
            return null; // Don't show auth-required items if not logged in
          }
          return (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className={cn(
                    "justify-start",
                    pathname === item.href 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <a>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.label}
                    </span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        })}
      </div>

      <div className="p-2 mt-auto">
        {currentUser ? (
          <>
            <div className="p-2 text-xs text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden truncate">
              {currentUser.email}
            </div>
            <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={handleLogout}
                    tooltip="Cerrar Sesión"
                    className="justify-start w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                    Cerrar Sesión
                    </span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </>
        ) : (
          <>
            <SidebarMenuItem>
              <Link href="/login" passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/login"}
                  tooltip="Iniciar Sesión"
                  className="justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <a>
                    <LogIn className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Iniciar Sesión
                    </span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/signup" passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/signup"}
                  tooltip="Registrarse"
                  className="justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <a>
                    <UserPlus className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Registrarse
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
