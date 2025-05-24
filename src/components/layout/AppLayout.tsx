
"use client";

import type React from 'react';
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
import { Brain, User as UserIcon, LogIn, LogOut } from 'lucide-react'; // Added UserIcon, LogIn, LogOut
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Button } from '@/components/ui/button'; // For logout button
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'; // For user avatar

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const { currentUser, logout, loading } = useAuth(); // Get auth state

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  const headerTitle = "Panel de Estudio"; // Default title, can be dynamic later

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
           {/* Auth related content moved to SidebarNav for better structure */}
          <p className="text-xs text-sidebar-foreground/70">
            © {new Date().getFullYear()} AdivinaExamen
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
              {/* This title could be dynamic based on the current page */}
              {headerTitle}
            </h2>
          </div>
          
          {/* User Avatar / Login Button in Header */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded-md"></div>
            ) : currentUser ? (
              <Link href="/profile" passHref>
                <Avatar className="h-9 w-9 cursor-pointer border border-primary/50 hover:opacity-80 transition-opacity">
                  {currentUser.photoURL ? (
                    <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName || "User"} data-ai-hint="user avatar"/>
                  ) : (
                     <AvatarImage src="https://placehold.co/36x36.png" alt={currentUser.displayName || "User"} data-ai-hint="user avatar generic" />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(currentUser.displayName || currentUser.email)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link href="/login" passHref>
                <Button variant="outline" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </Button>
              </Link>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
