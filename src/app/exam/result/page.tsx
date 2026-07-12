
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { PREDICTED_DATA_KEY, FREE_USER_LAST_GENERATION_TIMESTAMP_KEY } from '@/lib/localStorageKeys';
import type { PredictedData, PredictedQuestion } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, BookOpenText, BrainCircuit, ListOrdered, Sparkles, RefreshCw, ArrowLeft } from 'lucide-react';
import PredictedQuestionCard from '@/components/dashboard/PredictedQuestionCard';
import { generateAIExplanation, type GenerateAIExplanationInput } from '@/ai/flows/generate-ai-explanations';
import AIExplanationDialog from '@/components/dashboard/AIExplanationDialog';
import { UpgradeProAlert } from '@/components/ui/upgrade-pro-alert';
import { predictExamQuestions } from '@/ai/flows/predict-exam-questions';
import AdSenseUnit from '@/components/ads/AdSenseUnit';

const MAX_QUESTIONS_FREE_USER = 10;
const FREE_USER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function ExamResultPage() {
  const { t } = useI18n();
  const { currentUser, userTier, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [predictedData, setPredictedData] = useState<PredictedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainingQuestionText, setExplainingQuestionText] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem(PREDICTED_DATA_KEY);
    if (storedData) {
      try {
        const parsedData: PredictedData = JSON.parse(storedData);
        setPredictedData(parsedData);
      } catch (error) {
        console.error("Failed to parse predicted data from localStorage", error);
        localStorage.removeItem(PREDICTED_DATA_KEY);
        toast({ title: t('common.error'), description: t('examResultPage.couldNotLoadExamData'), variant: 'destructive' });
        router.push('/dashboard');
      }
    } else {
        toast({ title: t('examResultPage.noExamDataTitle'), description: t('examResultPage.noExamDataDescription'), variant: 'default' });
        router.push('/upload');
    }
    setIsLoading(false);
  }, [router, toast, t]);

  const handleGetExplanation = useCallback(async (questionText: string, options: string[], correctAnswerIndex: number) => {
    setIsExplaining(true);
    setExplainingQuestionText(questionText);
    setExplanation(null);
    setIsExplanationDialogOpen(true);
    
    try {
      const input: GenerateAIExplanationInput = {
        questionText,
        options,
        correctAnswerIndex,
        topic: predictedData?.recurringThemes?.[0] || 'General',
      };
      const result = await generateAIExplanation(input);
      setExplanation(result.explanation);
    } catch (error) {
      console.error("Error generating AI explanation:", error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : "Failed to generate explanation.",
        variant: "destructive",
      });
      setExplanation("Failed to load explanation.");
    } finally {
      setIsExplaining(false);
    }
  }, [predictedData?.recurringThemes, toast, t]);

  const handleReAnalyze = async () => {
    if (!predictedData?.originalDocumentContent || !predictedData?.requestedNumberOfQuestions) {
      toast({ title: t('common.error'), description: t('examResultPage.noOriginalContent'), variant: "destructive" });
      return;
    }

    if (userTier === 'free') {
        const lastGenTimestamp = localStorage.getItem(FREE_USER_LAST_GENERATION_TIMESTAMP_KEY);
        if (lastGenTimestamp && (Date.now() - parseInt(lastGenTimestamp)) < FREE_USER_COOLDOWN_MS) {
            toast({ 
                title: t('fileUploadArea.dailyLimitReachedPopupTitle'), 
                description: t('fileUploadArea.dailyLimitReachedPopupDescription'), 
                variant: "destructive", 
                duration: 8000 
            });
            return;
        }
    }
    
    setIsReanalyzing(true);
    try {
        toast({ title: t('uploadPage.analysisCompleteToastTitle'), description: t('uploadPage.analysisCompleteToastDescription') });
        const predictionResult = await predictExamQuestions({ 
            analysisSummary: predictedData.analysisSummary,
            recurringThemes: predictedData.recurringThemes,
            numberOfQuestions: predictedData.requestedNumberOfQuestions,
            identifiedExamPatterns: predictedData.identifiedExamPatterns,
            potentialFocusAreas: predictedData.potentialFocusAreas,
        });

        const dataToStore: PredictedData = {
            ...predictedData,
            questions: predictionResult.questions,
            timestamp: Date.now(),
        };

        localStorage.setItem(PREDICTED_DATA_KEY, JSON.stringify(dataToStore));
        if (userTier === 'free') {
            localStorage.setItem(FREE_USER_LAST_GENERATION_TIMESTAMP_KEY, Date.now().toString());
        }
        setPredictedData(dataToStore);
        toast({ title: t('uploadPage.successToastTitle'), description: t('examResultPage.newQuestionsGenerated'), variant: "default" });

    } catch (error) {
        console.error("Error during re-analysis:", error);
        toast({ title: t('uploadPage.errorProcessingToastTitle'), description: (error instanceof Error ? error.message : t('uploadPage.errorProcessingToastFallback')), variant: "destructive" });
    } finally {
        setIsReanalyzing(false);
    }
  };

  const isFreeUserWithMoreQuestions = userTier === 'free' && predictedData && predictedData.questions.length > MAX_QUESTIONS_FREE_USER;

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{t('dashboardPage.loadingData')}</p>
      </div>
    );
  }

  if (!predictedData) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
            <h2 className="text-2xl font-bold mb-4">{t('examResultPage.noExamDataTitle')}</h2>
            <p className="text-muted-foreground mb-6">{t('examResultPage.couldNotFindExamData')}</p>
            <Link href="/upload" passHref><Button><ArrowLeft className="mr-2 h-4 w-4" /> {t('examResultPage.goToUpload')}</Button></Link>
        </div>
    );
  }

  const questionsToShow = isFreeUserWithMoreQuestions
    ? predictedData.questions.slice(0, MAX_QUESTIONS_FREE_USER)
    : predictedData.questions;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-3">
                <BookOpenText className="h-8 w-8" />
                {t('examResultPage.title')}
              </CardTitle>
              <CardDescription className="mt-2">{t('examResultPage.description')}</CardDescription>
            </div>
            <Link href="/dashboard" passHref>
              <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> {t('examResultPage.backToDashboard')}</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <AdSenseUnit adSlot="YOUR_AD_SLOT_ID_FOR_EXAM_RESULTS" className="mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <Alert variant="default" className="bg-muted">
                    <BrainCircuit className="h-4 w-4" />
                    <AlertTitle>{t('dashboardPage.mainThemesLabel')}</AlertTitle>
                    <AlertDescription>{predictedData.recurringThemes?.join(', ') || 'N/A'}</AlertDescription>
                </Alert>
                <Alert variant="default" className="bg-muted">
                    <ListOrdered className="h-4 w-4" />
                    <AlertTitle>{t('dashboardPage.numQuestionsLabel')}</AlertTitle>
                    <AlertDescription>{predictedData.questions.length}</AlertDescription>
                </Alert>
                <Alert variant="default" className="bg-muted">
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>{t('dashboardPage.focusAreasLabel')}</AlertTitle>
                    <AlertDescription>{predictedData.potentialFocusAreas?.slice(0, 3).join(', ') || 'N/A'}</AlertDescription>
                </Alert>
            </div>
            {predictedData.identifiedExamPatterns && (
                <Alert variant="default">
                    <AlertTitle>{t('dashboardPage.examPatternsIdentifiedTitle')}</AlertTitle>
                    <AlertDescription className="text-xs whitespace-pre-wrap">{predictedData.identifiedExamPatterns}</AlertDescription>
                </Alert>
            )}
        </CardContent>
        <CardFooter>
            <Button onClick={handleReAnalyze} disabled={isReanalyzing || !predictedData.originalDocumentContent} className="w-full sm:w-auto">
                {isReanalyzing ? <Loader2 className="animate-spin mr-2"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
                {t('dashboardPage.reanalyzeButton')}
            </Button>
        </CardFooter>
      </Card>

      {isFreeUserWithMoreQuestions && (
        <UpgradeProAlert 
            featureName={t('dashboardPage.upgradeProAlertViewAll')}
            message={t('dashboardPage.upgradeProAlertViewAllMessage', { count: MAX_QUESTIONS_FREE_USER.toString(), total: predictedData.questions.length.toString() })}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {questionsToShow.map((q, index) => (
          <PredictedQuestionCard
            key={index}
            question={q}
            onGetExplanation={handleGetExplanation}
            isExplainingCurrent={isExplaining && explainingQuestionText === q.questionText}
          />
        ))}
      </div>

      <AIExplanationDialog
        open={isExplanationDialogOpen}
        onOpenChange={setIsExplanationDialogOpen}
        question={explainingQuestionText}
        explanation={explanation}
        isLoading={isExplaining}
      />
    </div>
  );
}
