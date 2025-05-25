
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-10">Cargando perfil...</div>;
  }

  if (!currentUser) {
    // This should ideally be handled by ConditionalLayout redirecting to login
    return <div className="text-center py-10">Por favor, inicia sesión para ver tu perfil.</div>;
  }

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card">
        <CardHeader className="items-center text-center">
           <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
            <AvatarImage src={currentUser.photoURL || `https://placehold.co/100x100.png?text=${getInitials(currentUser.email)}`} alt={currentUser.displayName || currentUser.email || "Usuario"} data-ai-hint="user avatar placeholder" />
            <AvatarFallback>{getInitials(currentUser.email)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">
            {currentUser.displayName || "Mi Perfil"}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Gestiona tu información personal y preferencias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-md">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Correo Electrónico</p>
                <p className="font-medium text-foreground">{currentUser.email}</p>
              </div>
            </div>
             <div className="flex items-center gap-3 p-3 border rounded-md">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre de Usuario</p>
                <p className="font-medium text-foreground">{currentUser.displayName || currentUser.email?.split('@')[0] || "No especificado"}</p>
              </div>
            </div>
             <div className="flex items-center gap-3 p-3 border rounded-md">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Estado de la Cuenta</p>
                <Badge variant={currentUser.emailVerified ? "default" : "secondary"} className={currentUser.emailVerified ? "bg-green-500/20 text-green-700" : ""}>
                  {currentUser.emailVerified ? "Verificado" : "No Verificado"}
                </Badge>
              </div>
            </div>
            {currentUser.providerData.map(profile => (
                 <div key={profile.providerId} className="flex items-center gap-3 p-3 border rounded-md">
                    {profile.providerId === 'google.com' && <svg className="h-5 w-5 text-primary" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.03-4.66 2.03-3.86 0-6.99-3.11-6.99-7.11s3.13-7.11 6.99-7.11c1.73 0 3.25.59 4.52 1.78l2.48-2.48C17.46.89 15.21 0 12.48 0 5.88 0 0 5.56 0 12.48s5.88 12.48 12.48 12.48c7.02 0 12.24-4.82 12.24-12.72 0-.79-.08-1.54-.2-2.32H12.48z" fill="currentColor"/></svg>}
                    {profile.providerId === 'password' && <Mail className="h-5 w-5 text-primary" />}
                    <div>
                        <p className="text-sm text-muted-foreground">Método de inicio de sesión</p>
                        <p className="font-medium text-foreground">{profile.providerId === 'google.com' ? 'Google' : 'Correo/Contraseña'}</p>
                    </div>
                </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">Más opciones de perfil estarán disponibles próximamente.</p>
          </div>
          <Link href="/dashboard" passHref className="block mt-6">
            <Button variant="outline" className="w-full">
              Volver al Panel de Estudio
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
