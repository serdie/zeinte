
"use client";

import type React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, UploadCloud, XCircle, AlertTriangle, Search, Brain, LibraryBig, Users, User, Sparkles, FileType } from 'lucide-react'; // Removed unused Building, School, Briefcase
import { useToast } from "@/hooks/use-toast";
import { EXAM_CONFIG_KEY, FREE_USER_LAST_GENERATION_TIMESTAMP_KEY } from '@/lib/localStorageKeys';
import type { ExamConfig } from '@/types';
import { findExternalDocuments, type FindExternalDocumentsOutput } from '@/ai/flows/find-external-documents';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// import { UpgradeProAlert } from '@/components/ui/upgrade-pro-alert'; // Commented out as restrictions are currently lifted
import { useI18n } from '@/contexts/I18nContext';

interface FileUploadAreaProps {
  onAnalyze: (content: string, numQuestions: number) => Promise<void>; // examType removed
  isLoading: boolean;
}

const DEFAULT_MAX_FILES_UPLOAD = 30;
const DEFAULT_MAX_TOTAL_SIZE_MB = 5;
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const FREE_USER_MAX_QUESTIONS = 5;

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
  { id: 'ucm', name: 'Universidad Complutense', category: 'Universidad', logoPlaceholder: 'https://placehold.co/80x40.png', logoHint: 'university campus', keywords: 'exámenes Universidad Complutense Madrid', icon: LibraryBig },
  { id: 'uab', name: 'Universitat Autònoma BCN', category: 'Universidad', logoPlaceholder: 'https://placehold.co/80x40.png', logoHint: 'modern university', keywords: 'exámenes Universitat Autònoma Barcelona', icon: LibraryBig },
  { id: 'us', name: 'Universidad de Sevilla', category: 'Universidad', logoPlaceholder: 'https://placehold.co/80x40.png', logoHint: 'historic university', keywords: 'exámenes Universidad de Sevilla', icon: LibraryBig },
  { id: 'admin_estado', name: 'Administrativo del Estado', category: 'Oposición', logoPlaceholder: 'https://placehold.co/60x60.png', logoHint: 'government building', keywords: 'oposición Administrativo del Estado', icon: LibraryBig },
  { id: 'hacienda', name: 'Agente de Hacienda', category: 'Oposición', logoPlaceholder: 'https://placehold.co/60x60.png', logoHint: 'tax office', keywords: 'oposición Agente Hacienda Pública', icon: LibraryBig },
  { id: 'agente_forestal', name: 'Agente Forestal', category: 'Oposición', logoPlaceholder: 'https://placehold.co/60x60.png', logoHint: 'forest ranger', keywords: 'oposición Agente Forestal', icon: LibraryBig },
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
  const { t } = useI18n();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [numQuestions, setNumQuestions] = useState<string>("10");
  // const [examType, setExamType] = useState<ExamType>("test"); // examType logic removed for now
  const { toast } = useToast();
  const { isFirebaseConfigured, currentUser, userTier } = useAuth(); // Added userTier
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
    let initialNumQuestions = "10";
    // let initialExamType: ExamType = "test"; // examType logic removed

    if (storedConfig) {
      try {
        const parsedConfig: ExamConfig = JSON.parse(storedConfig);
        if (parsedConfig.defaultNumberOfQuestions) {
            initialNumQuestions = parsedConfig.defaultNumberOfQuestions.toString();
        }
        // if (parsedConfig.defaultExamType) { // examType logic removed
        //     initialExamType = parsedConfig.defaultExamType;
        // }
      } catch (error) {
        console.error("Error parsing exam config for FileUploadArea:", error);
      }
    }
    setNumQuestions(initialNumQuestions);
    // setExamType(initialExamType); // examType logic removed
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Restrictions removed for PAU special
    // if (isFreeUser) {
    //   const lastGenerationTime = localStorage.getItem(FREE_USER_LAST_GENERATION_TIMESTAMP_KEY);
    //   if (lastGenerationTime && (Date.now() - parseInt(lastGenerationTime, 10) < ONE_DAY_IN_MS)) {
    //     setShowUpgradeDialog(true);
    //     return;
    //   }
    // }

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
          reject(t('fileUploadArea.toastErrorProcessingFilesDescription', { error: `Error al leer el archivo ${file.name}`}));
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
          title: t('fileUploadArea.toastEmptyContentTitle'),
          description: t('fileUploadArea.toastEmptyContentDescription'),
          variant: "destructive",
        });
        return;
      }
      let finalNumQuestions = parseInt(numQuestions, 10);

      // Restrictions removed for PAU special
      // if (isFreeUser && finalNumQuestions > FREE_USER_MAX_QUESTIONS) {
      //   toast({
      //     title: t('fileUploadArea.toastFreeUserLimitTitle'),
      //     description: t('fileUploadArea.toastFreeUserLimitDescription', {maxQuestions: FREE_USER_MAX_QUESTIONS.toString()}),
      //     variant: "default",
      //     duration: 7000,
      //   });
      //   finalNumQuestions = FREE_USER_MAX_QUESTIONS;
      // }
      
      await onAnalyze(allFilesContent, finalNumQuestions); // examType removed

    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: t('fileUploadArea.toastErrorProcessingFilesTitle'),
        description: typeof error === 'string' ? error : t('fileUploadArea.toastErrorProcessingFilesFallback'),
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
          disabled={isLoading || isDeepSearching } // Removed isFreeUser check
          title={exam.name}
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
                  disabled={isLoading || isDeepSearching || isLoadingAppSettings}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('fileUploadArea.supportedFiles', { maxFiles: isLoadingAppSettings ? '...' : appUploadLimits.maxFiles.toString() })}
                </p>
              </div>

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
                    disabled={isLoading || isDeepSearching || isLoadingAppSettings } // Removed isFreeUser check
                  />
                  <Button onClick={() => handleDeepSearch()} disabled={isLoading || isDeepSearching || !deepSearchTopic.trim() || isLoadingAppSettings } className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isDeepSearching ? <Loader2 className="animate-spin" /> : <Search className="h-5 w-5" />}
                    <span className="ml-2 hidden sm:inline">{t('fileUploadArea.suggestButton')}</span>
                  </Button>
                </div>
              </div>

              {isDeepSearching && (
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
                            disabled={isLoading || isDeepSearching || isLoadingAppSettings}
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

      <div className="space-y-6 p-6 border rounded-lg shadow-xl bg-card"> {/* Removed lg:col-span-2 as it's now a direct child of the form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="num-questions-select" className="text-md font-medium">{t('dashboardPage.numQuestionsLabel')}</Label>
                <Select
                    value={numQuestions}
                    // onValueChange={val => isFreeUser && parseInt(val, 10) > FREE_USER_MAX_QUESTIONS ? setNumQuestions(FREE_USER_MAX_QUESTIONS.toString()) : setNumQuestions(val)} // Logic for free user limit removed
                    onValueChange={setNumQuestions}
                    disabled={isLoading || isDeepSearching || isLoadingAppSettings}
                >
                <SelectTrigger id="num-questions-select" className="w-full text-base py-3">
                    <SelectValue placeholder={t('common.selectOption')} />
                </SelectTrigger>
                <SelectContent>
                    {/* {isFreeUser && <SelectItem value="5">5 {t('fileUploadArea.questionsSuffix')}</SelectItem>}
                    {!isFreeUser && ( // Options for Pro/Admin - now all users
                      <> */}
                        <SelectItem value="5">5 {t('fileUploadArea.questionsSuffix')}</SelectItem>
                        <SelectItem value="10">10 {t('fileUploadArea.questionsSuffix')}</SelectItem>
                        <SelectItem value="15">15 {t('fileUploadArea.questionsSuffix')}</SelectItem>
                        <SelectItem value="20">20 {t('fileUploadArea.questionsSuffix')}</SelectItem>
                        <SelectItem value="25">25 {t('fileUploadArea.questionsSuffix')}</SelectItem>
                        <SelectItem value="30">30 {t('fileUploadArea.questionsSuffix')}</SelectItem>
                      {/* </>
                    )} */}
                </SelectContent>
                </Select>
                {/* {isFreeUser && <p className="text-xs text-muted-foreground mt-1">{t('fileUploadArea.finalAnalysisConfigFreeUserMaxText', {maxQuestions: FREE_USER_MAX_QUESTIONS.toString()})}</p>} */}
            </div>

            {/* Exam Type Selector - REMOVED FOR SIMPLICITY BASED ON PREVIOUS REQUESTS
            <div className="space-y-2">
                <Label htmlFor="exam-type-select" className="text-md font-medium">{t('fileUploadArea.examTypeLabel')}</Label>
                <Select value={examType} onValueChange={(value) => setExamType(value as ExamType)} disabled={isLoading || isDeepSearching || isLoadingAppSettings}>
                <SelectTrigger id="exam-type-select" className="w-full text-base py-3">
                    <SelectValue placeholder={t('common.selectOption')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="test">{t('fileUploadArea.examTypeTest')}</SelectItem>
                </SelectContent>
                </Select>
            </div>
            */}
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-lg font-semibold rounded-lg shadow-md transition-transform duration-150 ease-in-out active:scale-95 mt-6"
            disabled={isLoading || isDeepSearching || isLoadingAppSettings || (selectedFiles.length === 0 && selectedDeepSearchDocIds.length === 0) }
          >
            {isLoading || isLoadingAppSettings ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                {isLoadingAppSettings ? t('fileUploadArea.loadingConfigButton') : t('fileUploadArea.analyzingButton')}
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

    {/* Upgrade Dialog for Free User Limit - REMOVED FOR PAU SPECIAL
    <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('fileUploadArea.dailyLimitReachedPopupTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('fileUploadArea.dailyLimitReachedPopupDescription')}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('common.close')}</AlertDialogCancel>
                <AlertDialogAction asChild>
                    <Link href="/#pricing">{t('fileUploadArea.viewProPlansButtonPopup')}</Link>
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    */}
    </>
  );
}

