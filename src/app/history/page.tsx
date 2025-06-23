
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, History, ArrowLeft, BookOpen, AlertCircle, MoreVertical, Share2, Download, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { PREDICTED_DATA_KEY, EXAM_HISTORY_KEY } from '@/lib/localStorageKeys';
import type { PredictedData } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function HistoryPage() {
  const { t, language } = useI18n();
  const { currentUser, userTier, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [examHistory, setExamHistory] = useState<PredictedData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [examToDelete, setExamToDelete] = useState<PredictedData | null>(null);

  useEffect(() => {
    const storedHistory = localStorage.getItem(EXAM_HISTORY_KEY);
    if (storedHistory) {
      try {
        const parsedHistory: PredictedData[] = JSON.parse(storedHistory);
        // Ensure history is sorted from newest to oldest
        parsedHistory.sort((a, b) => b.timestamp - a.timestamp);
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

  const handleDeleteExam = () => {
    if (!examToDelete) return;
    const updatedHistory = examHistory.filter(exam => exam.id !== examToDelete.id);
    setExamHistory(updatedHistory);
    localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(updatedHistory));
    toast({
      title: t('historyPage.examDeletedToastTitle'),
      description: t('historyPage.examDeletedToastDescription'),
      variant: "default",
    });
    setExamToDelete(null);
  };

  const handleShare = () => {
    toast({
        title: t('historyPage.comingSoonTitle'),
        description: t('historyPage.comingSoonDescription'),
    });
  };

  const handleDownloadPdf = async (exam: PredictedData) => {
    if (userTier === 'free') {
        toast({
            title: t('historyPage.proFeatureTitle', {defaultValue: "Pro Feature"}),
            description: t('historyPage.downloadProFeature'),
        });
        return;
    }

    toast({
        title: t('historyPage.generatingPdfTitle', {defaultValue: "Generating PDF..."}),
        description: t('historyPage.generatingPdfDescription', {defaultValue: "This may take a moment."}),
    });

    try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const maxLineWidth = pageWidth - margin * 2;
        let y = 20;

        const checkPageBreak = (spaceNeeded: number) => {
            if (y + spaceNeeded > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }
        };

        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(exam.title, margin, y);
        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`${t('historyPage.generatedOn', {defaultValue: "Generated on"})} ${formatDate(exam.timestamp)}`, margin, y);
        y += 10;
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
        
        // Summary
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(t('dashboardPage.analysisSummaryLabel', {defaultValue: "Analysis summary:"}), margin, y);
        y += 8;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(exam.analysisSummary, maxLineWidth);
        checkPageBreak(summaryLines.length * 7 + 5);
        doc.text(summaryLines, margin, y);
        y += summaryLines.length * 7 + 5;
        
        // Themes
        if (exam.recurringThemes && exam.recurringThemes.length > 0) {
            checkPageBreak(15);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(t('dashboardPage.mainThemesLabel', {defaultValue: "Main themes:"}), margin, y);
            y += 8;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(exam.recurringThemes.join(', '), margin, y);
            y += 10;
        }

        // Questions
        checkPageBreak(20);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(t('historyPage.generatedQuestionsTitle', {defaultValue: "Generated Questions"}), margin, y);
        y += 10;

        exam.questions.forEach((q, index) => {
            checkPageBreak(50); // Minimum space for a question
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            const questionLines = doc.splitTextToSize(`${index + 1}. ${q.questionText}`, maxLineWidth);
            checkPageBreak(questionLines.length * 7 + 5);
            doc.text(questionLines, margin, y);
            y += questionLines.length * 7 + 5;

            doc.setFont('helvetica', 'normal');
            q.options.forEach((option, optIndex) => {
                const isCorrect = optIndex === q.correctAnswerIndex;
                const prefix = `${String.fromCharCode(65 + optIndex)}) `;
                if (isCorrect) {
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(34, 139, 34); // ForestGreen
                }
                const optionLines = doc.splitTextToSize(prefix + option, maxLineWidth - 5);
                checkPageBreak(optionLines.length * 6 + 2);
                doc.text(optionLines, margin + 5, y);
                y += optionLines.length * 6 + 2;
                if (isCorrect) {
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(0, 0, 0); // Black
                }
            });

            if (q.explanation) {
                checkPageBreak(20);
                y += 2;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                const explanationLines = doc.splitTextToSize(`${t('predictedQuestionCard.viewBriefExplanation', {defaultValue: "View brief explanation of the answer"})}: ${q.explanation}`, maxLineWidth - 5);
                checkPageBreak(explanationLines.length * 5 + 5);
                doc.text(explanationLines, margin + 5, y);
                y += explanationLines.length * 5 + 5;
                doc.setFont('helvetica', 'normal');
            }
             y += 5;
             if (index < exam.questions.length - 1) {
                doc.line(margin, y, pageWidth - margin, y);
                y+= 5;
             }
        });

        doc.save(`${exam.title.substring(0, 25).replace(/[^a-z0-9]/gi, '_')}_zeinte_exam.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
            title: t('common.error'),
            description: (error instanceof Error) ? error.message : t('historyPage.pdfGenerationError', {defaultValue: "Could not generate PDF."}),
            variant: "destructive"
        });
    }
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
    <>
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
            <Card key={exam.id} className="shadow-md hover:shadow-xl transition-shadow flex flex-col relative group">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Opciones del examen</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        <span>{t('historyPage.shareExam')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadPdf(exam)}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>{t('historyPage.downloadPDF')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setExamToDelete(exam)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>{t('historyPage.deleteExam')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <CardHeader>
                <CardTitle className="text-lg text-primary truncate pr-8" title={exam.title}>{exam.title}</CardTitle>
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

    <AlertDialog open={!!examToDelete} onOpenChange={(open) => !open && setExamToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('historyPage.deleteConfirmationTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('historyPage.deleteConfirmationDescription')}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setExamToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteExam} className="bg-destructive hover:bg-destructive/90">
                    <Trash2 className="mr-2 h-4 w-4" /> {t('historyPage.deleteConfirmButton')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
