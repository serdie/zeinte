
"use client";

import { usePathname, useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ['/', '/login', '/signup'];

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading, isFirebaseConfigured } = useAuth();

  useEffect(() => {
    if (!loading && !isFirebaseConfigured && !PUBLIC_PATHS.includes(pathname)) {
      // If Firebase isn't configured and user tries to access a protected page,
      // it's better to keep them on a page that informs about the config issue,
      // or redirect to home. For now, we rely on login/signup pages showing the error.
      // If they somehow land on a protected path, redirecting to login is one option.
      // router.push('/login'); // Or show a global "config error" page
      return;
    }

    if (!loading && !currentUser && !PUBLIC_PATHS.includes(pathname)) {
      router.push('/login');
    } else if (!loading && currentUser && (pathname === '/login' || pathname === '/signup')) {
      router.push('/dashboard');
    }
  }, [pathname, currentUser, loading, router, isFirebaseConfigured]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  if (!currentUser) {
    // This case should ideally be caught by the useEffect redirect,
    // but as a fallback, show loading or a minimal message.
    return (
       <div className="flex items-center justify-center min-h-screen bg-background">
         <p>Redirigiendo a inicio de sesión...</p>
        <Loader2 className="ml-2 h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
