
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PredictedQuestionCard from '@/components/dashboard/PredictedQuestionCard';
import AIExplanationDialog from '@/components/dashboard/AIExplanationDialog';
import { generateAIExplanation, type GenerateAIExplanationOutput, type GenerateAIExplanationInput } from '@/ai/flows/generate-ai-explanations';
import { analyzeDocuments, type AnalyzeDocumentsOutput } from '@/ai/flows/analyze-documents';
import { predictExamQuestions, type PredictExamQuestionsOutput } from '@/ai/flows/predict-exam-questions';
import { PREDICTED_DATA_KEY } from '@/lib/localStorageKeys';
import type { PredictedData, AIExplanation, PredictedQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, Info, BookOpenText, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [predictedData, setPredictedData] = useState<PredictedData | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isReAnalyzing, setIsReAnalyzing] = useState(false);
  
  const [currentExplanation, setCurrentExplanation] = useState<AIExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [selectedQuestionForExplanation, setSelectedQuestionForExplanation] = useState<Omit<GenerateAIExplanationInput, 'topic'> | null>(null);
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const storedData = localStorage.getItem(PREDICTED_DATA_KEY);
    if (storedData) {
      try {
        const parsedData: PredictedData = JSON.parse(storedData);
        if (parsedData.questions && parsedData.questions.length > 0 && typeof parsedData.questions[0] === 'string') {
          console.warn("Old question format detected in localStorage. Clearing data.");
          localStorage.removeItem(PREDICTED_DATA_KEY);
          setPredictedData(null);
        } else {
          setPredictedData(parsedData);
        }
      } catch (error) {
        console.error("Failed to parse predicted data from localStorage", error);
        localStorage.removeItem(PREDICTED_DATA_KEY);
        setPredictedData(null);
      }
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
      const topic = predictedData?.recurringThemes?.[0] || "Tema General";
      
      const result: GenerateAIExplanationOutput = await generateAIExplanation({ ...questionContext, topic });
      if (result && result.explanation) {
        setCurrentExplanation({ question: questionText, explanation: result.explanation, topic });
      } else {
        throw new Error("La explicación recibida está vacía o no es válida.");
      }
    } catch (error) {
      console.error("Error generating AI explanation:", error);
      setCurrentExplanation(null); // Ensure explanation is cleared on error
      toast({
        title: "Error al generar explicación",
        description: (error instanceof Error ? error.message : "No se pudo obtener la explicación detallada.") + " Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsExplaining(false);
    }
  }, [predictedData, toast]);

  const handleReAnalyze = async () => {
    if (!predictedData?.originalDocumentContent) {
      toast({
        title: "Falta contenido",
        description: "No hay contenido de documento para re-analizar. Sube documentos primero o el contenido anterior no fue guardado.",
        variant: "destructive",
      });
      return;
    }

    setIsReAnalyzing(true);
    try {
      toast({
        title: "Re-procesando Documentos",
        description: "Analizando de nuevo el contenido de tus documentos...",
      });
      const analysisResult: AnalyzeDocumentsOutput = await analyzeDocuments({ documentContent: predictedData.originalDocumentContent });
      
      toast({
        title: "Análisis Completo",
        description: "Generando nuevas predicciones de preguntas...",
      });
      const predictionResult: PredictExamQuestionsOutput = await predictExamQuestions({ 
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes
      });

      const newDataToStore: PredictedData = {
        questions: predictionResult.questions,
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes,
        timestamp: Date.now(),
        originalDocumentContent: predictedData.originalDocumentContent, // Preserve content for future re-analyses
      };

      localStorage.setItem(PREDICTED_DATA_KEY, JSON.stringify(newDataToStore));
      setPredictedData(newDataToStore); // Update state to re-render

      toast({
        title: "¡Nuevas Preguntas Listas!",
        description: "Se ha generado un nuevo conjunto de preguntas.",
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error during AI re-processing:", error);
      toast({
        title: "Error en el Re-procesamiento",
        description: "Hubo un problema al re-analizar los documentos o predecir preguntas. Inténtalo de nuevo.",
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
        <h2 className="text-3xl font-semibold text-foreground mb-3">Bienvenido a AdivinaExamen</h2>
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
  
  return (
    <div className="space-y-8">
      <Alert className="border-primary bg-primary/10">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">¡Preguntas Listas para Estudiar!</AlertTitle>
        <AlertDescription className="text-primary/80">
          Hemos analizado tus documentos y estas son las preguntas tipo test que creemos podrían aparecer en tu examen. 
          Selecciona una opción para ver si es correcta y pide a la IA una explicación detallada. ¡Mucha suerte!
          <br />
          Resumen del análisis: {predictedData.analysisSummary.substring(0,150)}...
          {predictedData.recurringThemes && predictedData.recurringThemes.length > 0 && (
            <span className="block mt-1 text-sm">Temas principales: {predictedData.recurringThemes.join(', ')}.</span>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleReAnalyze} 
          disabled={isReAnalyzing || !predictedData?.originalDocumentContent}
          variant="outline"
          className="shadow-md"
        >
          {isReAnalyzing ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-5 w-5" />
          )}
          Re-analizar y Generar Nuevo Examen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictedData.questions.map((q: PredictedQuestion, index) => (
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
