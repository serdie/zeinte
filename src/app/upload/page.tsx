
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FileUploadArea from '@/components/dashboard/FileUploadArea';
import { analyzeDocuments, type AnalyzeDocumentsOutput } from '@/ai/flows/analyze-documents';
import { predictExamQuestions, type PredictExamQuestionsOutput } from '@/ai/flows/predict-exam-questions';
import { useToast } from "@/hooks/use-toast";
import { PREDICTED_DATA_KEY, FREE_USER_LAST_GENERATION_TIMESTAMP_KEY } from '@/lib/localStorageKeys';
import type { PredictedData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CardTitle } from '@/components/ui/card'; // Import CardTitle
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';


export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, userTier } = useAuth();
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
        id: newTimestamp,
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
      
      // Save the current exam for immediate viewing
      localStorage.setItem(PREDICTED_DATA_KEY, JSON.stringify(dataToStore));

      // Add to Firestore history if user is logged in
      if (currentUser && db) {
        try {
          const examHistoryRef = doc(db, "users", currentUser.uid, "examHistory", dataToStore.id.toString());
          await setDoc(examHistoryRef, dataToStore);
        } catch (error) {
          console.error("Error saving exam to Firestore history:", error);
          toast({
            title: "Warning",
            description: "Could not save exam to your persistent history. It will be available for this session only.",
            variant: "destructive"
          });
        }
      }


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
        <CardTitle className="text-3xl text-primary"> {/* Use CardTitle for consistency */}
          {t("sidebar.upload")}
        </CardTitle>
        <Link href="/dashboard" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('configurePage.backToDashboard')}
          </Button>
        </Link>
      </div>
      <FileUploadArea onAnalyze={handleAnalyze} isLoading={isLoading} />
    </div>
  );
}
