
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, ShieldCheck, Bookmark, Layers, CheckCircle, Save, AlertTriangle, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth, type AppUserFirestoreData } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useMemo } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils'; // Import cn utility


// Define study interests with keys for i18n
const studyInterestsList = [
  { id: 'oposicion_hacienda', nameKey: 'profilePage.interestOppHacienda' },
  { id: 'oposicion_administrativo', nameKey: 'profilePage.interestOppAdminGeneral' },
  { id: 'oposicion_justicia', nameKey: 'profilePage.interestOppJustice' },
  { id: 'oposicion_seguridad', nameKey: 'profilePage.interestOppSecurity' },
  { id: 'oposicion_sanidad', nameKey: 'profilePage.interestOppHealth' },
  { id: 'oposicion_educacion', nameKey: 'profilePage.interestOppEducation' },
  { id: 'oposicion_forestal', nameKey: 'profilePage.interestOppForestal' },
  { id: 'oposicion_otra', nameKey: 'profilePage.interestOppOther' },
  { id: 'universidad_ingenieria', nameKey: 'profilePage.interestUniEngineering' },
  { id: 'universidad_derecho', nameKey: 'profilePage.interestUniLaw' },
  { id: 'universidad_ade', nameKey: 'profilePage.interestUniBusiness' },
  { id: 'universidad_medicina', nameKey: 'profilePage.interestUniMedicine' },
  { id: 'universidad_otra', nameKey: 'profilePage.interestUniOther' },
  { id: 'bachillerato_selectividad', nameKey: 'profilePage.interestHighSchoolEvaU' },
  { id: 'idiomas_ingles_c1', nameKey: 'profilePage.interestLangEnglishC1' },
  { id: 'idiomas_ingles_b2', nameKey: 'profilePage.interestLangEnglishB2' },
  { id: 'idiomas_frances_b1', nameKey: 'profilePage.interestLangFrenchB1' },
  { id: 'idiomas_otro', nameKey: 'profilePage.interestLangOther' },
  { id: 'carnet_conducir_b', nameKey: 'profilePage.interestDrivingLicenseB' },
  { id: 'certificaciones_profesionales', nameKey: 'profilePage.interestProfessionalCert' },
  { id: 'estudio_general', nameKey: 'profilePage.interestGeneralStudy' },
  { id: 'otro_estudio', nameKey: 'profilePage.interestOtherStudies' },
];


