
// src/app/signup/page.tsx
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Mail, AlertTriangle } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { signUpWithEmail, signInWithGoogle, currentUser, loading: authLoading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, authLoading, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isFirebaseConfigured) {
      toast({ title: "Configuración Incompleta", description: "Firebase no está configurado. Revisa las variables de entorno y reinicia el servidor.", variant: "destructive", duration: 7000 });
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Las contraseñas no coinciden.');
      toast({ title: "Error de Registro", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    const result = await signUpWithEmail(email, password);
    if (typeof result === 'string') {
      setAuthError(result);
      toast({ title: "Error de Registro", description: result, variant: "destructive" });
    } else {
      toast({ title: "Registro Exitoso", description: "¡Bienvenido! Ya puedes iniciar sesión.", variant: "default" });
      router.push('/login'); 
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
     if (!isFirebaseConfigured) {
      toast({ title: "Configuración Incompleta", description: "Firebase no está configurado. Revisa las variables de entorno y reinicia el servidor.", variant: "destructive", duration: 7000 });
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    const result = await signInWithGoogle();
    if (typeof result === 'string') {
      setAuthError(result);
       toast({ title: "Error con Google", description: result, variant: "destructive" });
    } else {
      toast({ title: "Registro Exitoso", description: "¡Bienvenido con Google!", variant: "default" });
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!authLoading && currentUser) {
     return <div className="flex items-center justify-center min-h-screen"><p>Redirigiendo...</p><Loader2 className="ml-2 h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
            <UserPlus className="h-8 w-8" />
            Crear Cuenta
          </CardTitle>
          <CardDescription>Únete para empezar a usar AdivinaExamen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isFirebaseConfigured && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Firebase no está configurado correctamente. Por favor, revisa las variables de entorno en `.env.local` y reinicia el servidor. La autenticación no funcionará.</span>
            </div>
          )}
          {authError && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md text-center">{authError}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
                disabled={!isFirebaseConfigured || isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Crea una contraseña (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base"
                disabled={!isFirebaseConfigured || isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="text-base"
                disabled={!isFirebaseConfigured || isLoading}
              />
            </div>
            <Button type="submit" className="w-full text-lg py-3 bg-primary hover:bg-primary/90" disabled={isLoading || !isFirebaseConfigured}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
              Registrarse
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                O regístrate con
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full text-md py-3" onClick={handleGoogleSignIn} disabled={isLoading || !isFirebaseConfigured}>
             {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <svg className="mr-2 h-5 w-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.03-4.66 2.03-3.86 0-6.99-3.11-6.99-7.11s3.13-7.11 6.99-7.11c1.73 0 3.25.59 4.52 1.78l2.48-2.48C17.46.89 15.21 0 12.48 0 5.88 0 0 5.56 0 12.48s5.88 12.48 12.48 12.48c7.02 0 12.24-4.82 12.24-12.72 0-.79-.08-1.54-.2-2.32H12.48z" fill="currentColor"/></svg> }
            Google
          </Button>
        </CardContent>
        <CardFooter className="text-center block">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
