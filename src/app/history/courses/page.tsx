
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, GraduationCap, ArrowLeft, BookOpen, AlertCircle, MoreVertical, Share2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { COURSE_HISTORY_KEY, CURRENT_COURSE_DATA_KEY } from '@/lib/localStorageKeys';
import type { DetailedCourse } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function CourseHistoryPage() {
  const { t, language } = useI18n();
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [courseHistory, setCourseHistory] = useState<DetailedCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courseToDelete, setCourseToDelete] = useState<DetailedCourse | null>(null);

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedHistory = localStorage.getItem(COURSE_HISTORY_KEY);
      if (storedHistory) {
        const parsedHistory: DetailedCourse[] = JSON.parse(storedHistory);
        setCourseHistory(parsedHistory);
      }
    } catch (error) {
      console.error("Failed to fetch course history from localStorage:", error);
      toast({
        title: t('common.error'),
        description: "Could not load course history from the browser.",
        variant: "destructive"
      });
      setCourseHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  const formatDate = (timestamp: number) => {
    try {
       if (!timestamp || isNaN(timestamp)) return t('common.invalidDate', {defaultValue: "Invalid date"});
      return format(new Date(timestamp), 'PPpp', { locale: language === 'es' ? es : undefined });
    } catch (error) {
      console.error("Error formatting date:", error);
      return t('common.invalidDate', {defaultValue: "Invalid date"});
    }
  };

  const handleStudyCourse = (course: DetailedCourse) => {
    // We need to set the current course and navigate to the viewer page.
    // The viewer page is currently the creation page in a "view" state.
    localStorage.setItem(CURRENT_COURSE_DATA_KEY, JSON.stringify({ ...course, currentModuleIndex: 0 }));
    router.push('/custom-courses/create');
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    try {
      const updatedHistory = courseHistory.filter(course => course.id !== courseToDelete.id);
      setCourseHistory(updatedHistory);
      localStorage.setItem(COURSE_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      toast({
        title: t('historyPage.courseDeletedToastTitle'),
        description: t('historyPage.courseDeletedToastDescription'),
        variant: "default",
      });
    } catch (error) {
       console.error("Error deleting course from localStorage:", error);
       toast({
         title: t('common.error'),
         description: "Could not delete the course from the browser storage.",
         variant: "destructive"
       });
    } finally {
      setCourseToDelete(null);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{t('historyPage.loadingCourseHistory', {defaultValue: "Loading course history..."})}</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-3">
            <GraduationCap className="h-8 w-8" />
            {t('historyPage.courseHistoryTitle', {defaultValue: "Course History"})}
          </CardTitle>
          <CardDescription className="mt-2">{t('historyPage.courseHistoryDescription', {defaultValue: "Review your previously generated custom courses."})}</CardDescription>
        </div>
        <Link href="/dashboard" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> {t('examResultPage.backToDashboard')}</Button>
        </Link>
      </div>
      
      {courseHistory.length === 0 ? (
        <Alert variant="default" className="bg-blue-500/10 border-blue-500/50">
            <AlertCircle className="h-5 w-5 text-blue-700" />
            <AlertTitle className="text-blue-700">{t('historyPage.noCourseHistoryTitle', {defaultValue: "No Course History Found"})}</AlertTitle>
            <AlertDescription className="text-blue-700/90">
              {t('historyPage.noCourseHistoryDescription', {defaultValue: "You haven't generated any custom courses yet."})}
              <Link href="/custom-courses/create" className="font-semibold underline hover:text-blue-800 ml-1">
                {t('historyPage.goToCourseCreation', {defaultValue: "Create one now"})}
              </Link>
            </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courseHistory.map((course) => (
            <Card key={course.id} className="shadow-md hover:shadow-xl transition-shadow flex flex-col relative group">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Opciones del curso</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                        toast({ title: t('common.soon'), description: 'Sharing courses will be available soon.' });
                    }}>
                        <Share2 className="mr-2 h-4 w-4" />
                        <span>{t('historyPage.shareCourse')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCourseToDelete(course)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>{t('historyPage.deleteCourse')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <CardHeader>
                <CardTitle className="text-lg text-primary truncate pr-8" title={course.courseTitleSuggestion}>{course.courseTitleSuggestion}</CardTitle>
                <CardDescription>{t('historyPage.generatedOn', {defaultValue: "Generated on"})} {formatDate(course.timestamp)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                <p><span className="font-semibold">{t('customCourses.createPage.estimatedDurationLabel')}:</span> {course.estimatedDuration}</p>
                <p><span className="font-semibold">{t('customCourses.createPage.moduleLabel')}s:</span> {course.modules.length}</p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleStudyCourse(course)} className="w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {t('historyPage.studyCourseButton', {defaultValue: "Study Course"})}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>

    <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('historyPage.deleteCourseConfirmationTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('historyPage.deleteCourseConfirmationDescription')}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCourseToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive hover:bg-destructive/90">
                    <Trash2 className="mr-2 h-4 w-4" /> {t('historyPage.deleteConfirmButton')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
