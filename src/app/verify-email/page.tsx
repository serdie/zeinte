// src/app/verify-email/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, MailCheck, AlertTriangle, LogOut, Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';

export default function VerifyEmailPage() {
  const { currentUser, loading, logout, resendVerificationEmail, isFirebaseConfigured, isResendingEmail } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    if (loading || !isFirebaseConfigured) return;

    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === 'google.com')) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, router, isFirebaseConfigured]);

  const handleResendEmail = async () => {
    const result = await resendVerificationEmail();
    // Comprobamos si el mensaje de éxito contiene el email del usuario o una subcadena clave del mensaje de éxito traducido
    if (typeof result === 'string' && (result.includes(currentUser?.email || ' unlikely_string_to_match ') || result.startsWith(t("authContext.resendVerificationSuccess").substring(0,10))  ) ) {
      toast({ title: t("verifyEmailPage.resendSuccessTitle"), description: result, variant: "default", duration: 7000 });
    } else if (typeof result === 'string') {
      toast({ title: t("verifyEmailPage.resendErrorTitle"), description: result, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  const handleCheckVerification = async () => {
    if (currentUser && !currentUser.emailVerified) {
      await currentUser.reload(); 
      // Forzar re-renderizado o una forma de que el useEffect se re-evalue
      // Esto es un poco un hack, idealmente onAuthStateChanged lo capturaría,
      // pero el reload es asíncrono y el estado de currentUser puede no actualizarse inmediatamente para este render.
      // La redirección en useEffect debería funcionar después del reload si el estado se propaga.
      if (auth.currentUser?.emailVerified) { // Comprobar el estado más reciente de Firebase Auth
         toast({ title: t("verifyEmailPage.verificationConfirmedTitle"), description: t("verifyEmailPage.redirectingToDashboard"), variant: "default" });
         router.push('/dashboard'); // Redirigir inmediatamente
      } else {
         toast({ title: t("verifyEmailPage.notYetVerifiedTitle"), description: t("verifyEmailPage.notYetVerifiedDescription"), variant: "default" });
      }
    } else if (currentUser?.emailVerified) {
        router.push('/dashboard');
    }
  };

  const auth = useAuth().currentUser ? firebaseAuthService : null; // Para acceder a auth.currentUser dentro de handleCheckVerification


  if (loading || !isFirebaseConfigured || (!currentUser && !loading) || (currentUser && (currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === 'google.com'))) ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Si currentUser existe pero emailVerified es false y no es de Google
  if (!currentUser || currentUser.providerData.some(p => p.providerId === 'google.com')) {
    // Este caso no debería ocurrir si la lógica de useEffect es correcta,
    // pero es un fallback para evitar renderizar la página si el usuario no debería estar aquí.
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>{t("common.loading")}</p>
        <Loader2 className="ml-2 h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <MailCheck className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">
            {t("verifyEmailPage.title")}
          </CardTitle>
          <CardDescription className="text-base">
            {t("verifyEmailPage.description", { email: currentUser.email || t("verifyEmailPage.yourEmail") })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-3 rounded-md bg-primary/10 text-primary text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{t("verifyEmailPage.spamWarning")}</span>
          </div>

          <Button 
            onClick={handleCheckVerification} 
            className="w-full text-md py-3 bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isResendingEmail || loading}
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            {t("verifyEmailPage.checkVerificationButton")}
          </Button>

          <Button 
            onClick={handleResendEmail} 
            variant="outline" 
            className="w-full text-md py-3"
            disabled={isResendingEmail || loading}
          >
            {isResendingEmail ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
            {t("verifyEmailPage.resendButton")}
          </Button>
          
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground text-center">
            {t("verifyEmailPage.loginAfterVerification")}
          </p>
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="w-full text-muted-foreground hover:text-primary"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("sidebar.logout")}
          </Button>
           <Link href="/dashboard" className="text-sm text-primary hover:underline text-center">
             {t("verifyEmailPage.backToDashboardAttempt")}
           </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
