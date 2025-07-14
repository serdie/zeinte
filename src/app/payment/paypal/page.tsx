// src/app/payment/paypal/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, ShieldCheck, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

declare global {
  interface Window {
    paypal?: any;
  }
}

const PAYPAL_HOSTED_BUTTON_ID = "TFTJY83J7D78U";
const PAYPAL_CONTAINER_ID = "paypal-container-" + PAYPAL_HOSTED_BUTTON_ID;

export default function PayPalPaymentPage() {
  const { currentUser, userTier, updateCurrentUserTier, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();

  const [isPayPalButtonRendered, setIsPayPalButtonRendered] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      router.push('/login'); // Should be handled by ConditionalLayout, but as a fallback
      return;
    }

    if (userTier === 'pro' || userTier === 'admin') {
      router.push('/dashboard'); // Already subscribed
      return;
    }

    const container = paypalContainerRef.current;
    let isMounted = true;

    if (!container || !window.paypal || !window.paypal.HostedButtons) {
      if (container && container.innerHTML !== '' && !container.querySelector('iframe[name^="__paypal_buttons__"]')) container.innerHTML = `<div class="flex items-center justify-center text-sm text-muted-foreground p-2"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>${t('paymentPage.payPalButtonLoading')}</div>`;
      if (isPayPalButtonRendered && isMounted) setIsPayPalButtonRendered(false);
      return;
    }
    
    const buttonAlreadyInDOM = container.querySelector('iframe[name^="__paypal_buttons__"]');

    if (!buttonAlreadyInDOM) {
      if (isMounted && isPayPalButtonRendered) setIsPayPalButtonRendered(false); // Reset if state is stale

      container.innerHTML = `<div class="flex items-center justify-center text-sm text-muted-foreground p-2"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>${t('paymentPage.payPalButtonLoading')}</div>`;

      window.paypal.HostedButtons({
        hostedButtonId: PAYPAL_HOSTED_BUTTON_ID,
      }).render(`#${PAYPAL_CONTAINER_ID}`)
      .then(() => {
        if (isMounted) {
            if (paypalContainerRef.current && paypalContainerRef.current.id === PAYPAL_CONTAINER_ID) {
                 // SDK might replace the loading message.
            }
            setIsPayPalButtonRendered(true);
        }
      })
      .catch((error: any) => {
        console.error("PayPal Hosted Button render() failed:", error);
        if (isMounted) {
          toast({
            title: t('common.error'),
            description: t('paymentPage.payPalButtonError'),
            variant: "destructive",
            duration: 7000,
          });
          if (paypalContainerRef.current && paypalContainerRef.current.id === PAYPAL_CONTAINER_ID) {
              paypalContainerRef.current.innerHTML = `<p class="text-xs text-center text-destructive py-2">${t('paymentPage.payPalButtonError')}</p>`;
          }
          setIsPayPalButtonRendered(false);
        }
      });
    } else if (buttonAlreadyInDOM && !isPayPalButtonRendered && isMounted) {
        setIsPayPalButtonRendered(true);
    }
    
    return () => {
      isMounted = false;
      if (paypalContainerRef.current) {
         paypalContainerRef.current.innerHTML = '';
      }
    };
  }, [currentUser, userTier, authLoading, router, toast, t, isPayPalButtonRendered]);

  const handleSimulatePayment = async () => {
    if (!currentUser) return;
    setIsSimulating(true);
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
    setIsSimulating(false);
  };

  if (authLoading || (!currentUser && !authLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUser && (userTier === 'pro' || userTier === 'admin')) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <CardTitle>{t('paymentPage.alreadyProTitle')}</CardTitle>
                <CardDescription>{t('paymentPage.alreadyProDescription')}</CardDescription>
            </CardHeader>
            <CardFooter>
                <Link href="/dashboard" className="w-full">
                    <Button className="w-full">{t('paymentPage.goToDashboard')}</Button>
                </Link>
            </CardFooter>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-lg mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary text-center">
            {t('paymentPage.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('paymentPage.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            ref={paypalContainerRef} 
            id={PAYPAL_CONTAINER_ID} 
            className="w-full flex justify-center min-h-[100px] items-center" // Ensure min height for loading state
          >
            {/* PayPal button will render here by the SDK via useEffect. */}
            {/* Initial loading message is handled inside useEffect */}
          </div>

          <Alert variant="default" className="bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('paymentPage.afterPaymentInfo')}
            </AlertDescription>
          </Alert>

          {/* Simulated Payment Button for Testing */}
          <Button
            onClick={handleSimulatePayment}
            disabled={isSimulating || authLoading}
            className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground"
            variant="outline"
          >
            {isSimulating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {isSimulating ? t('paymentPage.simulatingPayment') : t('paymentPage.simulatePaymentButton')}
          </Button>
          
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center">
          <Link href="/pricing" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t('paymentPage.backToPricing')}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
