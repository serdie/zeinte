
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EXAM_CONFIG_KEY } from '@/lib/localStorageKeys';
import type { ExamConfig, ExamType } from '@/types';
import { Save, Settings, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';


const DEFAULT_CONFIG: ExamConfig = {
  defaultNumberOfQuestions: 10,
  defaultExamType: "test",
};

export default function ConfigureExamPage() {
  const [config, setConfig] = useState<ExamConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedConfig = localStorage.getItem(EXAM_CONFIG_KEY);
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        // Validate parsed config structure
        if (parsedConfig.defaultNumberOfQuestions && parsedConfig.defaultExamType) {
          setConfig(parsedConfig);
        } else {
          setConfig(DEFAULT_CONFIG); // Reset to default if structure is invalid
          localStorage.setItem(EXAM_CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
        }
      } catch (error) {
        console.error("Error parsing exam config from localStorage:", error);
        setConfig(DEFAULT_CONFIG); // Reset to default on error
      }
    } else {
      // If no config in localStorage, set the default one
      localStorage.setItem(EXAM_CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    }
    setIsLoading(false);
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem(EXAM_CONFIG_KEY, JSON.stringify(config));
    toast({
      title: "Configuración Guardada",
      description: "Tus preferencias para generar exámenes han sido actualizadas.",
      variant: "default",
    });
  };

  const handleNumberOfQuestionsChange = (value: string) => {
    setConfig(prev => ({ ...prev, defaultNumberOfQuestions: parseInt(value, 10) }));
  };

  const handleExamTypeChange = (value: ExamType) => {
    setConfig(prev => ({ ...prev, defaultExamType: value }));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><p>Cargando configuración...</p></div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" />
            Configura tu Examen
          </CardTitle>
          <CardDescription>
            Ajusta las opciones por defecto para la generación de exámenes. Estos valores se usarán a menos que los modifiques al momento de subir archivos o re-analizar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="num-questions-config">Número de Preguntas por Defecto:</Label>
            <Select
              value={config.defaultNumberOfQuestions.toString()}
              onValueChange={handleNumberOfQuestionsChange}
              disabled={isLoading}
            >
              <SelectTrigger id="num-questions-config" className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecciona cantidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 preguntas</SelectItem>
                <SelectItem value="10">10 preguntas</SelectItem>
                <SelectItem value="15">15 preguntas</SelectItem>
                <SelectItem value="20">20 preguntas</SelectItem>
                <SelectItem value="25">25 preguntas</SelectItem>
                <SelectItem value="30">30 preguntas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Examen por Defecto:</Label>
            <RadioGroup
              value={config.defaultExamType}
              onValueChange={handleExamTypeChange}
              className="space-y-1"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="test" id="type-test" />
                <Label htmlFor="type-test">Test (Opción Múltiple)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="written" id="type-written" />
                <Label htmlFor="type-written">Preguntas Abiertas (Escrito)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oral" id="type-oral" />
                <Label htmlFor="type-oral">Guía para Examen Oral</Label>
              </div>
            </RadioGroup>
             {config.defaultExamType !== 'test' && (
                <Alert variant="default" className="mt-2 bg-primary/10 border-primary/50">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Funcionalidad en Desarrollo</AlertTitle>
                    <AlertDescription className="text-primary/80">
                        La generación de preguntas para tipos de examen 'Escrito' y 'Oral' aún no está implementada. Actualmente, todas las preguntas se generarán en formato 'Test'.
                    </AlertDescription>
                </Alert>
            )}
          </div>
          
          <Button
            onClick={handleSaveConfig}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base"
            disabled={isLoading}
          >
            <Save className="mr-2 h-5 w-5" />
            Guardar Configuración
          </Button>
        </CardContent>
      </Card>
       <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Sobre el botón "Re-analizar"</AlertTitle>
        <AlertDescription>
          La función "Re-analizar y Generar Nuevo Examen" en el Panel de Estudio depende del contenido textual de los documentos que hayas subido previamente. Este contenido se guarda en el almacenamiento local de tu navegador, el cual tiene límites de tamaño (generalmente 5-10MB). Si los documentos originales son muy grandes o numerosos, es posible que no se guarden completamente, y la función de re-análisis podría no tener datos suficientes.
        </AlertDescription>
      </Alert>
       <div className="text-center mt-8">
         <Link href="/dashboard" passHref>
            <Button variant="outline">
              Volver al Panel de Estudio
            </Button>
          </Link>
       </div>
    </div>
  );
}
