
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, ShieldCheck, Save, AlertTriangle, Info, Loader2, ChevronDown, ChevronUp, CheckSquare, Square, PenLine, Edit, X, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth, type AppUserFirestoreData } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useMemo, useCallback, type FormEvent } from 'react';
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
import { Textarea } from '@/components/ui/textarea';

const GENERAL_OTHER_INTEREST_ID = 'estudio_otro_custom_main'; // ID for the main "Other" category's custom input

export default function ProfilePage() {
  const { currentUser, userProfileData, loading, updateUserInterests, updateUserBillingInfo, isFirebaseConfigured, userTier } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  // Editing state for interests
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [isSavingInterests, setIsSavingInterests] = useState(false);
  
  // Editing state for billing
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [isSavingBilling, setIsSavingBilling] = useState(false);
  
  // States for interest form inputs
  const [editingPrimaryInterest, setEditingPrimaryInterest] = useState<string | null>(null);
  const [editingCustomPrimaryValue, setEditingCustomPrimaryValue] = useState('');
  const [isEditingPrimaryCustom, setIsEditingPrimaryCustom] = useState(false);
  const [editingSecondaryInterests, setEditingSecondaryInterests] = useState<string[]>([]);
  const [editingCustomSecondaryValues, setEditingCustomSecondaryValues] = useState<Record<string, string>>({});
  
  // States for billing form inputs
  const [billingName, setBillingName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingNif, setBillingNif] = useState('');

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

  // Combined initialization function
  const initializeEditingStates = useCallback(() => {
    if (!userProfileData) {
      // Reset interests
      setEditingPrimaryInterest(null);
      setIsEditingPrimaryCustom(false);
      setEditingCustomPrimaryValue('');
      setEditingSecondaryInterests([]);
      setEditingCustomSecondaryValues({});
      // Reset billing
      setBillingName('');
      setBillingAddress('');
      setBillingNif('');
      return;
    }

    // --- Initialize Interests ---
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
      } else {
        isCustomP = true;
        customPVal = profilePrimary;
        const genericOtherOption = flatOptions.find(opt => opt.id === GENERAL_OTHER_INTEREST_ID) || flatOptions.find(opt => opt.isCustomEntry);
        primaryRadioSelection = genericOtherOption ? genericOtherOption.id : null;
        if (primaryOptionMatch && primaryOptionMatch.isCustomEntry) {
            primaryRadioSelection = primaryOptionMatch.id; // Use the specific custom option ID
            customPVal = '';
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
        secInterestsToSet.push(secInterest);
      } else if (!optionMatch) {
        const availableOtherCheckbox = flatOptions.find(o => o.isCustomEntry && !customSecValuesToSet[o.id]);
        if (availableOtherCheckbox) {
          if (!secInterestsToSet.includes(availableOtherCheckbox.id)) {
            secInterestsToSet.push(availableOtherCheckbox.id);
          }
          customSecValuesToSet[availableOtherCheckbox.id] = secInterest;
        }
      }
    });
    setEditingSecondaryInterests(secInterestsToSet);
    setEditingCustomSecondaryValues(customSecValuesToSet);
    
    // --- Initialize Billing ---
    setBillingName(userProfileData.billingName || '');
    setBillingAddress(userProfileData.billingAddress || '');
    setBillingNif(userProfileData.billingNif || '');

  }, [userProfileData, translatedCategorizedInterests]);
  
  useEffect(() => {
    if (!isEditingPreferences && !isEditingBilling) {
      initializeEditingStates();
    }
  }, [userProfileData, isEditingPreferences, isEditingBilling, initializeEditingStates]);

  const handleEditPreferencesClick = () => {
    setIsEditingPreferences(true);
    setIsEditingBilling(false);
  };
  
  const handleEditBillingClick = () => {
    setIsEditingBilling(true);
    setIsEditingPreferences(false);
  };

  const handleCancelEdit = () => {
    setIsEditingPreferences(false);
    setIsEditingBilling(false);
    initializeEditingStates();
  };
  
  const handlePrimaryInterestChange = (value: string) => {
    setEditingPrimaryInterest(value);
    const flatOption = translatedCategorizedInterests.flatMap(c => c.options).find(o => o.id === value);
    if (flatOption?.isCustomEntry) {
      setIsEditingPrimaryCustom(true);
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

    if (isEditingPrimaryCustom && editingPrimaryInterest) {
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
      } else if(id !== finalPrimaryInterest) {
        finalSecondaryInterestsSet.add(id);
      }
    });
    
    const uniqueSecondaryInterests = Array.from(finalSecondaryInterestsSet);

    setIsSavingInterests(true);
    const result = await updateUserInterests(finalPrimaryInterest, uniqueSecondaryInterests);
    if (typeof result === 'string') {
      toast({ title: t('profilePage.errorSavingPreferencesToastTitle'), description: result, variant: "destructive" });
    } else {
      toast({ title: t('profilePage.preferencesSavedToastTitle'), description: t('profilePage.preferencesSavedToastDescription'), variant: "default" });
      setIsEditingPreferences(false); 
    }
    setIsSavingInterests(false);
  };

  const handleSaveBillingInfo = async (e: FormEvent) => {
    e.preventDefault();
    if (!billingName.trim()) {
      toast({ title: t('profilePage.billingNameRequiredTitle'), description: t('profilePage.billingNameRequiredDescription'), variant: "destructive" });
      return;
    }
    
    setIsSavingBilling(true);
    const result = await updateUserBillingInfo({ billingName, billingAddress, billingNif });
    if (typeof result === 'string') {
      toast({ title: t('profilePage.errorSavingBillingToastTitle'), description: result, variant: "destructive" });
    } else {
      toast({ title: t('profilePage.billingInfoSavedToastTitle'), description: t('profilePage.billingInfoSavedToastDescription'), variant: "default" });
      setIsEditingBilling(false);
    }
    setIsSavingBilling(false);
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

  const getTierLabel = (tier: typeof userTier) => {
    if (tier === 'admin') return t('sidebar.tierAdmin');
    if (tier === 'pro') return t('sidebar.tierPro');
    return t('sidebar.tierFree');
  };


  const renderInterestsViewMode = () => (
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
    </div>
  );

  const renderInterestsEditMode = () => {
    const saveDisabled = isSavingInterests ||
        (!isEditingPrimaryCustom && !editingPrimaryInterest) ||
        (isEditingPrimaryCustom && !editingCustomPrimaryValue.trim());

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
                          {option.isCustomEntry && editingPrimaryInterest === option.id && (
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
           {isEditingPrimaryCustom && !editingCustomPrimaryValue.trim() && (
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
          {isSavingInterests ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          {t('profilePage.savePreferencesButton')}
        </Button>
      </div>
    </div>
    );
  };
  
  const renderBillingViewMode = () => (
    <Card className="bg-background/30">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />{t('profilePage.billingInfoTitle')}</div>
          <Button variant="outline" size="sm" onClick={handleEditBillingClick} className="flex items-center gap-1">
            <Edit className="h-4 w-4" /> {t('common.edit')}
          </Button>
        </CardTitle>
        <CardDescription>{t('profilePage.billingInfoDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {userProfileData?.billingName ? (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">{t('profilePage.billingNameLabel')}</Label>
              <p>{userProfileData.billingName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('profilePage.billingAddressLabel')}</Label>
              <p className="whitespace-pre-line">{userProfileData.billingAddress || t('profilePage.notSet')}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('profilePage.billingNifLabel')}</Label>
              <p>{userProfileData.billingNif || t('profilePage.notSet')}</p>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">{t('profilePage.noBillingInfoSet')}</p>
        )}
      </CardContent>
    </Card>
  );

  const renderBillingEditMode = () => (
    <Card className="bg-background/50">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />{t('profilePage.editBillingInfoTitle')}</CardTitle>
        <CardDescription>{t('profilePage.editBillingInfoDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveBillingInfo} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="billingName">{t('profilePage.billingNameLabel')}</Label>
            <Input id="billingName" value={billingName} onChange={(e) => setBillingName(e.target.value)} placeholder={t('profilePage.billingNamePlaceholder')} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="billingAddress">{t('profilePage.billingAddressLabel')}</Label>
            <Textarea id="billingAddress" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder={t('profilePage.billingAddressPlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="billingNif">{t('profilePage.billingNifLabel')}</Label>
            <Input id="billingNif" value={billingNif} onChange={(e) => setBillingNif(e.target.value)} placeholder={t('profilePage.billingNifPlaceholder')} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <Button onClick={handleCancelEdit} type="button" variant="outline" className="w-full sm:w-auto text-base py-3">
              <X className="mr-2 h-5 w-5" />
              {t('profilePage.cancelButton')}
            </Button>
            <Button type="submit" disabled={isSavingBilling} className="w-full sm:w-auto text-base py-3">
              {isSavingBilling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

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
            {isEditingPreferences || isEditingBilling ? t('profilePage.manageInfoAndInterests') : t('profilePage.viewYourInterests')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditingPreferences ? renderInterestsEditMode() : renderInterestsViewMode()}
          <div className="my-6">
             {isEditingBilling ? renderBillingEditMode() : renderBillingViewMode()}
          </div>
        </CardContent>
        
        <Card className="mt-6 bg-muted/30">
          <CardHeader>
              <CardTitle className="text-xl text-foreground">{t('profilePage.accountInfoTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 divide-y">
              <div className="flex items-center justify-between gap-3 p-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">{t('profilePage.emailLabel')}</p>
                        <p className="font-medium text-foreground">{currentUser.email}</p>
                    </div>
                  </div>
              </div>
               <div className="flex items-center justify-between gap-3 p-2">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">{t('profilePage.usernameLabel')}</p>
                        <p className="font-medium text-foreground">{userProfileData?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || t('profilePage.usernameNotSet')}</p>
                    </div>
                  </div>
              </div>
              <div className="flex items-center justify-between gap-3 p-2">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">{t('profilePage.accountStatusLabel')}</p>
                        <Badge variant={currentUser.emailVerified ? "default" : "secondary"} className={cn("text-xs", currentUser.emailVerified ? "bg-green-500/20 text-green-700 border-green-500/30" : "bg-yellow-500/20 text-yellow-700 border-yellow-500/30")}>
                        {currentUser.emailVerified ? t('profilePage.verifiedStatus') : t('profilePage.notVerifiedStatus')}
                        </Badge>
                    </div>
                  </div>
              </div>
                <div className="flex items-center justify-between gap-3 p-2">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">{t('profilePage.planLabel')}</p>
                        <Badge variant={userTier === 'admin' ? 'destructive' : userTier === 'pro' ? 'default' : 'secondary'} className={cn("text-xs", userTier === 'pro' && 'bg-green-500 text-white', userTier === 'admin' && 'bg-red-600 text-white')}>
                          {getTierLabel(userTier)}
                        </Badge>
                    </div>
                  </div>
                  {userTier === 'pro' && (
                    <Link href="/account/subscription" passHref>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Settings className="h-4 w-4"/> {t('profilePage.manageSubscriptionButton')}
                        </Button>
                    </Link>
                  )}
              </div>
              {currentUser.providerData.map(profile => (
                  <div key={profile.providerId} className="flex items-center justify-between gap-3 p-2">
                    <div className="flex items-center gap-3">
                      {profile.providerId === 'google.com' && <svg className="h-5 w-5 text-muted-foreground" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.03-4.66 2.03-3.86 0-6.99-3.11-6.99-7.11s3.13-7.11 6.99-7.11c1.73 0 3.25.59 4.52 1.78l2.48-2.48C17.46.89 15.21 0 12.48 0 5.88 0 0 5.56 0 12.48s5.88 12.48 12.48 12.48c7.02 0 12.24-4.82 12.24-12.72 0-.79-.08-1.54-.2-2.32H12.48z" fill="currentColor"/></svg>}
                      {profile.providerId === 'password' && <Mail className="h-5 w-5 text-muted-foreground" />}
                      <div>
                          <p className="text-xs text-muted-foreground">{t('profilePage.loginMethodLabel')}</p>
                          <p className="font-medium text-foreground">{profile.providerId === 'google.com' ? t('profilePage.loginMethodGoogle') : t('profilePage.loginMethodEmail')}</p>
                      </div>
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

    