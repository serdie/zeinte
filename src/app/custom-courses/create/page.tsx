
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress'; // Added import
import { Loader2, Lightbulb, CheckCircle, RefreshCw, Edit3, BookCopy, Clock, UsersIcon, BarChart3, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { generateCustomCourseSyllabus, type GenerateCustomCourseSyllabusInput, type GenerateCustomCourseSyllabusOutput } from '@/ai/flows/generate-custom-course-syllabus';

type CourseCreationStage = "define" | "review_syllabus" | "course_prep" | "course_view";

export default function CreateCustomCoursePage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [stage, setStage] = useState<CourseCreationStage>("define");
  const [isLoading, setIsLoading] = useState(false);

  const [courseTopic, setCourseTopic] = useState("");
  const [courseLevel, setCourseLevel] = useState<"Principiante" | "Intermedio" | "Avanzado" | "">("");
  const [courseGoals, setCourseGoals] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  const [generatedSyllabus, setGeneratedSyllabus] = useState<GenerateCustomCourseSyllabusOutput | null>(null);

  const handleGenerateSyllabus = async (event: FormEvent) => {
    event.preventDefault();
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
    try {
      const input: GenerateCustomCourseSyllabusInput = {
        courseTopic,
        courseLevel: courseLevel as "Principiante" | "Intermedio" | "Avanzado", // Type assertion
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

  const handlePrepareCourse = () => {
    // This will eventually trigger full course generation
    setIsLoading(true);
    // Simulate delay for course preparation
    setTimeout(() => {
      setStage("course_prep");
      setIsLoading(false);
      toast({
        title: t('customCourses.createPage.coursePreparationStartedTitle'),
        description: t('customCourses.createPage.coursePreparationStartedDescription'),
      });
    }, 1500);
  };
  
  const startOver = () => {
    setStage("define");
    setCourseTopic("");
    setCourseLevel("");
    setCourseGoals("");
    setTargetAudience("");
    setGeneratedSyllabus(null);
    setIsLoading(false);
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3 text-primary">
            <Lightbulb className="h-8 w-8" />
            {t('customCourses.createPage.title')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('customCourses.createPage.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
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

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button onClick={handlePrepareCourse} className="w-full sm:w-auto text-md py-3 px-6 bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                  {t('customCourses.createPage.acceptAndPrepareButton')}
                </Button>
                <Button variant="outline" onClick={() => handleGenerateSyllabus(new Event('submit') as any)} className="w-full sm:w-auto text-md py-3 px-6" disabled={isLoading}>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  {t('customCourses.createPage.regenerateSyllabusButton')}
                </Button>
                <Button variant="outline" className="w-full sm:w-auto text-md py-3 px-6" disabled={true} title={t('common.soon')}>
                  <Edit3 className="mr-2 h-5 w-5" />
                  {t('customCourses.createPage.modifySyllabusButton')}
                </Button>
              </div>
               <Button variant="link" onClick={startOver} className="mx-auto block mt-4 text-sm">
                {t('customCourses.createPage.startOverButton')}
              </Button>
            </div>
          )}

          {stage === "course_prep" && (
            <div className="text-center py-10 space-y-4">
              <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin mb-4" />
              <h2 className="text-2xl font-semibold text-foreground">
                {t('customCourses.createPage.preparingCourseTitle', { courseName: generatedSyllabus?.courseTitleSuggestion || courseTopic })}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('customCourses.createPage.preparingCourseDescription')}
              </p>
              <Progress value={33} className="w-full max-w-md mx-auto h-3 my-4" />
              <p className="text-sm text-primary">{t('common.soon')}</p>
               <Button variant="outline" onClick={startOver} className="mx-auto block mt-6">
                {t('customCourses.createPage.createNewCourseButton')}
              </Button>
            </div>
          )}
          
          {/* Placeholder for course_view stage if needed in the future */}

        </CardContent>
        {stage !== "course_prep" && (
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