export default function ProfilePage() {
  const { currentUser, userProfileData, loading, updateUserInterests, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  const [primaryInterest, setPrimaryInterest] = useState<string | null>(null);
  const [secondaryInterests, setSecondaryInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const translatedInterests = useMemo(() => {
    return studyInterestsList.map(interest => ({
      ...interest,
      name: t(interest.nameKey)
    }));
  }, [t]);

  useEffect(() => {
    if (userProfileData) {
      setPrimaryInterest(userProfileData.primaryInterest || null);
      setSecondaryInterests(userProfileData.secondaryInterests || []);
    }
  }, [userProfileData]);

  const handleSaveInterests = async () => {
    if (!primaryInterest) {
      toast({
        title: t('profilePage.primaryInterestRequiredTitle'),
        description: t('profilePage.primaryInterestRequiredDescription'),
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    const result = await updateUserInterests(primaryInterest, secondaryInterests);
    if (typeof result === 'string') {
      toast({ title: t('profilePage.errorSavingPreferencesToastTitle'), description: result, variant: "destructive" });
    } else {
      toast({ title: t('profilePage.preferencesSavedToastTitle'), description: t('profilePage.preferencesSavedToastDescription'), variant: "default" });
    }
    setIsSaving(false);
  };

  const handleSecondaryInterestChange = (interestId: string, checked: boolean | "indeterminate") => {
    if (typeof checked === 'boolean') { // Ensure checked is boolean
        setSecondaryInterests(prev =>
        checked ? [...prev, interestId] : prev.filter(id => id !== interestId)
        );
    }
  };

  if (loading || !isFirebaseConfigured) { // Combined loading check
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-3 text-lg">{t('profilePage.loadingProfile')}</span></div>;
  }

  if (!currentUser) {
    // This case should ideally be handled by ConditionalLayout redirecting to login,
    // but as a fallback:
    return <div className="text-center py-10">{t('profilePage.loginPrompt')}</div>;
  }

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full max-w-3xl mx-auto shadow-xl bg-card">
        <CardHeader className="items-center text-center">
           <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
            <AvatarImage src={currentUser.photoURL || `https://placehold.co/100x100.png?text=${getInitials(currentUser.email)}`} alt={currentUser.displayName || currentUser.email || "Usuario"} data-ai-hint="user avatar placeholder" />
            <AvatarFallback>{getInitials(currentUser.email)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl md:text-3xl">
            {currentUser.displayName || t('profilePage.defaultDisplayName')}
          </CardTitle>
          <CardDescription className="text-base md:text-lg text-muted-foreground">
            {t('profilePage.manageInfo')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {userProfileData && !userProfileData.primaryInterest && (
            <Alert variant="default" className="bg-amber-500/10 border-amber-500/50 text-amber-700 dark:bg-amber-700/20 dark:text-amber-400 dark:border-amber-600">
              <Info className="h-5 w-5" />
              <AlertTitle>{t('profilePage.configureInterestTitle')}</AlertTitle>
              <AlertDescription>
                {t('profilePage.configureInterestDescription')}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3 p-4 border rounded-md shadow-sm bg-background/50">
             <h3 className="text-lg font-semibold text-primary flex items-center gap-2"><Bookmark className="h-5 w-5" />{t('profilePage.primaryInterestTitle')}</h3>
             <p className="text-sm text-muted-foreground">{t('profilePage.primaryInterestDescription')}</p>
            <RadioGroup value={primaryInterest || ""} onValueChange={setPrimaryInterest} className="space-y-1">
              <ScrollArea className="h-[200px] w-full pr-3">
                {translatedInterests.map((interest) => (
                  <div key={interest.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                    <RadioGroupItem value={interest.id} id={`primary-${interest.id}`} />
                    <Label htmlFor={`primary-${interest.id}`} className="font-normal cursor-pointer flex-1">{interest.name}</Label>
                  </div>
                ))}
              </ScrollArea>
            </RadioGroup>
          </div>

          <div className="space-y-3 p-4 border rounded-md shadow-sm bg-background/50">
             <h3 className="text-lg font-semibold text-primary flex items-center gap-2"><Layers className="h-5 w-5" />{t('profilePage.secondaryInterestsTitle')}</h3>
             <p className="text-sm text-muted-foreground">{t('profilePage.secondaryInterestsDescription')}</p>
            <ScrollArea className="h-[200px] w-full pr-3">
                <div className="space-y-1">
                {translatedInterests.map((interest) => (
                    <div key={interest.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md">
                    <Checkbox
                        id={`secondary-${interest.id}`}
                        checked={secondaryInterests.includes(interest.id)}
                        onCheckedChange={(checked) => handleSecondaryInterestChange(interest.id, checked)}
                        disabled={primaryInterest === interest.id} 
                    />
                    <Label htmlFor={`secondary-${interest.id}`} className={cn("font-normal cursor-pointer flex-1", primaryInterest === interest.id && "text-muted-foreground line-through")}>{interest.name}</Label>
                    </div>
                ))}
                </div>
            </ScrollArea>
          </div>
          
          <Button onClick={handleSaveInterests} disabled={isSaving || !primaryInterest} className="w-full sm:w-auto">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t('profilePage.savePreferencesButton')}
          </Button>

          <Card className="mt-6 bg-muted/30">
            <CardHeader>
                <CardTitle className="text-xl text-foreground">{t('profilePage.accountInfoTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-2 border-b">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">{t('profilePage.emailLabel')}</p>
                        <p className="font-medium text-foreground">{currentUser.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-2 border-b">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">{t('profilePage.usernameLabel')}</p>
                        <p className="font-medium text-foreground">{userProfileData?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || t('profilePage.usernameNotSet')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-2 border-b">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">{t('profilePage.accountStatusLabel')}</p>
                        <Badge variant={currentUser.emailVerified ? "default" : "secondary"} className={cn("text-xs", currentUser.emailVerified ? "bg-green-500/20 text-green-700 border-green-500/30" : "bg-yellow-500/20 text-yellow-700 border-yellow-500/30")}>
                        {currentUser.emailVerified ? t('profilePage.verifiedStatus') : t('profilePage.notVerifiedStatus')}
                        </Badge>
                    </div>
                </div>
                {currentUser.providerData.map(profile => (
                    <div key={profile.providerId} className="flex items-center gap-3 p-2">
                        {profile.providerId === 'google.com' && <svg className="h-5 w-5 text-muted-foreground" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.03-4.66 2.03-3.86 0-6.99-3.11-6.99-7.11s3.13-7.11 6.99-7.11c1.73 0 3.25.59 4.52 1.78l2.48-2.48C17.46.89 15.21 0 12.48 0 5.88 0 0 5.56 0 12.48s5.88 12.48 12.48 12.48c7.02 0 12.24-4.82 12.24-12.72 0-.79-.08-1.54-.2-2.32H12.48z" fill="currentColor"/></svg>}
                        {profile.providerId === 'password' && <Mail className="h-5 w-5 text-muted-foreground" />}
                        <div>
                            <p className="text-xs text-muted-foreground">{t('profilePage.loginMethodLabel')}</p>
                            <p className="font-medium text-foreground">{profile.providerId === 'google.com' ? t('profilePage.loginMethodGoogle') : t('profilePage.loginMethodEmail')}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
          </Card>
          
        </CardContent>
         <CardFooter className="flex-col items-center space-y-2">
             <p className="text-xs text-muted-foreground text-center">{t('profilePage.moreOptionsSoon')}</p>
             <Link href="/dashboard" passHref>
                <Button variant="outline" className="w-full sm:w-auto">
                {t('profilePage.backToDashboard')}
                </Button>
            </Link>
         </CardFooter>
      </Card>
    </div>
  );
}
