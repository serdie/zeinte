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
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);


  useEffect(() => {
    if (loading || !isFirebaseConfigured) return;

    if (!currentUser) {
      router.push('/login');
      return;
    }
    // If user is from Google or email is verified, redirect to dashboard
    if (currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === 'google.com')) {
      router.push('/dashboard');
    }
    // Otherwise, they should stay on this page if they are an email user and not verified.
  }, [currentUser, loading, router, isFirebaseConfigured]);

  const handleResendEmail = async () => {
    const result = await resendVerificationEmail();
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
      setIsCheckingVerification(true);
      try {
        await currentUser.reload(); // This updates the currentUser object in place
        // The useEffect above should catch the change in currentUser.emailVerified and redirect.
        // For more immediate feedback, we can check here:
        if (currentUser.emailVerified) {
           toast({ title: t("verifyEmailPage.verificationConfirmedTitle"), description: t("verifyEmailPage.redirectingToDashboard"), variant: "default" });
           router.push('/dashboard'); // Redirect immediately
        } else {
           toast({ title: t("verifyEmailPage.notYetVerifiedTitle"), description: t("verifyEmailPage.notYetVerifiedDescription"), variant: "default" });
        }
      } catch (error) {
        console.error("Error during manual verification check:", error);
        toast({ title: t("common.error"), description: "Error checking verification status.", variant: "destructive"});
      } finally {
        setIsCheckingVerification(false);
      }
    } else if (currentUser?.emailVerified) {
        // This case handles if the component renders and currentUser is already verified
        // or if the button is clicked after verification through other means (e.g. another tab)
        router.push('/dashboard');
    }
  };

  // Removed problematic line: const auth = useAuth().currentUser ? firebaseAuthService : null;

  if (loading || !isFirebaseConfigured || (!currentUser && !loading) || (currentUser && (currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === 'google.com'))) ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser || currentUser.providerData.some(p => p.providerId === 'google.com')) {
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
            disabled={isResendingEmail || loading || isCheckingVerification}
          >
            {isCheckingVerification ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" /> }
            {t("verifyEmailPage.checkVerificationButton")}
          </Button>

          <Button 
            onClick={handleResendEmail} 
            variant="outline" 
            className="w-full text-md py-3"
            disabled={isResendingEmail || loading || isCheckingVerification}
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
