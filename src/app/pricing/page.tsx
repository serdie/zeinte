
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, Sparkles, Star, TrendingUp, Zap, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';

declare global {
  interface Window {
    paypal?: any;
  }
}

const PAYPAL_HOSTED_BUTTON_ID = "TFTJY83J7D78U";
const PAYPAL_CONTAINER_ID = `paypal-container-${PAYPAL_HOSTED_BUTTON_ID}`;

export default function PricingPage() {
  const { currentUser, userTier, updateCurrentUserTier, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { t } = useI18n();
  const [isPayPalButtonRendered, setIsPayPalButtonRendered] = useState(false);

  const handleSubscribePro = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (userTier === 'pro' || userTier === 'admin') {
      toast({ title: t('pricingPage.alreadyProToastTitle'), description: t('pricingPage.alreadyProToastDescription'), variant: "default" });
      router.push('/dashboard');
      return;
    }

    setIsSubscribing(true);
    const result = await updateCurrentUserTier('pro');
    if (typeof result === 'string') {
      toast({ title: t('common.error'), description: result, variant: "destructive" });
    } else {
      toast({
        title: t('pricingPage.subscriptionSuccessToastTitle'),
        description: t('pricingPage.subscriptionSuccessToastDescription'),
        variant: "default",
      });
      router.push('/dashboard');
    }
    setIsSubscribing(false);
  };

  useEffect(() => {
    if (currentUser && userTier !== 'pro' && userTier !== 'admin' && !authLoading) {
      const paypalContainer = document.getElementById(PAYPAL_CONTAINER_ID);

      if (paypalContainer && window.paypal && window.paypal.HostedButtons) {
        if (!isPayPalButtonRendered) {
          // Check if a PayPal button iframe already exists in the container (e.g., due to HMR)
          if (paypalContainer.querySelector('iframe[name^="__paypal_buttons__"]')) {
            console.warn("PayPal button iframe already exists in container, likely due to HMR. Marking as rendered.");
            setIsPayPalButtonRendered(true);
          } else {
            // Container is empty or doesn't have a PayPal button, proceed to render
            paypalContainer.innerHTML = ''; // Ensure it's definitely empty before rendering
            window.paypal.HostedButtons({
              hostedButtonId: PAYPAL_HOSTED_BUTTON_ID,
            }).render(`#${PAYPAL_CONTAINER_ID}`)
            .then(() => {
              setIsPayPalButtonRendered(true);
            })
            .catch((error: any) => {
              console.error("PayPal Hosted Button render() failed:", error);
              toast({
                title: t('common.error'),
                description: t('pricingPage.paypalButtonError'),
                variant: "destructive",
                duration: 7000,
              });
              if (paypalContainer) {
                  paypalContainer.innerHTML = `<p class="text-xs text-destructive">${t('pricingPage.paypalButtonError')}</p>`;
              }
            });
          }
        }
      }
    }
  }, [currentUser, userTier, authLoading, isPayPalButtonRendered, toast, t]);


  return (
    <div className="container mx-auto py-12 px-4">
      <section className="text-center mb-12">
        <Star className="h-16 w-16 text-accent mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-accent mb-4">{t('pricingPage.mainTitle')}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('pricingPage.mainSubtitle')}
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan Card (Informational) */}
        <Card className="shadow-lg flex flex-col bg-card border">
          <CardHeader className="text-center pb-4">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl text-primary">{t('pricingPage.freePlanTitle')}</CardTitle>
            <CardDescription className="text-base">{t('pricingPage.freePlanDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-3">
            <p className="text-3xl font-bold text-center text-primary mb-3">{t('pricingPage.freePlanPrice')}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />{t('homePage.freeTrialFeature1')}</li>
              <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />{t('homePage.freeTrialFeature2')}</li>
              <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />{t('homePage.freeTrialFeature3')}</li>
              <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />{t('homePage.freeTrialFeature4')}</li>
            </ul>
          </CardContent>
          <CardFooter className="mt-auto">
            {currentUser && (userTier === 'free' || userTier === null) ? (
              <Button size="lg" variant="outline" className="w-full text-primary border-primary hover:bg-primary/10 py-3 text-md" disabled>
                {t('pricingPage.currentPlanButton')}
              </Button>
            ) : currentUser && (userTier === 'pro' || userTier === 'admin') ? (
               <Button size="lg" variant="outline" className="w-full text-primary border-primary hover:bg-primary/10 py-3 text-md" disabled>
                {userTier === 'pro' ? t('pricingPage.currentPlanButton') : t('pricingPage.adminPlanButton')}
              </Button>
            ) : (
              <Link href="/signup" passHref className="w-full">
                <Button size="lg" variant="outline" className="w-full text-primary border-primary hover:bg-primary/10 py-3 text-md">
                  {t('homePage.startFreeTrialButton')}
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>

        {/* Pro Plan Card (Actionable) */}
        <Card className="shadow-xl flex flex-col bg-card border-2 border-accent relative overflow-hidden">
           <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
             {t('homePage.proPlanRecommended')}
           </div>
          <CardHeader className="text-center pb-4">
            <Star className="h-12 w-12 text-accent mx-auto mb-4" />
            <CardTitle className="text-2xl text-accent">{t('homePage.proPlanTitle')}</CardTitle>
            <CardDescription className="text-base">{t('homePage.proPlanDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-3">
            <p className="text-3xl font-bold text-center text-accent mb-3">
              {t('homePage.proPlanPrice')}
              <span className="text-sm font-normal text-muted-foreground">{t('homePage.proPlanPriceSuffix')}</span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center"><TrendingUp className="h-5 w-5 text-green-500 mr-2" />{t('homePage.proPlanFeature1')}</li>
              <li className="flex items-center"><TrendingUp className="h-5 w-5 text-green-500 mr-2" />{t('homePage.proPlanFeature2')}</li>
              <li className="flex items-center"><TrendingUp className="h-5 w-5 text-green-500 mr-2" />{t('homePage.proPlanFeature3')}</li>
              <li className="flex items-center"><TrendingUp className="h-5 w-5 text-green-500 mr-2" />{t('homePage.proPlanFeature4')}</li>
              <li className="flex items-center"><TrendingUp className="h-5 w-5 text-green-500 mr-2" />{t('homePage.proPlanFeature5')}</li>
              <li className="flex items-center"><TrendingUp className="h-5 w-5 text-green-500 mr-2" />{t('homePage.proPlanFeature6')}</li>
            </ul>
          </CardContent>
          <CardFooter className="mt-auto">
            {currentUser && (userTier === 'pro' || userTier === 'admin') ? (
              <Button size="lg" className="w-full bg-accent/70 py-3 text-md" disabled>
                <ShieldCheck className="mr-2 h-5 w-5" /> {t('pricingPage.alreadySubscribedButton')}
              </Button>
            ) : (
              <div className="w-full space-y-4">
                {/* Simulated Upgrade Button (kept for local testing if needed) */}
                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-md"
                  onClick={handleSubscribePro}
                  disabled={isSubscribing || authLoading || !currentUser}
                >
                  {isSubscribing ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  {t('pricingPage.subscribeProButtonAction')}
                </Button>

                {/* PayPal Hosted Button Container */}
                {currentUser && !authLoading && userTier !== 'pro' && userTier !== 'admin' && (
                  <div id={PAYPAL_CONTAINER_ID} className="w-full flex justify-center min-h-[50px]">
                    {/* PayPal button will render here by the SDK */}
                    {!isPayPalButtonRendered && ( 
                       <div className="flex items-center justify-center text-sm text-muted-foreground p-2">
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('pricingPage.loadingPayPalButton')}
                       </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-muted-foreground">
          {t('pricingPage.paymentGatewayComingSoon')}
        </p>
        <Link href="/dashboard" passHref>
          <Button variant="ghost" className="mt-4 text-primary hover:text-primary/80">
            <ArrowRight className="mr-2 h-4 w-4" /> {t('pricingPage.backToDashboardButton')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
