
// src/app/signup/page.tsx
"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Mail } from 'lucide-react'; // Using Mail for Google icon placeholder

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUpWithEmail, signInWithGoogle, currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  if (currentUser) {
    router.push('/profile'); // Redirect if already logged in
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      toast({ title: "Error de Registro", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await signUpWithEmail(email, password);
    if (typeof result === 'string') {
      setError(result);
      toast({ title: "Error de Registro", description: result, variant: "destructive" });
    } else {
      toast({ title: "Registro Exitoso", description: "¡Bienvenido! Ya puedes iniciar sesión.", variant: "default" });
      router.push('/login'); // Redirect to login page after successful signup
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    if (typeof result === 'string') {
      setError(result);
       toast({ title: "Error con Google", description: result, variant: "destructive" });
    } else {
      toast({ title: "Registro Exitoso", description: "¡Bienvenido con Google!", variant: "default" });
      router.push('/profile');
    }
    setIsLoading(false);
  };

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
          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md text-center">{error}</p>}
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
              />
            </div>
            <Button type="submit" className="w-full text-lg py-3 bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading && !email.includes('@') ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
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
          <Button variant="outline" className="w-full text-md py-3" onClick={handleGoogleSignIn} disabled={isLoading}>
             {isLoading && email.includes('@') ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mail className="mr-2 h-5 w-5" /> } {/* Placeholder for Google icon */}
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
