
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, History, ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { PREDICTED_DATA_KEY, EXAM_HISTORY_KEY } from '@/lib/localStorageKeys';
import type { PredictedData } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HistoryPage() {
  const { t, language } = useI18n();
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [examHistory, setExamHistory] = useState<PredictedData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedHistory = localStorage.getItem(EXAM_HISTORY_KEY);
    if (storedHistory) {
      try {
        const parsedHistory: PredictedData[] = JSON.parse(storedHistory);
        setExamHistory(parsedHistory);
      } catch (error) {
        console.error("Failed to parse exam history from localStorage", error);
        setExamHistory([]);
      }
    }
    setIsLoading(false);
  }, []);

  const formatDate = (timestamp: number) => {
    try {
      return format(new Date(timestamp), 'PPpp', { locale: language === 'es' ? es : undefined });
    } catch (error) {
      console.error("Error formatting date:", error);
      return t('common.invalidDate', {defaultValue: "Invalid date"});
    }
  };

  const handleStudyExam = (exam: PredictedData) => {
    localStorage.setItem(PREDICTED_DATA_KEY, JSON.stringify(exam));
    router.push('/exam/result');
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{t('historyPage.loadingHistory', {defaultValue: "Loading exam history..."})}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-3">
            <History className="h-8 w-8" />
            {t('historyPage.title', {defaultValue: "Exam History"})}
          </CardTitle>
          <CardDescription className="mt-2">{t('historyPage.description', {defaultValue: "Review your past analysis and study sessions."})}</CardDescription>
        </div>
        <Link href="/dashboard" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> {t('examResultPage.backToDashboard')}</Button>
        </Link>
      </div>

      {examHistory.length === 0 ? (
        <Alert variant="default" className="bg-blue-500/10 border-blue-500/50">
            <AlertCircle className="h-5 w-5 text-blue-700" />
            <AlertTitle className="text-blue-700">{t('historyPage.noHistoryTitle', {defaultValue: "No History Found"})}</AlertTitle>
            <AlertDescription className="text-blue-700/90">
              {t('historyPage.noHistoryDescription', {defaultValue: "You haven't generated any exams yet. Go to the upload section to start!"})}
              <Link href="/upload" className="font-semibold underline hover:text-blue-800 ml-1">
                {t('historyPage.goToUpload', {defaultValue: "Go to Upload"})}
              </Link>
            </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examHistory.map((exam) => (
            <Card key={exam.id} className="shadow-md hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg text-primary truncate" title={exam.title}>{exam.title}</CardTitle>
                <CardDescription>{t('historyPage.generatedOn', {defaultValue: "Generated on"})} {formatDate(exam.timestamp)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                <p><span className="font-semibold">{t('dashboardPage.questionsGeneratedLabel')}</span> {exam.questions?.length || 0}</p>
                {exam.recurringThemes && exam.recurringThemes.length > 0 && (
                  <p><span className="font-semibold">{t('dashboardPage.mainThemesLabel')}</span> {exam.recurringThemes.slice(0, 3).join(', ')}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleStudyExam(exam)} className="w-full">
                  <BookOpen className="mr-2 h-4 w-4" /> {t('historyPage.studyButton', {defaultValue: "Study Exam"})}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
