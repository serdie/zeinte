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

const PUBLIC_PATHS = ['/', '/login', '/signup', '/verify-email']; // Añadir /verify-email
const ADMIN_PATH_PREFIX = '/admin';
const CUSTOM_COURSES_PATH_PREFIX = '/custom-courses';


export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading, isFirebaseConfigured, isAdmin } = useAuth();

  useEffect(() => {
    if (loading || !isFirebaseConfigured) { // Si está cargando o Firebase no está listo, no hacer nada aún
      return;
    }

    const isEmailUser = currentUser?.providerData.some(p => p.providerId === 'password');

    if (currentUser) {
      // Si el usuario está logueado pero su email no está verificado (y es un usuario de email/pass)
      if (isEmailUser && !currentUser.emailVerified && pathname !== '/verify-email') {
        if (!PUBLIC_PATHS.includes(pathname) || pathname === '/dashboard') { // Proteger dashboard también
           router.push('/verify-email');
           return;
        }
      }
      // Si el email está verificado (o es de Google) y está en verify-email, redirigir al dashboard
      if ((currentUser.emailVerified || !isEmailUser) && pathname === '/verify-email') {
        router.push('/dashboard');
        return;
      }

      // Si es admin y está en una ruta no-admin o no-cursos, puede continuar
      // Si no es admin e intenta acceder a rutas de admin/cursos, redirigir
      if ((pathname.startsWith(ADMIN_PATH_PREFIX) || pathname.startsWith(CUSTOM_COURSES_PATH_PREFIX)) && !isAdmin) {
        router.push('/dashboard');
        return;
      }
      
      // Si está logueado y en login/signup, redirigir al dashboard (si ya está verificado o es de google)
      if ((pathname === '/login' || pathname === '/signup') && (currentUser.emailVerified || !isEmailUser)) {
        router.push('/dashboard');
        return;
      }
    } else {
      // Si no hay usuario y la ruta NO es pública, redirigir a login
      if (!PUBLIC_PATHS.includes(pathname)) {
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
  
  // Determinar si mostrar AppLayout
  // No mostrar AppLayout en páginas públicas si el usuario no está logueado O
  // si el usuario está logueado pero no verificado Y está en la página de verificación.
  const showAppLayout = currentUser && 
                        (currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === 'google.com')) &&
                        !PUBLIC_PATHS.includes(pathname) || 
                        (currentUser && (pathname.startsWith(ADMIN_PATH_PREFIX) || pathname.startsWith(CUSTOM_COURSES_PATH_PREFIX)) && isAdmin) ||
                        (currentUser && pathname === '/dashboard') ||
                        (currentUser && pathname === '/upload') ||
                        (currentUser && pathname === '/configure') ||
                        (currentUser && pathname === '/community') ||
                        (currentUser && pathname === '/profile');


  if (showAppLayout) {
     if (!currentUser) { // Doble chequeo por si acaso, debería ser capturado por el useEffect
        return (
         <div className="flex items-center justify-center min-h-screen bg-background">
           <p>Redirigiendo...</p>
          <Loader2 className="ml-2 h-5 w-5 animate-spin text-primary" />
        </div>
      );
     }
    return <AppLayout>{children}</AppLayout>;
  }

  // Para páginas públicas o la página de verificación si el email no está verificado
  return <>{children}</>;
}
