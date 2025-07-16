
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useI18n } from '@/contexts/I18nContext';
import { LifeBuoy } from 'lucide-react';

interface SupportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export default function SupportFormDialog({ open, onOpenChange, userEmail }: SupportFormDialogProps) {
  const { t } = useI18n();
  const [value, setValue] = useState("item-1");

  const faqItems = [
    { id: "item-1", questionKey: "faq.q1", answerKey: "faq.a1" },
    { id: "item-2", questionKey: "faq.q2", answerKey: "faq.a2" },
    { id: "item-3", questionKey: "faq.q3", answerKey: "faq.a3" },
    { id: "item-4", questionKey: "faq.q4", answerKey: "faq.a4" },
    { id: "item-5", questionKey: "faq.q5", answerKey: "faq.a5" },
    { id: "item-6", questionKey: "faq.q6", answerKey: "faq.a6" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center gap-2">
            <LifeBuoy className="h-6 w-6"/>
            {t('supportForm.title')}
          </DialogTitle>
          <DialogDescription>{t('supportForm.description')}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="text-lg font-semibold mb-2">{t('faq.title')}</h3>
          <Accordion type="single" collapsible className="w-full" value={value} onValueChange={setValue}>
            {faqItems.map(item => (
              <AccordionItem value={item.id} key={item.id}>
                <AccordionTrigger>{t(item.questionKey)}</AccordionTrigger>
                <AccordionContent>
                  {t(item.answerKey)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t('common.close')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
