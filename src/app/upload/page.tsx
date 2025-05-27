
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUploadArea from '@/components/dashboard/FileUploadArea';
import { analyzeDocuments, type AnalyzeDocumentsOutput } from '@/ai/flows/analyze-documents';
import { predictExamQuestions, type PredictExamQuestionsOutput } from '@/ai/flows/predict-exam-questions';
import { useToast } from "@/hooks/use-toast";
import { PREDICTED_DATA_KEY, FREE_USER_LAST_GENERATION_TIMESTAMP_KEY } from '@/lib/localStorageKeys';
import type { PredictedData, ExamType } from '@/types'; // Import ExamType
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';


export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { userTier } = useAuth();
  const isFreeUser = userTier === 'free';
  const { t } = useI18n();

  const handleAnalyze = async (content: string, numQuestions: number, examType: ExamType) => {
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
        examType: examType, // Pass examType here
        identifiedExamPatterns: analysisResult.identifiedExamPatterns,
        potentialFocusAreas: analysisResult.potentialFocusAreas,
      });

      const dataToStore: PredictedData = {
        questions: predictionResult.questions.map(q => ({ // Ensure questionType is set
            ...q, 
            questionType: q.questionType || examType // Default to examType if not set by AI
        })),
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes,
        timestamp: Date.now(),
        originalDocumentContent: content,
        requestedNumberOfQuestions: numQuestions,
        examType: examType, // Store examType
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
