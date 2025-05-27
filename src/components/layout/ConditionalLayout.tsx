
// src/components/layout/ConditionalLayout.tsx
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

const PUBLIC_PATHS = ['/', '/login', '/signup', '/verify-email'];
const ADMIN_PATH_PREFIX = '/admin';
const CUSTOM_COURSES_PATH_PREFIX = '/custom-courses';


export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading, isFirebaseConfigured, isAdmin } = useAuth();

  useEffect(() => {
    if (loading || !isFirebaseConfigured) { 
      return;
    }

    const isEmailUser = currentUser?.providerData.some(p => p.providerId === 'password');

    if (currentUser) {
      if (isEmailUser && !currentUser.emailVerified && pathname !== '/verify-email') {
        if (!PUBLIC_PATHS.includes(pathname) || pathname === '/dashboard') { 
           router.push('/verify-email');
           return;
        }
      }
      if ((currentUser.emailVerified || !isEmailUser) && pathname === '/verify-email') {
        router.push('/dashboard');
        return;
      }

      // Admin-specific routes
      if (pathname.startsWith(ADMIN_PATH_PREFIX) && !isAdmin) {
        router.push('/dashboard'); 
        return;
      }
      
      // Authenticated user routes (custom courses now available to all authenticated users)
      if (pathname.startsWith(CUSTOM_COURSES_PATH_PREFIX) && !currentUser) {
        router.push('/login');
        return;
      }
      
      if ((pathname === '/login' || pathname === '/signup') && (currentUser.emailVerified || !isEmailUser)) {
        router.push('/dashboard');
        return;
      }
    } else {
      // If no user and the route is not public, redirect to login
      // Also protect custom courses if no user
      if (!PUBLIC_PATHS.includes(pathname) || pathname.startsWith(CUSTOM_COURSES_PATH_PREFIX)) {
        router.push('/login');
        return;
      }
    }

  }, [pathname, currentUser, loading, router, isFirebaseConfigured, isAdmin]);

  if (loading || (!isFirebaseConfigured && !PUBLIC_PATHS.includes(pathname))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  const isAppRoute = !PUBLIC_PATHS.includes(pathname) || 
                     (currentUser && (pathname.startsWith(ADMIN_PATH_PREFIX) || pathname.startsWith(CUSTOM_COURSES_PATH_PREFIX) || 
                                       ['/dashboard', '/upload', '/configure', '/community', '/profile'].includes(pathname)));

  const showAppLayout = currentUser && 
                        (currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === 'google.com')) &&
                        isAppRoute;

  if (showAppLayout) {
     if (!currentUser) { 
        return (
         <div className="flex items-center justify-center min-h-screen bg-background">
           <p>Redirigiendo...</p>
          <Loader2 className="ml-2 h-5 w-5 animate-spin text-primary" />
        </div>
      );
     }
    return <AppLayout>{children}</AppLayout>;
  }

  return <>{children}</>;
}
