
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Loader2, Users, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/firebase/config';
import { collection, getDocs, Timestamp, type DocumentData } from 'firebase/firestore';

interface AppUser extends DocumentData {
  id: string;
  email?: string;
  displayName?: string;
  provider?: string;
  createdAt?: Timestamp | { seconds: number, nanoseconds: number } | null;
}

const formatFirebaseTimestamp = (timestamp: Timestamp | { seconds: number, nanoseconds: number } | undefined | null): string => {
  if (!timestamp) return 'N/A';
  
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp && typeof timestamp.seconds === 'number') {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return 'Fecha inválida';
  }
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function AdminPage() {
  const { currentUser, isAdmin, loading: authLoading, isFirebaseConfigured } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin || !isFirebaseConfigured || !db) {
      setIsLoadingUsers(false);
      if (isAdmin && (!isFirebaseConfigured || !db)) {
        setFetchError("Firebase Firestore no está configurado o no está disponible. No se pueden cargar los usuarios.");
      }
      return;
    }

    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      setFetchError(null);
      try {
        const usersCollectionRef = collection(db, "users");
        const querySnapshot = await getDocs(usersCollectionRef);
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AppUser));
        setUsers(usersList);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission-denied'))) {
          setFetchError("Error de permisos al cargar usuarios. Asegúrate de que las reglas de seguridad de Firestore permiten al administrador leer la colección 'users'. Revisa la consola de Firebase > Firestore Database > Rules.");
        } else {
          setFetchError(`Error al cargar usuarios: ${error.message}`);
        }
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (isAdmin && isFirebaseConfigured && db) {
      fetchUsers();
    }
  }, [isAdmin, isFirebaseConfigured, db]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-3 text-lg">Cargando panel de administración...</span></div>;
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
  
  if (!isFirebaseConfigured || !db) {
      return (
        <div className="container mx-auto py-10 px-4">
            <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error de Configuración de Firebase</AlertTitle>
                <AlertDescription>
                    Firebase Firestore no está configurado o disponible. El panel de administración no puede funcionar correctamente. Por favor, revisa las variables de entorno en <code>.env.local</code> y la consola de Firebase.
                </AlertDescription>
            </Alert>
             <div className="text-center">
                <Link href="/dashboard" passHref>
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Volver al Panel de Estudio</Button>
                </Link>
            </div>
        </div>
      )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <ShieldAlert className="h-8 w-8" /> Panel de Administración
        </h1>
        <Link href="/dashboard" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Volver al Panel de Estudio</Button>
        </Link>
      </div>
      <Card className="w-full shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl">
            Gestión de Usuarios
          </CardTitle>
          <CardDescription>
            Bienvenido, {currentUser.email}. Aquí puedes visualizar los usuarios registrados en AdivinaExamen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /> Cargando usuarios...
            </div>
          ) : fetchError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error al Cargar Usuarios</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay usuarios registrados todavía.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nombre a Mostrar</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                      <TableCell>{user.displayName || 'N/A'}</TableCell>
                      <TableCell>{user.providerData && user.providerData.length > 0 ? user.providerData[0].providerId : user.provider || 'N/A'}</TableCell>
                      <TableCell>{formatFirebaseTimestamp(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled className="text-xs">(Próximamente)</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-10 space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b pb-2">Otras Funciones del CMS (Próximamente)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="opacity-60 cursor-not-allowed">
            <CardHeader>
              <CardTitle className="text-xl">Gestionar Contenido Comunidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Moderar temas y mensajes del foro, gestionar categorías, etc.</p>
              <Button variant="outline" size="sm" className="mt-3" disabled>Ir a Gestión de Comunidad (Próximamente)</Button>
            </CardContent>
          </Card>
            <Card className="opacity-60 cursor-not-allowed">
            <CardHeader>
              <CardTitle className="text-xl">Configuración General de la App</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Ajustes globales de la aplicación, parámetros de IA, gestión de planes (futuro), etc.</p>
               <Button variant="outline" size="sm" className="mt-3" disabled>Ir a Configuración (Próximamente)</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    