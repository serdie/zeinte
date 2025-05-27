
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
const ADMIN_PATH_PREFIX = '/admin';
const CUSTOM_COURSES_PATH_PREFIX = '/custom-courses';


export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading, isFirebaseConfigured, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return; 

    if (!isFirebaseConfigured && !PUBLIC_PATHS.includes(pathname) && !pathname.startsWith(ADMIN_PATH_PREFIX) && !pathname.startsWith(CUSTOM_COURSES_PATH_PREFIX)) {
      // No redirect here if firebase not configured to avoid loops on login/signup pages
      return;
    }

    if (pathname.startsWith(ADMIN_PATH_PREFIX) || pathname.startsWith(CUSTOM_COURSES_PATH_PREFIX)) {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      if (!isAdmin) {
        router.push('/dashboard'); 
        return;
      }
    }
    else if (!PUBLIC_PATHS.includes(pathname)) { 
      if (!currentUser) {
        router.push('/login');
      }
    } else if (currentUser && (pathname === '/login' || pathname === '/signup')) {
      router.push('/dashboard');
    }

  }, [pathname, currentUser, loading, router, isFirebaseConfigured, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  const isAppRoute = !PUBLIC_PATHS.includes(pathname) || (currentUser && (pathname === '/login' || pathname === '/signup'));

  if (isAppRoute && !currentUser && !loading) {
     // If still loading or already redirected, this avoids flicker.
     // If not loading and no user for a protected route, show loading/redirect message.
     if (!PUBLIC_PATHS.includes(pathname)) {
        return (
         <div className="flex items-center justify-center min-h-screen bg-background">
           <p>Redirigiendo...</p>
          <Loader2 className="ml-2 h-5 w-5 animate-spin text-primary" />
        </div>
      );
     }
  }


  if (PUBLIC_PATHS.includes(pathname) && !currentUser) {
    return <>{children}</>;
  }

  if (currentUser) {
    if (pathname.startsWith(ADMIN_PATH_PREFIX) || pathname.startsWith(CUSTOM_COURSES_PATH_PREFIX)) {
      if (isAdmin) {
        return <AppLayout>{children}</AppLayout>; 
      } else {
         // This case should be handled by the redirect effect,
         // but as a fallback render nothing or a minimal access denied.
         // For now, rely on redirect.
         return null;
      }
    }
    // For other authenticated routes
    return <AppLayout>{children}</AppLayout>;
  }
  
  // Fallback for non-logged in users trying to access a route that isn't explicitly public
  // but somehow slipped through other checks (should ideally be caught by redirects).
  if (!PUBLIC_PATHS.includes(pathname)) {
    return (
       <div className="flex items-center justify-center min-h-screen bg-background">
         <p>Cargando...</p>
        <Loader2 className="ml-2 h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
