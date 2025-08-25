
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { BrainCircuit } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

interface AIExplanationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: string | null;
  explanation: string | null;
  isLoading: boolean;
}

export default function AIExplanationDialog({
  open,
  onOpenChange,
  question,
  explanation,
  isLoading,
}: AIExplanationDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center gap-2">
            <BrainCircuit className="h-6 w-6" />
            {t('aiExplanationDialog.title')}
          </DialogTitle>
          {question && (
            <DialogDescription className="text-base text-muted-foreground pt-2">
              {t('aiExplanationDialog.questionLabel')} <span className="font-semibold text-foreground">{question}</span>
            </DialogDescription>
          )}
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4"> 
          {isLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : explanation ? (
            <div
              className="prose prose-sm sm:prose max-w-none py-4 text-foreground"
              dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br />') }}
            />
          ) : (
            <p className="py-4 text-muted-foreground">{t('aiExplanationDialog.noExplanation')}</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

    