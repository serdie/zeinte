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
  const { currentUser, userTier, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();

  const [isButtonLoading, setIsButtonLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !currentUser || userTier === 'pro' || userTier === 'admin') {
      return;
    }

    // Check if PayPal SDK script has loaded
    if (window.paypal && window.paypal.HostedButtons) {
        window.paypal.HostedButtons({
            hostedButtonId: PAYPAL_HOSTED_BUTTON_ID,
        }).render(`#${PAYPAL_CONTAINER_ID}`)
        .then(() => {
            setIsButtonLoading(false);
        })
        .catch((error: any) => {
            console.error("PayPal Hosted Button render() failed:", error);
            toast({
                title: t('common.error'),
                description: t('paymentPage.payPalButtonError'),
                variant: "destructive",
                duration: 7000,
            });
            setIsButtonLoading(false);
            const container = document.getElementById(PAYPAL_CONTAINER_ID);
            if (container) {
                container.innerHTML = `<p class="text-xs text-center text-destructive py-2">${t('paymentPage.payPalButtonError')}</p>`;
            }
        });
    } else {
        // If SDK is not ready, we rely on a timer or subsequent renders to try again
        // For now, the loading state handles the initial UI
        setIsButtonLoading(true);
    }
  }, [authLoading, currentUser, userTier, toast, t]);
  
  // Redirect logic
  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      router.push('/login');
    } else if (userTier === 'pro' || userTier === 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, currentUser, userTier, router]);

  if (authLoading || !currentUser || userTier === 'pro' || userTier === 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
          <div className="w-full flex justify-center min-h-[100px] items-center">
            {isButtonLoading && (
              <div className="flex items-center justify-center text-sm text-muted-foreground p-2">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                {t('paymentPage.payPalButtonLoading')}
              </div>
            )}
            <div id={PAYPAL_CONTAINER_ID} style={{ display: isButtonLoading ? 'none' : 'block' }} />
          </div>

          <Alert variant="default" className="bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('paymentPage.afterPaymentInfo')}
            </AlertDescription>
          </Alert>

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
