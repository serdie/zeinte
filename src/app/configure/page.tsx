
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Removed
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EXAM_CONFIG_KEY } from '@/lib/localStorageKeys';
import type { ExamConfig } from '@/types'; // Removed ExamType
import { Save, Settings, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';


const DEFAULT_CONFIG: ExamConfig = {
  defaultNumberOfQuestions: 10,
  // defaultExamType: "test", // Removed
};

export default function ConfigureExamPage() {
  const { t } = useI18n();
  const [config, setConfig] = useState<ExamConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedConfig = localStorage.getItem(EXAM_CONFIG_KEY);
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        // Validate parsed config structure
        if (parsedConfig.defaultNumberOfQuestions) { // Removed check for defaultExamType
          setConfig({defaultNumberOfQuestions: parsedConfig.defaultNumberOfQuestions});
        } else {
          setConfig(DEFAULT_CONFIG); 
          localStorage.setItem(EXAM_CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
        }
      } catch (error) {
        console.error("Error parsing exam config from localStorage:", error);
        setConfig(DEFAULT_CONFIG); 
      }
    } else {
      localStorage.setItem(EXAM_CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    }
    setIsLoading(false);
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem(EXAM_CONFIG_KEY, JSON.stringify(config));
    toast({
      title: t('configurePage.configSavedToastTitle'),
      description: t('configurePage.configSavedToastDescription'),
      variant: "default",
    });
  };

  const handleNumberOfQuestionsChange = (value: string) => {
    setConfig(prev => ({ ...prev, defaultNumberOfQuestions: parseInt(value, 10) }));
  };

  // Removed handleExamTypeChange

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><p>{t('configurePage.loadingConfig')}</p></div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" />
            {t('configurePage.title')}
          </CardTitle>
          <CardDescription>
            {t('configurePage.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="num-questions-config">{t('configurePage.defaultNumQuestionsLabel')}</Label>
            <Select
              value={config.defaultNumberOfQuestions.toString()}
              onValueChange={handleNumberOfQuestionsChange}
              disabled={isLoading}
            >
              <SelectTrigger id="num-questions-config" className="w-full sm:w-[200px]">
                <SelectValue placeholder={t('configurePage.defaultNumQuestionsPlaceholder')} />
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

          {/* Removed Exam Type Configuration Section */}
          
          <Button
            onClick={handleSaveConfig}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base"
            disabled={isLoading}
          >
            <Save className="mr-2 h-5 w-5" />
            {t('configurePage.saveConfigButton')}
          </Button>
        </CardContent>
      </Card>
       <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('configurePage.reanalyzeWarningTitle')}</AlertTitle>
        <AlertDescription>
          {t('configurePage.reanalyzeWarningDescription')}
        </AlertDescription>
      </Alert>
       <div className="text-center mt-8">
         <Link href="/dashboard" passHref>
            <Button variant="outline">
              {t('configurePage.backToDashboard')}
            </Button>
          </Link>
       </div>
    </div>
  );
}
