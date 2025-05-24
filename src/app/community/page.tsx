
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Share2 } from 'lucide-react';

export default function CommunityPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Comunidad de Estudio (Próximamente)
          </CardTitle>
          <CardDescription>
            Esta sección está en desarrollo. Aquí podrás conectar con otros estudiantes, participar en foros y compartir recursos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-foreground">
              <MessageSquare className="h-5 w-5 text-accent" />
              Foros y Discusiones
            </h3>
            <p className="text-sm text-muted-foreground">
              Imagina un espacio donde puedas preguntar dudas, debatir sobre temas de examen y encontrar compañeros de estudio para tus oposiciones o asignaturas.
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-foreground">
              <Share2 className="h-5 w-5 text-accent" />
              Compartir y Descubrir
            </h3>
            <p className="text-sm text-muted-foreground">
              En el futuro, podrás compartir tus análisis de documentos (¡si lo deseas!), descubrir recursos útiles compartidos por otros y recibir recomendaciones personalizadas.
            </p>
          </div>

           <div data-ai-hint="students collaborating online">
            <img
                src="https://placehold.co/600x300.png"
                alt="Estudiantes colaborando online"
                className="rounded-lg shadow-md mt-6"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
