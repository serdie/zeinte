
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Loader2, ShieldAlert, ArrowLeft, Settings, AlertTriangle, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';

interface AppSettings {
  maxFilesUpload: number;
  maxTotalSizeMB: number;
  defaultAiModel?: string;
  defaultTemperature?: number;
  updatedAt?: any;
}

const DEFAULT_MAX_FILES_UPLOAD = 30;
const DEFAULT_MAX_TOTAL_SIZE_MB = 20; // Updated to 20MB

export default function AdminAppSettingsPage() {
  const { currentUser, isAdmin, loading: authLoading, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  const [settings, setSettings] = useState<Partial<AppSettings>>({
    maxFilesUpload: DEFAULT_MAX_FILES_UPLOAD,
    maxTotalSizeMB: DEFAULT_MAX_TOTAL_SIZE_MB,
    defaultAiModel: 'googleai/gemini-2.0-flash',
    defaultTemperature: 0.7,
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !isAdmin) {
      setIsLoadingSettings(false);
      return;
    }

    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const settingsRef = doc(db, "appSettings", "globalConfig");
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as AppSettings;
          setSettings({
            maxFilesUpload: data.maxFilesUpload || DEFAULT_MAX_FILES_UPLOAD,
            maxTotalSizeMB: data.maxTotalSizeMB || DEFAULT_MAX_TOTAL_SIZE_MB,
            defaultAiModel: data.defaultAiModel || 'googleai/gemini-2.0-flash',
            defaultTemperature: data.defaultTemperature === undefined ? 0.7 : data.defaultTemperature,
          });
        } else {
          // Initialize with defaults if not found
          setSettings({
            maxFilesUpload: DEFAULT_MAX_FILES_UPLOAD,
            maxTotalSizeMB: DEFAULT_MAX_TOTAL_SIZE_MB,
            defaultAiModel: 'googleai/gemini-2.0-flash',
            defaultTemperature: 0.7,
          });
        }
      } catch (error) {
        console.error("Error fetching app settings:", error);
        toast({
          title: t('adminAppSettingsPage.errorLoadingConfigToastTitle'),
          description: t('adminAppSettingsPage.errorLoadingConfigToastDescription'),
          variant: "destructive",
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [isFirebaseConfigured, db, isAdmin, toast, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSaveSettings = async (event: FormEvent) => {
    event.preventDefault();
    if (!isFirebaseConfigured || !db || !isAdmin) {
      toast({ title: t('common.error'), description: t('adminAppSettingsPage.firebaseConfigErrorDescription'), variant: "destructive" });
      return;
    }
    if (!settings.maxFilesUpload || settings.maxFilesUpload <= 0 || 
        !settings.maxTotalSizeMB || settings.maxTotalSizeMB <= 0 ||
        (settings.defaultTemperature !== undefined && (settings.defaultTemperature < 0 || settings.defaultTemperature > 1))
       ) {
        toast({ title: t('adminAppSettingsPage.invalidValuesToastTitle'), description: t('adminAppSettingsPage.invalidValuesToastDescription'), variant: "destructive" });
        return;
    }

    setIsSaving(true);
    try {
      const settingsRef = doc(db, "appSettings", "globalConfig");
      const settingsToSave: Partial<AppSettings> = {
        maxFilesUpload: settings.maxFilesUpload,
        maxTotalSizeMB: settings.maxTotalSizeMB,
        defaultAiModel: settings.defaultAiModel || 'googleai/gemini-2.0-flash',
        defaultTemperature: settings.defaultTemperature === undefined ? 0.7 : settings.defaultTemperature,
        updatedAt: serverTimestamp(),
      };
      await setDoc(settingsRef, settingsToSave, { merge: true });
      
      let descriptionKey = 'adminAppSettingsPage.configSavedToastDescriptionAll';
      if (Object.keys(settingsToSave).length === 3 && settingsToSave.maxFilesUpload && settingsToSave.maxTotalSizeMB && settingsToSave.updatedAt) {
          descriptionKey = 'adminAppSettingsPage.configSavedToastDescriptionFileUploadLimits';
      } else if (Object.keys(settingsToSave).length === 3 && settingsToSave.defaultAiModel && settingsToSave.defaultTemperature && settingsToSave.updatedAt) {
          descriptionKey = 'adminAppSettingsPage.configSavedToastDescriptionAISettings';
      }

      toast({
        title: t('adminAppSettingsPage.configSavedToastTitle'),
        description: t(descriptionKey),
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving app settings:", error);
      toast({
        title: t('adminAppSettingsPage.errorSavingConfigToastTitle'),
        description: t('adminAppSettingsPage.errorSavingConfigToastDescription'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoadingSettings) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-3 text-lg">{t('adminAppSettingsPage.loading')}</span></div>;
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="container mx-auto py-8 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">{t('adminAppSettingsPage.accessDeniedTitle')}</h1>
        <p className="text-muted-foreground">{t('adminAppSettingsPage.accessDeniedDescription')}</p>
        <Link href="/dashboard" passHref className="mt-6 inline-block">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t('adminAppSettingsPage.backToDashboard')}</Button>
        </Link>
      </div>
    );
  }
  
  if (!isFirebaseConfigured) {
      return (
        <div className="container mx-auto py-10 px-4">
            <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('adminAppSettingsPage.firebaseConfigErrorTitle')}</AlertTitle>
                <AlertDescription>
                    {t('adminAppSettingsPage.firebaseConfigErrorDescription')}
                </AlertDescription>
            </Alert>
             <div className="text-center">
                <Link href="/admin" passHref>
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t('adminAppSettingsPage.backToAdminPanel')}</Button>
                </Link>
            </div>
        </div>
      )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Settings className="h-8 w-8" /> {t('adminAppSettingsPage.title')}
        </h1>
        <Link href="/admin" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t('adminAppSettingsPage.backToAdminPanel')}</Button>
        </Link>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">{t('adminAppSettingsPage.appParamsCardTitle')}</CardTitle>
          <CardDescription>
            {t('adminAppSettingsPage.appParamsCardDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <fieldset className="border p-4 rounded-md space-y-4">
              <legend className="text-lg font-medium text-primary px-1">{t('adminAppSettingsPage.fileUploadLimitsLegend')}</legend>
              <div className="space-y-2">
                <Label htmlFor="maxFilesUpload">{t('adminAppSettingsPage.maxFilesUploadLabel')}</Label>
                <Input
                  id="maxFilesUpload"
                  name="maxFilesUpload"
                  type="number"
                  value={settings.maxFilesUpload || ''}
                  onChange={handleInputChange}
                  className="max-w-xs"
                  min="1"
                  required
                />
                <p className="text-xs text-muted-foreground">{t('adminAppSettingsPage.maxFilesUploadDescription')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTotalSizeMB">{t('adminAppSettingsPage.maxTotalSizeMBLabel')}</Label>
                <Input
                  id="maxTotalSizeMB"
                  name="maxTotalSizeMB"
                  type="number"
                  value={settings.maxTotalSizeMB || ''}
                  onChange={handleInputChange}
                  className="max-w-xs"
                  min="1"
                  required
                />
                <p className="text-xs text-muted-foreground">{t('adminAppSettingsPage.maxTotalSizeMBDescription')}</p>
              </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md space-y-4">
              <legend className="text-lg font-medium text-primary px-1">{t('adminAppSettingsPage.aiConfigLegend')}</legend>
              <div className="space-y-2">
                <Label htmlFor="defaultAiModel">{t('adminAppSettingsPage.defaultAiModelLabel')}</Label>
                <Input
                  id="defaultAiModel"
                  name="defaultAiModel"
                  type="text"
                  value={settings.defaultAiModel || 'googleai/gemini-2.0-flash'}
                  onChange={handleInputChange}
                  className="max-w-xs"
                />
                 <p className="text-xs text-muted-foreground">{t('adminAppSettingsPage.defaultAiModelDescription')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTemperature">{t('adminAppSettingsPage.defaultTemperatureLabel')}</Label>
                <Input
                  id="defaultTemperature"
                  name="defaultTemperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={settings.defaultTemperature === undefined ? '' : settings.defaultTemperature}
                  onChange={handleInputChange}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">{t('adminAppSettingsPage.defaultTemperatureDescription')}</p>
              </div>
            </fieldset>
            
            <Alert variant="default" className="bg-primary/10 border-primary/50">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">{t('adminAppSettingsPage.importantNoteTitle')}</AlertTitle>
              <AlertDescription className="text-primary/80">
                {t('adminAppSettingsPage.importantNoteDescription')}
              </AlertDescription>
            </Alert>

            <Button type="submit" disabled={isSaving || isLoadingSettings} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t('adminAppSettingsPage.saveConfigButton')}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                {t('adminAppSettingsPage.firestoreSecurityRulesFooter')}
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    