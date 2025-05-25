
"use client";

import type React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, FileText, UploadCloud, XCircle, AlertTriangle, Search, Brain, LibraryBig, Users, User, Sparkles, Building, School, Briefcase, Lock, ExternalLink } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { EXAM_CONFIG_KEY, FREE_USER_LAST_GENERATION_TIMESTAMP_KEY } from '@/lib/localStorageKeys';
import type { ExamConfig } from '@/types';
import { findExternalDocuments, type FindExternalDocumentsOutput } from '@/ai/flows/find-external-documents';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradeProAlert } from '@/components/ui/upgrade-pro-alert';
import { db } from '@/firebase/config'; // Import db
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

interface FileUploadAreaProps {
  onAnalyze: (content: string, numQuestions: number) => Promise<void>;
  isLoading: boolean;
}

// Default values, will be overridden by Firestore settings if available
const DEFAULT_MAX_FILES_UPLOAD = 30;
const DEFAULT_MAX_TOTAL_SIZE_MB = 5; 

const FREE_USER_MAX_QUESTIONS_TO_GENERATE = "5";
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

interface CommonExam {
  id: string;
  name: string;
  category: 'Universidad' | 'Oposición';
  logoPlaceholder: string;
  logoHint: string;
  keywords: string;
  icon: React.ElementType;
}

