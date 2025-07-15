
"use client";

import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

export interface TutorialStep {
  title: string;
  content: string;
  icon?: LucideIcon;
}

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TutorialStep[];
}

export default function InteractiveTutorial({ isOpen, onClose, steps }: InteractiveTutorialProps) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Reset to the first step when the tutorial is opened
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose(); // Tutorial finished
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];
  const Icon = step.icon;
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center items-center">
          {Icon && <Icon className="h-12 w-12 text-primary mb-3" />}
          <DialogTitle className="text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground whitespace-pre-line">
            {step.content}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <Progress value={progressPercentage} className="w-full h-2.5" />
          <p className="text-center text-sm text-muted-foreground">
            {t('common.page')} {currentStep + 1} {t('common.of')} {steps.length}
          </p>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full">
          <Button
            variant="ghost"
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
            className={currentStep === 0 ? 'invisible' : ''}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('common.goBack')}
          </Button>
          <div className="flex justify-end gap-2">
            {!isLastStep && (
                 <Button variant="outline" onClick={onClose}>
                    {t('common.close')}
                </Button>
            )}
            <Button onClick={goToNextStep}>
              {isLastStep ? t('common.confirm') : t('common.nextButton')}
              {!isLastStep && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    