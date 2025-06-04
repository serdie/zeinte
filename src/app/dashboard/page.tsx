
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PredictedQuestionCard from '@/components/dashboard/PredictedQuestionCard';
import AIExplanationDialog from '@/components/dashboard/AIExplanationDialog';
import { generateAIExplanation, type GenerateAIExplanationOutput, type GenerateAIExplanationInput } from '@/ai/flows/generate-ai-explanations';
import { analyzeDocuments, type AnalyzeDocumentsOutput } from '@/ai/flows/analyze-documents';
import { predictExamQuestions, type PredictExamQuestionsOutput } from '@/ai/flows/predict-exam-questions';
import { PREDICTED_DATA_KEY, EXAM_CONFIG_KEY } from '@/lib/localStorageKeys';
import type { PredictedData, AIExplanation, PredictedQuestion, ExamConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Info, BookOpenText, Loader2, RefreshCw, Microscope, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useI18n } from '@/contexts/I18nContext';

const DEFAULT_NUM_QUESTIONS_REANALYSIS = "10";

export default function DashboardPage() {
  const { t } = useI18n();
  const [predictedData, setPredictedData] = useState<PredictedData | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isReAnalyzing, setIsReAnalyzing] = useState(false);

  const [currentExplanation, setCurrentExplanation] = useState<AIExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [selectedQuestionForExplanation, setSelectedQuestionForExplanation] = useState<Omit<GenerateAIExplanationInput, 'topic'> | null>(null);
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);

  const [numQuestionsForReanalysis, setNumQuestionsForReanalysis] = useState<string>(DEFAULT_NUM_QUESTIONS_REANALYSIS);

  const { toast } = useToast();

  useEffect(() => {
    let defaultNumQuestions = DEFAULT_NUM_QUESTIONS_REANALYSIS;

    const storedConfig = localStorage.getItem(EXAM_CONFIG_KEY);
    if (storedConfig) {
      try {
        const parsedConfig: ExamConfig = JSON.parse(storedConfig);
        if (parsedConfig.defaultNumberOfQuestions) {
          defaultNumQuestions = parsedConfig.defaultNumberOfQuestions.toString();
        }
      } catch (e) { console.error("Failed to parse exam config for dashboard", e); }
    }

    const storedData = localStorage.getItem(PREDICTED_DATA_KEY);
    if (storedData) {
      try {
        const parsedData: PredictedData = JSON.parse(storedData);
        setPredictedData(parsedData);
        const requestedNumStr = parsedData.requestedNumberOfQuestions?.toString();
        if (requestedNumStr) {
            setNumQuestionsForReanalysis(requestedNumStr);
        } else {
            setNumQuestionsForReanalysis(defaultNumQuestions);
        }
      } catch (error) {
        console.error("Failed to parse predicted data from localStorage", error);
        localStorage.removeItem(PREDICTED_DATA_KEY);
        setPredictedData(null);
        setNumQuestionsForReanalysis(defaultNumQuestions);
      }
    } else {
        setNumQuestionsForReanalysis(defaultNumQuestions);
    }
    setIsLoadingInitialData(false);
  }, []);

  const handleGetExplanation = useCallback(async (questionText: string, options: string[], correctAnswerIndex: number) => {
    const questionContext = { questionText, options, correctAnswerIndex };
    setSelectedQuestionForExplanation(questionContext);
    setIsExplaining(true);
    setIsExplanationDialogOpen(true);
    setCurrentExplanation(null);

    try {
      const topic = predictedData?.recurringThemes?.[0] || predictedData?.potentialFocusAreas?.[0] || "General Topic";

      const result: GenerateAIExplanationOutput = await generateAIExplanation({ ...questionContext, topic });
      if (result && result.explanation) {
        setCurrentExplanation({ question: questionText, explanation: result.explanation, topic });
      } else {
        throw new Error(t('aiExplanationDialog.noExplanation'));
      }
    } catch (error) {
      console.error("Error generating AI explanation:", error);
      setCurrentExplanation(null);
      toast({
        title: t('common.error'),
        description: (error instanceof Error ? error.message : t('aiExplanationDialog.noExplanation')) + " " + t('common.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsExplaining(false);
    }
  }, [predictedData, toast, t]);

  const handleReAnalyze = async () => {
    if (!predictedData?.originalDocumentContent) {
      toast({
        title: t('fileUploadArea.toastEmptyContentTitle'),
        description: t('fileUploadArea.toastEmptyContentDescription'),
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    setIsReAnalyzing(true);
    let requestedNum = parseInt(numQuestionsForReanalysis, 10);

    try {
      toast({
        title: t('uploadPage.processingDocumentToastTitle'),
        description: t('uploadPage.processingDocumentToastDescription'),
      });
      const analysisResult: AnalyzeDocumentsOutput = await analyzeDocuments({ documentContent: predictedData.originalDocumentContent });

      toast({
        title: t('uploadPage.analysisCompleteToastTitle'),
        description: t('uploadPage.analysisCompleteToastDescription'),
      });
      const predictionResult: PredictExamQuestionsOutput = await predictExamQuestions({
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes,
        numberOfQuestions: requestedNum,
        identifiedExamPatterns: analysisResult.identifiedExamPatterns,
        potentialFocusAreas: analysisResult.potentialFocusAreas,
      });

      const newDataToStore: PredictedData = {
        questions: predictionResult.questions,
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes,
        timestamp: Date.now(),
        originalDocumentContent: predictedData.originalDocumentContent,
        requestedNumberOfQuestions: requestedNum,
        identifiedExamPatterns: analysisResult.identifiedExamPatterns,
        potentialFocusAreas: analysisResult.potentialFocusAreas,
      };

      localStorage.setItem(PREDICTED_DATA_KEY, JSON.stringify(newDataToStore));
      setPredictedData(newDataToStore);

      toast({
        title: t('uploadPage.successToastTitle'),
        description: t('dashboardPage.questionsReadyTitle'),
        variant: "default",
      });

    } catch (error) {
      console.error("Error during AI re-processing:", error);
      toast({
        title: t('uploadPage.errorProcessingToastTitle'),
        description: (error instanceof Error ? error.message : t('uploadPage.errorProcessingToastFallback')) + " " + t('common.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsReAnalyzing(false);
    }
  };

  if (isLoadingInitialData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{t('dashboardPage.loadingData')}</p>
      </div>
    );
  }

  if (!predictedData || !predictedData.questions || predictedData.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6 bg-card rounded-lg shadow-xl">
        <BookOpenText className="h-20 w-20 text-primary mb-6" />
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">{t('dashboardPage.emptyTitle')}</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          {t('dashboardPage.emptySubtitle')}
        </p>
        <Link href="/upload" passHref>
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-base px-8 py-6 rounded-lg shadow-md transition-transform duration-150 ease-in-out active:scale-95">
            <UploadCloud className="mr-3 h-6 w-6" />
            {t('dashboardPage.uploadDocsButton')}
          </Button>
        </Link>
      </div>
    );
  }

  const questionsToDisplay = predictedData.questions;
  
  return (
    <div className="space-y-8">
      <Alert variant="default" className="bg-green-500/10 border-green-500/50 text-green-700 dark:bg-green-700/20 dark:text-green-400 dark:border-green-600">
        <Sparkles className="h-6 w-6" />
        <AlertTitle className="text-xl font-semibold">{t("pauSpecial.title")}</AlertTitle>
        <AlertDescription className="text-base space-y-2 mt-1">
          <p>{t("pauSpecial.description")}</p>
          <p>
            {t("pauSpecial.feedbackRequest")} <a href="mailto:info@zeinte.com" className="underline font-medium hover:text-green-800 dark:hover:text-green-300">info@zeinte.com</a>.
          </p>
          <p>{t("pauSpecial.tips")}</p>
        </AlertDescription>
      </Alert>

      {/* AdSense Ad Unit Placeholder REMOVED */}
      {/* 
      <div style={{ width: '100%', minHeight: '90px', backgroundColor: '#f0f0f0', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0', padding: '10px', textAlign: 'center' }}>
        <span style={{ color: '#999', fontSize: '0.9rem' }}>{t("adsense.placeholderDashboard")}</span>
      </div>
      */}

      <Alert className="border-primary bg-primary/10">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary text-lg md:text-xl">{t('dashboardPage.questionsReadyTitle')}</AlertTitle>
        <AlertDescription className="text-primary/80">
          {t('dashboardPage.questionsReadyDescription')}
          <br />
          <span className="font-medium">{t('dashboardPage.analysisSummaryLabel')}</span> {predictedData.analysisSummary.substring(0,150)}...
          {predictedData.recurringThemes && predictedData.recurringThemes.length > 0 && (
            <span className="block mt-1 text-sm"><span className="font-medium">{t('dashboardPage.mainThemesLabel')}</span> {predictedData.recurringThemes.join(', ')}.</span>
          )}
           {predictedData.potentialFocusAreas && predictedData.potentialFocusAreas.length > 0 && (
            <span className="block mt-1 text-sm"><span className="font-medium">{t('dashboardPage.focusAreasLabel')}</span> {predictedData.potentialFocusAreas.join(', ')}.</span>
          )}
          {predictedData.identifiedExamPatterns && (
            <Alert variant="default" className="mt-2 bg-primary/10 border-primary/30">
                <Microscope className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary text-sm">{t('dashboardPage.examPatternsIdentifiedTitle')}</AlertTitle>
                <AlertDescription className="text-primary/70 text-xs">
                    {predictedData.identifiedExamPatterns}
                </AlertDescription>
            </Alert>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="num-questions-reanalysis-select" className="text-sm font-medium">{t('dashboardPage.numQuestionsLabel')}</Label>
          <Select
            value={numQuestionsForReanalysis}
            onValueChange={setNumQuestionsForReanalysis}
            disabled={isReAnalyzing || !predictedData?.originalDocumentContent}
          >
            <SelectTrigger id="num-questions-reanalysis-select" className="w-[150px] sm:w-auto">
              <SelectValue placeholder={t('common.selectOption')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="30">30</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleReAnalyze}
          disabled={isReAnalyzing || !predictedData?.originalDocumentContent}
          variant="outline"
          className="shadow-md w-full sm:w-auto"
          title={t('dashboardPage.reanalyzeButton')}
        >
          {isReAnalyzing ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-5 w-5" />
          )}
          {t('dashboardPage.reanalyzeButton')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionsToDisplay.map((q: PredictedQuestion, index) => (
          <PredictedQuestionCard
              key={index}
              question={q}
              onGetExplanation={handleGetExplanation}
              isExplainingCurrent={isExplaining && selectedQuestionForExplanation?.questionText === q.questionText}
          />
          ))}
      </div>

      <AIExplanationDialog
        open={isExplanationDialogOpen}
        onOpenChange={setIsExplanationDialogOpen}
        question={currentExplanation?.question || selectedQuestionForExplanation?.questionText}
        explanation={currentExplanation?.explanation || null}
        isLoading={isExplaining && !currentExplanation}
      />
    </div>
  );
}
