// src/components/layout/ConditionalLayout.tsx
"use client";

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ['/', '/login', '/signup', '/verify-email'];
const ADMIN_PATH_PREFIX = '/admin';
const CUSTOM_COURSES_PATH_PREFIX = '/custom-courses';
const PAYMENT_PATH_PREFIX = '/payment';
const LEGAL_PATH_PREFIX = '/legal';
const HISTORY_PATH_PREFIX = '/history'; // Added for consistency
const PROFILE_PATH = '/profile';
const PROTECTED_PATHS = [
  '/dashboard',
  '/upload',
  '/configure',
  '/community',
  // '/history', // Replaced with startsWith check
  PROFILE_PATH,
  '/pricing',
  '/account/subscription',
  '/exam/result'
];


export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname(); // Corrected: usePathname() directly returns the string.
  const router = useRouter();
  const { currentUser, userProfileData, loading, isFirebaseConfigured, isAdmin } = useAuth(); // Get userProfileData
  const { toast } = useToast();
  const { t } = useI18n();
  const [interestPromptShown, setInterestPromptShown] = useState(false);


  useEffect(() => {
    if (loading || !isFirebaseConfigured) {
      return;
    }

    const isEmailUser = currentUser?.providerData.some(p => p.providerId === 'password');
    const isGeneralProtectedRoute = PROTECTED_PATHS.includes(pathname) ||
                                    pathname.startsWith(CUSTOM_COURSES_PATH_PREFIX) ||
                                    pathname.startsWith(PAYMENT_PATH_PREFIX) ||
                                    pathname.startsWith(HISTORY_PATH_PREFIX) ||
                                    pathname.startsWith(LEGAL_PATH_PREFIX);


    if (currentUser && userProfileData) { // Ensure userProfileData is loaded
      if (isEmailUser && !currentUser.emailVerified && pathname !== '/verify-email') {
        if (isGeneralProtectedRoute || pathname.startsWith(ADMIN_PATH_PREFIX)) {
           router.push('/verify-email');
           return;
        }
      }
      if ((currentUser.emailVerified || !isEmailUser) && pathname === '/verify-email') {
        router.push('/dashboard');
        return;
      }

      // Check for primary interest configuration
      if (!userProfileData.primaryInterest && pathname !== PROFILE_PATH && !pathname.startsWith(LEGAL_PATH_PREFIX) && !interestPromptShown) {
        toast({
          title: t('conditionalLayout.interestSetupTitle'),
          description: t('conditionalLayout.interestSetupDescription'),
          variant: "default",
          duration: 8000, // Longer duration for user to read
        });
        setInterestPromptShown(true); // Ensure toast is shown only once per session load
        router.push(PROFILE_PATH);
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
    } else if (!currentUser) { // No user
      // If no user and the route is protected (general or admin), redirect to login
      if (isGeneralProtectedRoute || pathname.startsWith(ADMIN_PATH_PREFIX) || pathname === PROFILE_PATH) {
        // Exception for legal pages, which should be public
        if (!pathname.startsWith(LEGAL_PATH_PREFIX)) {
          router.push('/login');
          return;
        }
      }
    }

  }, [pathname, currentUser, userProfileData, loading, router, isFirebaseConfigured, isAdmin, toast, t, interestPromptShown]);

  if (loading || (!isFirebaseConfigured && !PUBLIC_PATHS.includes(pathname) && !pathname.startsWith(LEGAL_PATH_PREFIX))) {
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
    pathname.startsWith(PAYMENT_PATH_PREFIX) ||
    pathname.startsWith(HISTORY_PATH_PREFIX) ||
    pathname.startsWith(LEGAL_PATH_PREFIX)
  );
  
  const isPublicLegalPage = pathname.startsWith(LEGAL_PATH_PREFIX) && !currentUser;


  // Modified showAppLayout condition
  const showAppLayout = currentUser &&
                        userProfileData && // Profile data must exist
                        (currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === 'google.com')) &&
                        isAppRoute;
                        
  if (isPublicLegalPage) {
    return <>{children}</>;
  }


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
