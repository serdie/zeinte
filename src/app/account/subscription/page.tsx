
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, ShieldCheck, ArrowLeft, XCircle, Info, AlertTriangle, FileText, CheckCircle, Download } from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '@/contexts/AuthContext';
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
  description: string;
  price: string;
  total: string;
}

const mockInvoices: MockInvoice[] = [
  { id: 'inv_1a2b3c4d5e', date: new Date(2024, 6, 15), amount: '9,95 €', status: 'Pagado', description: 'Suscripción Zeinte Pro - Julio 2024', price: '8,22 €', total: '9,95 €' },
  { id: 'inv_6f7g8h9i0j', date: new Date(2024, 5, 15), amount: '9,95 €', status: 'Pagado', description: 'Suscripción Zeinte Pro - Junio 2024', price: '8,22 €', total: '9,95 €' },
  { id: 'inv_k1l2m3n4o5', date: new Date(2024, 4, 15), amount: '9,95 €', status: 'Pagado', description: 'Suscripción Zeinte Pro - Mayo 2024', price: '8,22 €', total: '9,95 €' },
];

export default function ManageSubscriptionPage() {
  const { currentUser, userProfileData, userTier, updateCurrentUserTier, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { t, language } = useI18n();

  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);


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
    
    setIsCancelling(true);
    
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

    const handleDownloadPdf = async (invoice: MockInvoice) => {
    if (!currentUser || !userProfileData) return;
    setIsDownloading(true);
    toast({
        title: t('historyPage.generatingPdfTitle', {defaultValue: "Generando PDF..."}),
        description: t('historyPage.generatingPdfDescription', {defaultValue: "Esto puede tardar un momento."}),
    });

    try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const maxLineWidth = pageWidth - margin * 2;

        // --- Header ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text("FACTURA", pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Factura #: ${invoice.id}`, pageWidth - margin, 20, { align: 'right' });
        doc.text(`Fecha: ${formatDate(invoice.date)}`, pageWidth - margin, 26, { align: 'right' });

        // --- Company & Client Info ---
        doc.line(margin, 35, pageWidth - margin, 35);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Vendedor:", margin, 45);
        doc.setFont('helvetica', 'normal');
        doc.text("SEARCH AND MAKE S.L.", margin, 51);
        doc.text("NIF: B45786787", margin, 57);
        doc.text("Calle Conquistadores 8, 45500", margin, 63);
        doc.text("Torrijos, Toledo, España", margin, 69);
        doc.text("info@zeinte.com", margin, 75);

        doc.setFont('helvetica', 'bold');
        doc.text("Cliente:", pageWidth / 2, 45);
        doc.setFont('helvetica', 'normal');
        doc.text(userProfileData.billingName || currentUser.displayName || currentUser.email || "Usuario de Zeinte", pageWidth / 2, 51);
        if (userProfileData.billingNif) {
            doc.text(`NIF/CIF: ${userProfileData.billingNif}`, pageWidth / 2, 57);
        }
        if (userProfileData.billingAddress) {
            const addressLines = doc.splitTextToSize(userProfileData.billingAddress, (pageWidth / 2) - margin);
            doc.text(addressLines, pageWidth / 2, 63);
        }

        // --- Invoice Table ---
        const tableYStart = 90;
        doc.setFont('helvetica', 'bold');
        doc.text("Descripción", margin, tableYStart);
        doc.text("Precio", pageWidth - margin - 50, tableYStart, { align: 'right' });
        doc.text("Total", pageWidth - margin, tableYStart, { align: 'right' });
        doc.line(margin, tableYStart + 3, pageWidth - margin, tableYStart + 3);

        doc.setFont('helvetica', 'normal');
        let currentY = tableYStart + 10;
        doc.text(invoice.description, margin, currentY);
        doc.text(invoice.price, pageWidth - margin - 50, currentY, { align: 'right' });
        doc.text(invoice.total, pageWidth - margin, currentY, { align: 'right' });
        
        // --- Totals ---
        currentY += 20;
        doc.line(pageWidth / 2, currentY, pageWidth - margin, currentY);
        currentY += 7;
        
        doc.setFont('helvetica', 'bold');
        doc.text("Subtotal:", pageWidth / 2, currentY);
        doc.text(invoice.price, pageWidth - margin, currentY, { align: 'right' });
        currentY += 7;

        doc.text("IVA (21%):", pageWidth / 2, currentY);
        const subtotal = parseFloat(invoice.price.replace(',', '.').replace(' €',''));
        const iva = (subtotal * 0.21).toFixed(2);
        doc.text(`${iva.replace('.',',')} €`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 7;

        doc.setFontSize(14);
        doc.text("TOTAL:", pageWidth / 2, currentY);
        doc.text(invoice.total, pageWidth - margin, currentY, { align: 'right' });
        
        // --- Footer ---
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Gracias por su confianza en Zeinte.", pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });


        doc.save(`factura_${invoice.id}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
            title: t('common.error'),
            description: (error instanceof Error) ? error.message : t('historyPage.pdfGenerationError', {defaultValue: "Could not generate PDF."}),
            variant: "destructive"
        });
    } finally {
        setIsDownloading(false);
    }
  };


  if (authLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const isSpecialAdminUser = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

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
              {!isSpecialAdminUser && (
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
               {isSpecialAdminUser && (
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
                                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleDownloadPdf(invoice)} disabled={isDownloading}>
                                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Download className="h-4 w-4 mr-1"/>}
                                        {t('subscriptionPage.downloadInvoiceAction')}
                                    </Button>
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
                    {t('subscriptionPage.cancelConfirmDescription')}
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
