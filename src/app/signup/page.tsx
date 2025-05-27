// src/app/signup/page.tsx
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Mail, AlertTriangle, Info } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { signUpWithEmail, signInWithGoogle, currentUser, loading: authLoading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    if (!authLoading && currentUser) {
      // Si el usuario ya está verificado, va al dashboard, sino a verify-email
      if (currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === 'google.com')) {
        router.push('/dashboard');
      } else {
        router.push('/verify-email');
      }
    }
  }, [currentUser, authLoading, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isFirebaseConfigured) {
      toast({ title: t("configIncompleteToastTitle"), description: t("configIncompleteToastDescription"), variant: "destructive", duration: 7000 });
      return;
    }
    if (password !== confirmPassword) {
      setAuthError(t("signupPage.passwordsDoNotMatchError"));
      toast({ title: t("signupPage.signupErrorToastTitle"), description: t("signupPage.passwordsDoNotMatchError"), variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    const result = await signUpWithEmail(email, password);
    if (typeof result === 'string') {
      setAuthError(result);
      toast({ title: t("signupPage.signupErrorToastTitle"), description: result, variant: "destructive" });
    } else {
      // El usuario (result) ha sido creado, y sendEmailVerification fue llamado.
      // El estado de currentUser en useAuth se actualizará por onAuthStateChanged.
      toast({ title: t("signupPage.signupSuccessToastTitle"), description: t("signupPage.signupSuccessEmailVerificationToastDescription", { email: email }), variant: "default", duration: 7000 });
      router.push('/verify-email'); // Redirigir a la página de verificación
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
     if (!isFirebaseConfigured) {
      toast({ title: t("configIncompleteToastTitle"), description: t("configIncompleteToastDescription"), variant: "destructive", duration: 7000 });
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    const result = await signInWithGoogle();
    if (typeof result === 'string') {
      setAuthError(result);
       toast({ title: t("signupPage.googleErrorToastTitle"), description: result, variant: "destructive" });
    } else {
      // onAuthStateChanged manejará la redirección o el estado del usuario.
      // No es necesario mostrar un toast aquí ya que onAuthStateChanged podría redirigir antes.
      // La lógica de redirección en useEffect se encargará.
      // router.push('/dashboard'); // No es necesario, useEffect lo hará
    }
    setIsLoading(false);
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  // No redirigir desde aquí si currentUser existe, dejar que useEffect maneje la lógica.
  // if (!authLoading && currentUser) {
  //    return <div className="flex items-center justify-center min-h-screen"><p>{t("signupPage.redirecting")}</p><Loader2 className="ml-2 h-5 w-5 animate-spin text-primary" /></div>;
  // }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
            <UserPlus className="h-8 w-8" />
            {t("signupPage.title")}
          </CardTitle>
          <CardDescription>{t("signupPage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="default" className="bg-primary/10 border-primary/50 text-primary">
            <Info className="h-5 w-5" />
            <AlertTitle>{t("signupPage.betaNoticeTitle")}</AlertTitle>
            <AlertDescription>
              {t("signupPage.betaWelcomeMessage")}
            </AlertDescription>
          </Alert>
          {!isFirebaseConfigured && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{t("signupPage.firebaseNotConfiguredWarning")}</span>
            </div>
          )}
          {authError && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md text-center">{authError}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("signupPage.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("signupPage.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
                disabled={!isFirebaseConfigured || isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("signupPage.passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("signupPage.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base"
                disabled={!isFirebaseConfigured || isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("signupPage.confirmPasswordLabel")}</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder={t("signupPage.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="text-base"
                disabled={!isFirebaseConfigured || isLoading}
              />
            </div>
            <Button type="submit" className="w-full text-lg py-3 bg-primary hover:bg-primary/90" disabled={isLoading || !isFirebaseConfigured}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
              {t("signupPage.signupButton")}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t("signupPage.signupWith")}
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full text-md py-3" onClick={handleGoogleSignIn} disabled={isLoading || !isFirebaseConfigured}>
             {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <svg className="mr-2 h-5 w-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.03-4.66 2.03-3.86 0-6.99-3.11-6.99-7.11s3.13-7.11 6.99-7.11c1.73 0 3.25.59 4.52 1.78l2.48-2.48C17.46.89 15.21 0 12.48 0 5.88 0 0 5.56 0 12.48s5.88 12.48 12.48 12.48c7.02 0 12.24-4.82 12.24-12.72 0-.79-.08-1.54-.2-2.32H12.48z" fill="currentColor"/></svg> }
            {t("signupPage.googleButton")}
          </Button>
        </CardContent>
        <CardFooter className="text-center block">
          <p className="text-sm text-muted-foreground">
            {t("signupPage.hasAccount")}{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t("signupPage.loginHere")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
