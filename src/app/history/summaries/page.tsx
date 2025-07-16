
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, FileText, ArrowLeft, BookOpen, AlertCircle, MoreVertical, Share2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { SUMMARY_HISTORY_KEY, CURRENT_SUMMARY_DATA_KEY } from '@/lib/localStorageKeys';
import type { SummaryData } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import AdSenseUnit from '@/components/ads/AdSenseUnit';

export default function SummaryHistoryPage() {
  const { t, language } = useI18n();
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [summaryHistory, setSummaryHistory] = useState<SummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryToDelete, setSummaryToDelete] = useState<SummaryData | null>(null);

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedHistory = localStorage.getItem(SUMMARY_HISTORY_KEY);
      if (storedHistory) {
        const parsedHistory: SummaryData[] = JSON.parse(storedHistory);
        setSummaryHistory(parsedHistory);
      }
    } catch (error) {
      console.error("Failed to fetch summary history from localStorage:", error);
      toast({
        title: t('common.error'),
        description: "Could not load summary history from the browser.",
        variant: "destructive"
      });
      setSummaryHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  const formatDate = (timestamp: number) => {
    try {
       if (!timestamp || isNaN(timestamp)) return t('common.invalidDate');
      return format(new Date(timestamp), 'PPpp', { locale: language === 'es' ? es : undefined });
    } catch (error) {
      console.error("Error formatting date:", error);
      return t('common.invalidDate');
    }
  };

  const handleViewSummary = (summary: SummaryData) => {
    localStorage.setItem(CURRENT_SUMMARY_DATA_KEY, JSON.stringify(summary));
    router.push('/summarize/result');
  };

  const handleDeleteSummary = async () => {
    if (!summaryToDelete) return;
    
    try {
      const updatedHistory = summaryHistory.filter(summary => summary.id !== summaryToDelete.id);
      setSummaryHistory(updatedHistory);
      localStorage.setItem(SUMMARY_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      toast({
        title: t('historyPage.summaryDeletedToastTitle'),
        description: t('historyPage.summaryDeletedToastDescription'),
        variant: "default",
      });
    } catch (error) {
       console.error("Error deleting summary from localStorage:", error);
       toast({
         title: t('common.error'),
         description: "Could not delete the summary from the browser storage.",
         variant: "destructive"
       });
    } finally {
      setSummaryToDelete(null);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{t('historyPage.loadingSummaryHistory')}</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-3">
            <FileText className="h-8 w-8" />
            {t('historyPage.summaryHistoryTitle')}
          </CardTitle>
          <CardDescription className="mt-2">{t('historyPage.summaryHistoryDescription')}</CardDescription>
        </div>
        <Link href="/dashboard" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> {t('examResultPage.backToDashboard')}</Button>
        </Link>
      </div>
      
      <AdSenseUnit adSlot="YOUR_AD_SLOT_ID_FOR_HISTORY" className="mb-6" />

      {summaryHistory.length === 0 ? (
        <Alert variant="default" className="bg-blue-500/10 border-blue-500/50">
            <AlertCircle className="h-5 w-5 text-blue-700" />
            <AlertTitle className="text-blue-700">{t('historyPage.noSummaryHistoryTitle')}</AlertTitle>
            <AlertDescription className="text-blue-700/90">
              {t('historyPage.noSummaryHistoryDescription')}
              <Link href="/summarize" className="font-semibold underline hover:text-blue-800 ml-1">
                {t('historyPage.goToSummaryCreation')}
              </Link>
            </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summaryHistory.map((summary) => (
            <Card key={summary.id} className="shadow-md hover:shadow-xl transition-shadow flex flex-col relative group">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">{t('historyPage.summaryOptions')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSummaryToDelete(summary)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>{t('historyPage.deleteSummary')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <CardHeader>
                <CardTitle className="text-lg text-primary truncate pr-8" title={summary.title}>{summary.title}</CardTitle>
                <CardDescription>{t('historyPage.generatedOn')} {formatDate(summary.timestamp)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                 <p><span className="font-semibold">{t('historyPage.summaryKeyPointsLabel')}:</span> {summary.summary.keyPoints.slice(0, 2).join(', ')}...</p>
                 <p><span className="font-semibold">{t('historyPage.summarySectionsLabel')}:</span> {summary.summary.sections.length}</p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleViewSummary(summary)} className="w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {t('historyPage.viewSummaryButton')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>

    <AlertDialog open={!!summaryToDelete} onOpenChange={(open) => !open && setSummaryToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('historyPage.deleteSummaryConfirmationTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('historyPage.deleteSummaryConfirmationDescription')}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSummaryToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSummary} className="bg-destructive hover:bg-destructive/90">
                    <Trash2 className="mr-2 h-4 w-4" /> {t('historyPage.deleteConfirmButton')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
