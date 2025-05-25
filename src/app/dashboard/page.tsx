
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PredictedQuestionCard from '@/components/dashboard/PredictedQuestionCard';
import AIExplanationDialog from '@/components/dashboard/AIExplanationDialog';
import { generateAIExplanation, type GenerateAIExplanationOutput, type GenerateAIExplanationInput } from '@/ai/flows/generate-ai-explanations';
import { analyzeDocuments, type AnalyzeDocumentsOutput } from '@/ai/flows/analyze-documents';
import { predictExamQuestions, type PredictExamQuestionsOutput } from '@/ai/flows/predict-exam-questions';
import { PREDICTED_DATA_KEY, EXAM_CONFIG_KEY, FREE_USER_LAST_GENERATION_TIMESTAMP_KEY } from '@/lib/localStorageKeys';
import type { PredictedData, AIExplanation, PredictedQuestion, ExamConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Info, BookOpenText, Loader2, RefreshCw, Microscope, Lock, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { UpgradeProAlert } from '@/components/ui/upgrade-pro-alert';

const DEFAULT_NUM_QUESTIONS_REANALYSIS = "10";
const FREE_USER_QUESTION_LIMIT = 3;
const FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS = "5";
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export default function DashboardPage() {
  const [predictedData, setPredictedData] = useState<PredictedData | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isReAnalyzing, setIsReAnalyzing] = useState(false);
  
  const [currentExplanation, setCurrentExplanation] = useState<AIExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [selectedQuestionForExplanation, setSelectedQuestionForExplanation] = useState<Omit<GenerateAIExplanationInput, 'topic'> | null>(null);
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);

  const [numQuestionsForReanalysis, setNumQuestionsForReanalysis] = useState<string>(DEFAULT_NUM_QUESTIONS_REANALYSIS);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);


  const { toast } = useToast();
  const { userTier } = useAuth();
  const isFreeUser = userTier === 'free';

  useEffect(() => {
    let defaultNumQuestions = isFreeUser ? FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS : DEFAULT_NUM_QUESTIONS_REANALYSIS;
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
  }, [isFreeUser]);

  const handleGetExplanation = useCallback(async (questionText: string, options: string[], correctAnswerIndex: number) => {
    if (isFreeUser) {
      toast({
        title: "Funcionalidad Pro",
        description: (
          <div className="flex flex-col gap-2">
            <span>Las explicaciones detalladas de la IA son una característica del Plan Pro.</span>
            <Link href="/#pricing" passHref>
              <Button variant="link" className="p-0 h-auto text-primary hover:underline">¡Actualiza tu plan!</Button>
            </Link>
          </div>
        ),
        variant: "default",
        duration: 7000,
      });
      return;
    }

    const questionContext = { questionText, options, correctAnswerIndex };
    setSelectedQuestionForExplanation(questionContext);
    setIsExplaining(true);
    setIsExplanationDialogOpen(true);
    setCurrentExplanation(null); 

    try {
      const topic = predictedData?.recurringThemes?.[0] || predictedData?.potentialFocusAreas?.[0] || "Tema General";
      
      const result: GenerateAIExplanationOutput = await generateAIExplanation({ ...questionContext, topic });
      if (result && result.explanation) {
        setCurrentExplanation({ question: questionText, explanation: result.explanation, topic });
      } else {
        throw new Error("La explicación recibida está vacía o no es válida.");
      }
    } catch (error) {
      console.error("Error generating AI explanation:", error);
      setCurrentExplanation(null); 
      toast({
        title: "Error al generar explicación",
        description: (error instanceof Error ? error.message : "No se pudo obtener la explicación detallada.") + " Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsExplaining(false);
    }
  }, [predictedData, toast, isFreeUser]);

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
        title: "Falta contenido",
        description: "No hay contenido de documento para re-analizar. Sube documentos primero o el contenido anterior no fue guardado (posiblemente debido a su tamaño). Revisa la sección 'Configura tu examen' para más detalles.",
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
            title: "Límite del Plan Gratuito",
            description: `Se generarán un máximo de ${FREE_USER_MAX_QUESTIONS_TO_GENERATE_REANALYSIS} preguntas para usuarios gratuitos.`,
            variant: "default"
        });
    }

    try {
      toast({
        title: "Re-procesando Documentos",
        description: "Realizando un análisis profundo del contenido de tus documentos...",
      });
      const analysisResult: AnalyzeDocumentsOutput = await analyzeDocuments({ documentContent: predictedData.originalDocumentContent });
      
      toast({
        title: "Análisis Detallado Completo",
        description: "Generando nuevas predicciones de preguntas basadas en el análisis avanzado...",
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

      if (isFreeUser) {
        localStorage.setItem(FREE_USER_LAST_GENERATION_TIMESTAMP_KEY, Date.now().toString());
      }

      toast({
        title: "¡Nuevas Preguntas Listas!",
        description: `Se ha generado un nuevo conjunto de ${predictionResult.questions.length} preguntas con análisis mejorado.`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error during AI re-processing:", error);
      toast({
        title: "Error en el Re-procesamiento Avanzado",
        description: (error instanceof Error ? error.message : "Hubo un problema al re-analizar los documentos o predecir preguntas.") + " Inténtalo de nuevo.",
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
        <p className="text-xl text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  if (!predictedData || !predictedData.questions || predictedData.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6 bg-card rounded-lg shadow-xl">
        <BookOpenText className="h-20 w-20 text-primary mb-6" />
        <h2 className="text-3xl font-semibold text-foreground mb-3">Panel de Estudio Vacío</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          Parece que aún no has analizado ningún documento. ¡Sube tus apuntes, temarios o exámenes para empezar a estudiar de forma inteligente!
        </p>
        <Link href="/upload" passHref>
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-base px-8 py-6 rounded-lg shadow-md transition-transform duration-150 ease-in-out active:scale-95">
            <UploadCloud className="mr-3 h-6 w-6" />
            Subir Documentos Ahora
          </Button>
        </Link>
      </div>
    );
  }

  const questionsToDisplay = isFreeUser 
    ? predictedData.questions.slice(0, FREE_USER_QUESTION_LIMIT) 
    : predictedData.questions;
  
  return (
    <div className="space-y-8">
      <Alert className="border-primary bg-primary/10">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">¡Preguntas Listas para Estudiar!</AlertTitle>
        <AlertDescription className="text-primary/80">
          Hemos analizado tus documentos y estas son las preguntas tipo test que creemos podrían aparecer en tu examen. 
          Selecciona una opción para ver si es correcta y pide a la IA una explicación detallada. ¡Mucha suerte!
          <br />
          <span className="font-medium">Resumen del análisis:</span> {predictedData.analysisSummary.substring(0,150)}...
          {predictedData.recurringThemes && predictedData.recurringThemes.length > 0 && (
            <span className="block mt-1 text-sm"><span className="font-medium">Temas principales:</span> {predictedData.recurringThemes.join(', ')}.</span>
          )}
           {predictedData.potentialFocusAreas && predictedData.potentialFocusAreas.length > 0 && (
            <span className="block mt-1 text-sm"><span className="font-medium">Áreas de enfoque detectadas:</span> {predictedData.potentialFocusAreas.join(', ')}.</span>
          )}
          {predictedData.identifiedExamPatterns && (
            <Alert variant="default" className="mt-2 bg-primary/10 border-primary/30">
                <Microscope className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary text-sm">Patrones de Examen Identificados</AlertTitle>
                <AlertDescription className="text-primary/70 text-xs">
                    {predictedData.identifiedExamPatterns}
                </AlertDescription>
            </Alert>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="num-questions-reanalysis-select" className="text-sm font-medium">Número de preguntas:</Label>
          <Select 
            value={numQuestionsForReanalysis} 
            onValueChange={setNumQuestionsForReanalysis}
            disabled={isReAnalyzing || !predictedData?.originalDocumentContent}
          >
            <SelectTrigger id="num-questions-reanalysis-select" className="w-[150px] sm:w-auto">
              <SelectValue placeholder="Cantidad" />
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
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleReAnalyze} 
          disabled={isReAnalyzing || !predictedData?.originalDocumentContent}
          variant="outline"
          className="shadow-md w-full sm:w-auto"
          title={isFreeUser ? "Actualiza a Pro para re-analizar documentos (o espera 24h para otro gratis)" : "Re-analizar y generar nuevo examen"}
        >
          {isReAnalyzing ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-5 w-5" />
          )}
          Re-analizar y Generar Nuevo Examen
        </Button>
      </div>
      {isFreeUser && (
        <UpgradeProAlert 
            featureName="la función de re-análisis ilimitado y la generación de más de 5 preguntas" 
            className="mb-4" 
            message="Estás viendo un número limitado de preguntas y algunas funciones están restringidas en el plan gratuito. Puedes generar un examen gratis al día."
        />
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questionsToDisplay.map((q: PredictedQuestion, index) => (
          <PredictedQuestionCard
            key={index}
            question={q}
            onGetExplanation={handleGetExplanation}
            isExplainingCurrent={isExplaining && selectedQuestionForExplanation?.questionText === q.questionText}
            isExplanationDisabled={isFreeUser}
          />
        ))}
      </div>
      {isFreeUser && predictedData.questions.length > FREE_USER_QUESTION_LIMIT && (
         <UpgradeProAlert 
            featureName="visualizar todas las preguntas generadas" 
            className="mt-6"
            message={`Estás viendo ${FREE_USER_QUESTION_LIMIT} de ${predictedData.questions.length} preguntas generadas.`}
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
                <AlertTriangle className="h-6 w-6" /> Límite Diario Alcanzado
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              Has alcanzado el límite de un examen gratuito por día. Para generar más exámenes y acceder a todas las funcionalidades avanzadas, considera actualizar a nuestro Plan Pro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setShowUpgradeDialog(false)}>Cerrar</AlertDialogCancel>
            <Link href="/#pricing" passHref>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setShowUpgradeDialog(false)}>
                <ExternalLink className="mr-2 h-4 w-4" /> Ver Planes Pro
              </Button>
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
