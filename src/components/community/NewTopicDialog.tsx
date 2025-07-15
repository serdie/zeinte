
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';

interface NewTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTopicCreated: () => void;
}

export default function NewTopicDialog({ open, onOpenChange, onTopicCreated }: NewTopicDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentUser) {
        toast({ title: "Error de autenticación", description: "Debes haber iniciado sesión para crear un tema.", variant: "destructive" });
        return;
    }
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Campos requeridos",
        description: "El título y el contenido del primer mensaje no pueden estar vacíos.",
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
        const batch = writeBatch(db);
        
        // 1. Create the topic document
        const topicRef = doc(collection(db, "forumTopics"));
        const now = serverTimestamp();
        batch.set(topicRef, {
            title: title,
            description: content.substring(0, 150) + (content.length > 150 ? '...' : ''), // Auto-generate description
            authorId: currentUser.uid,
            createdAt: now,
            lastActivity: now,
            postCount: 1,
            views: 0,
        });

        // 2. Create the first post document
        const postRef = doc(collection(db, "forumPosts"));
        batch.set(postRef, {
            topicId: topicRef.id,
            userId: currentUser.uid,
            content: content,
            timestamp: now,
            likes: 0,
        });

        await batch.commit();

        toast({
            title: "¡Tema Creado!",
            description: "Tu nuevo tema ha sido publicado en la comunidad.",
            variant: 'default',
        });
        
        onTopicCreated();
        onOpenChange(false);
        setTitle('');
        setContent('');

    } catch (error) {
        console.error("Error creating new topic:", error);
        toast({ title: "Error", description: "No se pudo crear el tema. Por favor, inténtalo de nuevo.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Crear Nuevo Tema</DialogTitle>
          <DialogDescription>Inicia una nueva conversación en la comunidad. Un buen título ayuda a atraer respuestas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="topic-title">Título del Tema</Label>
            <Input 
                id="topic-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Dudas sobre la Ley 39/2015"
                required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-content">Contenido del Primer Mensaje</Label>
            <Textarea
              id="topic-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe aquí tu pregunta o el contenido para iniciar el debate..."
              rows={8}
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Publicar Tema
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
