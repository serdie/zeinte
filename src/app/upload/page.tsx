
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUploadArea from '@/components/dashboard/FileUploadArea';
import { analyzeDocuments, type AnalyzeDocumentsOutput } from '@/ai/flows/analyze-documents';
import { predictExamQuestions, type PredictExamQuestionsOutput } from '@/ai/flows/predict-exam-questions';
import { useToast } from "@/hooks/use-toast";
import { PREDICTED_DATA_KEY } from '@/lib/localStorageKeys';
import type { PredictedData } from '@/types';

export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAnalyze = async (content: string, numQuestions: number) => {
    setIsLoading(true);
    try {
      toast({
        title: "Procesando Documento",
        description: "Analizando el contenido de tu documento en profundidad...",
      });
      const analysisResult: AnalyzeDocumentsOutput = await analyzeDocuments({ documentContent: content });
      
      toast({
        title: "Análisis Completo",
        description: "Generando predicciones de preguntas basadas en el análisis detallado...",
      });
      const predictionResult: PredictExamQuestionsOutput = await predictExamQuestions({ 
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes,
        numberOfQuestions: numQuestions,
        identifiedExamPatterns: analysisResult.identifiedExamPatterns,
        potentialFocusAreas: analysisResult.potentialFocusAreas,
      });

      const dataToStore: PredictedData = {
        questions: predictionResult.questions,
        analysisSummary: analysisResult.summary,
        recurringThemes: analysisResult.recurringThemes,
        timestamp: Date.now(),
        originalDocumentContent: content,
        requestedNumberOfQuestions: numQuestions,
        identifiedExamPatterns: analysisResult.identifiedExamPatterns,
        potentialFocusAreas: analysisResult.potentialFocusAreas,
      };

      localStorage.setItem(PREDICTED_DATA_KEY, JSON.stringify(dataToStore));

      toast({
        title: "¡Éxito!",
        description: "Preguntas predichas y listas para estudiar. Redirigiendo al panel...",
        variant: "default",
      });
      
      router.push('/dashboard'); // MODIFIED: Redirect to dashboard

    } catch (error) {
      console.error("Error during AI processing:", error);
      toast({
        title: "Error en el Procesamiento",
        description: (error instanceof Error ? error.message : "Hubo un problema al analizar el documento o predecir preguntas.") + " Inténtalo de nuevo.",
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
