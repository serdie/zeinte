
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip, Send, Brain, Loader2 } from 'lucide-react';
import type { PredictedQuestion } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';

interface WrittenQuestionCardProps {
  question: PredictedQuestion;
  // Placeholder for AI analysis function in the future
  // onAnalyzeAnswer?: (questionText: string, answerText?: string, answerImage?: File) => Promise<void>;
}

export default function WrittenQuestionCard({ question /*, onAnalyzeAnswer */ }: WrittenQuestionCardProps) {
  const { t } = useI18n();
  const [answerText, setAnswerText] = useState("");
  const [answerImage, setAnswerImage] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // For future AI analysis
  const { toast } = useToast();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAnswerImage(event.target.files[0]);
    } else {
      setAnswerImage(null);
    }
  };

  const handleSubmitForAnalysis = async () => {
    // This part will be implemented in the future when the AI analysis flow is ready
    setIsAnalyzing(true);
    toast({
      title: t('writtenQuestionCard.analysisSoonTitle'),
      description: t('writtenQuestionCard.analysisSoonDescription'),
      variant: "default"
    });
    // Simulating a delay for now
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setIsAnalyzing(false);

    // Example of future call:
    // if (onAnalyzeAnswer) {
    //   try {
    //     await onAnalyzeAnswer(question.questionText, answerText, answerImage || undefined);
    //     // Handle display of results
    //   } catch (error) {
    //     toast({ title: "Error", description: "Failed to analyze answer.", variant: "destructive" });
    //   } finally {
    //     setIsAnalyzing(false);
    //   }
    // } else {
    //   setIsAnalyzing(false);
    // }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-primary">{t('writtenQuestionCard.cardTitle')}</CardTitle>
        <CardDescription>{t('writtenQuestionCard.cardDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <p className="text-foreground leading-relaxed mb-4 whitespace-pre-line">{question.questionText}</p>
        
        {question.explanation && (
            <Alert variant="default" className="bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400">
                <Brain className="h-4 w-4" />
                <AlertTitle>{t('writtenQuestionCard.idealAnswerHintTitle')}</AlertTitle>
                <AlertDescription>
                    {question.explanation}
                </AlertDescription>
            </Alert>
        )}

        <div>
          <Label htmlFor={`written-answer-${question.questionText.slice(0,10)}`} className="mb-1 block text-sm font-medium text-muted-foreground">
            {t('writtenQuestionCard.yourAnswerLabel')}
          </Label>
          <Textarea
            id={`written-answer-${question.questionText.slice(0,10)}`}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder={t('writtenQuestionCard.answerPlaceholder')}
            rows={6}
            className="bg-background"
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor={`image-answer-${question.questionText.slice(0,10)}`} className="text-sm font-medium text-muted-foreground">
            {t('writtenQuestionCard.uploadImageLabel')} <span className="text-xs">({t('writtenQuestionCard.optionalLabel')})</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id={`image-answer-${question.questionText.slice(0,10)}`}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-xs p-1 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {answerImage && (
              <Button variant="ghost" size="sm" onClick={() => setAnswerImage(null)} className="text-xs">
                {t('writtenQuestionCard.removeImageButton')}
              </Button>
            )}
          </div>
          {answerImage && <p className="text-xs text-muted-foreground mt-1">{t('writtenQuestionCard.selectedFileLabel')}: {answerImage.name}</p>}
        </div>

      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmitForAnalysis} 
          disabled={isAnalyzing || (!answerText && !answerImage)}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isAnalyzing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {t('writtenQuestionCard.submitForAnalysisButton')} ({t('common.soon')})
        </Button>
      </CardFooter>
    </Card>
  );
}

// Minimal Alert component structure for the hint (can be expanded or imported if you have a full Alert component)
const Alert: React.FC<{children: React.ReactNode, className?: string, variant?: string}> = ({children, className}) => (
    <div className={`p-3 border rounded-md text-sm ${className}`}>
        {children}
    </div>
);
const AlertTitle: React.FC<{children: React.ReactNode, className?: string}> = ({children, className}) => (
    <h5 className={`font-medium mb-1 ${className}`}>{children}</h5>
);
const AlertDescription: React.FC<{children: React.ReactNode, className?: string}> = ({children, className}) => (
    <div className={`${className}`}>{children}</div>
);
