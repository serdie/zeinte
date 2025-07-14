
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UploadCloud, BrainCircuit, Lightbulb, Sparkles, BookOpenText, Settings, Users, CheckCircle, ArrowRight, Star, Zap, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { useI18n } from '@/contexts/I18nContext'; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Testimonial {
  id: string;
  name: string;
  roleKey: string;
  avatarFallback: string;
  stars: number;
  quoteKey: string;
  avatarHint: string;
}

const featureKeys = [
  "uploadDocs",
  "deepAnalysis",
  "smartPrediction",
  "clearExplanations",
  "interactiveStudy",
  "customConfig",
  "studyCommunity"
];

const iconMap: { [key: string]: React.ElementType } = {
  uploadDocs: UploadCloud,
  deepAnalysis: BrainCircuit,
  smartPrediction: Lightbulb,
  clearExplanations: Sparkles,
  interactiveStudy: BookOpenText,
  customConfig: Settings,
  studyCommunity: Users
};

export default function HomePageClient() {
  const { t } = useI18n();

  const features = featureKeys.map(key => ({
    key,
    icon: iconMap[key],
    title: t(`features.${key}Title`),
    shortText: t(`features.${key}Short`),
    longText: t(`features.${key}Long`)
  }));

  const testimonials: Testimonial[] = [
    {
      id: 'testimonial1',
      name: 'Carlos M.',
      roleKey: 'homePage.testimonial1Role',
      avatarFallback: 'CM',
      stars: 5,
      quoteKey: 'homePage.testimonial1Quote',
      avatarHint: 'student happy',
    },
    {
      id: 'testimonial2',
      name: 'Laura G.',
      roleKey: 'homePage.testimonial2Role',
      avatarFallback: 'LG',
      stars: 5,
      quoteKey: 'homePage.testimonial2Quote',
      avatarHint: 'student library',
    },
    {
      id: 'testimonial3',
      name: 'David S.',
      roleKey: 'homePage.testimonial3Role',
      avatarFallback: 'DS',
      stars: 5,
      quoteKey: 'homePage.testimonial3Quote',
      avatarHint: 'person computer',
    },
    {
      id: 'testimonial4',
      name: 'Sofía P.',
      roleKey: 'homePage.testimonial4Role',
      avatarFallback: 'SP',
      stars: 5,
      quoteKey: 'homePage.testimonial4Quote',
      avatarHint: 'professional work',
    },
    {
      id: 'testimonial5',
      name: 'Miguel Ángel R.',
      roleKey: 'homePage.testimonial5Role',
      avatarFallback: 'MR',
      stars: 4,
      quoteKey: 'homePage.testimonial5Quote',
      avatarHint: 'focused student',
    },
    {
      id: 'testimonial6',
      name: 'Isabel V.',
      roleKey: 'homePage.testimonial6Role',
      avatarFallback: 'IV',
      stars: 5,
      quoteKey: 'homePage.testimonial6Quote',
      avatarHint: 'teacher classroom',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 text-foreground">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 text-center bg-card shadow-lg rounded-b-xl mb-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full z-0">
            <video 
                src="https://www.diemy.es/wp-content/uploads/2025/07/Video_Generado_para_Zeinte.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover opacity-20"
            ></video>
            <div className="absolute top-0 left-0 w-full h-full bg-background/30"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
            {t('homePage.mainTitle')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {t('homePage.subtitle')}
          </p>
          <Link href="/upload" passHref>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-10 py-6 rounded-lg shadow-md transition-transform duration-150 ease-in-out active:scale-95">
              <UploadCloud className="mr-3 h-6 w-6" />
              {t('homePage.startNowButton')}
            </Button>
          </Link>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" passHref className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full text-primary border-primary hover:bg-primary/10 hover:text-primary">
                {t('sidebar.login')}
              </Button>
            </Link>
            <Link href="/signup" passHref className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full text-primary border-primary hover:bg-primary/10 hover:text-primary">
                {t('sidebar.signup')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center mb-10 text-foreground">{t('homePage.howItHelpsTitle')}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.key} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <feature.icon className="h-10 w-10 text-primary" />
                  <CardTitle className="text-xl text-primary">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-sm text-muted-foreground h-12">{feature.shortText}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value={`item-${feature.key}`} className="border-t pt-2">
                    <AccordionTrigger className="text-sm text-accent hover:text-accent/80 py-2">
                      {t('features.knowMore')}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-foreground/80 pt-2">
                      {feature.longText}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-muted/50 mt-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-10 text-foreground">{t('homePage.simpleFastEffectiveTitle')}</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-card rounded-lg shadow-md">
              <div className="p-4 bg-primary text-primary-foreground rounded-full inline-block mb-4 text-2xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{t('homePage.step1Title')}</h3>
              <p className="text-muted-foreground text-sm">{t('homePage.step1Description')}</p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md">
              <div className="p-4 bg-primary text-primary-foreground rounded-full inline-block mb-4 text-2xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{t('homePage.step2Title')}</h3>
              <p className="text-muted-foreground text-sm">{t('homePage.step2Description')}</p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md">
              <div className="p-4 bg-primary text-primary-foreground rounded-full inline-block mb-4 text-2xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{t('homePage.step3Title')}</h3>
              <p className="text-muted-foreground text-sm">{t('homePage.step3Description')}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing/Subscription Section */}
      <section id="pricing" className="py-16 container mx-auto px-4 mt-12">
        <h2 className="text-3xl font-semibold text-center mb-4 text-foreground">{t('homePage.choosePlanTitle')}</h2>
        <p className="text-lg text-muted-foreground text-center max-w-xl mx-auto mb-10">
          {t('homePage.choosePlanSubtitle')}
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Trial Card */}
          <Card className="shadow-lg flex flex-col bg-card border-2 border-primary/30 hover:border-primary/70 transition-colors">
            <CardHeader className="text-center pb-4">
              <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl text-primary">{t('homePage.freeTrialTitle')}</CardTitle>
              <CardDescription className="text-base">{t('homePage.freeTrialDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />{t('features.uploadDocsShort')}</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />{t('features.smartPredictionShort')}</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />{t('features.clearExplanationsShort')}</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />{t('homePage.freeTrialFeature4')}</li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Link href="/signup" passHref className="w-full"> 
                <Button size="lg" variant="outline" className="w-full text-primary border-primary hover:bg-primary/10 hover:text-primary py-3 text-md">
                  {t('homePage.startFreeTrialButton')}
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Pro Plan Card */}
          <Card className="shadow-xl flex flex-col bg-card border-2 border-accent hover:border-accent/70 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
              {t('homePage.proPlanRecommended')}
            </div>
            <CardHeader className="text-center pb-4">
              <Star className="h-12 w-12 text-accent mx-auto mb-4" />
              <CardTitle className="text-2xl text-accent">{t('homePage.proPlanTitle')}</CardTitle>
              <CardDescription className="text-base">{t('homePage.proPlanDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
               <p className="text-3xl font-bold text-center text-accent mb-3">{t('homePage.proPlanPrice')}<span className="text-sm font-normal text-muted-foreground">{t('homePage.proPlanPriceSuffix')}</span></p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><TrendingUp className="h-5 w-5 text-green-500 mr-2" />{t('homePage.proPlanFeature1')}</li>
                <li className="flex items-center"><TrendingUp className="h-5 w-5 text-green-500 mr-2" />{t('homePage.proPlanFeature2')}</li>
                <li className="flex items-center"><TrendingUp className="h-5 w-5 text-green-500 mr-2" />{t('homePage.proPlanFeature3')}</li>
                <li className="flex items-center"><TrendingUp className="h-5 w-5 text-green-500 mr-2" />{t('homePage.proPlanFeature4')}</li>
                <li className="flex items-center"><TrendingUp className="h-5 w-5 text-green-500 mr-2" />{t('homePage.proPlanFeature5')}</li>
                <li className="flex items-center"><TrendingUp className="h-5 w-5 text-green-500 mr-2" />{t('homePage.proPlanFeature6')}</li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Link href="/pricing" passHref className="w-full">
                <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-md">
                  {t('homePage.subscribeProButton')}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-muted/50 mt-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-10 text-foreground">{t('homePage.testimonialsTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="shadow-lg flex flex-col bg-background">
                <CardContent className="pt-6 flex flex-col flex-grow">
                  <div className="flex items-center mb-4">
                    <Avatar className="h-12 w-12 mr-4 border-2 border-primary/50">
                      <AvatarImage src={`https://placehold.co/48x48.png?text=${testimonial.avatarFallback}`} alt={testimonial.name} data-ai-hint={testimonial.avatarHint} />
                      <AvatarFallback>{testimonial.avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{t(testimonial.roleKey)}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < testimonial.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <blockquote className="text-sm text-foreground/90 italic border-l-4 border-primary pl-4 py-2 flex-grow bg-primary/5 rounded-r-md">
                    {t(testimonial.quoteKey)}
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 text-center container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6 text-foreground">{t('homePage.revolutionizeStudyTitle')}</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          {t('homePage.revolutionizeStudySubtitle')}
        </p>
        <Link href="/signup" passHref> 
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-7 rounded-lg shadow-lg transition-transform duration-150 ease-in-out active:scale-95">
            <Sparkles className="mr-3 h-7 w-7" />
            {t('homePage.tryFreeButton')}
          </Button>
        </Link>
      </section>
      
      <footer className="text-center py-8 mt-12 border-t border-border">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Search and Make S.L (CIF: B45786787) - Zeinte. {t('homePage.footerRights')}
        </p>
         <div className="mt-2 space-x-4 text-xs text-muted-foreground">
          <Link href="/legal/privacy" className="hover:text-primary">{t('legal.privacyPolicy')}</Link>
          <span>|</span>
          <Link href="/legal/cookies" className="hover:text-primary">{t('legal.cookiesPolicy')}</Link>
          <span>|</span>
          <Link href="/legal/terms" className="hover:text-primary">{t('legal.legalNotice')}</Link>
        </div>
        <p className="mt-2 text-xs text-muted-foreground/80 max-w-3xl mx-auto px-4">
          {t('legal.disclaimerText')}
        </p>
      </footer>
    </div>
  );
}