const commonExams: CommonExam[] = [
  { id: 'ucm', name: 'Universidad Complutense', category: 'Universidad', logoPlaceholder: 'https://placehold.co/80x40.png', logoHint: 'university campus', keywords: 'exámenes Universidad Complutense Madrid', icon: School },
  { id: 'uab', name: 'Universitat Autònoma BCN', category: 'Universidad', logoPlaceholder: 'https://placehold.co/80x40.png', logoHint: 'modern university', keywords: 'exámenes Universitat Autònoma Barcelona', icon: School },
  { id: 'us', name: 'Universidad de Sevilla', category: 'Universidad', logoPlaceholder: 'https://placehold.co/80x40.png', logoHint: 'historic university', keywords: 'exámenes Universidad de Sevilla', icon: School },
  { id: 'admin_estado', name: 'Administrativo del Estado', category: 'Oposición', logoPlaceholder: 'https://placehold.co/60x60.png', logoHint: 'government building', keywords: 'oposición Administrativo del Estado', icon: Briefcase },
  { id: 'hacienda', name: 'Agente de Hacienda', category: 'Oposición', logoPlaceholder: 'https://placehold.co/60x60.png', logoHint: 'tax office', keywords: 'oposición Agente Hacienda Pública', icon: Briefcase },
  { id: 'agente_forestal', name: 'Agente Forestal', category: 'Oposición', logoPlaceholder: 'https://placehold.co/60x60.png', logoHint: 'forest ranger', keywords: 'oposición Agente Forestal', icon: Briefcase },
];

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
  const [numQuestions, setNumQuestions] = useState<string>(FREE_USER_MAX_QUESTIONS_TO_GENERATE); // Default to free user limit initially
  const { toast } = useToast();
  const { userTier, isFirebaseConfigured } = useAuth();
  const isFreeUser = userTier === 'free';

  const [appUploadLimits, setAppUploadLimits] = useState({
    maxFiles: DEFAULT_MAX_FILES_UPLOAD,
    maxSizeMB: DEFAULT_MAX_TOTAL_SIZE_MB,
  });
  const [isLoadingAppSettings, setIsLoadingAppSettings] = useState(true);

  const [deepSearchTopic, setDeepSearchTopic] = useState("");
  const [deepSearchResults, setDeepSearchResults] = useState<FindExternalDocumentsOutput | null>(null);
  const [selectedDeepSearchDocIds, setSelectedDeepSearchDocIds] = useState<string[]>([]);
  const [isDeepSearching, setIsDeepSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("comunes");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    const fetchAppSettings = async () => {
      if (!isFirebaseConfigured || !db) {
        setIsLoadingAppSettings(false);
        return;
      }
      setIsLoadingAppSettings(true);
      try {
        const settingsRef = doc(db, "appSettings", "globalConfig");
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAppUploadLimits({
            maxFiles: data.maxFilesUpload || DEFAULT_MAX_FILES_UPLOAD,
            maxSizeMB: data.maxTotalSizeMB || DEFAULT_MAX_TOTAL_SIZE_MB,
          });
        }
      } catch (error) {
        console.error("Error fetching app upload limits:", error);
        // Keep default limits if fetching fails
      } finally {
        setIsLoadingAppSettings(false);
      }
    };
    fetchAppSettings();
  }, [isFirebaseConfigured]);
  
  const MAX_TOTAL_SIZE_BYTES = useMemo(() => appUploadLimits.maxSizeMB * 1024 * 1024, [appUploadLimits.maxSizeMB]);

  const totalSizeInBytes = useMemo(() => {
    return selectedFiles.reduce((acc, file) => acc + file.size, 0);
  }, [selectedFiles]);

  useEffect(() => {
    const storedConfig = localStorage.getItem(EXAM_CONFIG_KEY);
    let initialNumQuestions = isFreeUser ? FREE_USER_MAX_QUESTIONS_TO_GENERATE : "10"; // Default for Pro
    if (storedConfig) {
      try {
        const parsedConfig: ExamConfig = JSON.parse(storedConfig);
        if (parsedConfig.defaultNumberOfQuestions) {
            const configNum = parsedConfig.defaultNumberOfQuestions.toString();
            if (isFreeUser && parseInt(configNum, 10) > parseInt(FREE_USER_MAX_QUESTIONS_TO_GENERATE, 10)) {
                initialNumQuestions = FREE_USER_MAX_QUESTIONS_TO_GENERATE;
            } else {
                initialNumQuestions = configNum;
            }
        }
      } catch (error) {
        console.error("Error parsing exam config for FileUploadArea:", error);
      }
    }
    setNumQuestions(initialNumQuestions);
  }, [isFreeUser]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      if (selectedFiles.length + newFiles.length > appUploadLimits.maxFiles) {
        toast({
          title: "Límite de archivos excedido",
          description: `Puedes subir un máximo de ${appUploadLimits.maxFiles} archivos a la vez. Este límite puede ser ajustado por el administrador.`,
          variant: "destructive",
        });
        event.target.value = ""; 
        return;
      }
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles].slice(0, appUploadLimits.maxFiles));
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };

  const handleDeepSearch = useCallback(async (searchTopic?: string) => {
    if (isFreeUser) {
      toast({
        title: "Funcionalidad Pro",
        description: (
            <div className="flex flex-col gap-2">
                <span>Las sugerencias IA de documentos son una característica del Plan Pro.</span>
                <Link href="/#pricing" passHref>
                <Button variant="link" className="p-0 h-auto text-primary hover:underline">¡Actualiza tu plan!</Button>
                </Link>
            </div>
        ),
        variant: "default",
        duration: 7000,
      });
      return;
    }

    const topicToSearch = searchTopic || deepSearchTopic;
    if (!topicToSearch.trim()) {
      toast({ title: "Tema vacío", description: "Por favor, introduce un tema para la búsqueda.", variant: "destructive" });
      return;
    }
    setIsDeepSearching(true);
    setDeepSearchResults(null);
    setSelectedDeepSearchDocIds([]);
    if(!searchTopic) { 
        toast({
            title: "Buscando Sugerencias IA...",
            description: "La IA está generando ideas de documentos relevantes para tu tema. Esto puede tardar unos momentos.",
        });
    }
    try {
      const results = await findExternalDocuments({ topic: topicToSearch });
      setDeepSearchResults(results);
      if (results.results.length === 0 && results.message.includes("no pudo generar sugerencias") && !searchTopic) {
         toast({
            title: "Sugerencias IA",
            description: results.message,
            variant: "default",
            duration: 7000,
        });
      } else if (results.results.length > 0 && !searchTopic) {
         toast({
            title: "Sugerencias IA Listas",
            description: `Se encontraron ${results.results.length} sugerencias. Recuerda que el contenido detallado es simulado.`,
            variant: "default",
        });
      }

    } catch (error) {
      console.error("Error during deep search:", error);
      if (!searchTopic) {
        toast({ title: "Error en la Búsqueda IA", description: (error instanceof Error ? error.message : "No se pudieron obtener sugerencias de documentos."), variant: "destructive" });
      }
    } finally {
      setIsDeepSearching(false);
    }
  }, [deepSearchTopic, toast, isFreeUser]);

  const handleCommonExamClick = (exam: CommonExam) => {
    setDeepSearchTopic(exam.keywords);
    if (isFreeUser) {
        toast({
            title: "Funcionalidad Pro",
            description: (
                <div className="flex flex-col gap-2">
                    <span>Usar exámenes comunes para iniciar una búsqueda IA es parte del Plan Pro.</span>
                    <Link href="/#pricing" passHref>
                    <Button variant="link" className="p-0 h-auto text-primary hover:underline">¡Actualiza tu plan!</Button>
                    </Link>
                </div>
            ),
            variant: "default",
            duration: 7000,
        });
        return;
    }
    handleDeepSearch(exam.keywords); 
    toast({
        title: `Buscando sobre "${exam.name}"`,
        description: "La IA está generando sugerencias de documentos. Revisa la sección 'Sugerencias IA' en unos momentos.",
        variant: "default"
    })
  };

  const toggleDeepSearchDocSelection = (docId: string) => {
    if (isFreeUser) return; 
    setSelectedDeepSearchDocIds(prevSelected =>
      prevSelected.includes(docId)
        ? prevSelected.filter(id => id !== docId)
        : [...prevSelected, docId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isFreeUser) {
      const lastGenerationTime = localStorage.getItem(FREE_USER_LAST_GENERATION_TIMESTAMP_KEY);
      if (lastGenerationTime && (Date.now() - parseInt(lastGenerationTime, 10) < ONE_DAY_IN_MS)) {
        setShowUpgradeDialog(true);
        return;
      }
    }

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
            description: `El tamaño total de los archivos (${formatBytes(totalSizeInBytes)}) excede el límite sugerido de ${appUploadLimits.maxSizeMB}MB. Esto podría afectar la función de "Re-analizar". Puedes continuar, pero tenlo en cuenta. Este límite puede ser ajustado por el administrador.`,
            variant: "destructive",
            duration: 10000,
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
      let finalNumQuestions = parseInt(numQuestions, 10);
      if (isFreeUser && finalNumQuestions > parseInt(FREE_USER_MAX_QUESTIONS_TO_GENERATE, 10)) {
        finalNumQuestions = parseInt(FREE_USER_MAX_QUESTIONS_TO_GENERATE, 10);
        toast({
          title: "Límite del Plan Gratuito",
          description: `Se generarán ${FREE_USER_MAX_QUESTIONS_TO_GENERATE} preguntas como máximo para usuarios gratuitos.`,
          variant: "default"
        });
      }
      
      await onAnalyze(allFilesContent, finalNumQuestions); 

    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Error al procesar archivos",
        description: typeof error === 'string' ? error : "Hubo un problema al leer los archivos.",
        variant: "destructive",
      });
    }
  };

  const filesProgress = isLoadingAppSettings ? 0 : (selectedFiles.length / appUploadLimits.maxFiles) * 100;
  const sizeProgress = isLoadingAppSettings ? 0 : Math.min((totalSizeInBytes / MAX_TOTAL_SIZE_BYTES) * 100, 100);


  const renderCommonExams = (category: 'Universidad' | 'Oposición') => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      {commonExams.filter(exam => exam.category === category).map(exam => (
        <Button
          key={exam.id}
          variant="outline"
          className="h-auto p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md"
          onClick={() => handleCommonExamClick(exam)}
          disabled={isLoading || isDeepSearching || isFreeUser}
          title={isFreeUser ? "Funcionalidad Pro: Actualiza para usar esta opción" : exam.name}
        >
          <Image 
            src={exam.logoPlaceholder} 
            alt={`Logo ${exam.name}`} 
            width={category === 'Universidad' ? 60 : 40} 
            height={category === 'Universidad' ? 30 : 40} 
            className="mb-2 rounded"
            data-ai-hint={exam.logoHint}
          />
          <span className="text-xs font-medium">{exam.name}</span>
        </Button>
      ))}
    </div>
  );
  
  const renderComingSoon = (title: string, description: string) => (
    <div className="text-center py-10 px-4">
        <div className="flex justify-center items-center mb-4">
            {title === "Exámenes de la Comunidad" && <Users className="h-12 w-12 text-muted-foreground" />}
            {title === "Mis Exámenes Personales" && <User className="h-12 w-12 text-muted-foreground" />}
            {title === "Exámenes Recomendados IA" && <Sparkles className="h-12 w-12 text-muted-foreground" />}
        </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description} ¡Vuelve pronto para descubrir nuevas funcionalidades!</p>
      <div data-ai-hint="empty state illustration" className="mt-6">
          <Image src="https://placehold.co/300x200.png" alt="Próximamente" width={300} height={200} className="mx-auto rounded-lg opacity-70" />
      </div>
    </div>
  );

  if (isLoadingAppSettings && !isFirebaseConfigured) { // Show basic loading if Firebase not configured yet
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-xl text-muted-foreground">Cargando configuración de subida...</p>
        </div>
    );
  }


  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna 1: Subida manual y Biblioteca */}
        <div className="space-y-8">
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
                  disabled={isLoading || isDeepSearching || isLoadingAppSettings}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Archivos soportados: PDF, DOC, DOCX, TXT. Máximo {isLoadingAppSettings ? <Loader2 className="inline h-3 w-3 animate-spin" /> : appUploadLimits.maxFiles} archivos.
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="files-progress" className="text-sm font-medium">Archivos seleccionados:</Label>
                      <span className="text-xs text-muted-foreground">{selectedFiles.length} / {isLoadingAppSettings ? <Loader2 className="inline h-3 w-3 animate-spin" /> : appUploadLimits.maxFiles}</span>
                    </div>
                    <Progress value={filesProgress} id="files-progress" className="w-full h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="size-progress" className="text-sm font-medium">Tamaño total estimado:</Label>
                      <span className="text-xs text-muted-foreground">{formatBytes(totalSizeInBytes)} / {isLoadingAppSettings ? <Loader2 className="inline h-3 w-3 animate-spin" /> : `${appUploadLimits.maxSizeMB} MB`}</span>
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
                            disabled={isLoading || isDeepSearching || isLoadingAppSettings}
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
                <LibraryBig className="h-7 w-7 text-primary" />
                Explorar Biblioteca de Exámenes
              </CardTitle>
              <CardDescription>
                Accede a plantillas de exámenes comunes o gestiona los tuyos (próximamente).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                  <TabsTrigger value="comunes" className="py-2 flex items-center gap-1.5"><LibraryBig className="h-4 w-4" /> Comunes</TabsTrigger>
                  <TabsTrigger value="comunidad" className="py-2 flex items-center gap-1.5"><Users className="h-4 w-4" /> Comunidad</TabsTrigger>
                  <TabsTrigger value="personales" className="py-2 flex items-center gap-1.5"><User className="h-4 w-4" /> Personales</TabsTrigger>
                  <TabsTrigger value="recomendados" className="py-2 flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Recomendados</TabsTrigger>
                </TabsList>
                <TabsContent value="comunes" className="mt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecciona un tipo de examen común. Esto rellenará el tema en la sección "Sugerencias IA" y buscará documentos relacionados (simulado).
                    {isFreeUser && " (Funcionalidad Pro)"}
                  </p>
                  <div>
                    <h4 className="text-md font-semibold mt-4 mb-2 text-foreground">Universidades</h4>
                    {renderCommonExams('Universidad')}
                    <h4 className="text-md font-semibold mt-6 mb-2 text-foreground">Oposiciones</h4>
                    {renderCommonExams('Oposición')}
                  </div>
                  {isFreeUser && <UpgradeProAlert featureName="la exploración de exámenes comunes" className="mt-4"/>}
                </TabsContent>
                <TabsContent value="comunidad">
                  {renderComingSoon("Exámenes de la Comunidad", "Aquí podrás encontrar y utilizar exámenes y material de estudio compartido por otros usuarios de la plataforma.")}
                </TabsContent>
                <TabsContent value="personales">
                  {renderComingSoon("Mis Exámenes Personales", "Guarda y organiza tus propios exámenes y documentos analizados para acceder a ellos fácilmente.")}
                </TabsContent>
                <TabsContent value="recomendados">
                  {renderComingSoon("Exámenes Recomendados IA", "Basado en tu actividad y temas de estudio, la IA te sugerirá exámenes y documentos que podrían serte útiles.")}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Columna 2: Sugerencias IA */}
        <div className="space-y-8">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Brain className="h-7 w-7 text-accent" />
                Sugerencias IA de Documentos
                 {isFreeUser && <Lock className="h-5 w-5 text-amber-500" />}
              </CardTitle>
              <CardDescription>
                Introduce un tema y la IA sugerirá títulos y resúmenes de documentos relevantes. Podrás añadir su contenido simulado al análisis.
                {isFreeUser && " (Funcionalidad Pro)"}
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
                    disabled={isLoading || isDeepSearching || isFreeUser || isLoadingAppSettings}
                  />
                  <Button onClick={() => handleDeepSearch()} disabled={isLoading || isDeepSearching || !deepSearchTopic.trim() || isFreeUser || isLoadingAppSettings} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isDeepSearching ? <Loader2 className="animate-spin" /> : <Search className="h-5 w-5" />}
                    <span className="ml-2 hidden sm:inline">Sugerir</span>
                  </Button>
                </div>
              </div>

              {isFreeUser && (
                <UpgradeProAlert featureName="las sugerencias IA de documentos" className="mt-4"/>
              )}

              {!isFreeUser && isDeepSearching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="ml-2 text-muted-foreground">IA generando sugerencias...</p>
                </div>
              )}

              {!isFreeUser && deepSearchResults && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground italic">{deepSearchResults.message}</p>
                  {deepSearchResults.results.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto border p-3 rounded-md bg-muted/30">
                      <h4 className="text-sm font-medium text-foreground">Sugerencias de la IA ({deepSearchResults.results.length}):</h4>
                      {deepSearchResults.results.map((doc) => (
                        <div key={doc.id} className="flex items-start space-x-2 p-2 bg-background rounded-md shadow-sm hover:bg-muted/50">
                          <Checkbox
                            id={`ds-${doc.id}`}
                            checked={selectedDeepSearchDocIds.includes(doc.id)}
                            onCheckedChange={() => toggleDeepSearchDocSelection(doc.id)}
                            disabled={isLoading || isDeepSearching || isFreeUser || isLoadingAppSettings}
                            aria-label={`Seleccionar ${doc.title}`}
                            className="mt-1"
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
        </div>
      </div>

      {/* Configuración final y botón de submit */}
      <div className="lg:col-span-2 space-y-6 p-6 border rounded-lg shadow-xl bg-card">
          <div className="space-y-2">
            <Label htmlFor="num-questions-select" className="text-lg font-semibold text-primary">Configuración Final del Análisis:</Label>
            <p className="text-sm text-muted-foreground">Define cuántas preguntas quieres generar a partir de todos los documentos (subidos manualmente y/o seleccionados de las sugerencias IA).
            {isFreeUser && ` (Máximo ${FREE_USER_MAX_QUESTIONS_TO_GENERATE} para usuarios gratuitos).`}
            </p>
            <Select value={numQuestions} onValueChange={setNumQuestions} disabled={isLoading || isDeepSearching || isLoadingAppSettings}>
              <SelectTrigger id="num-questions-select" className="w-full sm:w-[250px] text-base py-3">
                <SelectValue placeholder="Selecciona cantidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 preguntas</SelectItem>
                {!isFreeUser && (
                  <>
                    <SelectItem value="10">10 preguntas</SelectItem>
                    <SelectItem value="15">15 preguntas</SelectItem>
                    <SelectItem value="20">20 preguntas</SelectItem>
                    <SelectItem value="25">25 preguntas</SelectItem>
                    <SelectItem value="30">30 preguntas</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
             {isFreeUser && numQuestions !== FREE_USER_MAX_QUESTIONS_TO_GENERATE && parseInt(numQuestions) > parseInt(FREE_USER_MAX_QUESTIONS_TO_GENERATE) && (
                <p className="text-xs text-amber-600 mt-1">
                    Has seleccionado {numQuestions} preguntas, pero se generarán {FREE_USER_MAX_QUESTIONS_TO_GENERATE} debido a tu plan gratuito.
                </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-lg font-semibold rounded-lg shadow-md transition-transform duration-150 ease-in-out active:scale-95"
            disabled={isLoading || isDeepSearching || isLoadingAppSettings || (selectedFiles.length === 0 && selectedDeepSearchDocIds.length === 0 && !isFreeUser) || (isFreeUser && selectedFiles.length === 0) }
          >
            {isLoading || isLoadingAppSettings ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                {isLoadingAppSettings ? "Cargando Config..." : "Analizando Contenido..."}
              </>
            ) : (
              'Analizar y Predecir Preguntas'
            )}
          </Button>
      </div>
    </form>
    <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-6 w-6" /> Límite Diario Alcanzado
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              Has alcanzado el límite de un examen gratuito por día. Para generar más exámenes y acceder a todas las funcionalidades avanzadas, considera actualizar a nuestro Plan Pro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setShowUpgradeDialog(false)}>Cerrar</AlertDialogCancel>
            <Link href="/#pricing" passHref>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setShowUpgradeDialog(false)}>
                <ExternalLink className="mr-2 h-4 w-4" /> Ver Planes Pro
              </Button>
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
