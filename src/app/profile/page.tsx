
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Mail, ShieldCheck, ShoppingBag, LogOut, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4 border-2 border-primary shadow-lg">
            {/* Firebase User object might have photoURL if signed in with Google and has a pic */}
            {currentUser.photoURL ? (
              <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName || currentUser.email || 'Usuario'} data-ai-hint="user avatar" />
            ) : (
               <AvatarImage src="https://placehold.co/96x96.png" alt={currentUser.displayName || currentUser.email || 'Usuario'} data-ai-hint="user avatar generic" />
            )}
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
              {getInitials(currentUser.displayName || currentUser.email)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl flex items-center gap-2 justify-center">
            <User className="h-8 w-8 text-primary" />
            {currentUser.displayName || "Mi Perfil"}
          </CardTitle>
          <CardDescription className="text-lg">
            Gestiona tu información personal y preferencias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg bg-background/50">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-foreground">
              <Mail className="h-5 w-5 text-accent" />
              Información de la Cuenta
            </h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Correo Electrónico:</span> {currentUser.email}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">UID:</span> {currentUser.uid}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Verificado:</span> {currentUser.emailVerified ? 'Sí' : 'No'}
            </p>
          </div>

          <div className="p-4 border rounded-lg bg-background/50">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-accent" />
              Seguridad (Próximamente)
            </h3>
            <p className="text-sm text-muted-foreground">
              Próximamente podrás cambiar tu contraseña y gestionar otros ajustes de seguridad.
            </p>
          </div>

          <div className="p-4 border rounded-lg bg-background/50">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-foreground">
              <ShoppingBag className="h-5 w-5 text-accent" />
              Planes y Suscripción (Próximamente)
            </h3>
            <p className="text-sm text-muted-foreground">
              Aquí podrás ver los detalles de tu plan actual y gestionar tu suscripción.
            </p>
          </div>
          
          <Button onClick={logout} variant="destructive" className="w-full py-3 text-base">
            <LogOut className="mr-2 h-5 w-5" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
