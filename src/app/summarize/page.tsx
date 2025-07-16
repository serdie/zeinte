
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FileUploadArea from '@/components/dashboard/FileUploadArea';
import { generateSummary } from '@/ai/flows/generate-summary';
import { useToast } from "@/hooks/use-toast";
import { CURRENT_SUMMARY_DATA_KEY, SUMMARY_HISTORY_KEY } from '@/lib/localStorageKeys';
import type { SummaryData, GenerateSummaryOutput } from '@/types';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { CardTitle } from '@/components/ui/card';
import AdSenseUnit from '@/components/ads/AdSenseUnit';

export default function SummarizePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();

  const handleAnalyze = async (content: string) => {
    setIsLoading(true);
    try {
      toast({
        title: t('summarizePage.processingToastTitle'),
        description: t('summarizePage.processingToastDescription'),
      });

      const summaryResult: GenerateSummaryOutput = await generateSummary({ documentContent: content });
      
      const newTimestamp = Date.now();
      const summaryTitle = summaryResult.title;

      const dataToStore: SummaryData = {
        id: newTimestamp.toString(),
        title: summaryTitle,
        summary: summaryResult,
        timestamp: newTimestamp,
        originalDocumentContent: content,
      };
      
      const historyString = localStorage.getItem(SUMMARY_HISTORY_KEY);
      const history: SummaryData[] = historyString ? JSON.parse(historyString) : [];
      history.unshift(dataToStore);
      localStorage.setItem(SUMMARY_HISTORY_KEY, JSON.stringify(history));
      
      localStorage.setItem(CURRENT_SUMMARY_DATA_KEY, JSON.stringify(dataToStore));

      toast({
        title: t('summarizePage.successToastTitle'),
        description: t('summarizePage.successToastDescription'),
        variant: "default",
      });
      
      router.push('/summarize/result');

    } catch (error) {
      console.error("Error during AI summarization:", error);
      toast({
        title: t('summarizePage.errorProcessingToastTitle'),
        description: (error instanceof Error ? error.message : t('summarizePage.errorProcessingToastFallback')) + " " + t('common.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileUploadAnalyze = (content: string, _numQuestions?: number) => {
    handleAnalyze(content);
  };


  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <CardTitle className="text-3xl text-primary flex items-center gap-2">
          <FileText className="h-8 w-8" />
          {t("sidebar.createSummary")}
        </CardTitle>
        <Link href="/dashboard" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('configurePage.backToDashboard')}
          </Button>
        </Link>
      </div>
      <AdSenseUnit adSlot="YOUR_AD_SLOT_ID_FOR_SUMMARIZE" className="mb-8" />
      <FileUploadArea onAnalyze={handleFileUploadAnalyze} isLoading={isLoading} mode="summary" />
    </div>
  );
}
