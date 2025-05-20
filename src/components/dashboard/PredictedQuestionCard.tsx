
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { PredictedQuestion } from '@/types';
import { useState } from 'react';

interface PredictedQuestionCardProps {
  question: PredictedQuestion;
  onGetExplanation: (questionText: string) => void;
  isExplainingCurrent: boolean;
}

export default function PredictedQuestionCard({ question, onGetExplanation, isExplainingCurrent }: PredictedQuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-primary">Pregunta Tipo Test</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-foreground leading-relaxed mb-4">{question.questionText}</p>
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border text-sm flex items-center
                ${showAnswer ? (index === question.correctAnswerIndex ? 'border-green-500 bg-green-500/10 text-green-700' : 'border-red-500 bg-red-500/10 text-red-700') : 'bg-muted/30 hover:bg-muted/60'}`}
            >
              {showAnswer && (
                index === question.correctAnswerIndex 
                  ? <CheckCircle className="h-5 w-5 mr-2 text-green-500 shrink-0" /> 
                  : <XCircle className="h-5 w-5 mr-2 text-red-500 shrink-0" />
              )}
              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
              {option}
            </div>
          ))}
        </div>
        {question.explanation && (
          <Accordion type="single" collapsible className="w-full mt-4">
            <AccordionItem value="explanation">
              <AccordionTrigger className="text-sm text-muted-foreground hover:text-accent">
                Ver explicación de la respuesta
              </AccordionTrigger>
              <AccordionContent className="text-sm text-foreground/80 pt-2">
                {question.explanation}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

      </CardContent>
      <CardFooter className="flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Button
          onClick={() => setShowAnswer(!showAnswer)}
          variant="outline"
          className="flex-1"
        >
          {showAnswer ? 'Ocultar Respuesta' : 'Mostrar Respuesta'}
        </Button>
        <Button
          onClick={() => onGetExplanation(question.questionText)}
          disabled={isExplainingCurrent}
          variant="outline"
          className="bg-accent hover:bg-accent/90 text-accent-foreground border-accent hover:border-accent/90 flex-1"
        >
          {isExplainingCurrent ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Obteniendo IA...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Más Detalles (IA)
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

