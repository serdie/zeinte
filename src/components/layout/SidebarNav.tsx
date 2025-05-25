
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, UploadCloud, Settings, User, Users, Home, LogIn, LogOut, UserPlus } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button'; // For logout button
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home, public: true },
  { href: '/dashboard', label: 'Panel de Estudio', icon: BookOpenText, protected: true },
  { href: '/upload', label: 'Subir Documentos', icon: UploadCloud, protected: true },
  { href: '/configure', label: 'Configura tu examen', icon: Settings, protected: true },
  { href: '/community', label: 'Comunidad', icon: Users, protected: true },
  { href: '/profile', label: 'Mi Perfil', icon: User, protected: true },
];

const authNavItems = {
  login: { href: '/login', label: 'Iniciar Sesión', icon: LogIn },
  signup: { href: '/signup', label: 'Registrarse', icon: UserPlus },
};

export default function SidebarNav() {
  const pathname = usePathname();
  const { currentUser, logout, loading, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    const result = await logout();
    if (typeof result === 'string') {
      toast({ title: "Error al Cerrar Sesión", description: result, variant: "destructive" });
    } else {
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente.", variant: "default" });
      // Router will redirect via AuthContext
    }
  };

  return (
    <SidebarMenu className="flex flex-col justify-between h-full p-2 space-y-2">
      <div className="space-y-1">
        {navItems.map((item) => {
          if (item.protected && !currentUser && isFirebaseConfigured) return null; // Hide protected routes if not logged in (and Firebase is configured)
          // If Firebase is not configured, show all main routes, but they will redirect to login which will show config error
          return (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className={cn(
                    "justify-start w-full",
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
          )
        })}
      </div>

      <div className="mt-auto space-y-1">
         <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
          {loading && <p className="text-xs text-sidebar-foreground/70">Cargando usuario...</p>}
          {!loading && currentUser && (
            <p className="text-xs text-sidebar-foreground/70 truncate" title={currentUser.email || "Usuario"}>
              {currentUser.email || "Usuario Conectado"}
            </p>
          )}
          {!isFirebaseConfigured && <p className="text-xs text-destructive">Firebase no configurado</p>}
        </div>
        {currentUser && isFirebaseConfigured ? (
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Cerrar Sesión"
              className="justify-start w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              disabled={loading || !isFirebaseConfigured}
            >
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">
                Cerrar Sesión
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
                  tooltip={authNavItems.login.label}
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
                      {authNavItems.login.label}
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
                  tooltip={authNavItems.signup.label}
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
                      {authNavItems.signup.label}
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
