
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Lightbulb, CheckCircle, RefreshCw, Edit3, BookCopy, Clock, UsersIcon, BarChart3, FileText, ChevronLeft, ChevronRight, ListChecks, PackageCheck, Wand2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { generateCustomCourseSyllabus, type GenerateCustomCourseSyllabusInput, type GenerateCustomCourseSyllabusOutput } from '@/ai/flows/generate-custom-course-syllabus';
import { generateModuleContent, type GenerateModuleContentInput } from '@/ai/flows/generateModuleContent';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import AdSenseUnit from '@/components/ads/AdSenseUnit';

type CourseCreationStage = "define" | "review_syllabus" | "course_prep" | "course_view";

interface CourseModule {
  title: string;
  content: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}
interface DetailedCourse {
  courseTitleSuggestion: string;
  estimatedDuration: string;
  modules: CourseModule[];
}

export default function CreateCustomCoursePage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [stage, setStage] = useState<CourseCreationStage>("define");
  const [isLoading, setIsLoading] = useState(false); // General loading for syllabus generation
  const [isPreparingCourse, setIsPreparingCourse] = useState(false); // Specific loading for module content generation

  // Form inputs
  const [courseTopic, setCourseTopic] = useState("");
  const [courseLevel, setCourseLevel] = useState<"Principiante" | "Intermedio" | "Avanzado" | "">("");
  const [courseGoals, setCourseGoals] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // AI-generated data
  const [generatedSyllabus, setGeneratedSyllabus] = useState<GenerateCustomCourseSyllabusOutput | null>(null);
  const [detailedCourseData, setDetailedCourseData] = useState<DetailedCourse | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0); // For overall course content generation

  const handleGenerateSyllabus = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!courseTopic || !courseLevel) {
      toast({
        title: t('customCourses.createPage.validationErrorTitle'),
        description: t('customCourses.createPage.validationErrorDescription'),
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setGeneratedSyllabus(null);
    setDetailedCourseData(null); // Reset detailed course data
    try {
      const input: GenerateCustomCourseSyllabusInput = {
        courseTopic,
        courseLevel: courseLevel as "Principiante" | "Intermedio" | "Avanzado",
        courseGoals: courseGoals || undefined,
        targetAudience: targetAudience || undefined,
      };
      const result = await generateCustomCourseSyllabus(input);
      setGeneratedSyllabus(result);
      setStage("review_syllabus");
      toast({
        title: t('customCourses.createPage.syllabusGeneratedTitle'),
        description: t('customCourses.createPage.syllabusGeneratedDescription'),
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating syllabus:", error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('customCourses.createPage.syllabusGenerationError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAndPrepareCourse = async () => {
    if (!generatedSyllabus) return;

    setIsPreparingCourse(true);
    setStage("course_prep");
    setGenerationProgress(0);

    const initialModules: CourseModule[] = generatedSyllabus.syllabusItems.map(title => ({
      title,
      content: null,
      status: 'pending' as const,
    }));

    const courseDataToBuild: DetailedCourse = {
      courseTitleSuggestion: generatedSyllabus.courseTitleSuggestion,
      estimatedDuration: generatedSyllabus.estimatedDuration,
      modules: initialModules,
    };
    setDetailedCourseData(courseDataToBuild); 

    const updatedModules: CourseModule[] = [];
    for (let i = 0; i < initialModules.length; i++) {
      const module = initialModules[i];
      
      setDetailedCourseData(prev => ({
        ...prev!,
        modules: prev!.modules.map((m, idx) => idx === i ? { ...m, status: 'generating' } : m),
      }));

      try {
        const contentInput: GenerateModuleContentInput = {
          moduleTitle: module.title,
          courseTopic: courseTopic,
          courseLevel: courseLevel as "Principiante" | "Intermedio" | "Avanzado",
          courseGoals: courseGoals || undefined,
        };
        const moduleResult = await generateModuleContent(contentInput);
        updatedModules.push({ ...module, content: moduleResult.generatedContent, status: 'completed' });
      } catch (error) {
        console.error(`Error generating content for module "${module.title}":`, error);
        updatedModules.push({ ...module, content: t('customCourses.createPage.moduleContentError'), status: 'failed' });
         toast({
          title: t('customCourses.createPage.moduleContentErrorTitle', { moduleTitle: module.title}),
          description: error instanceof Error ? error.message : t('customCourses.createPage.moduleContentErrorGeneric'),
          variant: "destructive",
        });
      }
      setGenerationProgress(((i + 1) / initialModules.length) * 100);
      setDetailedCourseData(prev => ({
        ...prev!,
        modules: prev!.modules.map((m, idx) => idx === i ? updatedModules[updatedModules.length-1] : m),
      }));
    }
        
    setIsPreparingCourse(false);
    setCurrentModuleIndex(0);
    setStage("course_view");
    toast({
      title: t('customCourses.createPage.courseReadyTitle'),
      description: t('customCourses.createPage.courseReadyDescription'),
      variant: "default",
    });
  };
  
  const startOver = () => {
    setStage("define");
    setCourseTopic("");
    setCourseLevel("");
    setCourseGoals("");
    setTargetAudience("");
    setGeneratedSyllabus(null);
    setDetailedCourseData(null);
    setIsLoading(false);
    setIsPreparingCourse(false);
    setGenerationProgress(0);
    setCurrentModuleIndex(0);
  }

  const navigateModule = (direction: 'next' | 'prev') => {
    if (!detailedCourseData) return;
    if (direction === 'next' && currentModuleIndex < detailedCourseData.modules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentModuleIndex > 0) {
      setCurrentModuleIndex(prev => prev + 1);
    }
  };

  const currentVisualProgress = detailedCourseData?.modules.length 
    ? ((currentModuleIndex + 1) / detailedCourseData.modules.length) * 100 
    : 0;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <CardTitle className="text-3xl flex items-center gap-3 text-primary">
          <Wand2 className="h-8 w-8" /> 
          {t('customCourses.createPage.title')}
        </CardTitle>
        <Link href="/dashboard" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('configurePage.backToDashboard')} 
          </Button>
        </Link>
      </div>

      <Card className="w-full shadow-xl">
        <CardHeader>
          {/* CardTitle moved above Card component */}
          <CardDescription className="text-base">
            {t('customCourses.createPage.descriptionForAllUsers')} 
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <AdSenseUnit adSlot="YOUR_AD_SLOT_ID_FOR_CUSTOM_COURSES" className="mb-6" />

          {stage === "define" && (
            <form onSubmit={handleGenerateSyllabus} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="courseTopic" className="text-lg">{t('customCourses.createPage.topicLabel')}</Label>
                  <Input
                    id="courseTopic"
                    value={courseTopic}
                    onChange={(e) => setCourseTopic(e.target.value)}
                    placeholder={t('customCourses.createPage.topicPlaceholder')}
                    required
                    className="text-base p-3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseLevel" className="text-lg">{t('customCourses.createPage.levelLabel')}</Label>
                  <Select value={courseLevel} onValueChange={(value) => setCourseLevel(value as any)} required>
                    <SelectTrigger id="courseLevel" className="text-base p-3">
                      <SelectValue placeholder={t('customCourses.createPage.levelPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Principiante">{t('customCourses.createPage.levelBeginner')}</SelectItem>
                      <SelectItem value="Intermedio">{t('customCourses.createPage.levelIntermediate')}</SelectItem>
                      <SelectItem value="Avanzado">{t('customCourses.createPage.levelAdvanced')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="courseGoals" className="text-lg">{t('customCourses.createPage.goalsLabel')}</Label>
                <Textarea
                  id="courseGoals"
                  value={courseGoals}
                  onChange={(e) => setCourseGoals(e.target.value)}
                  placeholder={t('customCourses.createPage.goalsPlaceholder')}
                  rows={3}
                  className="text-base p-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="text-lg">{t('customCourses.createPage.audienceLabel')}</Label>
                <Input
                  id="targetAudience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder={t('customCourses.createPage.audiencePlaceholder')}
                  className="text-base p-3"
                />
              </div>
              <Button type="submit" className="w-full md:w-auto text-lg py-3 px-6 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lightbulb className="mr-2 h-5 w-5" />}
                {t('customCourses.createPage.generateSyllabusButton')}
              </Button>
            </form>
          )}

          {stage === "review_syllabus" && generatedSyllabus && (
            <div className="space-y-6">
              <Alert variant="default" className="bg-green-500/10 border-green-500/50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-700">{t('customCourses.createPage.syllabusProposalTitle')}</AlertTitle>
                <AlertDescription className="text-green-700/90">
                  {t('customCourses.createPage.syllabusProposalDescription')}
                </AlertDescription>
              </Alert>

              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2 text-primary">
                     <FileText className="h-6 w-6"/> {generatedSyllabus.courseTitleSuggestion || t('customCourses.createPage.suggestedSyllabusTitle')}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> {t('customCourses.createPage.estimatedDurationLabel')}: {generatedSyllabus.estimatedDuration}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">{t('customCourses.createPage.syllabusModulesTitle')}</h3>
                  <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                    {generatedSyllabus.syllabusItems.map((item, index) => (
                      <AccordionItem value={`item-${index}`} key={index} className="border-b">
                        <AccordionTrigger className="text-left hover:no-underline py-3 text-base">
                          {t('customCourses.createPage.moduleLabel')} {index + 1}: {item}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pt-1 pb-3">
                          {t('customCourses.createPage.moduleContentPlaceholder')}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4 justify-center items-center pt-4 max-w-sm mx-auto">
                <Button onClick={handleAcceptAndPrepareCourse} className="w-full text-md py-3 px-6 bg-primary hover:bg-primary/90" disabled={isPreparingCourse}>
                  {isPreparingCourse ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PackageCheck className="mr-2 h-5 w-5" />}
                  {t('customCourses.createPage.acceptAndPrepareButton')}
                </Button>
                <Button variant="outline" onClick={() => handleGenerateSyllabus()} className="w-full text-md py-3 px-6" disabled={isPreparingCourse || isLoading}>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  {t('customCourses.createPage.regenerateSyllabusButton')}
                </Button>
                 <Button variant="link" onClick={startOver} className="text-sm">
                   {t('customCourses.createPage.startOverButton')}
                 </Button>
              </div>
            </div>
          )}

          {stage === "course_prep" && detailedCourseData && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center text-primary">
                {t('customCourses.createPage.preparingCourseTitle', { courseName: detailedCourseData.courseTitleSuggestion || courseTopic })}
              </h2>
              <Progress value={generationProgress} className="w-full h-4" />
              <p className="text-sm text-center text-muted-foreground">
                {t('customCourses.createPage.generatingModulesProgress', { completed: Math.floor(detailedCourseData.modules.filter(m => m.status === 'completed' || m.status === 'failed').length), total: detailedCourseData.modules.length, progress: generationProgress.toFixed(0) })}
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto border p-3 rounded-md">
                {detailedCourseData.modules.map((module, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">{t('customCourses.createPage.moduleLabel')} {index + 1}: {module.title}</span>
                    {module.status === 'pending' && <span className="text-xs text-muted-foreground">{t('customCourses.createPage.moduleStatusPending')}</span>}
                    {module.status === 'generating' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {module.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {module.status === 'failed' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  </div>
                ))}
              </div>
               <p className="text-center text-muted-foreground">{t('customCourses.createPage.coursePreparationPatience')}</p>
            </div>
          )}

          {stage === "course_view" && detailedCourseData && (
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary flex items-center gap-2">
                    <BookCopy className="h-7 w-7" />
                    {detailedCourseData.courseTitleSuggestion}
                  </CardTitle>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-muted-foreground">{t('customCourses.createPage.moduleProgress', { current: currentModuleIndex + 1, total: detailedCourseData.modules.length })}</p>
                    <div className="w-1/2">
                       <Progress value={currentVisualProgress} className="h-2.5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {detailedCourseData.modules[currentModuleIndex].title}
                  </h3>
                  {detailedCourseData.modules[currentModuleIndex].status === 'generating' && (
                     <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p>{t('customCourses.createPage.moduleContentLoading')}</p>
                     </div>
                  )}
                  {detailedCourseData.modules[currentModuleIndex].status === 'failed' && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t('customCourses.createPage.moduleContentErrorTitleShort')}</AlertTitle>
                      <AlertDescription>
                        {detailedCourseData.modules[currentModuleIndex].content || t('customCourses.createPage.moduleContentErrorGeneric')}
                      </AlertDescription>
                    </Alert>
                  )}
                  {detailedCourseData.modules[currentModuleIndex].status === 'completed' && (
                    <ScrollArea className="h-[400px] p-4 border rounded-md bg-muted/30">
                      <div 
                        className="prose prose-sm sm:prose-base max-w-none whitespace-pre-line"
                        dangerouslySetInnerHTML={{ __html: detailedCourseData.modules[currentModuleIndex].content?.replace(/\n/g, '<br />') || '' }}
                      />
                    </ScrollArea>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between pt-4">
                  <Button onClick={() => navigateModule('prev')} disabled={currentModuleIndex === 0 || isPreparingCourse}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> {t('customCourses.createPage.previousModuleButton')}
                  </Button>
                  <Button onClick={() => navigateModule('next')} disabled={currentModuleIndex === detailedCourseData.modules.length - 1 || isPreparingCourse}>
                    {t('customCourses.createPage.nextModuleButton')} <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
               <Button variant="outline" onClick={startOver} className="mx-auto block mt-6">
                 {t('customCourses.createPage.createNewCourseButton')}
               </Button>
            </div>
          )}

        </CardContent>
        {(stage === "define" || stage === "review_syllabus") && (
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              {t('customCourses.createPage.betaNote')}
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
