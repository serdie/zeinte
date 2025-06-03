
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
const PAYMENT_PATH_PREFIX = '/payment'; // Added payment prefix
const PROTECTED_PATHS = [
  '/dashboard', 
  '/upload', 
  '/configure', 
  '/community', 
  '/profile', 
  '/pricing', 
  '/account/subscription'
];


export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading, isFirebaseConfigured, isAdmin } = useAuth();

  useEffect(() => {
    if (loading || !isFirebaseConfigured) { 
      return;
    }

    const isEmailUser = currentUser?.providerData.some(p => p.providerId === 'password');
    const isGeneralProtectedRoute = PROTECTED_PATHS.includes(pathname) || 
                                    pathname.startsWith(CUSTOM_COURSES_PATH_PREFIX) ||
                                    pathname.startsWith(PAYMENT_PATH_PREFIX); // Added payment path check


    if (currentUser) {
      if (isEmailUser && !currentUser.emailVerified && pathname !== '/verify-email') {
        // If user is email-based, not verified, and not on verify-email page, redirect them there.
        // This is especially important if they try to access a protected route.
        if (isGeneralProtectedRoute || pathname.startsWith(ADMIN_PATH_PREFIX)) { 
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
      
      // Authenticated user trying to access login/signup
      if ((pathname === '/login' || pathname === '/signup') && (currentUser.emailVerified || !isEmailUser)) {
        router.push('/dashboard');
        return;
      }
    } else {
      // If no user and the route is protected (general or admin), redirect to login
      if (isGeneralProtectedRoute || pathname.startsWith(ADMIN_PATH_PREFIX)) {
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
  
  const isAppRoute = (
    PROTECTED_PATHS.includes(pathname) || 
    pathname.startsWith(ADMIN_PATH_PREFIX) || 
    pathname.startsWith(CUSTOM_COURSES_PATH_PREFIX) ||
    pathname.startsWith(PAYMENT_PATH_PREFIX) // Added payment path check
  );


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
