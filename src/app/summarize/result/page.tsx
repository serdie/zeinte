
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { CURRENT_SUMMARY_DATA_KEY } from '@/lib/localStorageKeys';
import type { SummaryData } from '@/types';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileText, ArrowLeft, RefreshCw, Star, Info, List, CheckCircle, BrainCircuit } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { generateSummary } from '@/ai/flows/generate-summary';


export default function SummaryResultPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem(CURRENT_SUMMARY_DATA_KEY);
    if (storedData) {
      try {
        const parsedData: SummaryData = JSON.parse(storedData);
        setSummaryData(parsedData);
      } catch (error) {
        console.error("Failed to parse summary data from localStorage", error);
        localStorage.removeItem(CURRENT_SUMMARY_DATA_KEY);
        toast({ title: t('common.error'), description: "Could not load summary data. Redirecting.", variant: 'destructive' });
        router.push('/dashboard');
      }
    } else {
        toast({ title: "No Summary Data", description: "No summary data found. Please generate a summary first.", variant: 'default' });
        router.push('/summarize');
    }
    setIsLoading(false);
  }, [router, toast, t]);

  const handleReAnalyze = async () => {
    if (!summaryData?.originalDocumentContent) {
      toast({ title: t('common.error'), description: "No original content available to re-analyze.", variant: "destructive" });
      return;
    }
    
    setIsReanalyzing(true);
    try {
        const result = await generateSummary({ 
            documentContent: summaryData.originalDocumentContent
        });

        const dataToStore: SummaryData = {
            ...summaryData,
            summary: result,
            timestamp: Date.now(),
        };

        localStorage.setItem(CURRENT_SUMMARY_DATA_KEY, JSON.stringify(dataToStore));
        setSummaryData(dataToStore);
        toast({ title: t('uploadPage.successToastTitle'), description: "New summary has been generated.", variant: "default" });

    } catch (error) {
        console.error("Error during re-analysis:", error);
        toast({ title: t('uploadPage.errorProcessingToastTitle'), description: (error instanceof Error ? error.message : t('uploadPage.errorProcessingToastFallback')), variant: "destructive" });
    } finally {
        setIsReanalyzing(false);
    }
  };
  
  const renderIcon = (iconName: string | undefined) => {
    if (!iconName) return <List className="h-5 w-5 text-primary" />;
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className="h-5 w-5 text-primary" />;
    }
    return <List className="h-5 w-5 text-primary" />;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{t('dashboardPage.loadingData')}</p>
      </div>
    );
  }

  if (!summaryData) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
            <h2 className="text-2xl font-bold mb-4">No Summary Data</h2>
            <p className="text-muted-foreground mb-6">Could not find generated summary data. Please go back and generate one.</p>
            <Link href="/summarize" passHref><Button><ArrowLeft className="mr-2 h-4 w-4" /> Go to Create Summary</Button></Link>
        </div>
    );
  }

  const { title, summary } = summaryData;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-3">
                <FileText className="h-8 w-8" />
                {t('summaryResultPage.title')}
              </CardTitle>
              <CardDescription className="mt-2">{t('summaryResultPage.description')}</CardDescription>
            </div>
            <Link href="/dashboard" passHref>
              <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> {t('examResultPage.backToDashboard')}</Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl md:text-2xl text-accent">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <Alert variant="default" className="bg-muted">
                <BrainCircuit className="h-4 w-4" />
                <AlertTitle>{t('summaryResultPage.introductionTitle')}</AlertTitle>
                <AlertDescription className="prose prose-sm max-w-none">{summary.introduction}</AlertDescription>
            </Alert>
            
            <Alert variant="default" className="bg-muted">
                <Star className="h-4 w-4" />
                <AlertTitle>{t('summaryResultPage.keyPointsTitle')}</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                        {summary.keyPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                        ))}
                    </ul>
                </AlertDescription>
            </Alert>

            <div>
                <h3 className="text-lg font-semibold mb-4">{t('summaryResultPage.sectionsTitle')}</h3>
                <div className="space-y-4">
                    {summary.sections.map((section, index) => (
                        <Card key={index} className="bg-background/50">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {renderIcon(section.icon)}
                                    {section.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="prose prose-sm max-w-none whitespace-pre-line">
                                {section.content}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Alert variant="default" className="bg-blue-500/10 border-blue-500/50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-700">{t('summaryResultPage.conclusionTitle')}</AlertTitle>
                <AlertDescription className="text-blue-700/90 prose prose-sm max-w-none">{summary.conclusion}</AlertDescription>
            </Alert>

        </CardContent>
        <CardFooter>
             <Button onClick={handleReAnalyze} disabled={isReanalyzing || !summaryData.originalDocumentContent} className="w-full sm:w-auto">
                {isReanalyzing ? <Loader2 className="animate-spin mr-2"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
                {t('summaryResultPage.regenerateButton')}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
