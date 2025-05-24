
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, ShieldCheck, ShoppingBag } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <User className="h-7 w-7 text-primary" />
            Mi Perfil (Próximamente)
          </CardTitle>
          <CardDescription>
            Esta sección está en desarrollo. Aquí podrás gestionar tu información personal, preferencias y suscripción.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-accent" />
              Personalización y Seguridad
            </h3>
            <p className="text-sm text-muted-foreground">
              Pronto podrás personalizar tu experiencia en AdivinaExamen, ajustar tus preferencias de estudio y gestionar la seguridad de tu cuenta.
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-foreground">
              <ShoppingBag className="h-5 w-5 text-accent" />
              Planes y Suscripción
            </h3>
            <p className="text-sm text-muted-foreground">
              En el futuro, desde aquí podrás ver los detalles de tu plan, gestionar tu suscripción y acceder a funcionalidades premium.
            </p>
          </div>
          
          <div data-ai-hint="user studying computer">
            <img
                src="https://placehold.co/600x300.png"
                alt="Usuario estudiando con su ordenador"
                className="rounded-lg shadow-md mt-6"
            />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
