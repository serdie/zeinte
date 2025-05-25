
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
const ADMIN_PATH = '/admin';

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading, isFirebaseConfigured, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait until auth state is resolved

    if (!isFirebaseConfigured && !PUBLIC_PATHS.includes(pathname) && pathname !== ADMIN_PATH) {
      // If Firebase isn't configured, allow access to public paths and admin (admin will show its own config error).
      // Otherwise, redirect to login which will show the config error.
      // This logic primarily prevents redirect loops if login/signup also try to use Firebase.
      if (!PUBLIC_PATHS.includes(pathname)) {
         // router.push('/login'); // Commented out to let login/signup pages handle their own Firebase status display
      }
      return;
    }

    // Handle admin route
    if (pathname.startsWith(ADMIN_PATH)) {
      if (!currentUser) {
        router.push('/login'); // Must be logged in to check for admin
        return;
      }
      if (!isAdmin) {
        router.push('/dashboard'); // Not an admin, redirect to dashboard
        return;
      }
      // If admin, let them proceed to the admin page
    }
    // Handle public routes and general protected routes
    else if (!PUBLIC_PATHS.includes(pathname)) { // Path is not public, so it's protected
      if (!currentUser) {
        router.push('/login'); // Not logged in, redirect to login
      }
      // If user is logged in, they can access the protected route
    } else if (currentUser && (pathname === '/login' || pathname === '/signup')) {
       // If logged in and trying to access login/signup, redirect to dashboard
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

  // If it's a public path or admin path (which has its own auth check + layout), render children directly
  if (PUBLIC_PATHS.includes(pathname) || (pathname.startsWith(ADMIN_PATH) && isAdmin)) {
    return <>{children}</>;
  }
  
  // If user is not current and path is protected, they should have been redirected.
  // This is a fallback or for when loading is done but redirect hasn't occurred yet.
  if (!currentUser && !PUBLIC_PATHS.includes(pathname)) {
     return (
       <div className="flex items-center justify-center min-h-screen bg-background">
         <p>Redirigiendo...</p>
        <Loader2 className="ml-2 h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  // For all other authenticated routes that are not admin
  return <AppLayout>{children}</AppLayout>;
}
