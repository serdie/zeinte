
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, ShieldCheck, Save, AlertTriangle, Info, Loader2, ChevronDown, ChevronUp, CheckSquare, Square, PenLine, Edit, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth, type AppUserFirestoreData } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { categorizedStudyInterests, type InterestCategory, type InterestOption } from '@/lib/studyInterestsData';

const GENERAL_OTHER_INTEREST_ID = 'estudio_otro_custom_main'; // ID for the main "Other" category's custom input

export default function ProfilePage() {
  const { currentUser, userProfileData, loading, updateUserInterests, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // States for form inputs when in edit mode
  const [editingPrimaryInterest, setEditingPrimaryInterest] = useState<string | null>(null);
  const [editingCustomPrimaryValue, setEditingCustomPrimaryValue] = useState('');
  const [isEditingPrimaryCustom, setIsEditingPrimaryCustom] = useState(false);
  
  const [editingSecondaryInterests, setEditingSecondaryInterests] = useState<string[]>([]);
  const [editingCustomSecondaryValues, setEditingCustomSecondaryValues] = useState<Record<string, string>>({});
  
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

  const getInterestDisplayName = useCallback((interestValue: string | null, interestsList: InterestCategory[]): string => {
    if (!interestValue) return t('profilePage.notSet');
    for (const category of interestsList) {
      for (const option of category.options) {
        if (option.id === interestValue) {
          return option.name;
        }
      }
    }
    // If not found by ID, it's a custom string
    return interestValue;
  }, [t]);

  const initializeEditingStates = useCallback(() => {
    if (!userProfileData) {
      setEditingPrimaryInterest(null);
      setIsEditingPrimaryCustom(false);
      setEditingCustomPrimaryValue('');
      setEditingSecondaryInterests([]);
      setEditingCustomSecondaryValues({});
      return;
    }

    const profilePrimary = userProfileData.primaryInterest || null;
    let primaryRadioSelection: string | null = null;
    let isCustomP = false;
    let customPVal = '';

    const flatOptions = translatedCategorizedInterests.flatMap(cat => cat.options);

    if (profilePrimary) {
      const primaryOptionMatch = flatOptions.find(opt => opt.id === profilePrimary);
      if (primaryOptionMatch && !primaryOptionMatch.isCustomEntry) {
        primaryRadioSelection = profilePrimary;
        isCustomP = false;
        customPVal = '';
      } else { // It's a custom string, or an ID of a custom entry option
        isCustomP = true;
        customPVal = profilePrimary; // Assume it's the custom text itself
        // Try to find the generic "Otros" radio button to select
        const genericOtherOption = flatOptions.find(opt => opt.id === GENERAL_OTHER_INTEREST_ID) || flatOptions.find(opt => opt.isCustomEntry);
        primaryRadioSelection = genericOtherOption ? genericOtherOption.id : null;
        if (primaryOptionMatch && primaryOptionMatch.isCustomEntry) { // If profilePrimary IS an ID of a custom entry option
            primaryRadioSelection = profilePrimary; // Keep it selected
            customPVal = ''; // The custom text would be handled separately or might be missing if only ID was stored
        }
      }
    }
    setEditingPrimaryInterest(primaryRadioSelection);
    setIsEditingPrimaryCustom(isCustomP);
    setEditingCustomPrimaryValue(customPVal);

    const profileSecondary = userProfileData.secondaryInterests || [];
    const secInterestsToSet: string[] = [];
    const customSecValuesToSet: Record<string, string> = {};

    profileSecondary.forEach(secInterest => {
      const optionMatch = flatOptions.find(opt => opt.id === secInterest);
      if (optionMatch && !optionMatch.isCustomEntry) {
        secInterestsToSet.push(secInterest);
      } else if (optionMatch && optionMatch.isCustomEntry) {
        // This means an ID of a custom entry checkbox was saved
        secInterestsToSet.push(secInterest);
        // We don't automatically populate its text field here, user has to re-type or it's a toggle for the "Other" category
      } else if (!optionMatch) { // It's a custom string not matching any ID
        // Try to associate with the first available "Otros" checkbox that doesn't already have a custom value
        const availableOtherCheckbox = flatOptions.find(o => o.isCustomEntry && !customSecValuesToSet[o.id]);
        if (availableOtherCheckbox) {
          if (!secInterestsToSet.includes(availableOtherCheckbox.id)) {
            secInterestsToSet.push(availableOtherCheckbox.id);
          }
          customSecValuesToSet[availableOtherCheckbox.id] = secInterest;
        }
        // If no "Otros" checkbox is available, this custom string might not appear editable directly
        // but it's still part of profileSecondary for display.
      }
    });
    setEditingSecondaryInterests(secInterestsToSet);
    setEditingCustomSecondaryValues(customSecValuesToSet);

  }, [userProfileData, translatedCategorizedInterests, t]);
  
  useEffect(() => {
    if (!isEditingPreferences) {
      initializeEditingStates();
    }
  }, [userProfileData, isEditingPreferences, initializeEditingStates]);


  const handleEditPreferencesClick = () => {
    initializeEditingStates(); 
    setIsEditingPreferences(true);
  };

  const handleCancelEdit = () => {
    initializeEditingStates(); 
    setIsEditingPreferences(false);
  };
  
  const handlePrimaryInterestChange = (value: string) => {
    setEditingPrimaryInterest(value);
    const flatOption = translatedCategorizedInterests.flatMap(c => c.options).find(o => o.id === value);
    if (flatOption?.isCustomEntry) {
      setIsEditingPrimaryCustom(true);
      // If switching to custom, and it's the main custom input, clear its value or prefill if needed.
      if (value === GENERAL_OTHER_INTEREST_ID && editingCustomPrimaryValue && editingPrimaryInterest !== GENERAL_OTHER_INTEREST_ID) {
          // User switched TO the main custom input from another custom input. Keep the text.
      } else if (value === GENERAL_OTHER_INTEREST_ID) {
          // Switched to main custom, maybe clear it or set to userProfileData's custom if applicable
      } else {
          // Switched to a different "other" radio, clear the main custom value
          // setEditingCustomPrimaryValue('');
      }
    } else {
      setIsEditingPrimaryCustom(false);
      setEditingCustomPrimaryValue(''); 
    }
  };
  
  const handleSecondaryInterestChange = (optionId: string, checked: boolean | "indeterminate") => {
    if (typeof checked !== 'boolean') return;
    setEditingSecondaryInterests(prev => {
      const isAlreadySelected = prev.includes(optionId);
      if (checked) {
        return isAlreadySelected ? prev : [...prev, optionId];
      } else {
        // If unchecking an "Otros" checkbox, also clear its custom text input
        const optionDetails = translatedCategorizedInterests.flatMap(c => c.options).find(o => o.id === optionId);
        if (optionDetails?.isCustomEntry) {
          setEditingCustomSecondaryValues(prevCustom => {
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
    setEditingCustomSecondaryValues(prev => ({ ...prev, [customOptionId]: value }));
  };

  const handleSaveInterests = async () => {
    let finalPrimaryInterest: string | null = null;

    if (isEditingPrimaryCustom && editingPrimaryInterest && translatedCategorizedInterests.flatMap(c=>c.options).find(o=>o.id === editingPrimaryInterest)?.isCustomEntry) {
      if (!editingCustomPrimaryValue.trim()) {
        toast({ title: t('profilePage.customPrimaryInterestRequiredTitle'), description: t('profilePage.customPrimaryInterestRequiredDescription'), variant: "destructive" });
        return;
      }
      finalPrimaryInterest = editingCustomPrimaryValue.trim();
    } else if (editingPrimaryInterest) {
      finalPrimaryInterest = editingPrimaryInterest;
    } else {
       toast({ title: t('profilePage.primaryInterestRequiredTitle'), description: t('profilePage.primaryInterestRequiredDescription'), variant: "destructive" });
       return;
    }

    const finalSecondaryInterestsSet = new Set<string>();
    editingSecondaryInterests.forEach(id => {
      const option = translatedCategorizedInterests.flatMap(c => c.options).find(o => o.id === id);
      if (option?.isCustomEntry) {
        if (editingCustomSecondaryValues[id]?.trim()) {
          finalSecondaryInterestsSet.add(editingCustomSecondaryValues[id].trim());
        }
        // Do not add the placeholder ID itself if custom text is provided and meaningful
        // Or, if the checkbox ID itself is considered a "category" of "other"
        // For simplicity, if an "other" checkbox is checked AND its input is filled, only custom text is saved.
        // If "other" checkbox is checked AND input is EMPTY, then maybe the ID of checkbox is saved (e.g. "user is interested in Other Oppositions")
        // Current: only save custom text if present.
      } else {
        finalSecondaryInterestsSet.add(id);
      }
    });
    
    const uniqueSecondaryInterests = Array.from(finalSecondaryInterestsSet);

    setIsSaving(true);
    const result = await updateUserInterests(finalPrimaryInterest, uniqueSecondaryInterests);
    if (typeof result === 'string') {
      toast({ title: t('profilePage.errorSavingPreferencesToastTitle'), description: result, variant: "destructive" });
    } else {
      toast({ title: t('profilePage.preferencesSavedToastTitle'), description: t('profilePage.preferencesSavedToastDescription'), variant: "default" });
      setIsEditingPreferences(false); 
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

  const renderViewMode = () => (
    <div className="space-y-6">
      <Card className="bg-background/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <div className="flex items-center gap-2"><PenLine className="h-5 w-5 text-primary" />{t('profilePage.primaryInterestTitleNew')}</div>
            <Button variant="outline" size="sm" onClick={handleEditPreferencesClick} className="flex items-center gap-1">
              <Edit className="h-4 w-4" /> {t('profilePage.changePreferencesButton')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userProfileData?.primaryInterest ? (
            <p className="text-foreground text-lg">
              {getInterestDisplayName(userProfileData.primaryInterest, translatedCategorizedInterests)}
            </p>
          ) : (
            <Alert variant="default" className="bg-amber-500/10 border-amber-500/50 text-amber-700 dark:bg-amber-700/20 dark:text-amber-400 dark:border-amber-600">
                <Info className="h-5 w-5" />
                <AlertTitle>{t('profilePage.noPrimaryInterestSet')}</AlertTitle>
                <AlertDescription>{t('profilePage.noPrimaryInterestSetDescription')}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="bg-background/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><CheckSquare className="h-5 w-5 text-primary" />{t('profilePage.secondaryInterestsTitleNew')}</CardTitle>
        </CardHeader>
        <CardContent>
          {userProfileData?.secondaryInterests && userProfileData.secondaryInterests.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 pl-4">
              {userProfileData.secondaryInterests.map((interest, index) => (
                <li key={index} className="text-foreground">
                  {getInterestDisplayName(interest, translatedCategorizedInterests)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">{t('profilePage.noSecondaryInterestsSet')}</p>
          )}
        </CardContent>
      </Card>
       <Alert variant="default" className="mt-6 bg-primary/10 border-primary/50">
        <Info className="h-5 w-5 text-primary" />
        <AlertDescription className="text-primary/80">
          {t('profilePage.betaFeatureNote')}
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderEditMode = () => {
    const saveDisabled = isSaving ||
        (!isEditingPrimaryCustom && !editingPrimaryInterest) ||
        (isEditingPrimaryCustom && editingPrimaryInterest === GENERAL_OTHER_INTEREST_ID && !editingCustomPrimaryValue.trim()) ||
        (isEditingPrimaryCustom && editingPrimaryInterest !== GENERAL_OTHER_INTEREST_ID && !editingCustomPrimaryValue.trim() && translatedCategorizedInterests.flatMap(c => c.options).find(o => o.id === editingPrimaryInterest)?.isCustomEntry)


    return (
    <div className="space-y-6">
      {userProfileData && !userProfileData.primaryInterest && (
         <Alert variant="default" className="bg-amber-500/10 border-amber-500/50 text-amber-700 dark:bg-amber-700/20 dark:text-amber-400 dark:border-amber-600">
            <Info className="h-5 w-5" />
            <AlertTitle>{t('profilePage.configureInterestTitle')}</AlertTitle>
            <AlertDescription>{t('profilePage.configureInterestDescription')}</AlertDescription>
         </Alert>
      )}
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
                  <RadioGroup value={editingPrimaryInterest || ""} onValueChange={handlePrimaryInterestChange} className="space-y-1">
                    <ScrollArea className="h-auto max-h-[250px] w-full pr-3">
                      {category.options.map((option) => (
                        <div key={option.id} className="flex flex-col space-y-1 p-2 hover:bg-muted rounded-md">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={`primary-${option.id}`} />
                            <Label htmlFor={`primary-${option.id}`} className="font-normal cursor-pointer flex-1">{option.name}</Label>
                          </div>
                          {option.isCustomEntry && editingPrimaryInterest === option.id && isEditingPrimaryCustom && (
                            <Input
                              type="text"
                              placeholder={t('profilePage.customInterestPlaceholder')}
                              value={editingCustomPrimaryValue}
                              onChange={(e) => setEditingCustomPrimaryValue(e.target.value)}
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
           {isEditingPrimaryCustom && editingPrimaryInterest && translatedCategorizedInterests.flatMap(c=>c.options).find(o=>o.id===editingPrimaryInterest)?.isCustomEntry && !editingCustomPrimaryValue.trim() && (
            <p className="text-xs text-destructive mt-2 ml-1">{t('profilePage.customInterestRequiredError')}</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-background/50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><PenLine className="h-5 w-5 text-primary" />{t('profilePage.secondaryInterestsTitleNew')}</CardTitle>
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
                            checked={editingSecondaryInterests.includes(option.id) || (editingPrimaryInterest === option.id && !option.isCustomEntry)}
                            onCheckedChange={(checked) => handleSecondaryInterestChange(option.id, checked)}
                            disabled={editingPrimaryInterest === option.id && !option.isCustomEntry}
                          />
                          <Label 
                            htmlFor={`secondary-${option.id}`} 
                            className={cn("font-normal cursor-pointer flex-1", (editingPrimaryInterest === option.id && !option.isCustomEntry) && "text-muted-foreground line-through")}
                          >
                            {option.name}
                          </Label>
                        </div>
                        {option.isCustomEntry && editingSecondaryInterests.includes(option.id) && (
                            <Input
                              type="text"
                              placeholder={t('profilePage.customInterestPlaceholder')}
                              value={editingCustomSecondaryValues[option.id] || ''}
                              onChange={(e) => handleCustomSecondaryInputChange(option.id, e.target.value)}
                              className="mt-1 ml-7 text-sm"
                              disabled={editingPrimaryInterest === option.id}
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
      
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button onClick={handleCancelEdit} variant="outline" className="w-full sm:w-auto text-base py-3">
          <X className="mr-2 h-5 w-5" />
          {t('profilePage.cancelButton')}
        </Button>
        <Button onClick={handleSaveInterests} disabled={saveDisabled} className="w-full sm:w-auto text-base py-3">
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          {t('profilePage.savePreferencesButton')}
        </Button>
      </div>
    </div>
    );
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
            {userProfileData?.displayName || currentUser.displayName || t('profilePage.defaultDisplayName')}
          </CardTitle>
          <CardDescription className="text-base md:text-lg text-muted-foreground">
            {isEditingPreferences ? t('profilePage.manageInfoAndInterests') : t('profilePage.viewYourInterests')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isEditingPreferences ? renderViewMode() : renderEditMode()}
        </CardContent>

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
         <CardFooter className="flex-col items-center space-y-2 pt-6">
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

    