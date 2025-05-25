
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';


export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card">
        <CardHeader className="items-center text-center">
          <User className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl">
            Mi Perfil (Próximamente)
          </CardTitle>
          <CardDescription className="text-lg">
            Esta sección está en desarrollo. Aquí podrás gestionar tu información personal y preferencias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            ¡Vuelve pronto para ver las novedades!
          </p>
           <Image
              src="https://placehold.co/300x200.png"
              alt="Próximamente"
              width={300}
              height={200}
              className="mx-auto rounded-lg opacity-70"
              data-ai-hint="construct gears"
            />
          <Link href="/dashboard" passHref>
            <Button variant="outline" className="mt-4">
              Volver al Panel de Estudio
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
