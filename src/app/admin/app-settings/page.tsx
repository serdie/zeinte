
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

interface AppSettings {
  maxFilesUpload: number;
  maxTotalSizeMB: number;
  defaultAiModel?: string; // Placeholder for future
  defaultTemperature?: number; // Placeholder for future
  updatedAt?: any;
}

const DEFAULT_MAX_FILES_UPLOAD = 30;
const DEFAULT_MAX_TOTAL_SIZE_MB = 5;

export default function AdminAppSettingsPage() {
  const { currentUser, isAdmin, loading: authLoading, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<Partial<AppSettings>>({
    maxFilesUpload: DEFAULT_MAX_FILES_UPLOAD,
    maxTotalSizeMB: DEFAULT_MAX_TOTAL_SIZE_MB,
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
            defaultAiModel: data.defaultAiModel || '',
            defaultTemperature: data.defaultTemperature || 0.7,
          });
        } else {
          // Initialize with defaults if not found
          setSettings({
            maxFilesUpload: DEFAULT_MAX_FILES_UPLOAD,
            maxTotalSizeMB: DEFAULT_MAX_TOTAL_SIZE_MB,
            defaultAiModel: '',
            defaultTemperature: 0.7,
          });
        }
      } catch (error) {
        console.error("Error fetching app settings:", error);
        toast({
          title: "Error al Cargar Configuración",
          description: "No se pudieron cargar las configuraciones de la aplicación.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [isFirebaseConfigured, db, isAdmin, toast]);

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
      toast({ title: "Error", description: "Firebase no está configurado o no eres administrador.", variant: "destructive" });
      return;
    }
    if (!settings.maxFilesUpload || settings.maxFilesUpload <= 0 || !settings.maxTotalSizeMB || settings.maxTotalSizeMB <= 0) {
        toast({ title: "Valores Inválidos", description: "Los límites deben ser números positivos.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    try {
      const settingsRef = doc(db, "appSettings", "globalConfig");
      await setDoc(settingsRef, {
        ...settings, // Save all current settings, including placeholders
        maxFilesUpload: settings.maxFilesUpload,
        maxTotalSizeMB: settings.maxTotalSizeMB,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast({
        title: "Configuración Guardada",
        description: "Los límites de subida de archivos han sido actualizados.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving app settings:", error);
      toast({
        title: "Error al Guardar",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoadingSettings) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-3 text-lg">Cargando...</span></div>;
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="container mx-auto py-8 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
        <Link href="/dashboard" passHref className="mt-6 inline-block">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Volver al Panel de Estudio</Button>
        </Link>
      </div>
    );
  }
  
  if (!isFirebaseConfigured) {
      return (
        <div className="container mx-auto py-10 px-4">
            <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error de Configuración de Firebase</AlertTitle>
                <AlertDescription>
                    Firebase no está configurado. Las configuraciones no pueden funcionar.
                </AlertDescription>
            </Alert>
             <div className="text-center">
                <Link href="/admin" passHref>
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Volver al Panel de Administración</Button>
                </Link>
            </div>
        </div>
      )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Settings className="h-8 w-8" /> Configuración General de la Aplicación
        </h1>
        <Link href="/admin" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Volver al Panel de Administración</Button>
        </Link>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Parámetros de la Aplicación</CardTitle>
          <CardDescription>
            Ajusta configuraciones globales de AdivinaExamen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <fieldset className="border p-4 rounded-md space-y-4">
              <legend className="text-lg font-medium text-primary px-1">Límites de Subida de Archivos</legend>
              <div className="space-y-2">
                <Label htmlFor="maxFilesUpload">Máximo número de archivos a subir:</Label>
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
                <p className="text-xs text-muted-foreground">Define cuántos archivos puede subir un usuario a la vez.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTotalSizeMB">Tamaño total máximo sugerido (MB):</Label>
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
                <p className="text-xs text-muted-foreground">Límite de tamaño total (sugerido) para la subida de archivos. Esto afecta la capacidad de "Re-analizar".</p>
              </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md space-y-4 opacity-50 cursor-not-allowed">
              <legend className="text-lg font-medium text-muted-foreground px-1">Configuración de IA (En Desarrollo)</legend>
              <div className="space-y-2">
                <Label htmlFor="defaultAiModel">Modelo de IA por defecto:</Label>
                <Input
                  id="defaultAiModel"
                  name="defaultAiModel"
                  type="text"
                  value={settings.defaultAiModel || 'googleai/gemini-2.0-flash'}
                  onChange={handleInputChange}
                  className="max-w-xs"
                  disabled
                />
                 <p className="text-xs text-muted-foreground">Para análisis y predicción. (Funcionalidad futura).</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTemperature">Temperatura/Creatividad IA:</Label>
                <Input
                  id="defaultTemperature"
                  name="defaultTemperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={settings.defaultTemperature || 0.7}
                  onChange={handleInputChange}
                  className="max-w-xs"
                  disabled
                />
                <p className="text-xs text-muted-foreground">Valor entre 0 y 1. (Funcionalidad futura).</p>
              </div>
            </fieldset>
            
            <Alert variant="default" className="bg-primary/10 border-primary/50">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Nota Importante</AlertTitle>
              <AlertDescription className="text-primary/80">
                Actualmente, solo los "Límites de Subida de Archivos" son funcionales. La configuración de IA y otras opciones avanzadas se implementarán en futuras versiones. Los planes de suscripción se gestionan conceptualmente y no a través de esta interfaz por ahora.
              </AlertDescription>
            </Alert>

            <Button type="submit" disabled={isSaving || isLoadingSettings} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Configuración
            </Button>
          </form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Recuerda configurar las reglas de seguridad de Firestore para permitir al administrador escribir en <code>appSettings/globalConfig</code> y a los usuarios autenticados leerla.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
