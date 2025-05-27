
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PredictedQuestionCard from '@/components/dashboard/PredictedQuestionCard';
// import WrittenQuestionCard from '@/components/dashboard/WrittenQuestionCard'; // Removed import
import AIExplanationDialog from '@/components/dashboard/AIExplanationDialog';
import { generateAIExplanation, type GenerateAIExplanationOutput, type GenerateAIExplanationInput } from '@/ai/flows/generate-ai-explanations';
import { analyzeDocuments, type AnalyzeDocumentsOutput } from '@/ai/flows/analyze-documents';
import { predictExamQuestions, type PredictExamQuestionsOutput } from '@/ai/flows/predict-exam-questions';
import { PREDICTED_DATA_KEY, EXAM_CONFIG_KEY, FREE_USER_LAST_GENERATION_TIMESTAMP_KEY } from '@/lib/localStorageKeys';
import type { PredictedData, AIExplanation, PredictedQuestion, ExamConfig } from '@/types'; // Removed ExamType
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Info, BookOpenText, Loader2, RefreshCw, Microscope, Lock, AlertTriangle, ExternalLink, Newspaper } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { UpgradeProAlert } from '@/components/ui/upgrade-pro-alert';
import { useI18n } from '@/contexts/I18nContext';

const DEFAULT_NUM_QUESTIONS_REANALYSIS = "10";
// const DEFAULT_EXAM_TYPE_REANALYSIS: ExamType = "test"; // Removed
const FREE_USER_QUESTION_LIMIT = 3;
const FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS = "5";
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

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
  // const [examTypeForReanalysis, setExamTypeForReanalysis] = useState<ExamType>(DEFAULT_EXAM_TYPE_REANALYSIS); // Removed
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);


  const { toast } = useToast();
  const { userTier } = useAuth();
  const isFreeUser = userTier === 'free';

  useEffect(() => {
    let defaultNumQuestions = isFreeUser ? FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS : DEFAULT_NUM_QUESTIONS_REANALYSIS;
    // let defaultExamType: ExamType = DEFAULT_EXAM_TYPE_REANALYSIS; // Removed

    const storedConfig = localStorage.getItem(EXAM_CONFIG_KEY);
    if (storedConfig) {
      try {
        const parsedConfig: ExamConfig = JSON.parse(storedConfig);
        if (parsedConfig.defaultNumberOfQuestions) {
          const configNumStr = parsedConfig.defaultNumberOfQuestions.toString();
          if (isFreeUser && parseInt(configNumStr, 10) > parseInt(FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS, 10)) {
            defaultNumQuestions = FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS;
          } else {
            defaultNumQuestions = configNumStr;
          }
        }
        // Removed defaultExamType logic from config
      } catch (e) { console.error("Failed to parse exam config for dashboard", e); }
    }

    const storedData = localStorage.getItem(PREDICTED_DATA_KEY);
    if (storedData) {
      try {
        const parsedData: PredictedData = JSON.parse(storedData);
        setPredictedData(parsedData);
        const requestedNumStr = parsedData.requestedNumberOfQuestions?.toString();
        if (requestedNumStr) {
            if (isFreeUser && parseInt(requestedNumStr, 10) > parseInt(FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS, 10)) {
                setNumQuestionsForReanalysis(FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS);
            } else {
                setNumQuestionsForReanalysis(requestedNumStr);
            }
        } else {
            setNumQuestionsForReanalysis(defaultNumQuestions);
        }
        // setExamTypeForReanalysis(parsedData.examType || defaultExamType); // Removed
      } catch (error) {
        console.error("Failed to parse predicted data from localStorage", error);
        localStorage.removeItem(PREDICTED_DATA_KEY);
        setPredictedData(null);
        setNumQuestionsForReanalysis(defaultNumQuestions);
        // setExamTypeForReanalysis(defaultExamType); // Removed
      }
    } else {
        setNumQuestionsForReanalysis(defaultNumQuestions);
        // setExamTypeForReanalysis(defaultExamType); // Removed
    }
    setIsLoadingInitialData(false);
  }, [isFreeUser]);

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
    if (isFreeUser) {
        const lastGenerationTime = localStorage.getItem(FREE_USER_LAST_GENERATION_TIMESTAMP_KEY);
        if (lastGenerationTime && (Date.now() - parseInt(lastGenerationTime, 10) < ONE_DAY_IN_MS)) {
            setShowUpgradeDialog(true);
            return;
        }
    }

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
    if (isFreeUser && requestedNum > parseInt(FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS, 10)) {
        requestedNum = parseInt(FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS, 10);
        toast({
            title: t('fileUploadArea.toastFreeUserLimitTitle'),
            description: t('fileUploadArea.toastFreeUserLimitDescription', { maxQuestions: FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS }),
            variant: "default"
        });
    }

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
      // Call predictExamQuestions without examType
      const predictionResult: PredictExamQuestionsOutput = await predictExamQuestions({
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes,
        numberOfQuestions: requestedNum,
        // examType: examTypeForReanalysis, // Removed
        identifiedExamPatterns: analysisResult.identifiedExamPatterns,
        potentialFocusAreas: analysisResult.potentialFocusAreas,
      });

      const newDataToStore: PredictedData = {
        questions: predictionResult.questions.map(q => ({
            ...q,
            // questionType: q.questionType || examTypeForReanalysis // Removed
        })),
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes,
        timestamp: Date.now(),
        originalDocumentContent: predictedData.originalDocumentContent,
        requestedNumberOfQuestions: requestedNum,
        // examType: examTypeForReanalysis, // Removed
        identifiedExamPatterns: analysisResult.identifiedExamPatterns,
        potentialFocusAreas: analysisResult.potentialFocusAreas,
      };

      localStorage.setItem(PREDICTED_DATA_KEY, JSON.stringify(newDataToStore));
      setPredictedData(newDataToStore);

      if (isFreeUser) {
        localStorage.setItem(FREE_USER_LAST_GENERATION_TIMESTAMP_KEY, Date.now().toString());
      }

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
        <h2 className="text-3xl font-semibold text-foreground mb-3">{t('dashboardPage.emptyTitle')}</h2>
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

  const questionsToDisplay = isFreeUser
    ? predictedData.questions.slice(0, FREE_USER_QUESTION_LIMIT)
    : predictedData.questions;
  
  // const currentExamType = predictedData.examType || "test"; // Removed, all are test now

  return (
    <div className="space-y-8">
      <Alert variant="default" className="bg-blue-500/10 border-blue-500/50 text-blue-700 dark:bg-blue-700/20 dark:text-blue-400 dark:border-blue-600">
        <Newspaper className="h-5 w-5" />
        <AlertTitle>{t("dashboardPage.betaAdNoticeTitle")}</AlertTitle>
        <AlertDescription>
          {t("dashboardPage.betaAdNoticeDescription")}
        </AlertDescription>
      </Alert>

      <div style={{ width: '100%', minHeight: '90px', backgroundColor: '#f0f0f0', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0', padding: '10px', textAlign: 'center' }}>
        <span style={{ color: '#999', fontSize: '0.9rem' }}>{t("adsense.placeholderDashboard")}</span>
      </div>


      <Alert className="border-primary bg-primary/10">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">{t('dashboardPage.questionsReadyTitle')}</AlertTitle>
        <AlertDescription className="text-primary/80">
          {t('dashboardPage.questionsReadyDescription')} {/* Simplified description */}
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
        {/* Removed Exam Type Selector for Re-analysis */}
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
              {!isFreeUser && (
                <>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </>
              )}
               {isFreeUser && parseInt(numQuestionsForReanalysis) > parseInt(FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS) && (
                 <SelectItem value={numQuestionsForReanalysis}>{numQuestionsForReanalysis} ({t('dashboardPage.proOnlyOption')})</SelectItem>
               )}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleReAnalyze}
          disabled={isReAnalyzing || !predictedData?.originalDocumentContent}
          variant="outline"
          className="shadow-md w-full sm:w-auto"
          title={isFreeUser ? t('dashboardPage.reanalyzeButtonProTooltip') : t('dashboardPage.reanalyzeButton')}
        >
          {isReAnalyzing ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-5 w-5" />
          )}
          {t('dashboardPage.reanalyzeButton')}
        </Button>
      </div>
      {isFreeUser && (
        <UpgradeProAlert
            featureName={t('dashboardPage.upgradeProAlertReanalysis')}
            className="mb-4"
            message={t('dashboardPage.upgradeProAlertReanalysisMessage')}
        />
      )}

      {/* Always render PredictedQuestionCard as examType is now only "test" */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionsToDisplay.map((q: PredictedQuestion, index) => (
          <PredictedQuestionCard
              key={index}
              question={q}
              onGetExplanation={handleGetExplanation}
              isExplainingCurrent={isExplaining && selectedQuestionForExplanation?.questionText === q.questionText}
              // isExplanationDisabled={false} // No longer needed, explanation always enabled
          />
          ))}
      </div>

      {isFreeUser && predictedData.questions.length > FREE_USER_QUESTION_LIMIT && (
         <UpgradeProAlert
            featureName={t('dashboardPage.upgradeProAlertViewAll')}
            className="mt-6"
            message={t('dashboardPage.upgradeProAlertViewAllMessage', { count: FREE_USER_QUESTION_LIMIT, total: predictedData.questions.length })}
        />
      )}

      <AIExplanationDialog
        open={isExplanationDialogOpen}
        onOpenChange={setIsExplanationDialogOpen}
        question={currentExplanation?.question || selectedQuestionForExplanation?.questionText}
        explanation={currentExplanation?.explanation || null}
        isLoading={isExplaining && !currentExplanation}
      />

      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-6 w-6" /> {t('dashboardPage.dailyLimitReachedTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              {t('dashboardPage.dailyLimitReachedDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setShowUpgradeDialog(false)}>{t('common.close')}</AlertDialogCancel>
            <Link href="/#pricing" passHref>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setShowUpgradeDialog(false)}>
                <ExternalLink className="mr-2 h-4 w-4" /> {t('dashboardPage.viewProPlansButton')}
              </Button>
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
