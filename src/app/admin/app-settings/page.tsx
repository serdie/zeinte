
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Loader2, ShieldAlert, ArrowLeft, Settings, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminAppSettingsPage() {
  const { currentUser, isAdmin, loading: authLoading, isFirebaseConfigured } = useAuth();

  if (authLoading) {
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
                    Firebase no está configurado o disponible. Las configuraciones no pueden funcionar correctamente.
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
            Aquí podrás ajustar configuraciones globales de AdivinaExamen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta sección está en desarrollo. En el futuro, podrás configurar aspectos como:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Modelos de IA por defecto para análisis y predicción.</li>
            <li>Parámetros de "temperatura" o creatividad para la generación de preguntas.</li>
            <li>Límites de subida de archivos por defecto.</li>
            <li>Activación/Desactivación de módulos experimentales.</li>
            <li>Configuración de planes de suscripción (precios, características).</li>
          </ul>
          <Alert variant="default" className="mt-6 bg-primary/10 border-primary/50">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">En Desarrollo</AlertTitle>
            <AlertDescription className="text-primary/80">
              La gestión funcional de estas configuraciones se implementará en futuras versiones.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
