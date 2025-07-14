
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, ShieldCheck, ArrowLeft, XCircle, Info, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { useAuth, ADMIN_EMAIL, FREE_USER_EMAIL } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MockInvoice {
  id: string;
  date: Date;
  amount: string;
  status: 'Pagado' | 'Pendiente' | 'Fallido';
}

const mockInvoices: MockInvoice[] = [
  { id: 'inv_1a2b3c4d5e', date: new Date(2024, 6, 15), amount: '9,95 €', status: 'Pagado' },
  { id: 'inv_6f7g8h9i0j', date: new Date(2024, 5, 15), amount: '9,95 €', status: 'Pagado' },
  { id: 'inv_k1l2m3n4o5', date: new Date(2024, 4, 15), amount: '9,95 €', status: 'Pagado' },
];

export default function ManageSubscriptionPage() {
  const { currentUser, userTier, updateCurrentUserTier, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { t, language } = useI18n();

  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && currentUser && userTier !== 'pro' && userTier !== 'admin') {
      toast({
        title: t('subscriptionPage.accessDeniedTitle'),
        description: t('subscriptionPage.accessDeniedDescription'),
        variant: "destructive"
      });
      router.push('/pricing');
    }
  }, [currentUser, userTier, authLoading, router, toast, t]);
  
  const handleConfirmCancellation = async () => {
    if (!currentUser || userTier !== 'pro') {
      toast({ title: t('common.error'), description: t('subscriptionPage.notProError'), variant: "destructive" });
      return;
    }

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
    
    // This is now a real action, not a simulation.
    const result = await updateCurrentUserTier('free');

    if (typeof result === 'string') { // It's an error message
        toast({
            title: t('common.error'),
            description: result,
            variant: "destructive",
        });
        setIsCancelling(false);
        return;
    }
    
    toast({
        title: t('subscriptionPage.cancelSuccessToastTitle'),
        description: t('subscriptionPage.cancelSuccessToastDescription'),
        variant: "default",
        duration: 8000
    });
    
    setShowCancelConfirm(false);
    setIsCancelling(false);
    router.push('/dashboard');
  };

  const getNextBillingDate = () => {
    const lastInvoiceDate = mockInvoices[0]?.date || new Date();
    const nextBillingDate = new Date(lastInvoiceDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    return formatDate(nextBillingDate);
  };

  const formatDate = (date: Date) => {
    try {
      return format(date, 'd MMMM, yyyy', { locale: language === 'es' ? es : undefined });
    } catch (error) {
      return 'N/A';
    }
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
    <>
    <div className="container mx-auto py-12 px-4 space-y-8">
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
                  {t('subscriptionPage.currentPlanProDescription', { date: getNextBillingDate() })}
                  </AlertDescription>
              </Alert>
              
              <p className="text-sm text-muted-foreground">
                {t('subscriptionPage.cancelProInfo')}
              </p>
              {!isSpecialUser && (
                <Button 
                  variant="destructive" 
                  className="w-full text-lg py-3" 
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isCancelling || authLoading}
                >
                  <XCircle className="mr-2 h-5 w-5" />
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
        </CardContent>
        <CardFooter className="flex-col gap-4 items-start">
            <p className="text-xs text-muted-foreground text-center pt-4 w-full">
                {t('subscriptionPage.paymentGatewayComingSoon')}
            </p>
             <Link href="/dashboard" passHref className="w-full">
                <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t('subscriptionPage.backToDashboardButton')}
                </Button>
            </Link>
        </CardFooter>
      </Card>

      {userTier === 'pro' && (
        <Card className="max-w-2xl mx-auto shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    {t('subscriptionPage.invoiceHistoryTitle')}
                </CardTitle>
                <CardDescription>{t('subscriptionPage.invoiceHistoryDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('subscriptionPage.invoiceHistoryDateHeader')}</TableHead>
                            <TableHead>{t('subscriptionPage.invoiceHistoryAmountHeader')}</TableHead>
                            <TableHead>{t('subscriptionPage.invoiceHistoryStatusHeader')}</TableHead>
                            <TableHead className="text-right">{t('subscriptionPage.invoiceHistoryActionHeader')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockInvoices.map(invoice => (
                            <TableRow key={invoice.id}>
                                <TableCell>{formatDate(invoice.date)}</TableCell>
                                <TableCell>{invoice.amount}</TableCell>
                                <TableCell>
                                    <Badge variant={invoice.status === 'Pagado' ? 'default' : 'destructive'} className={invoice.status === 'Pagado' ? 'bg-green-600/80' : ''}>
                                        {t(`subscriptionPage.invoiceStatus${invoice.status}`)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => alert(t('subscriptionPage.downloadInvoiceComingSoon'))}>{t('subscriptionPage.downloadInvoiceAction')}</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}

    </div>

    <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('subscriptionPage.cancelConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('subscriptionPage.cancelConfirmDescription', { date: getNextBillingDate() })}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowCancelConfirm(false)} disabled={isCancelling}>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmCancellation} className="bg-destructive hover:bg-destructive/90" disabled={isCancelling}>
                    {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                    {t('subscriptionPage.cancelConfirmButton')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
