
"use client";

import type React from 'react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Changed from Textarea
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, UploadCloud, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface FileUploadAreaProps {
  onAnalyze: (content: string) => Promise<void>;
  isLoading: boolean;
}

export default function FileUploadArea({ onAnalyze, isLoading }: FileUploadAreaProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      // Basic validation for demonstration (e.g., limit number of files or total size)
      if (selectedFiles.length + newFiles.length > 10) {
        toast({
          title: "Límite de archivos excedido",
          description: "Puedes subir un máximo de 10 archivos a la vez.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast({
        title: "No hay archivos seleccionados",
        description: "Por favor, selecciona al menos un archivo para analizar.",
        variant: "destructive",
      });
      return;
    }

    let allFilesContent = "";
    const filePromises = selectedFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          resolve(`Contenido del archivo: ${file.name}\n\n${text}\n\n---\n\n`);
        };
        reader.onerror = (e) => {
          console.error("Error reading file:", file.name, e);
          reject(`Error al leer el archivo ${file.name}`);
        };
        // This will attempt to read all files as text.
        // For DOCX/PDF, this will not produce human-readable content without specialized libraries.
        // This is a simplified approach.
        reader.readAsText(file);
      });
    });

    try {
      const fileContents = await Promise.all(filePromises);
      allFilesContent = fileContents.join('');
      if (!allFilesContent.trim()) {
        toast({
          title: "Contenido vacío",
          description: "No se pudo extraer texto de los archivos seleccionados o están vacíos.",
          variant: "destructive",
        });
        return;
      }
      onAnalyze(allFilesContent);
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Error al procesar archivos",
        description: typeof error === 'string' ? error : "Hubo un problema al leer los archivos.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <UploadCloud className="h-7 w-7 text-primary" />
          Subir Documentos
        </CardTitle>
        <CardDescription>
          Selecciona archivos (.pdf, .doc, .docx, .txt) desde tu dispositivo. El sistema intentará extraer el texto para analizarlo y predecir preguntas de examen.
          <br />
          <span className="text-xs text-muted-foreground">Nota: La extracción de texto de PDF y Word puede ser limitada.</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="file-upload" className="sr-only">
              Seleccionar archivos
            </label>
            <Input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileChange}
              className="text-sm p-2 rounded-md shadow-sm focus:ring-primary focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              disabled={isLoading}
              accept=".pdf,.doc,.docx,.txt"
            />
             <p className="mt-2 text-xs text-muted-foreground">
              Archivos soportados: PDF, DOC, DOCX, TXT. Máximo 10 archivos.
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Archivos Seleccionados:</h4>
              <ul className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2 bg-muted/50">
                {selectedFiles.map(file => (
                  <li key={file.name} className="text-xs text-foreground flex justify-between items-center p-1.5 bg-background rounded shadow-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="truncate max-w-xs" title={file.name}>{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(file.name)}
                      disabled={isLoading}
                      aria-label={`Quitar ${file.name}`}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-semibold rounded-md shadow-md transition-transform duration-150 ease-in-out active:scale-95"
            disabled={isLoading || selectedFiles.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analizando Archivos...
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
