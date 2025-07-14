
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PREDICTED_DATA_KEY } from '@/lib/localStorageKeys';
import type { PredictedData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, BookOpenText, History, BarChart3, Settings, Users, User, Lightbulb, ArrowRight, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardPage() {
  const { t, language } = useI18n();
  const { currentUser, userProfileData, loading: authLoading } = useAuth();
  const [predictedData, setPredictedData] = useState<PredictedData | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);

  useEffect(() => {
    const storedData = localStorage.getItem(PREDICTED_DATA_KEY);
    if (storedData) {
      try {
        const parsedData: PredictedData = JSON.parse(storedData);
        setPredictedData(parsedData);
      } catch (error) {
        console.error("Failed to parse predicted data from localStorage", error);
        localStorage.removeItem(PREDICTED_DATA_KEY); // Clear corrupted data
        setPredictedData(null);
      }
    }
    setIsLoadingInitialData(false);
  }, []);

  const formatDate = (timestamp: number) => {
    try {
      return format(new Date(timestamp), 'PPpp', { locale: language === 'es' ? es : undefined });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Fecha inválida";
    }
  };
  
  const displayName = userProfileData?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || t('dashboardPage.guestUser');

  if (isLoadingInitialData || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{t('dashboardPage.loadingData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
          {t('dashboardPage.welcomeTitle', { name: displayName })}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('dashboardPage.welcomeSubtitle')}
        </p>
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">{t('dashboardPage.startNewAnalysisTitle')}</CardTitle>
            <CardDescription className="text-primary-foreground/80">{t('dashboardPage.startNewAnalysisDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/upload" passHref>
              <Button size="lg" className="bg-background text-primary hover:bg-background/90 w-full sm:w-auto text-lg py-3">
                <UploadCloud className="mr-3 h-6 w-6" />
                {t('dashboardPage.uploadDocsButton')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {predictedData && (
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-primary">
                <BookOpenText className="h-6 w-6" />
                {t('dashboardPage.lastAnalysisTitle')}
              </CardTitle>
              <CardDescription>{t('dashboardPage.lastAnalysisDate', { date: formatDate(predictedData.timestamp) })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold">{t('dashboardPage.analysisSummaryLabel')}</span> {predictedData.analysisSummary.substring(0, 100)}...</p>
              {predictedData.recurringThemes && predictedData.recurringThemes.length > 0 && (
                <p><span className="font-semibold">{t('dashboardPage.mainThemesLabel')}</span> {predictedData.recurringThemes.slice(0, 3).join(', ')}</p>
              )}
              <p><span className="font-semibold">{t('dashboardPage.questionsGeneratedLabel')}</span> {predictedData.questions?.length || 0}</p>
            </CardContent>
            <CardFooter>
               <Link href="/exam/result" passHref className="w-full">
                <Button variant="outline" className="w-full">
                  <ArrowRight className="mr-2 h-4 w-4" /> {t('dashboardPage.viewAndStudyButton')}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-primary">
              <History className="h-6 w-6" />
              {t('dashboardPage.examHistoryTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t('dashboardPage.examHistoryDescription')}</p>
          </CardContent>
           <CardFooter>
            <Link href="/history" passHref className="w-full">
              <Button variant="ghost" className="w-full text-primary">
                 {t('dashboardPage.viewHistoryButton')}
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-primary">
              <BarChart3 className="h-6 w-6" />
              {t('dashboardPage.studyStatsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t('dashboardPage.studyStatsDescription')}</p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full text-primary" disabled>
               {t('dashboardPage.viewStatsButton')} ({t('common.soon')})
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-primary">{t('dashboardPage.quickAccessTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { href: '/configure', labelKey: 'sidebar.configureExam', icon: Settings },
            { href: '/community', labelKey: 'sidebar.community', icon: Users },
            { href: '/profile', labelKey: 'sidebar.profile', icon: User },
            { href: '/custom-courses/create', labelKey: 'sidebar.createCourse', icon: Lightbulb },
            { href: '/#pricing', labelKey: 'pricingPage.mainTitle', icon: ArrowRight },
          ].map(item => (
            <Link key={item.href} href={item.href} passHref>
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center p-2 text-center shadow-sm hover:shadow-md hover:bg-accent/50">
                <item.icon className="h-7 w-7 mb-1 text-primary" />
                <span className="text-xs font-medium text-foreground">{t(item.labelKey)}</span>
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}
