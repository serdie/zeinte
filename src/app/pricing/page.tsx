
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, Sparkles, Star, TrendingUp, Zap, Loader2, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/contexts/I18nContext';

declare global {
  interface Window {
    paypal?: any;
  }
}

const PAYPAL_HOSTED_BUTTON_ID = "TFTJY83J7D78U";
// Dynamically create container ID to ensure it's unique if component instance changes
const PAYPAL_CONTAINER_ID_BASE = "paypal-container-";


export default function PricingPage() {
  const { currentUser, userTier, updateCurrentUserTier, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { t } = useI18n();
  const [isPayPalButtonRendered, setIsPayPalButtonRendered] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  // Generate a unique ID for the PayPal container for this component instance
  const PAYPAL_CONTAINER_ID = PAYPAL_CONTAINER_ID_BASE + PAYPAL_HOSTED_BUTTON_ID;


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
    const container = paypalContainerRef.current;
    let isMounted = true;

    // Condition 1: SDK and container must be ready
    if (!container || !window.paypal || !window.paypal.HostedButtons) {
      // If SDK not ready, ensure button is marked as not rendered and clear container
      if (container && container.innerHTML !== '') container.innerHTML = '';
      if (isPayPalButtonRendered && isMounted) setIsPayPalButtonRendered(false);
      return;
    }

    // Condition 2: User must be eligible to see the button
    const shouldRenderPayPalButton = currentUser && userTier !== 'pro' && userTier !== 'admin' && !authLoading;

    if (shouldRenderPayPalButton) {
      const buttonAlreadyInDOM = container.querySelector('iframe[name^="__paypal_buttons__"]');

      if (!buttonAlreadyInDOM) {
        // If button is not in DOM, and we think it's rendered (isPayPalButtonRendered is true), reset state.
        if (isPayPalButtonRendered && isMounted) setIsPayPalButtonRendered(false);
        
        container.innerHTML = ''; // Clear any previous error messages or stale content
        
        // Set a temporary loading message if not already rendered
        if (!isPayPalButtonRendered) {
             container.innerHTML = `<div class="flex items-center justify-center text-sm text-muted-foreground p-2"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>${t('pricingPage.loadingPayPalButton')}</div>`;
        }

        window.paypal.HostedButtons({
          hostedButtonId: PAYPAL_HOSTED_BUTTON_ID,
        }).render(`#${PAYPAL_CONTAINER_ID}`)
        .then(() => {
          if (isMounted) {
            // Check again if container still exists before removing loading message
            if (paypalContainerRef.current && paypalContainerRef.current.id === PAYPAL_CONTAINER_ID) {
                // The SDK might replace the content, so we don't need to clear it if successful.
                // If the loading message was inside, SDK's render will overwrite it.
            }
            setIsPayPalButtonRendered(true);
          }
        })
        .catch((error: any) => {
          console.error("PayPal Hosted Button render() failed:", error);
          if (isMounted) {
            toast({
              title: t('common.error'),
              description: t('pricingPage.paypalButtonError'),
              variant: "destructive",
              duration: 7000,
            });
            if (paypalContainerRef.current && paypalContainerRef.current.id === PAYPAL_CONTAINER_ID) { 
                paypalContainerRef.current.innerHTML = `<p class="text-xs text-center text-destructive py-2">${t('pricingPage.paypalButtonError')}</p>`;
            }
            setIsPayPalButtonRendered(false);
          }
        });
      } else if (buttonAlreadyInDOM && !isPayPalButtonRendered) {
        // Button is in DOM (e.g. HMR) but state doesn't reflect it. Sync state.
        if (isMounted) setIsPayPalButtonRendered(true);
      }
    } else {
      // Conditions to render are NOT met (e.g., user is pro, logged out, or auth loading)
      if (container.innerHTML !== '') {
        container.innerHTML = ''; // Clear the PayPal button or error message
      }
      if (isPayPalButtonRendered && isMounted) setIsPayPalButtonRendered(false);
    }

    return () => {
      isMounted = false;
      // Cleanup on unmount. If PayPal rendered something, clear the container.
      // This helps prevent React errors if it tries to operate on a container
      // with externally modified children.
      if (paypalContainerRef.current) {
         paypalContainerRef.current.innerHTML = '';
      }
    };
  // Dependencies that trigger re-evaluation of whether to render the button.
  // isPayPalButtonRendered is intentionally omitted to prevent loops on render failure.
  // PAYPAL_CONTAINER_ID and PAYPAL_HOSTED_BUTTON_ID are constants.
  }, [currentUser, userTier, authLoading, toast, t, PAYPAL_CONTAINER_ID]);


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
                {/* Simulated Upgrade Button (Kept for testing tier changes directly) */}
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
                <div ref={paypalContainerRef} id={PAYPAL_CONTAINER_ID} className="w-full flex justify-center min-h-[50px]">
                  {/* PayPal button will render here by the SDK via useEffect.
                      A loading message or placeholder can be shown if !isPayPalButtonRendered
                      and shouldRenderPayPalButton is true.
                      The useEffect now handles inserting a loading message.
                   */}
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-muted-foreground">
          {t('pricingPage.paymentGatewayComingSoon')} {/* This message might be outdated now with real PayPal button */}
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

