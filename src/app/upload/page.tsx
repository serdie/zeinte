
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUploadArea from '@/components/dashboard/FileUploadArea';
import { analyzeDocuments, type AnalyzeDocumentsOutput } from '@/ai/flows/analyze-documents';
import { predictExamQuestions, type PredictExamQuestionsOutput } from '@/ai/flows/predict-exam-questions';
import { useToast } from "@/hooks/use-toast";
import { PREDICTED_DATA_KEY, FREE_USER_LAST_GENERATION_TIMESTAMP_KEY } from '@/lib/localStorageKeys';
import type { PredictedData } from '@/types'; // Removed ExamType import
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';


export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { userTier } = useAuth();
  const isFreeUser = userTier === 'free';
  const { t } = useI18n();

  const handleAnalyze = async (content: string, numQuestions: number) => { // Removed examType parameter
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
      // Call predictExamQuestions without examType, as it's removed from the flow's input
      const predictionResult: PredictExamQuestionsOutput = await predictExamQuestions({ 
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes,
        numberOfQuestions: numQuestions,
        // examType: "test", // Removed, flow defaults to test
        identifiedExamPatterns: analysisResult.identifiedExamPatterns,
        potentialFocusAreas: analysisResult.potentialFocusAreas,
      });

      const dataToStore: PredictedData = {
        questions: predictionResult.questions.map(q => ({
            ...q,
            // questionType: "test" // Removed, type will reflect all questions are test
        })),
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes,
        timestamp: Date.now(),
        originalDocumentContent: content,
        requestedNumberOfQuestions: numQuestions,
        // examType: "test", // Removed
        identifiedExamPatterns: analysisResult.identifiedExamPatterns,
        potentialFocusAreas: analysisResult.potentialFocusAreas,
      };

      localStorage.setItem(PREDICTED_DATA_KEY, JSON.stringify(dataToStore));

      if (isFreeUser) {
        localStorage.setItem(FREE_USER_LAST_GENERATION_TIMESTAMP_KEY, Date.now().toString());
      }

      toast({
        title: t('uploadPage.successToastTitle'),
        description: t('uploadPage.successToastDescription'),
        variant: "default",
      });
      
      router.push('/dashboard');

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
      <FileUploadArea onAnalyze={handleAnalyze} isLoading={isLoading} />
    </div>
  );
}
