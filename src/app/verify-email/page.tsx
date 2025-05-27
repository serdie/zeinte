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
  const { currentUser, loading, logout, resendVerificationEmail, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (loading || !isFirebaseConfigured) return;

    if (!currentUser) {
      router.push('/login');
      return;
    }
    // Si el usuario es de Google o ya está verificado, redirigir al dashboard
    if (currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === 'google.com')) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, router, isFirebaseConfigured]);

  const handleResendEmail = async () => {
    setIsResending(true);
    const result = await resendVerificationEmail();
    if (typeof result === 'string' && result.startsWith(t("authContext.resendVerificationSuccess").substring(0,10))) { // Comprobación simple
      toast({ title: t("verifyEmailPage.resendSuccessTitle"), description: result, variant: "default" });
    } else if (typeof result === 'string') {
      toast({ title: t("verifyEmailPage.resendErrorTitle"), description: result, variant: "destructive" });
    }
    setIsResending(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  // Chequeo adicional por si el usuario verifica en otra pestaña y vuelve.
  // Firebase onAuthStateChanged debería eventualmente actualizarlo, pero esto puede forzar una recarga.
  const handleCheckVerification = async () => {
    if (currentUser) {
      await currentUser.reload(); // Recarga el estado del usuario desde Firebase
      // El useEffect se encargará de redirigir si emailVerified es true
      // Forzar una re-evaluación del estado del usuario
      if (currentUser.emailVerified) {
        toast({ title: t("verifyEmailPage.verificationConfirmedTitle"), description: t("verifyEmailPage.redirectingToDashboard"), variant: "default" });
        router.push('/dashboard');
      } else {
        toast({ title: t("verifyEmailPage.notYetVerifiedTitle"), description: t("verifyEmailPage.notYetVerifiedDescription"), variant: "default" });
      }
    }
  };


  if (loading || !currentUser || !isFirebaseConfigured || currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === 'google.com')) {
    // Muestra un loader mientras se redirige o si el estado aún no es el esperado
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
            disabled={isResending}
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            {t("verifyEmailPage.checkVerificationButton")}
          </Button>

          <Button 
            onClick={handleResendEmail} 
            variant="outline" 
            className="w-full text-md py-3"
            disabled={isResending}
          >
            {isResending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
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
