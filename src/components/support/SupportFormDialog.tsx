
"use client";

import { useState, type FormEvent } from 'react';
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
import { Loader2, Send } from 'lucide-react';

interface SupportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export default function SupportFormDialog({ open, onOpenChange, userEmail }: SupportFormDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [problemDescription, setProblemDescription] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!problemDescription.trim()) {
      toast({
        title: t('supportForm.validationErrorTitle'),
        description: t('supportForm.validationErrorDescription'),
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Support Request (Simulated):');
    console.log('User Email:', userEmail);
    console.log('Problem Description:', problemDescription);
    console.log('This would be sent to info@zeinte.com');

    toast({
      title: t('supportForm.requestSentTitle'),
      description: t('supportForm.requestSentDescription'),
      variant: 'default',
    });

    setIsSending(false);
    setProblemDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">{t('supportForm.title')}</DialogTitle>
          <DialogDescription>{t('supportForm.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
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
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSending}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t('supportForm.sendButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
