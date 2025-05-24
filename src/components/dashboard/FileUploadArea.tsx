
"use client";

import type React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, UploadCloud, XCircle, AlertTriangle, Search, CheckSquare, Square, Brain } from 'lucide-react'; // Added Brain
import { useToast } from "@/hooks/use-toast";
import { EXAM_CONFIG_KEY } from '@/lib/localStorageKeys';
import type { ExamConfig } from '@/types';
import { findExternalDocuments, type FindExternalDocumentsOutput, type DocumentSearchResult } from '@/ai/flows/find-external-documents';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';

interface FileUploadAreaProps {
  onAnalyze: (content: string, numQuestions: number) => Promise<void>;
  isLoading: boolean;
}

const MAX_FILES_UPLOAD = 30;
const DEFAULT_NUM_QUESTIONS = 10;
const MAX_TOTAL_SIZE_MB = 5; 
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function FileUploadArea({ onAnalyze, isLoading }: FileUploadAreaProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [numQuestions, setNumQuestions] = useState<string>(DEFAULT_NUM_QUESTIONS.toString());
  const { toast } = useToast();

  const [deepSearchTopic, setDeepSearchTopic] = useState("");
  const [deepSearchResults, setDeepSearchResults] = useState<FindExternalDocumentsOutput | null>(null);
  const [selectedDeepSearchDocIds, setSelectedDeepSearchDocIds] = useState<string[]>([]);
  const [isDeepSearching, setIsDeepSearching] = useState(false);

  const totalSizeInBytes = useMemo(() => {
    return selectedFiles.reduce((acc, file) => acc + file.size, 0);
  }, [selectedFiles]);

  useEffect(() => {
    const storedConfig = localStorage.getItem(EXAM_CONFIG_KEY);
    if (storedConfig) {
      try {
        const parsedConfig: ExamConfig = JSON.parse(storedConfig);
        if (parsedConfig.defaultNumberOfQuestions) {
          setNumQuestions(parsedConfig.defaultNumberOfQuestions.toString());
        }
      } catch (error) {
        console.error("Error parsing exam config for FileUploadArea:", error);
      }
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      if (selectedFiles.length + newFiles.length > MAX_FILES_UPLOAD) {
        toast({
          title: "Límite de archivos excedido",
          description: `Puedes subir un máximo de ${MAX_FILES_UPLOAD} archivos a la vez.`,
          variant: "destructive",
        });
        event.target.value = ""; 
        return;
      }
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles].slice(0, MAX_FILES_UPLOAD));
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };

  const handleDeepSearch = async () => {
    if (!deepSearchTopic.trim()) {
      toast({ title: "Tema vacío", description: "Por favor, introduce un tema para la búsqueda.", variant: "destructive" });
      return;
    }
    setIsDeepSearching(true);
    setDeepSearchResults(null);
    setSelectedDeepSearchDocIds([]);
    try {
      toast({
        title: "Buscando Sugerencias IA...",
        description: "La IA está generando ideas de documentos relevantes para tu tema. Esto puede tardar unos momentos.",
      });
      const results = await findExternalDocuments({ topic: deepSearchTopic });
      setDeepSearchResults(results);
      if (results.results.length === 0 && results.message.includes("no pudo generar sugerencias")) {
         toast({
            title: "Sugerencias IA",
            description: results.message,
            variant: "default",
            duration: 7000,
        });
      } else if (results.results.length > 0) {
         toast({
            title: "Sugerencias IA Listas",
            description: `Se encontraron ${results.results.length} sugerencias. Recuerda que el contenido detallado es simulado.`,
            variant: "default",
        });
      }

    } catch (error) {
      console.error("Error during deep search:", error);
      toast({ title: "Error en la Búsqueda IA", description: (error instanceof Error ? error.message : "No se pudieron obtener sugerencias de documentos."), variant: "destructive" });
    } finally {
      setIsDeepSearching(false);
    }
  };

  const toggleDeepSearchDocSelection = (docId: string) => {
    setSelectedDeepSearchDocIds(prevSelected =>
      prevSelected.includes(docId)
        ? prevSelected.filter(id => id !== docId)
        : [...prevSelected, docId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 && selectedDeepSearchDocIds.length === 0) {
      toast({
        title: "No hay contenido seleccionado",
        description: "Por favor, selecciona al menos un archivo para subir o un documento de la búsqueda IA.",
        variant: "destructive",
      });
      return;
    }

    if (totalSizeInBytes > MAX_TOTAL_SIZE_BYTES) {
        toast({
            title: "Tamaño total excede el límite sugerido",
            description: `El tamaño total de los archivos (${formatBytes(totalSizeInBytes)}) excede el límite sugerido de ${MAX_TOTAL_SIZE_MB}MB. Esto podría afectar la función de "Re-analizar". Puedes continuar, pero tenlo en cuenta.`,
            variant: "destructive",
            duration: 7000,
        });
    }

    let allFilesContent = "";
    const filePromises = selectedFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (eventReader) => {
          const text = eventReader.target?.result as string;
          resolve(`Contenido del archivo: ${file.name}\n\n${text}\n\n---\n\n`);
        };
        reader.onerror = (errorReader) => {
          console.error("Error reading file:", file.name, errorReader);
          reject(`Error al leer el archivo ${file.name}`);
        };
        reader.readAsText(file);
      });
    });

    try {
      const fileContents = await Promise.all(filePromises);
      allFilesContent = fileContents.join('');

      const deepSearchDocsContent = deepSearchResults?.results
        .filter(doc => selectedDeepSearchDocIds.includes(doc.id))
        .map(doc => `Contenido del documento (sugerido por IA): ${doc.title}\n\n${doc.simulatedTextContent}\n\n---\n\n`)
        .join('') || "";
      
      allFilesContent += deepSearchDocsContent;

      if (!allFilesContent.trim()) {
        toast({
          title: "Contenido vacío",
          description: "No se pudo extraer texto de los archivos seleccionados o los documentos de IA no tienen contenido simulado.",
          variant: "destructive",
        });
        return;
      }
      onAnalyze(allFilesContent, parseInt(numQuestions, 10));
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Error al procesar archivos",
        description: typeof error === 'string' ? error : "Hubo un problema al leer los archivos.",
        variant: "destructive",
      });
    }
  };

  const filesProgress = (selectedFiles.length / MAX_FILES_UPLOAD) * 100;
  const sizeProgress = Math.min((totalSizeInBytes / MAX_TOTAL_SIZE_BYTES) * 100, 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <UploadCloud className="h-7 w-7 text-primary" />
            Subir Documentos Manualmente
          </CardTitle>
          <CardDescription>
            Selecciona archivos (.pdf, .doc, .docx, .txt) desde tu dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="file-upload" className="sr-only">
              Seleccionar archivos
            </Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileChange}
              className="text-sm p-2 rounded-md shadow-sm focus:ring-primary focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              disabled={isLoading || isDeepSearching}
              accept=".pdf,.doc,.docx,.txt"
            />
             <p className="mt-2 text-xs text-muted-foreground">
              Archivos soportados: PDF, DOC, DOCX, TXT. Máximo {MAX_FILES_UPLOAD} archivos.
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="files-progress" className="text-sm font-medium">Archivos seleccionados:</Label>
                  <span className="text-xs text-muted-foreground">{selectedFiles.length} / {MAX_FILES_UPLOAD}</span>
                </div>
                <Progress value={filesProgress} id="files-progress" className="w-full h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="size-progress" className="text-sm font-medium">Tamaño total estimado:</Label>
                  <span className="text-xs text-muted-foreground">{formatBytes(totalSizeInBytes)} / {MAX_TOTAL_SIZE_MB} MB</span>
                </div>
                <Progress value={sizeProgress} id="size-progress" className="w-full h-2" 
                          aria-label={`Progreso de tamaño: ${sizeProgress.toFixed(0)}%`} />
                {totalSizeInBytes > MAX_TOTAL_SIZE_BYTES * 0.8 && (
                     <div className="mt-2 text-xs text-amber-600 flex items-start gap-1">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>
                        El almacenamiento en el navegador es limitado. Si el tamaño es muy grande, la función "Re-analizar" podría no funcionar.
                        </span>
                    </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Lista de Archivos ({selectedFiles.length}):</h4>
                <ul className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2 bg-muted/50">
                  {selectedFiles.map(file => (
                    <li key={file.name} className="text-xs text-foreground flex justify-between items-center p-1.5 bg-background rounded shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate" title={file.name}>{file.name}</span>
                        <span className="text-muted-foreground text-nowrap shrink-0">({formatBytes(file.size)})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeFile(file.name)}
                        disabled={isLoading || isDeepSearching}
                        aria-label={`Quitar ${file.name}`}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Brain className="h-7 w-7 text-accent" /> {/* Changed icon to Brain */}
            Sugerencias IA de Documentos
          </CardTitle>
          <CardDescription>
            Introduce un tema y la IA sugerirá títulos y resúmenes de documentos relevantes. Podrás añadir su contenido simulado al análisis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="deep-search-topic">Tema de Búsqueda:</Label>
            <div className="flex gap-2">
              <Input
                id="deep-search-topic"
                type="text"
                value={deepSearchTopic}
                onChange={(e) => setDeepSearchTopic(e.target.value)}
                placeholder="Ej: Oposición agente forestal, Historia de España S.XX"
                className="text-sm"
                disabled={isLoading || isDeepSearching}
              />
              <Button onClick={handleDeepSearch} disabled={isLoading || isDeepSearching || !deepSearchTopic.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isDeepSearching ? <Loader2 className="animate-spin" /> : <Search className="h-5 w-5" />}
                <span className="ml-2">Sugerir</span>
              </Button>
            </div>
          </div>

          {isDeepSearching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="ml-2 text-muted-foreground">IA generando sugerencias...</p>
            </div>
          )}

          {deepSearchResults && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground italic">{deepSearchResults.message}</p>
              {deepSearchResults.results.length > 0 && (
                 <div className="space-y-2 max-h-60 overflow-y-auto border p-3 rounded-md bg-muted/30">
                  <h4 className="text-sm font-medium text-foreground">Sugerencias de la IA ({deepSearchResults.results.length}):</h4>
                  {deepSearchResults.results.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-2 p-2 bg-background rounded-md shadow-sm hover:bg-muted/50">
                      <Checkbox
                        id={`ds-${doc.id}`}
                        checked={selectedDeepSearchDocIds.includes(doc.id)}
                        onCheckedChange={() => toggleDeepSearchDocSelection(doc.id)}
                        disabled={isLoading || isDeepSearching}
                        aria-label={`Seleccionar ${doc.title}`}
                      />
                      <Label htmlFor={`ds-${doc.id}`} className="text-xs font-normal flex-1 cursor-pointer">
                        <span className="font-medium text-foreground block">{doc.title}</span>
                        <span className="text-muted-foreground text-xs block">{doc.source}</span>
                         <p className="text-xs text-muted-foreground/80 mt-1">{doc.simulatedTextContent.split('\n\n')[0]}</p> {/* Show abstract */}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6 p-6 border rounded-lg shadow-lg bg-card">
          <div className="space-y-2">
            <Label htmlFor="num-questions-select" className="text-lg font-semibold text-primary">Configuración Final del Análisis:</Label>
            <p className="text-sm text-muted-foreground">Define cuántas preguntas quieres generar a partir de todos los documentos (subidos manualmente y/o seleccionados de las sugerencias IA).</p>
            <Select value={numQuestions} onValueChange={setNumQuestions} disabled={isLoading || isDeepSearching}>
              <SelectTrigger id="num-questions-select" className="w-full sm:w-[250px] text-base py-3">
                <SelectValue placeholder="Selecciona cantidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 preguntas</SelectItem>
                <SelectItem value="10">10 preguntas</SelectItem>
                <SelectItem value="15">15 preguntas</SelectItem>
                <SelectItem value="20">20 preguntas</SelectItem>
                <SelectItem value="25">25 preguntas</SelectItem>
                <SelectItem value="30">30 preguntas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            onClick={handleSubmit}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-lg font-semibold rounded-lg shadow-md transition-transform duration-150 ease-in-out active:scale-95"
            disabled={isLoading || isDeepSearching || (selectedFiles.length === 0 && selectedDeepSearchDocIds.length === 0)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Analizando Contenido...
              </>
            ) : (
              'Analizar y Predecir Preguntas'
            )}
          </Button>
      </div>
    </div>
  );
}

