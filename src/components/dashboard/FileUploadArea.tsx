
"use client";

import type React from 'react';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, FileText, UploadCloud, XCircle, AlertTriangle, Search, Brain, LibraryBig, Users, User, Sparkles, FileType, Camera, Video, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { EXAM_CONFIG_KEY, FREE_USER_LAST_GENERATION_TIMESTAMP_KEY } from '@/lib/localStorageKeys';
import type { ExamConfig } from '@/types';
import { findExternalDocuments, type FindExternalDocumentsOutput } from '@/ai/flows/find-external-documents';
import { extractTextFromFile, type ExtractTextFromFileInput } from '@/ai/flows/extract-text-from-file-flow';
import { Checkbox } from '../ui/checkbox';
import { Alert } from '../ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useI18n } from '@/contexts/I18nContext';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface FileUploadAreaProps {
  onAnalyze: (content: string, numQuestions: number) => Promise<void>;
  isLoading: boolean; // This is for the final analysis step
}

const DEFAULT_MAX_FILES_UPLOAD = 30;
const DEFAULT_MAX_TOTAL_SIZE_MB = 20; // Updated to 20MB
const MAX_QUESTIONS_FREE_USER = 5;
const FREE_USER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

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
  { id: 'ucm', name: 'Universidad Complutense', category: 'Universidad', logoPlaceholder: 'https://biblioteca.ucm.es/data/cont/media/www/pag-88746//escudo.jpg', logoHint: 'university campus', keywords: 'exámenes Universidad Complutense Madrid', icon: LibraryBig },
  { id: 'uab', name: 'Universitat Autònoma BCN', category: 'Universidad', logoPlaceholder: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Logo_uab.png', logoHint: 'modern university', keywords: 'exámenes Universitat Autònoma Barcelona', icon: LibraryBig },
  { id: 'us', name: 'Universidad de Sevilla', category: 'Universidad', logoPlaceholder: 'https://e7.pngegg.com/pngimages/234/349/png-clipart-university-of-seville-master-s-degree-student-higher-education-de-gea-thumbnail.png', logoHint: 'historic university', keywords: 'exámenes Universidad de Sevilla', icon: LibraryBig },
  { id: 'uam', name: 'Universidad Autónoma Madrid', category: 'Universidad', logoPlaceholder: 'https://www.universidata.es/sites/default/files/styles/group_medium/public/uam_0.png?itok=x5ldAQ-Z', logoHint: 'university science', keywords: 'exámenes Universidad Autónoma Madrid', icon: LibraryBig },
  { id: 'uc3m', name: 'Universidad Carlos III', category: 'Universidad', logoPlaceholder: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Logo_UC3M.svg/1200px-Logo_UC3M.svg.png', logoHint: 'university logo', keywords: 'exámenes Universidad Carlos III Madrid', icon: LibraryBig },
  { id: 'upv', name: 'Universitat Politècnica València', category: 'Universidad', logoPlaceholder: 'https://upload.wikimedia.org/wikipedia/commons/8/85/UPV_Logo.png', logoHint: 'polytechnic university', keywords: 'exámenes Universidad Politécnica de Valencia', icon: LibraryBig },
  { id: 'admin_estado', name: 'Administrativo del Estado', category: 'Oposición', logoPlaceholder: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Logotipo_de_la_Administraci%C3%B3n_General_del_Estado.svg/768px-Logotipo_de_la_Administraci%C3%B3n_General_del_Estado.svg.png', logoHint: 'government building', keywords: 'oposición Administrativo del Estado', icon: LibraryBig },
  { id: 'hacienda', name: 'Agente de Hacienda', category: 'Oposición', logoPlaceholder: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Agencia_Tributaria.svg/339px-Agencia_Tributaria.svg.png', logoHint: 'tax office', keywords: 'oposición Agente Hacienda Pública', icon: LibraryBig },
  { id: 'agente_forestal', name: 'Agente Forestal', category: 'Oposición', logoPlaceholder: 'https://larioja.org/medio-ambiente/en/econoticias/econoticias-2015/04_agentesforestales.files/627201-distintivo_agentesforestale.jpg?width=249&height=230', logoHint: 'forest ranger', keywords: 'oposición Agente Forestal', icon: LibraryBig },
  { id: 'justicia', name: 'Justicia (Auxilio/Tramitación)', category: 'Oposición', logoPlaceholder: 'https://justicia.fsc.ccoo.es/8a31eebe95ee55457de0bfeb72ef668e000050.jpg', logoHint: 'justice scale', keywords: 'oposición justicia auxilio judicial tramitación procesal', icon: LibraryBig },
  { id: 'policia', name: 'Policía Nacional (Escala Básica)', category: 'Oposición', logoPlaceholder: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjaieg2d3EWkj8EzVUy6bagcA3Vy3QDkz7nQ&s', logoHint: 'police badge', keywords: 'oposición Policía Nacional Escala Básica', icon: LibraryBig },
  { id: 'guardia_civil', name: 'Guardia Civil (Cabos y Guardias)', category: 'Oposición', logoPlaceholder: 'https://m.media-amazon.com/images/I/514S91YWWDL._UF894,1000_QL80_.jpg', logoHint: 'military emblem', keywords: 'oposición Guardia Civil', icon: LibraryBig },
];

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function FileUploadArea({ onAnalyze, isLoading: isFinalAnalyzing }: FileUploadAreaProps) {
  const { t } = useI18n();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [numQuestions, setNumQuestions] = useState<string>("10");
  const { toast } = useToast();
  const { isFirebaseConfigured, userTier } = useAuth();
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

  const [isProcessingFiles, setIsProcessingFiles] = useState(false); // For text extraction loading

  // Camera state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImageDataUri, setCapturedImageDataUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      } finally {
        setIsLoadingAppSettings(false);
      }
    };
    fetchAppSettings();
  }, [isFirebaseConfigured]);

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

  const MAX_TOTAL_SIZE_BYTES = useMemo(() => appUploadLimits.maxSizeMB * 1024 * 1024, [appUploadLimits.maxSizeMB]);
  const totalSizeInBytes = useMemo(() => selectedFiles.reduce((acc, file) => acc + file.size, 0), [selectedFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      if (selectedFiles.length + newFiles.length > appUploadLimits.maxFiles) {
        toast({
          title: t('fileUploadArea.toastFileLimitExceededTitle'),
          description: t('fileUploadArea.toastFileLimitExceededDescription', { maxFiles: appUploadLimits.maxFiles.toString() }),
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
    // ... (deep search logic remains the same)
    const topicToSearch = searchTopic || deepSearchTopic;
    if (!topicToSearch.trim()) {
      toast({ title: t('common.error'), description: t('fileUploadArea.searchTopicPlaceholder'), variant: "destructive" });
      return;
    }
    setIsDeepSearching(true);
    setDeepSearchResults(null);
    setSelectedDeepSearchDocIds([]);
    if(!searchTopic) {
        toast({
            title: t('fileUploadArea.aiSearchingToastTitle'),
            description: t('fileUploadArea.aiSearchingToastDescription'),
        });
    }
    try {
      const results = await findExternalDocuments({ topic: topicToSearch });
      setDeepSearchResults(results);
      if (results.results.length === 0 && results.message.includes("no pudo generar sugerencias") && !searchTopic) {
         toast({
            title: t('fileUploadArea.aiSuggestionsReadyToastTitle'),
            description: results.message,
            variant: "default",
            duration: 7000,
        });
      } else if (results.results.length > 0 && !searchTopic) {
         toast({
            title: t('fileUploadArea.aiSuggestionsReadyToastTitle'),
            description: t('fileUploadArea.aiSuggestionsReadyToastDescription', { count: results.results.length.toString() }),
            variant: "default",
        });
      }

    } catch (error) {
      console.error("Error during deep search:", error);
      if (!searchTopic) {
        toast({ title: t('common.error'), description: (error instanceof Error ? error.message : t('fileUploadArea.toastErrorProcessingFilesFallback')), variant: "destructive" });
      }
    } finally {
      setIsDeepSearching(false);
    }
  }, [deepSearchTopic, toast, t]);

  const handleCommonExamClick = (exam: CommonExam) => {
    setDeepSearchTopic(exam.keywords);
    handleDeepSearch(exam.keywords);
    toast({
        title: t('fileUploadArea.searchingCommonExamToastTitle', { examName: exam.name }),
        description: t('fileUploadArea.searchingCommonExamToastDescription'),
        variant: "default"
    })
  };

  const toggleDeepSearchDocSelection = (docId: string) => {
    setSelectedDeepSearchDocIds(prevSelected =>
      prevSelected.includes(docId)
        ? prevSelected.filter(id => id !== docId)
        : [...prevSelected, docId]
    );
  };
  
  // Camera functions
  useEffect(() => {
    if (showCameraModal) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
          setShowCameraModal(false);
        }
      };
      getCameraPermission();

      return () => { // Cleanup: stop camera stream when modal closes or component unmounts
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [showCameraModal, toast]);

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg');
      setCapturedImageDataUri(dataUri);
      setIsCapturing(false);

      // Stop camera stream after capture
       if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
    }
  };

  const handleUseCapturedPhoto = async () => {
    if (!capturedImageDataUri) return;
    
    setIsProcessingFiles(true); // Show loading for OCR
    toast({ title: "Processing captured photo..." });
    try {
      const fileName = `camera_capture_${Date.now()}.jpg`;
      const result = await extractTextFromFile({ fileDataUri: capturedImageDataUri, fileName });
      
      // Create a File object from the data URI to add to selectedFiles
      const blob = await (await fetch(capturedImageDataUri)).blob();
      const newFile = new File([blob], fileName, { type: 'image/jpeg' });

      // Check file count limit before adding
      if (selectedFiles.length >= appUploadLimits.maxFiles) {
          toast({
            title: t('fileUploadArea.toastFileLimitExceededTitle'),
            description: t('fileUploadArea.toastFileLimitExceededDescription', { maxFiles: appUploadLimits.maxFiles.toString() }),
            variant: "destructive",
          });
          setIsProcessingFiles(false);
          setShowCameraModal(false);
          setCapturedImageDataUri(null);
          return;
      }

      setSelectedFiles(prev => [...prev, newFile]);
      // Store the extracted text separately or integrate into the combined content later
      // For now, we will extract text from all files (including this one) during handleSubmit
      
      toast({ title: "Photo added", description: `Text from photo will be extracted during analysis.` });
    } catch (error) {
      console.error("Error processing captured photo:", error);
      toast({ title: "Error", description: "Could not process captured photo.", variant: "destructive" });
    } finally {
      setIsProcessingFiles(false);
      setShowCameraModal(false);
      setCapturedImageDataUri(null);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isFreeUser) {
        const lastGenTimestamp = localStorage.getItem(FREE_USER_LAST_GENERATION_TIMESTAMP_KEY);
        if (lastGenTimestamp && (Date.now() - parseInt(lastGenTimestamp)) < FREE_USER_COOLDOWN_MS) {
            toast({
                title: t('dashboardPage.dailyLimitReachedTitle'),
                description: t('dashboardPage.dailyLimitReachedDescription'),
                variant: 'destructive',
                duration: 7000
            });
            return;
        }
    }

    if (selectedFiles.length === 0 && selectedDeepSearchDocIds.length === 0) {
      toast({
        title: t('fileUploadArea.toastNoContentSelectedTitle'),
        description: t('fileUploadArea.toastNoContentSelectedDescription'),
        variant: "destructive",
      });
      return;
    }

    if (totalSizeInBytes > MAX_TOTAL_SIZE_BYTES) {
        toast({
            title: t('fileUploadArea.toastSizeExceedsLimitTitle'),
            description: t('fileUploadArea.toastSizeExceedsLimitDescription', { totalSize: formatBytes(totalSizeInBytes), maxSizeMB: appUploadLimits.maxSizeMB.toString() }),
            variant: "destructive",
            duration: 10000,
        });
        // Allow proceeding but warn.
    }

    setIsProcessingFiles(true);
    toast({ title: "Extracting text from files...", description: "This may take a moment for images or large documents." });

    let allFilesContent = "";
    const fileProcessingPromises: Promise<string>[] = [];

    // Process uploaded files
    selectedFiles.forEach(file => {
      const promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (eventReader) => {
          const dataUri = eventReader.target?.result as string;
          try {
            const extractionResult = await extractTextFromFile({ fileDataUri: dataUri, fileName: file.name });
            resolve(`Contenido del archivo: ${file.name}\n\n${extractionResult.extractedText}\n\n---\n\n`);
          } catch (err) {
            console.error(`Error extracting text from ${file.name}:`, err);
            resolve(`Error al procesar el archivo: ${file.name}. Puede que el formato no sea compatible o esté dañado.\n\n---\n\n`); // Resolve with error message
          }
        };
        reader.onerror = (errorReader) => {
          console.error("Error reading file:", file.name, errorReader);
          resolve(`Error al leer el archivo: ${file.name}.\n\n---\n\n`); // Resolve with error message
        };
        reader.readAsDataURL(file); // Read as Data URL for all types for the new flow
      });
      fileProcessingPromises.push(promise);
    });

    try {
      const fileContentsArray = await Promise.all(fileProcessingPromises);
      allFilesContent = fileContentsArray.join('');

      // Process deep search documents
      const deepSearchDocsContent = deepSearchResults?.results
        .filter(doc => selectedDeepSearchDocIds.includes(doc.id))
        .map(doc => `Contenido del documento (sugerido por IA): ${doc.title}\n\n${doc.simulatedTextContent}\n\n---\n\n`)
        .join('') || "";
      allFilesContent += deepSearchDocsContent;

      setIsProcessingFiles(false);

      if (!allFilesContent.trim()) {
        toast({
          title: t('fileUploadArea.toastEmptyContentTitle'),
          description: t('fileUploadArea.toastEmptyContentDescription'),
          variant: "destructive",
        });
        return;
      }
      
      let finalNumQuestions = parseInt(numQuestions, 10);
      if (isFreeUser && finalNumQuestions > MAX_QUESTIONS_FREE_USER) {
          toast({
              title: t('fileUploadArea.toastFreeUserLimitTitle'),
              description: t('fileUploadArea.toastFreeUserLimitDescription', {maxQuestions: MAX_QUESTIONS_FREE_USER.toString()}),
              variant: "default"
          });
          finalNumQuestions = MAX_QUESTIONS_FREE_USER;
      }
      await onAnalyze(allFilesContent, finalNumQuestions);

    } catch (error) {
      setIsProcessingFiles(false);
      console.error("Error processing files for analysis:", error);
      toast({
        title: t('fileUploadArea.toastErrorProcessingFilesTitle'),
        description: typeof error === 'string' ? error : t('fileUploadArea.toastErrorProcessingFilesFallback'),
        variant: "destructive",
      });
    }
  };

  const filesProgress = isLoadingAppSettings ? 0 : (selectedFiles.length / appUploadLimits.maxFiles) * 100;
  const sizeProgress = isLoadingAppSettings ? 0 : Math.min((totalSizeInBytes / MAX_TOTAL_SIZE_BYTES) * 100, 100);


  const renderCommonExams = (category: 'Universidad' | 'Oposición') => {
    const exams = commonExams.filter(exam => exam.category === category);
    return (
        <Carousel
            opts={{
                align: "start",
                loop: false,
            }}
            className="w-full"
        >
            <CarouselContent>
                {exams.map((exam) => (
                    <CarouselItem key={exam.id} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-auto p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md w-full"
                                onClick={() => handleCommonExamClick(exam)}
                                disabled={isFinalAnalyzing || isDeepSearching || isProcessingFiles}
                                title={exam.name}
                            >
                                <Image
                                    src={exam.logoPlaceholder}
                                    alt={`Logo ${exam.name}`}
                                    width={category === 'Universidad' ? 60 : 40}
                                    height={category === 'Universidad' ? 30 : 40}
                                    className="mb-2 rounded object-contain h-10"
                                    data-ai-hint={exam.logoHint}
                                />
                                <span className="text-xs font-medium">{exam.name}</span>
                            </Button>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious type="button" />
            <CarouselNext type="button" />
        </Carousel>
    );
};

  const renderComingSoon = (titleKey: string, descriptionKey: string, hint: string) => (
    <div className="text-center py-10 px-4">
        <div className="flex justify-center items-center mb-4">
            {titleKey.includes("Comunidad") && <Users className="h-12 w-12 text-muted-foreground" />}
            {titleKey.includes("Personales") && <User className="h-12 w-12 text-muted-foreground" />}
            {titleKey.includes("Recomendados") && <Sparkles className="h-12 w-12 text-muted-foreground" />}
        </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{t(titleKey)}</h3>
      <p className="text-muted-foreground">{t(descriptionKey)}</p>
      <div data-ai-hint={hint} className="mt-6">
          <Image src="https://placehold.co/300x200.png" alt={t(titleKey)} width={300} height={200} className="mx-auto rounded-lg opacity-70" />
      </div>
    </div>
  );

  if (isLoadingAppSettings && !isFirebaseConfigured) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-xl text-muted-foreground">{t('fileUploadArea.loadingUploadConfig')}</p>
        </div>
    );
  }


  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* First column on lg screens */}
        <div className="space-y-8">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <UploadCloud className="h-7 w-7 text-primary" />
                {t('fileUploadArea.uploadManuallyTitle')}
              </CardTitle>
              <CardDescription>
                {t('fileUploadArea.uploadManuallyDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="file-upload" className="sr-only">
                  {t('fileUploadArea.selectFilesLabel')}
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="text-sm p-2 rounded-md shadow-sm focus:ring-primary focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  disabled={isFinalAnalyzing || isDeepSearching || isLoadingAppSettings || isProcessingFiles}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('fileUploadArea.supportedFiles', { maxFiles: isLoadingAppSettings ? '...' : appUploadLimits.maxFiles.toString() })} (PDF, DOC, TXT, PNG, JPG, WEBP).
                </p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setCapturedImageDataUri(null); setShowCameraModal(true); }}
                disabled={isFinalAnalyzing || isDeepSearching || isLoadingAppSettings || isProcessingFiles || selectedFiles.length >= appUploadLimits.maxFiles}
                className="w-full"
              >
                <Camera className="mr-2 h-5 w-5" />
                {t('fileUploadArea.useCameraButton')}
              </Button>


              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="files-progress" className="text-sm font-medium">{t('fileUploadArea.selectedFilesLabel')}</Label>
                      <span className="text-xs text-muted-foreground">{selectedFiles.length} / {isLoadingAppSettings ? '...' : appUploadLimits.maxFiles}</span>
                    </div>
                    <Progress value={filesProgress} id="files-progress" className="w-full h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="size-progress" className="text-sm font-medium">{t('fileUploadArea.totalSizeLabel')}</Label>
                      <span className="text-xs text-muted-foreground">{formatBytes(totalSizeInBytes)} / {isLoadingAppSettings ? '...' : `${appUploadLimits.maxSizeMB} MB`}</span>
                    </div>
                    <Progress value={sizeProgress} id="size-progress" className="w-full h-2"
                              aria-label={`Progreso de tamaño: ${sizeProgress.toFixed(0)}%`} />
                    {totalSizeInBytes > MAX_TOTAL_SIZE_BYTES * 0.8 && (
                        <div className="mt-2 text-xs text-amber-600 flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>
                            {t('fileUploadArea.storageWarning')}
                            </span>
                        </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">{t('fileUploadArea.fileListTitle', { count: selectedFiles.length.toString() })}</h4>
                    <ul className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2 bg-muted/50">
                      {selectedFiles.map(file => (
                        <li key={file.name} className="text-xs text-foreground flex justify-between items-center p-1.5 bg-background rounded shadow-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            {file.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-accent shrink-0" /> : <FileText className="h-4 w-4 text-primary shrink-0" />}
                            <span className="truncate" title={file.name}>{file.name}</span>
                            <span className="text-muted-foreground text-nowrap shrink-0">({formatBytes(file.size)})</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => removeFile(file.name)}
                            disabled={isFinalAnalyzing || isDeepSearching || isLoadingAppSettings || isProcessingFiles}
                            aria-label={t('fileUploadArea.removeFileLabel', { fileName: file.name })}
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
                <Brain className="h-7 w-7 text-accent" />
                {t('fileUploadArea.aiDocSuggestionsTitle')}
              </CardTitle>
              <CardDescription>
                 {t('fileUploadArea.aiDocSuggestionsDescriptionNoPro')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="deep-search-topic">{t('fileUploadArea.searchTopicLabel')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="deep-search-topic"
                    type="text"
                    value={deepSearchTopic}
                    onChange={(e) => setDeepSearchTopic(e.target.value)}
                    placeholder={t('fileUploadArea.searchTopicPlaceholder')}
                    className="text-sm"
                    disabled={isFinalAnalyzing || isDeepSearching || isLoadingAppSettings || isProcessingFiles } 
                  />
                  <Button onClick={() => handleDeepSearch()} disabled={isFinalAnalyzing || isDeepSearching || !deepSearchTopic.trim() || isLoadingAppSettings || isProcessingFiles } className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isDeepSearching ? <Loader2 className="animate-spin" /> : <Search className="h-5 w-5" />}
                    <span className="ml-2 hidden sm:inline">{t('fileUploadArea.suggestButton')}</span>
                  </Button>
                </div>
              </div>

              {isDeepSearching && !deepSearchResults && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="ml-2 text-muted-foreground">{t('fileUploadArea.aiSearchingToastTitle')}</p>
                </div>
              )}

              {deepSearchResults && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground italic">{t('fileUploadArea.aiSuggestionsMessage', { message: deepSearchResults.message})}</p>
                  {deepSearchResults.results.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto border p-3 rounded-md bg-muted/30">
                      <h4 className="text-sm font-medium text-foreground">{t('fileUploadArea.aiSuggestionsListTitle', { count: deepSearchResults.results.length.toString() })}</h4>
                      {deepSearchResults.results.map((doc) => (
                        <div key={doc.id} className="flex items-start space-x-2 p-2 bg-background rounded-md shadow-sm hover:bg-muted/50">
                          <Checkbox
                            id={`ds-${doc.id}`}
                            checked={selectedDeepSearchDocIds.includes(doc.id)}
                            onCheckedChange={() => toggleDeepSearchDocSelection(doc.id)}
                            disabled={isFinalAnalyzing || isDeepSearching || isLoadingAppSettings || isProcessingFiles}
                            aria-label={t('fileUploadArea.selectAISuggestionLabel', { title: doc.title })}
                            className="mt-1"
                          />
                          <Label htmlFor={`ds-${doc.id}`} className="text-xs font-normal flex-1 cursor-pointer">
                            <span className="font-medium text-foreground block">{doc.title}</span>
                            <span className="text-muted-foreground text-xs block">{doc.source}</span>
                            <p className="text-xs text-muted-foreground/80 mt-1">{doc.simulatedTextContent.split('\n\n')[0]}</p>
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

        {/* Second column on lg screens */}
        <div className="space-y-8">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <LibraryBig className="h-7 w-7 text-primary" />
                {t('fileUploadArea.exploreLibraryTitle')}
              </CardTitle>
              <CardDescription>
                {t('fileUploadArea.exploreLibraryDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                  <TabsTrigger value="comunes" className="py-2 flex items-center gap-1.5"><LibraryBig className="h-4 w-4" /> {t('fileUploadArea.tabCommonExams')}</TabsTrigger>
                  <TabsTrigger value="comunidad" className="py-2 flex items-center gap-1.5"><Users className="h-4 w-4" /> {t('fileUploadArea.tabCommunityExams')}</TabsTrigger>
                  <TabsTrigger value="personales" className="py-2 flex items-center gap-1.5"><User className="h-4 w-4" /> {t('fileUploadArea.tabPersonalExams')}</TabsTrigger>
                  <TabsTrigger value="recomendados" className="py-2 flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> {t('fileUploadArea.tabRecommendedExams')}</TabsTrigger>
                </TabsList>
                <TabsContent value="comunes" className="mt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('fileUploadArea.commonExamsDescriptionNoPro')}
                  </p>
                  <div>
                    <h4 className="text-md font-semibold mt-4 mb-2 text-foreground">{t('fileUploadArea.universitiesSectionTitle')}</h4>
                    {renderCommonExams('Universidad')}
                    <h4 className="text-md font-semibold mt-6 mb-2 text-foreground">{t('fileUploadArea.oppositionsSectionTitle')}</h4>
                    {renderCommonExams('Oposición')}
                  </div>
                </TabsContent>
                <TabsContent value="comunidad">
                  {renderComingSoon("fileUploadArea.comingSoonCommunityExamsTitle", "fileUploadArea.comingSoonCommunityExamsDescription", "community forum discussion")}
                </TabsContent>
                <TabsContent value="personales">
                  {renderComingSoon("fileUploadArea.comingSoonPersonalExamsTitle", "fileUploadArea.comingSoonPersonalExamsDescription", "personal documents folder")}
                </TabsContent>
                <TabsContent value="recomendados">
                  {renderComingSoon("fileUploadArea.comingSoonRecommendedExamsTitle", "fileUploadArea.comingSoonRecommendedExamsDescription", "ai recommendations list")}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6 p-6 border rounded-lg shadow-xl bg-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="num-questions-select" className="text-md font-medium">{t('dashboardPage.numQuestionsLabel')}{isFreeUser && <span className="text-muted-foreground text-sm">{t('fileUploadArea.finalAnalysisConfigFreeUserMaxText', {maxQuestions: MAX_QUESTIONS_FREE_USER})}</span>}</Label>
                <Select
                    value={numQuestions}
                    onValueChange={(value) => {
                      const numValue = parseInt(value, 10);
                      if (isFreeUser && numValue > MAX_QUESTIONS_FREE_USER) {
                          toast({
                              title: t('fileUploadArea.toastFreeUserLimitTitle'),
                              description: t('fileUploadArea.toastFreeUserLimitDescription', {maxQuestions: MAX_QUESTIONS_FREE_USER}),
                              variant: "default",
                          });
                          setNumQuestions(MAX_QUESTIONS_FREE_USER.toString());
                      } else {
                          setNumQuestions(value);
                      }
                    }}
                    disabled={isFinalAnalyzing || isDeepSearching || isLoadingAppSettings || isProcessingFiles}
                >
                <SelectTrigger id="num-questions-select" className="w-full text-base py-3">
                    <SelectValue placeholder={t('common.selectOption')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="5">5 {t('fileUploadArea.questionsSuffix')}</SelectItem>
                    <SelectItem value="10">10 {t('fileUploadArea.questionsSuffix')}</SelectItem>
                    <SelectItem value="15">15 {t('fileUploadArea.questionsSuffix')}</SelectItem>
                    <SelectItem value="20">20 {t('fileUploadArea.questionsSuffix')}</SelectItem>
                    <SelectItem value="25">25 {t('fileUploadArea.questionsSuffix')}</SelectItem>
                    <SelectItem value="30">30 {t('fileUploadArea.questionsSuffix')}</SelectItem>
                </SelectContent>
                </Select>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-lg font-semibold rounded-lg shadow-md transition-transform duration-150 ease-in-out active:scale-95 mt-6"
            disabled={isFinalAnalyzing || isDeepSearching || isLoadingAppSettings || isProcessingFiles || (selectedFiles.length === 0 && selectedDeepSearchDocIds.length === 0) }
          >
            {isFinalAnalyzing || isLoadingAppSettings || isProcessingFiles ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                {isLoadingAppSettings ? t('fileUploadArea.loadingConfigButton') : (isProcessingFiles ? t('fileUploadArea.processingFilesButton') : t('fileUploadArea.analyzingButton'))}
              </>
            ) : (
              <>
                <FileType className="mr-2 h-6 w-6"/>
                {t('fileUploadArea.analyzeAndPredictButton')}
              </>
            )}
          </Button>
      </div>
    </form>

    <Dialog open={showCameraModal} onOpenChange={(open) => {
        setShowCameraModal(open);
        if (!open && videoRef.current && videoRef.current.srcObject) { // Stop stream if modal is closed
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null; // Clear srcObject
            setHasCameraPermission(null); // Reset permission status
        }
    }}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{t('fileUploadArea.cameraModalTitle')}</DialogTitle>
                <DialogDescription>
                    {t('fileUploadArea.cameraModalDescription')}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-4">
                {hasCameraPermission === null && <p>{t('fileUploadArea.cameraRequestingPermission')}</p>}
                {hasCameraPermission === false && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <p>{t('fileUploadArea.cameraPermissionDenied')}</p>
                    </Alert>
                )}
                {hasCameraPermission && !capturedImageDataUri && (
                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay playsInline muted />
                )}
                {capturedImageDataUri && (
                    <Image src={capturedImageDataUri} alt="Captured photo" width={400} height={300} className="rounded-md mx-auto" />
                )}
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
            <DialogFooter className="sm:justify-between">
                <DialogClose asChild>
                    <Button type="button" variant="outline">{t('common.cancel')}</Button>
                </DialogClose>
                <div>
                {!capturedImageDataUri && hasCameraPermission && (
                    <Button type="button" onClick={handleCapturePhoto} disabled={isCapturing}>
                        {isCapturing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                        {t('fileUploadArea.capturePhotoButton')}
                    </Button>
                )}
                {capturedImageDataUri && (
                    <>
                    <Button type="button" variant="ghost" onClick={() => setCapturedImageDataUri(null)} className="mr-2">
                        {t('fileUploadArea.retakePhotoButton')}
                    </Button>
                    <Button type="button" onClick={handleUseCapturedPhoto} disabled={isProcessingFiles}>
                        {isProcessingFiles ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        {t('fileUploadArea.useThisPhotoButton')}
                    </Button>
                    </>
                )}
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
