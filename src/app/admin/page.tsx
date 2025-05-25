
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-10">Cargando panel de administración...</div>;
  }

  // This page should ideally be protected by ConditionalLayout already,
  // but an extra check here is fine.
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
        <Link href="/dashboard" passHref className="mt-4 inline-block">
            <Button variant="outline">Volver al Panel</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-3xl text-primary">
            Panel de Administración
          </CardTitle>
          <CardDescription className="text-lg">
            Bienvenido al panel de control de AdivinaExamen, {`serdiegm@gmail.com`}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta es la sección de administración. Aquí podrás gestionar usuarios,
            contenido, configuraciones y más aspectos de la aplicación en el futuro.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Placeholder cards for future CMS sections */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">Gestionar Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">(Próximamente)</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">Gestionar Contenido Comunidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">(Próximamente)</p>
              </CardContent>
            </Card>
             <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">Configuración General</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">(Próximamente)</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
