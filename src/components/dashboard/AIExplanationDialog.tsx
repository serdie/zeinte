
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl"> {/* MODIFIED: Removed max-h-[80vh] flex flex-col */}
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center gap-2">
            <BrainCircuit className="h-6 w-6" />
            Explicación IA
          </DialogTitle>
          {question && (
            <DialogDescription className="text-base text-muted-foreground pt-2">
              Pregunta: <span className="font-semibold text-foreground">{question}</span>
            </DialogDescription>
          )}
        </DialogHeader>
        {/* MODIFIED: Changed ScrollArea to use max-h and restored pr-6 -mr-6. Removed h-0 and flex-grow. */}
        <ScrollArea className="max-h-[60vh] pr-6 -mr-6"> 
          {isLoading ? (
            <div className="space-y-3 py-4"> {/* MODIFIED: Removed px-1 */}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : explanation ? (
            <div
              className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none py-4 text-foreground" /* MODIFIED: Removed px-1 */
              dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br />') }}
            />
          ) : (
            <p className="py-4 text-muted-foreground">No hay explicación disponible o la pregunta no fue seleccionada.</p> /* MODIFIED: Removed px-1 */
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
