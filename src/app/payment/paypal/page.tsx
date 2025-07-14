
// src/app/payment/paypal/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PayPalPaymentPage() {
  const { currentUser, userTier, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

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

          <form
            action="https://www.paypal.com/ncp/payment/XUYY6HM9V87F6"
            method="post"
            target="_blank"
            className="inline-grid justify-items-center items-center content-start gap-2 w-full"
          >
            <input
              type="submit"
              value={t('paymentPage.buyNowButton')}
              className="text-center border-none rounded-sm min-w-[11.625rem] px-8 h-[2.625rem] font-bold bg-[#FFD140] text-black text-base leading-5 cursor-pointer hover:bg-[#fddb6d] transition-colors"
            />
            <Image
              src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg"
              alt="Accepted cards"
              width={250}
              height={40}
            />
            <section className="text-xs text-muted-foreground flex items-center gap-1">
              {t('paymentPage.poweredBy')}
              <Image
                src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
                alt="paypal logo"
                width={59}
                height={14}
                className="h-[14px] align-middle"
              />
            </section>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                O paga con Tarjeta
              </span>
            </div>
          </div>
          
          <div className="flex justify-center">
             <stripe-buy-button
              buy-button-id="buy_btn_1RkiJvJ6FVppO7DR1ysEionM"
              publishable-key="pk_live_51MKVupJ6FVppO7DRWC6XjQk9rOUM8lwsAYfE0i3ne9xq8HFXE9srMpW5TkcU1oAVQuZ2AQw7mw6h0KJszNAFmSgA00XyvsSmBd"
             >
            </stripe-buy-button>
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
