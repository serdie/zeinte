
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, ArrowLeft, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useAuth, ADMIN_EMAIL, FREE_USER_EMAIL } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';

export default function ManageSubscriptionPage() {
  const { currentUser, userTier, updateCurrentUserTier, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    // Redirect if not Pro or Admin (Admin can view but not act on their "subscription" here)
    // Free users trying to access this page will be redirected by ConditionalLayout or here.
    if (!authLoading && currentUser && userTier !== 'pro' && userTier !== 'admin') {
      toast({
        title: t('subscriptionPage.accessDeniedTitle'),
        description: t('subscriptionPage.accessDeniedDescription'),
        variant: "destructive"
      });
      router.push('/pricing');
    }
  }, [currentUser, userTier, authLoading, router, toast, t]);

  const handleCancelSubscription = async () => {
    if (!currentUser || userTier !== 'pro') {
      toast({ title: t('common.error'), description: t('subscriptionPage.notProError'), variant: "destructive" });
      return;
    }

    // Prevent special "pro" user (FREE_USER_EMAIL) from cancelling via this UI
    if (currentUser.email?.toLowerCase() === FREE_USER_EMAIL.toLowerCase()) {
        toast({
            title: t('subscriptionPage.cannotCancelSpecialProTitle'),
            description: t('subscriptionPage.cannotCancelSpecialProDescription'),
            variant: "default",
            duration: 7000,
        });
        return;
    }

    setIsCancelling(true);
    const result = await updateCurrentUserTier('free');
    if (typeof result === 'string') {
      toast({ title: t('common.error'), description: result, variant: "destructive" });
    } else {
      toast({
        title: t('subscriptionPage.cancelSuccessToastTitle'),
        description: t('subscriptionPage.cancelSuccessToastDescription'),
        variant: "default",
      });
      router.push('/dashboard');
    }
    setIsCancelling(false);
  };

  if (authLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const isSpecialUser = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || currentUser.email?.toLowerCase() === FREE_USER_EMAIL.toLowerCase();


  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl text-primary flex items-center gap-2">
            <ShieldCheck className="h-8 w-8" />
            {t('subscriptionPage.title')}
          </CardTitle>
          <CardDescription>
            {t('subscriptionPage.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {userTier === 'pro' && (
            <>
              <Alert variant="default" className="bg-green-500/10 border-green-500/50">
                <Info className="h-5 w-5 text-green-700" />
                <AlertTitle className="text-green-700">{t('subscriptionPage.currentPlanProTitle')}</AlertTitle>
                <AlertDescription className="text-green-700/90">
                  {t('subscriptionPage.currentPlanProDescription')}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                {t('subscriptionPage.cancelProInfo')}
              </p>
              {!isSpecialUser && (
                <Button 
                  variant="destructive" 
                  className="w-full text-lg py-3" 
                  onClick={handleCancelSubscription}
                  disabled={isCancelling || authLoading}
                >
                  {isCancelling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <XCircle className="mr-2 h-5 w-5" />}
                  {t('subscriptionPage.cancelButton')}
                </Button>
              )}
              {isSpecialUser && currentUser.email?.toLowerCase() === FREE_USER_EMAIL.toLowerCase() && (
                 <Alert variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('subscriptionPage.specialProUserTitle')}</AlertTitle>
                    <AlertDescription>{t('subscriptionPage.specialProUserDescription')}</AlertDescription>
                 </Alert>
              )}
            </>
          )}

          {userTier === 'admin' && (
            <Alert variant="default" className="bg-red-500/10 border-red-500/50">
              <Info className="h-5 w-5 text-red-700" />
              <AlertTitle className="text-red-700">{t('subscriptionPage.currentPlanAdminTitle')}</AlertTitle>
              <AlertDescription className="text-red-700/90">
                {t('subscriptionPage.currentPlanAdminDescription')}
              </AlertDescription>
            </Alert>
          )}
          
           {userTier !== 'pro' && userTier !== 'admin' && (
             <Alert variant="destructive">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>{t('subscriptionPage.notProOrAdminTitle')}</AlertTitle>
                <AlertDescription>
                  {t('subscriptionPage.notProOrAdminDescription')}
                  <Link href="/pricing" className="font-semibold underline hover:text-destructive/80 ml-1">
                    {t('subscriptionPage.upgradeHereLink')}
                  </Link>
                </AlertDescription>
             </Alert>
           )}

          <p className="text-xs text-muted-foreground text-center pt-4">
            {t('subscriptionPage.paymentGatewayComingSoon')}
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/dashboard" passHref className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t('subscriptionPage.backToDashboardButton')}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
