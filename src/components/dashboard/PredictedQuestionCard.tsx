
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sparkles, Loader2, CheckCircle, XCircle, Lock, AlertTriangle } from 'lucide-react';
import type { PredictedQuestion } from '@/types';
import { useState, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/contexts/I18nContext';

interface PredictedQuestionCardProps {
  question: PredictedQuestion;
  onGetExplanation: (questionText: string, options: string[], correctAnswerIndex: number) => void;
  isExplainingCurrent: boolean;
  isExplanationDisabled?: boolean;
}

export default function PredictedQuestionCard({ question, onGetExplanation, isExplainingCurrent, isExplanationDisabled }: PredictedQuestionCardProps) {
  const { t } = useI18n();
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [answerRevealed, setAnswerRevealed] = useState(false);

  const handleOptionSelect = (index: number, event: MouseEvent<HTMLDivElement>) => {
    // Prevent accordion from toggling if the click is on an option
    event.stopPropagation();
    if (!answerRevealed) {
      setSelectedOptionIndex(index);
      setAnswerRevealed(true);
    }
  };

  const handleResetSelection = (event: MouseEvent<HTMLButtonElement>) => {
     event.stopPropagation();
    setSelectedOptionIndex(null);
    setAnswerRevealed(false);
  }

  // Defensive check: if for some reason a "test" question doesn't have options, don't crash.
  if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col border-destructive">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error en Pregunta
            </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Esta pregunta tipo test no tiene opciones válidas o no se generaron correctamente.</p>
          <p className="text-sm text-muted-foreground mt-2">Texto de la pregunta: {question.questionText}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-primary">{t('predictedQuestionCard.multipleChoiceQuestion')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-foreground leading-relaxed mb-4">{question.questionText}</p>
        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isSelected = selectedOptionIndex === index;
            const isCorrect = index === question.correctAnswerIndex;

            let optionClass = "bg-muted/30 hover:bg-muted/60 cursor-pointer";
            if (answerRevealed) {
              if (isCorrect) {
                optionClass = "border-green-500 bg-green-500/10 text-green-700";
              } else if (isSelected && !isCorrect) {
                optionClass = "border-red-500 bg-red-500/10 text-red-700";
              } else {
                optionClass = "border-gray-300 bg-gray-500/5 text-gray-600 opacity-70";
              }
            }

            return (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-md border text-sm flex items-center transition-all duration-150 ease-in-out",
                  optionClass,
                  !answerRevealed && "hover:shadow-md hover:scale-[1.01]"
                )}
                onClick={(e) => handleOptionSelect(index, e)}
                role="button"
                tabIndex={answerRevealed ? -1 : 0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOptionSelect(index, e as any);}}
              >
                {answerRevealed && (
                  isCorrect
                    ? <CheckCircle className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                    : (isSelected && !isCorrect
                        ? <XCircle className="h-5 w-5 mr-2 text-red-500 shrink-0" />
                        : <XCircle className="h-5 w-5 mr-2 text-gray-400 shrink-0 opacity-50" />)
                )}
                <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
              </div>
            );
          })}
        </div>
        {question.explanation && (
          <Accordion type="single" collapsible className="w-full mt-4">
            <AccordionItem value="explanation">
              <AccordionTrigger className="text-sm text-muted-foreground hover:text-accent">
                {t('predictedQuestionCard.viewBriefExplanation')}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-foreground/80 pt-2">
                {question.explanation}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      <CardFooter className="flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4">
        {answerRevealed && (
          <Button
            onClick={handleResetSelection}
            variant="outline"
            className="flex-1"
          >
            {t('predictedQuestionCard.tryAgainButton')}
          </Button>
        )}
        <Button
          onClick={(e) => {
            e.stopPropagation(); // Prevent accordion toggle if card content is wrapped in one
            if (question.options && typeof question.correctAnswerIndex === 'number') { // Ensure options and correctAnswerIndex are valid before calling
                 onGetExplanation(question.questionText, question.options, question.correctAnswerIndex);
            }
          }}
          disabled={isExplainingCurrent || isExplanationDisabled || typeof question.correctAnswerIndex !== 'number'}
          variant="outline"
          title={isExplanationDisabled ? t('predictedQuestionCard.getAIDetailsButtonProTooltip') : t('predictedQuestionCard.getAIDetailsButton')}
          className={cn(
            "bg-accent hover:bg-accent/90 text-accent-foreground border-accent hover:border-accent/90 flex-1",
            !answerRevealed && "sm:col-span-2 w-full"
          )}
        >
          {isExplainingCurrent ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('predictedQuestionCard.getAIDetailsButtonLoading')}
            </>
          ) : isExplanationDisabled ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              {t('predictedQuestionCard.getAIDetailsButtonPro')}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('predictedQuestionCard.getAIDetailsButton')}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
