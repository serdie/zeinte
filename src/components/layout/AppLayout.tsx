
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

interface AppLayoutProps {
  children: React.ReactNode;
}

const getHeaderTitle = (pathname: string): string => {
  if (pathname === '/') return "Bienvenido a AdivinaExamen";
  if (pathname.startsWith('/dashboard')) return "Panel de Estudio";
  if (pathname.startsWith('/upload')) return "Subir Documentos";
  if (pathname.startsWith('/configure')) return "Configuración de Examen";
  if (pathname.startsWith('/community')) return "Comunidad de Estudio";
  if (pathname.startsWith('/profile')) return "Mi Perfil";
  return "AdivinaExamen";
};

export default function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const headerTitle = getHeaderTitle(pathname);

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
          {/* Placeholder for potential future elements in header */}
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
