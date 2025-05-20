"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';

interface PredictedQuestionCardProps {
  question: string;
  onGetExplanation: (question: string) => void;
  isExplainingCurrent: boolean; // Is this specific card's question being explained?
}

export default function PredictedQuestionCard({ question, onGetExplanation, isExplainingCurrent }: PredictedQuestionCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-primary">Pregunta Predicha</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-foreground leading-relaxed">{question}</p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onGetExplanation(question)} 
          disabled={isExplainingCurrent}
          variant="outline"
          className="bg-accent hover:bg-accent/90 text-accent-foreground border-accent hover:border-accent/90"
        >
          {isExplainingCurrent ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Obteniendo...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Obtener Explicación IA
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
