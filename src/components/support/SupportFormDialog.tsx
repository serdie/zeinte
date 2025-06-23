
"use client";

import { useState, type MouseEvent } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { Send } from 'lucide-react';

interface SupportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export default function SupportFormDialog({ open, onOpenChange, userEmail }: SupportFormDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [problemDescription, setProblemDescription] = useState('');

  const handleSendEmail = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!problemDescription.trim()) {
      toast({
        title: t('supportForm.validationErrorTitle'),
        description: t('supportForm.validationErrorDescription'),
        variant: 'destructive',
      });
      return;
    }

    const subject = encodeURIComponent(`Soporte Zeinte - Consulta de ${userEmail}`);
    const body = encodeURIComponent(problemDescription);
    const mailtoLink = `mailto:info@zeinte.com?subject=${subject}&body=${body}`;

    // Open email client
    window.location.href = mailtoLink;

    toast({
      title: t('supportForm.requestSentTitle'),
      description: t('supportForm.requestSentDescription'),
      variant: 'default',
    });

    onOpenChange(false);
    setProblemDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">{t('supportForm.title')}</DialogTitle>
          <DialogDescription>{t('supportForm.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="support-email">{t('supportForm.emailLabel')}</Label>
            <Input id="support-email" type="email" value={userEmail} disabled className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-problem">{t('supportForm.problemLabel')}</Label>
            <Textarea
              id="support-problem"
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder={t('supportForm.problemPlaceholder')}
              rows={6}
              required
            />
          </div>
        </div>
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t('common.cancel')}
            </Button>
          </DialogClose>
          <Button onClick={handleSendEmail} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Send className="mr-2 h-4 w-4" />
            {t('supportForm.sendButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
