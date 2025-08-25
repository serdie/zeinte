"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FileUploadArea from '@/components/dashboard/FileUploadArea';
import { analyzeDocuments, type AnalyzeDocumentsOutput } from '@/ai/flows/analyze-documents';
import { predictExamQuestions, type PredictExamQuestionsOutput } from '@/ai/flows/predict-exam-questions';
import { useToast } from "@/hooks/use-toast";
import { PREDICTED_DATA_KEY, FREE_USER_LAST_GENERATION_TIMESTAMP_KEY, EXAM_HISTORY_KEY } from '@/lib/localStorageKeys';
import type { PredictedData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CardTitle } from '@/components/ui/card';

export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { userTier } = useAuth();
  const isFreeUser = userTier === 'free';
  const { t } = useI18n();

  const handleAnalyze = async (content: string, numQuestions: number) => {
    setIsLoading(true);
    try {
      toast({
        title: t('uploadPage.processingDocumentToastTitle'),
        description: t('uploadPage.processingDocumentToastDescription'),
      });
      const analysisResult: AnalyzeDocumentsOutput = await analyzeDocuments({ documentContent: content });
      
      toast({
        title: t('uploadPage.analysisCompleteToastTitle'),
        description: t('uploadPage.analysisCompleteToastDescription'),
      });
      const predictionResult: PredictExamQuestionsOutput = await predictExamQuestions({ 
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes,
        numberOfQuestions: numQuestions,
        identifiedExamPatterns: analysisResult.identifiedExamPatterns,
        potentialFocusAreas: analysisResult.potentialFocusAreas,
      });
      
      const newTimestamp = Date.now();
      const examTitle = analysisResult.summary.substring(0, 50) + (analysisResult.summary.length > 50 ? '...' : '');

      const dataToStore: PredictedData = {
        id: newTimestamp.toString(),
        title: examTitle,
        questions: predictionResult.questions.map(q => ({
            ...q,
        })),
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes,
        timestamp: newTimestamp,
        originalDocumentContent: content,
        requestedNumberOfQuestions: numQuestions,
        identifiedExamPatterns: analysisResult.identifiedExamPatterns,
        potentialFocusAreas: analysisResult.potentialFocusAreas,
      };
      
      const historyString = localStorage.getItem(EXAM_HISTORY_KEY);
      const history: PredictedData[] = historyString ? JSON.parse(historyString) : [];
      history.unshift(dataToStore);
      localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(history));
      
      localStorage.setItem(PREDICTED_DATA_KEY, JSON.stringify(dataToStore));

      if (isFreeUser) {
        localStorage.setItem(FREE_USER_LAST_GENERATION_TIMESTAMP_KEY, Date.now().toString());
      }

      toast({
        title: t('uploadPage.successToastTitle'),
        description: t('uploadPage.successToastDescription'),
        variant: "default",
      });
      
      router.push('/exam/result');

    } catch (error) {
      console.error("Error during AI processing:", error);
      toast({
        title: t('uploadPage.errorProcessingToastTitle'),
        description: (error instanceof Error ? error.message : t('uploadPage.errorProcessingToastFallback')) + " " + t('common.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <CardTitle className="text-3xl text-primary">
          {t("sidebar.createExam")}
        </CardTitle>
        <Link href="/dashboard" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('configurePage.backToDashboard')}
          </Button>
        </Link>
      </div>
      <FileUploadArea onAnalyze={handleAnalyze} isLoading={isLoading} mode="exam" />
    </div>
  );
}