
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PredictedQuestionCard from '@/components/dashboard/PredictedQuestionCard';
import AIExplanationDialog from '@/components/dashboard/AIExplanationDialog';
import { generateAIExplanation, type GenerateAIExplanationOutput } from '@/ai/flows/generate-ai-explanations';
import { PREDICTED_DATA_KEY } from '@/lib/localStorageKeys';
import type { PredictedData, AIExplanation, PredictedQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, Info, BookOpenText, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [predictedData, setPredictedData] = useState<PredictedData | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  
  const [currentExplanation, setCurrentExplanation] = useState<AIExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [selectedQuestionTextForExplanation, setSelectedQuestionTextForExplanation] = useState<string | null>(null);
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const storedData = localStorage.getItem(PREDICTED_DATA_KEY);
    if (storedData) {
      try {
        const parsedData: PredictedData = JSON.parse(storedData);
        // Basic validation for new question format
        if (parsedData.questions && parsedData.questions.length > 0 && typeof parsedData.questions[0] === 'string') {
          // Old format detected, clear it to avoid errors
          console.warn("Old question format detected in localStorage. Clearing data.");
          localStorage.removeItem(PREDICTED_DATA_KEY);
          setPredictedData(null);
        } else {
          setPredictedData(parsedData);
        }
      } catch (error) {
        console.error("Failed to parse predicted data from localStorage", error);
        localStorage.removeItem(PREDICTED_DATA_KEY);
        setPredictedData(null); // Ensure state is reset on error
      }
    }
    setIsLoadingInitialData(false);
  }, []);

  const handleGetExplanation = useCallback(async (questionText: string) => {
    setSelectedQuestionTextForExplanation(questionText);
    setIsExplaining(true);
    setIsExplanationDialogOpen(true);
    setCurrentExplanation(null); // Clear previous explanation

    try {
      const topic = predictedData?.recurringThemes?.[0] || "Tema General";
      
      const result: GenerateAIExplanationOutput = await generateAIExplanation({ question: questionText, topic });
      setCurrentExplanation({ question: questionText, explanation: result.explanation, topic });
    } catch (error) {
      console.error("Error generating AI explanation:", error);
      toast({
        title: "Error al generar explicación",
        description: "No se pudo obtener la explicación detallada. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsExplaining(false);
    }
  }, [predictedData, toast]);

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
          ¡También puedes ver una breve explicación de la respuesta correcta! ¡Mucha suerte!
          <br />
          Resumen del análisis: {predictedData.analysisSummary.substring(0,150)}...
          {predictedData.recurringThemes && predictedData.recurringThemes.length > 0 && (
            <span className="block mt-1 text-sm">Temas principales: {predictedData.recurringThemes.join(', ')}.</span>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictedData.questions.map((q: PredictedQuestion, index) => (
          <PredictedQuestionCard
            key={index}
            question={q}
            onGetExplanation={handleGetExplanation}
            isExplainingCurrent={isExplaining && selectedQuestionTextForExplanation === q.questionText}
          />
        ))}
      </div>

      <AIExplanationDialog
        open={isExplanationDialogOpen}
        onOpenChange={setIsExplanationDialogOpen}
        question={currentExplanation?.question || selectedQuestionTextForExplanation}
        explanation={currentExplanation?.explanation || null}
        isLoading={isExplaining && !currentExplanation}
      />
    </div>
  );
}
