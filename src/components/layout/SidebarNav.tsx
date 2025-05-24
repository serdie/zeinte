
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, UploadCloud, Settings, User, Users } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Panel de Estudio', icon: BookOpenText },
  { href: '/upload', label: 'Subir Documentos', icon: UploadCloud },
  { href: '/configure', label: 'Configura tu examen', icon: Settings },
  { href: '/community', label: 'Comunidad', icon: Users },
  { href: '/profile', label: 'Mi Perfil', icon: User },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="flex flex-col justify-between h-full">
      <div>
        {navItems.map((item) => (
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
          ))}
      </div>
      {/* Placeholder for potential future elements like login/logout, if re-added */}
    </SidebarMenu>
  );
}
