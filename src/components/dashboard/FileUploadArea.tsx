"use client";

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface FileUploadAreaProps {
  onAnalyze: (content: string) => Promise<void>;
  isLoading: boolean;
}

export default function FileUploadArea({ onAnalyze, isLoading }: FileUploadAreaProps) {
  const [documentContent, setDocumentContent] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentContent.trim()) {
      // Optionally, show a toast message for empty content
      alert("Por favor, pega el contenido del documento.");
      return;
    }
    onAnalyze(documentContent);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Subir Contenido de Documentos</CardTitle>
        <CardDescription>
          Pega el texto de tus exámenes, temarios o apuntes aquí. El sistema los analizará para predecir preguntas de examen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Textarea
            placeholder="Pega aquí el contenido de tu documento..."
            value={documentContent}
            onChange={(e) => setDocumentContent(e.target.value)}
            rows={15}
            className="text-sm p-4 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-semibold rounded-md shadow-md transition-transform duration-150 ease-in-out active:scale-95"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analizando...
              </>
            ) : (
              'Analizar y Predecir Preguntas'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
