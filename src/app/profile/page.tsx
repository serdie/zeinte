
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, ShieldCheck, Save, AlertTriangle, Info, Loader2, ChevronDown, ChevronUp, CheckSquare, Square, PenLine } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth, type AppUserFirestoreData } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useMemo } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { categorizedStudyInterests, type InterestCategory, type InterestOption } from '@/lib/studyInterestsData';


export default function ProfilePage() {
  const { currentUser, userProfileData, loading, updateUserInterests, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  const [primaryInterest, setPrimaryInterest] = useState<string | null>(null);
  const [customPrimaryInterestValue, setCustomPrimaryInterestValue] = useState('');
  const [selectedPrimaryInterestIsCustom, setSelectedPrimaryInterestIsCustom] = useState(false);

  const [secondaryInterests, setSecondaryInterests] = useState<string[]>([]);
  const [customSecondaryInterestValues, setCustomSecondaryInterestValues] = useState<Record<string, string>>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>(undefined);


  const translatedCategorizedInterests = useMemo(() => {
    return categorizedStudyInterests.map(category => ({
      ...category,
      name: t(category.nameKey),
      options: category.options.map(option => ({
        ...option,
        name: t(option.nameKey)
      }))
    }));
  }, [t]);

  useEffect(() => {
    if (userProfileData) {
      const currentPrimary = userProfileData.primaryInterest || null;
      setPrimaryInterest(currentPrimary);

      // Check if the current primary interest is a custom one
      let isCustomP = false;
      let customPValue = '';
      if (currentPrimary) {
        const flatOptions = translatedCategorizedInterests.flatMap(cat => cat.options);
        const primaryOptionMatch = flatOptions.find(opt => opt.id === currentPrimary);
        if (!primaryOptionMatch) { // If ID not in predefined, it's custom text
          isCustomP = true;
          customPValue = currentPrimary;
          // Try to find which "Otros" option it might correspond to for UI state
          for (const category of translatedCategorizedInterests) {
            for (const option of category.options) {
              if (option.isCustomEntry) {
                 // Heuristic: if currentPrimary starts with a known custom option ID (e.g. "oposicion_otra_custom:Mi Opo")
                 // This part is tricky if we only save the text. For now, assume any non-ID match is a custom entry.
                 // For better UX, we'd need to know *which* "Otros" it came from.
                 // For now, we'll just set the custom input field value if it's not a direct ID match.
              }
            }
          }
        }
      }
      setSelectedPrimaryInterestIsCustom(isCustomP);
      setCustomPrimaryInterestValue(customPValue);


      const currentSecondary = userProfileData.secondaryInterests || [];
      const predefinedSecondaryIds = translatedCategorizedInterests.flatMap(cat => cat.options.map(opt => opt.id));
      const customSecondaryTexts = currentSecondary.filter(interest => !predefinedSecondaryIds.includes(interest));
      const standardSecondaryIds = currentSecondary.filter(interest => predefinedSecondaryIds.includes(interest));
      
      setSecondaryInterests(standardSecondaryIds);

      const initialCustomValues: Record<string, string> = {};
      // This part is tricky: mapping saved custom texts back to their original "Otros" input fields.
      // For simplicity, if there are custom texts, we can't reliably map them back to specific "Otros" inputs
      // unless we stored them with a prefix or a more complex structure.
      // So, for now, customSecondaryInterestValues will be primarily for *new* custom entries.
      // We can display the saved custom texts separately if needed.
      // For now, we'll just pre-fill the first available "Otros" if there's one custom text.
      const firstCustomOpp = translatedCategorizedInterests.flatMap(c => c.options).find(o => o.id === 'oposicion_otra_custom');
      if (customSecondaryTexts.length > 0 && firstCustomOpp) {
        // This is a simplification. True mapping requires knowing which "otros" it came from.
      }
      setCustomSecondaryInterestValues(initialCustomValues);


    }
  }, [userProfileData, translatedCategorizedInterests]);

  const handlePrimaryInterestChange = (value: string) => {
    setPrimaryInterest(value);
    const flatOption = translatedCategorizedInterests.flatMap(c => c.options).find(o => o.id === value);
    if (flatOption?.isCustomEntry) {
      setSelectedPrimaryInterestIsCustom(true);
      // Do not clear customPrimaryInterestValue here, let user type
    } else {
      setSelectedPrimaryInterestIsCustom(false);
      setCustomPrimaryInterestValue(''); // Clear if a non-custom option is selected
    }
  };
  
  const handleSecondaryInterestChange = (optionId: string, categoryId: string, isCustom: boolean | undefined, checked: boolean | "indeterminate") => {
    if (typeof checked !== 'boolean') return;

    setSecondaryInterests(prev => {
      const isAlreadySelected = prev.includes(optionId);
      if (checked) {
        return isAlreadySelected ? prev : [...prev, optionId];
      } else {
        // If unchecking a custom entry, also clear its text value
        if (isCustom) {
          setCustomSecondaryInterestValues(prevCustom => {
            const newCustom = { ...prevCustom };
            delete newCustom[optionId];
            return newCustom;
          });
        }
        return prev.filter(id => id !== optionId);
      }
    });
  };
  
  const handleCustomSecondaryInputChange = (customOptionId: string, value: string) => {
    setCustomSecondaryInterestValues(prev => ({ ...prev, [customOptionId]: value }));
  };


  const handleSaveInterests = async () => {
    let finalPrimaryInterest: string | null = primaryInterest;

    if (selectedPrimaryInterestIsCustom) {
      if (!customPrimaryInterestValue.trim()) {
        toast({
          title: t('profilePage.customPrimaryInterestRequiredTitle'),
          description: t('profilePage.customPrimaryInterestRequiredDescription'),
          variant: "destructive",
        });
        return;
      }
      finalPrimaryInterest = customPrimaryInterestValue.trim();
    } else if (!primaryInterest) {
       toast({
        title: t('profilePage.primaryInterestRequiredTitle'),
        description: t('profilePage.primaryInterestRequiredDescription'),
        variant: "destructive",
      });
      return;
    }

    const finalSecondaryInterests: string[] = [...secondaryInterests.filter(id => {
        // Filter out "Otros" placeholder IDs if their text input is empty
        const option = translatedCategorizedInterests.flatMap(c => c.options).find(o => o.id === id);
        if (option?.isCustomEntry && !customSecondaryInterestValues[id]?.trim()) {
            return false;
        }
        return true;
    })];
    
    Object.entries(customSecondaryInterestValues).forEach(([key, value]) => {
        // Add custom text only if the "Otros" checkbox for it was selected
        // AND the text is not empty.
        // The `secondaryInterests` state already holds the IDs of selected "Otros" checkboxes.
        if (value.trim() && secondaryInterests.includes(key)) {
            finalSecondaryInterests.push(value.trim());
        }
    });
    // Remove duplicates that might arise if an "Otros" ID was kept and its text was also added
    const uniqueSecondaryInterests = Array.from(new Set(finalSecondaryInterests));
    
    // Filter out the "Otros" IDs themselves if their custom text has been added
    const finalUniqueSecondaryInterests = uniqueSecondaryInterests.filter(interest => {
        const isCustomPlaceholderId = categorizedStudyInterests.flatMap(c => c.options).some(o => o.id === interest && o.isCustomEntry);
        if (isCustomPlaceholderId && customSecondaryInterestValues[interest]?.trim()) {
            // If it's a placeholder ID for a custom entry that has text, filter out the ID
            return false; 
        }
        return true;
    });


    setIsSaving(true);
    const result = await updateUserInterests(finalPrimaryInterest!, finalUniqueSecondaryInterests);
    if (typeof result === 'string') {
      toast({ title: t('profilePage.errorSavingPreferencesToastTitle'), description: result, variant: "destructive" });
    } else {
      toast({ title: t('profilePage.preferencesSavedToastTitle'), description: t('profilePage.preferencesSavedToastDescription'), variant: "default" });
    }
    setIsSaving(false);
  };


  if (loading || !isFirebaseConfigured) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-3 text-lg">{t('profilePage.loadingProfile')}</span></div>;
  }

  if (!currentUser) {
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
            {t('profilePage.manageInfoAndInterests')}
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

          {/* Primary Interest Selection */}
          <Card className="bg-background/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><PenLine className="h-5 w-5 text-primary" />{t('profilePage.primaryInterestTitleNew')}</CardTitle>
              <CardDescription>{t('profilePage.primaryInterestDescriptionNew')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full" value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
                {translatedCategorizedInterests.map((category) => (
                  <AccordionItem value={category.id} key={`primary-${category.id}`}>
                    <AccordionTrigger>{category.name}</AccordionTrigger>
                    <AccordionContent>
                      <RadioGroup value={primaryInterest || ""} onValueChange={handlePrimaryInterestChange} className="space-y-1">
                        <ScrollArea className="h-auto max-h-[250px] w-full pr-3">
                          {category.options.map((option) => (
                            <div key={option.id} className="flex flex-col space-y-1 p-2 hover:bg-muted rounded-md">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value={option.id} id={`primary-${option.id}`} />
                                <Label htmlFor={`primary-${option.id}`} className="font-normal cursor-pointer flex-1">{option.name}</Label>
                              </div>
                              {option.isCustomEntry && primaryInterest === option.id && selectedPrimaryInterestIsCustom && (
                                <Input
                                  type="text"
                                  placeholder={t('profilePage.customInterestPlaceholder')}
                                  value={customPrimaryInterestValue}
                                  onChange={(e) => setCustomPrimaryInterestValue(e.target.value)}
                                  className="mt-1 ml-6 text-sm"
                                />
                              )}
                            </div>
                          ))}
                        </ScrollArea>
                      </RadioGroup>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
               {selectedPrimaryInterestIsCustom && !customPrimaryInterestValue.trim() && (
                <p className="text-xs text-destructive mt-2 ml-1">{t('profilePage.customInterestRequiredError')}</p>
              )}
            </CardContent>
          </Card>

          {/* Secondary Interests Selection */}
          <Card className="bg-background/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><CheckSquare className="h-5 w-5 text-primary" />{t('profilePage.secondaryInterestsTitleNew')}</CardTitle>
              <CardDescription>{t('profilePage.secondaryInterestsDescriptionNew')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {translatedCategorizedInterests.map((category) => (
                  <AccordionItem value={category.id} key={`secondary-${category.id}`}>
                    <AccordionTrigger>{category.name}</AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-auto max-h-[250px] w-full pr-3 space-y-1">
                        {category.options.map((option) => (
                          <div key={option.id} className="flex flex-col space-y-1 p-2 hover:bg-muted rounded-md">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`secondary-${option.id}`}
                                checked={secondaryInterests.includes(option.id) || (primaryInterest === option.id && !option.isCustomEntry)}
                                onCheckedChange={(checked) => handleSecondaryInterestChange(option.id, category.id, option.isCustomEntry, checked)}
                                disabled={primaryInterest === option.id && !option.isCustomEntry}
                              />
                              <Label 
                                htmlFor={`secondary-${option.id}`} 
                                className={cn("font-normal cursor-pointer flex-1", (primaryInterest === option.id && !option.isCustomEntry) && "text-muted-foreground line-through")}
                              >
                                {option.name}
                              </Label>
                            </div>
                            {option.isCustomEntry && secondaryInterests.includes(option.id) && (
                                <Input
                                  type="text"
                                  placeholder={t('profilePage.customInterestPlaceholder')}
                                  value={customSecondaryInterestValues[option.id] || ''}
                                  onChange={(e) => handleCustomSecondaryInputChange(option.id, e.target.value)}
                                  className="mt-1 ml-7 text-sm"
                                  disabled={primaryInterest === option.id}
                                />
                              )}
                          </div>
                        ))}
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
          
          <Button onClick={handleSaveInterests} disabled={isSaving || !primaryInterest} className="w-full sm:w-auto text-base py-3">
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
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
