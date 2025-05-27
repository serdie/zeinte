
"use client";

import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Loader2, Users, AlertTriangle, ArrowLeft, Settings, MessageSquare, Edit3, Trash2, Save, ArrowDownUp, ArrowDown, ArrowUp, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/firebase/config';
import { collection, getDocs, Timestamp, type DocumentData, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { UserTier } from '@/contexts/AuthContext';

interface AppUser extends DocumentData {
  id: string; // document ID from Firestore snapshot
  uid: string; // Firebase Auth UID, usually same as document ID for 'users' collection
  email?: string;
  displayName?: string;
  provider?: string; // Fallback if providerData is not available
  providerData?: { providerId: string; uid: string }[]; // From Firebase Auth User object
  createdAt?: Timestamp | { seconds: number, nanoseconds: number } | null;
  tier?: UserTier;
  preferences?: string[];
}

const formatFirebaseTimestamp = (timestamp: Timestamp | { seconds: number, nanoseconds: number } | undefined | null): string => {
  if (!timestamp) return 'N/A';
  
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp && typeof (timestamp as {seconds: number}).seconds === 'number') {
    // Handle Firestore Timestamp-like objects that might not be actual Timestamp instances
    // (e.g., after serialization/deserialization or from certain Firestore SDK versions/contexts)
    date = new Date((timestamp as {seconds: number}).seconds * 1000);
  } else {
    return 'Fecha inválida';
  }
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
};

type SortOrder = 'asc' | 'desc' | 'none';

export default function AdminPage() {
  const { currentUser, isAdmin, loading: authLoading, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editedDisplayName, setEditedDisplayName] = useState("");
  const [editedTier, setEditedTier] = useState<UserTier | undefined>(undefined);
  const [isSavingUser, setIsSavingUser] = useState(false);

  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc'); // Default: newest first

  const fetchUsers = async () => {
    if (!isAdmin || !isFirebaseConfigured || !db) {
      setIsLoadingUsers(false);
      if (isAdmin && (!isFirebaseConfigured || !db)) {
        setFetchError("Firebase Firestore no está configurado o no está disponible. No se pueden cargar los usuarios.");
      }
      return;
    }
    setIsLoadingUsers(true);
    setFetchError(null);
    try {
      const usersCollectionRef = collection(db, "users");
      const querySnapshot = await getDocs(usersCollectionRef);
      const usersList = querySnapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        uid: docSnapshot.data().uid || docSnapshot.id, // Ensure uid is populated, fallback to doc.id if necessary
        ...docSnapshot.data()
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

  useEffect(() => {
    if (isAdmin && isFirebaseConfigured && db) {
      fetchUsers();
    }
  }, [isAdmin, isFirebaseConfigured]); // Removed db from dependency array as it's memoized in AuthContext

  const filteredAndSortedUsers = useMemo(() => {
    let processedUsers = [...users];

    if (searchTerm.trim()) {
      processedUsers = processedUsers.filter(user =>
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (sortOrder !== 'none') {
      processedUsers.sort((a, b) => {
        const timeA = a.createdAt
          ? (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : (a.createdAt.seconds * 1000 + Math.floor((a.createdAt.nanoseconds || 0) / 1000000)))
          : 0;
        const timeB = b.createdAt
          ? (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : (b.createdAt.seconds * 1000 + Math.floor((b.createdAt.nanoseconds || 0) / 1000000)))
          : 0;

        if (sortOrder === 'asc') {
          return timeA - timeB;
        } else { // desc
          return timeB - timeA;
        }
      });
    }
    return processedUsers;
  }, [users, searchTerm, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prevOrder => {
      if (prevOrder === 'desc') return 'asc';
      if (prevOrder === 'asc') return 'none';
      return 'desc'; // 'none' goes to 'desc'
    });
  };

  const getSortIcon = () => {
    if (sortOrder === 'desc') return <ArrowDown className="h-4 w-4" />;
    if (sortOrder === 'asc') return <ArrowUp className="h-4 w-4" />;
    return <ArrowDownUp className="h-4 w-4" />;
  };

  const handleOpenEditDialog = (user: AppUser) => {
    setEditingUser(user);
    setEditedDisplayName(user.displayName || "");
    setEditedTier(user.tier || 'free'); 
    setIsEditDialogOpen(true);
  };

  const handleSaveUserChanges = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingUser || !db) return;

    setIsSavingUser(true);
    const userRef = doc(db, "users", editingUser.uid); 
    try {
      await updateDoc(userRef, {
        displayName: editedDisplayName,
        tier: editedTier,
      });
      toast({ title: "Usuario Actualizado", description: `Los datos de ${editingUser.email} han sido actualizados.`, variant: "default" });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers(); 
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({ title: "Error al Actualizar", description: `No se pudo actualizar el usuario: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !db) return;

    setIsDeletingUser(true);
    const userRef = doc(db, "users", userToDelete.uid); 
    try {
      await deleteDoc(userRef);
      toast({ title: "Usuario Eliminado de Firestore", description: `El registro de ${userToDelete.email} ha sido eliminado de la base de datos.`, variant: "default" });
      setUserToDelete(null); 
      fetchUsers(); 
    } catch (error: any) {
      console.error("Error deleting user from Firestore:", error);
      toast({ title: "Error al Eliminar", description: `No se pudo eliminar el usuario de Firestore: ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeletingUser(false);
    }
  };

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
      
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Nota Importante sobre Eliminación de Usuarios</AlertTitle>
        <AlertDescription>
          La función "Eliminar Usuario" en este panel solo borra el registro del usuario de la base de datos Firestore (colección 'users'). **No elimina la cuenta del sistema de autenticación de Firebase.** Para una eliminación completa, necesitarías usar el SDK de Admin de Firebase en un entorno de backend seguro.
        </AlertDescription>
      </Alert>

      <Card className="w-full shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-6 w-6 mr-2" />
              Gestión de Usuarios
            </div>
            <span className="text-sm font-normal text-muted-foreground">Total: {users.length}</span>
          </CardTitle>
          <CardDescription>
            Bienvenido, {currentUser.email}. Aquí puedes visualizar y gestionar los usuarios registrados en Zeinte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button onClick={toggleSortOrder} variant="outline" className="w-full sm:w-auto">
              {getSortIcon()}
              <span className="ml-2">
                Ordenar por Fecha: {sortOrder === 'desc' ? 'Nuevos Primero' : sortOrder === 'asc' ? 'Antiguos Primero' : 'Sin Orden'}
              </span>
            </Button>
          </div>

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
          ) : filteredAndSortedUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {users.length === 0 ? "No hay usuarios registrados todavía." : "No se encontraron usuarios que coincidan con la búsqueda."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nombre a Mostrar</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-mono text-xs truncate max-w-[100px]" title={user.uid}>{user.uid}</TableCell>
                      <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                      <TableCell>{user.displayName || 'N/A'}</TableCell>
                      <TableCell>{user.providerData && user.providerData.length > 0 ? user.providerData[0].providerId : user.provider || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.tier === 'admin' ? 'bg-red-500 text-white' :
                          user.tier === 'pro' ? 'bg-green-500 text-white' :
                          user.tier === 'free' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
                        }`}>
                          {user.tier || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>{formatFirebaseTimestamp(user.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(user)} title="Editar Usuario">
                            <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setUserToDelete(user)} title="Eliminar Usuario (Firestore)">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Editar Usuario: {editingUser.email}</DialogTitle>
              <DialogDescription>
                Modifica el nombre a mostrar y el plan (tier) del usuario.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveUserChanges} className="space-y-4 py-4">
              <div>
                <Label htmlFor="displayName">Nombre a Mostrar</Label>
                <Input 
                  id="displayName" 
                  value={editedDisplayName} 
                  onChange={(e) => setEditedDisplayName(e.target.value)} 
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tier">Plan (Tier)</Label>
                <Select value={editedTier} onValueChange={(value) => setEditedTier(value as UserTier)}>
                  <SelectTrigger id="tier" className="mt-1">
                    <SelectValue placeholder="Selecciona un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSavingUser}>
                  {isSavingUser ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      
      {userToDelete && (
          <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar Usuario de Firestore?</AlertDialogTitle>
                <AlertDialogDescription>
                    Estás a punto de eliminar el registro del usuario <span className="font-semibold">{userToDelete.email}</span> de la base de datos Firestore.
                    Esta acción **no elimina la cuenta del sistema de autenticación de Firebase**. El usuario podría seguir existiendo en Firebase Auth.
                    ¿Estás seguro de que quieres continuar? Esta acción no se puede deshacer.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isDeletingUser}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} disabled={isDeletingUser} className="bg-destructive hover:bg-destructive/90">
                    {isDeletingUser ? <Loader2 className="animate-spin mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Sí, Eliminar de Firestore
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="mt-10 space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b pb-2">Otras Funciones del CMS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Gestionar Contenido Comunidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Moderar temas y mensajes del foro, gestionar categorías, etc.</p>
              <Link href="/admin/community-management" passHref>
                 <Button variant="outline" size="sm" className="mt-3">Ir a Gestión de Comunidad</Button>
              </Link>
            </CardContent>
          </Card>
            <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configuración General de la App
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Ajustes globales de la aplicación, parámetros de IA, gestión de planes (futuro), etc.</p>
               <Link href="/admin/app-settings" passHref>
                 <Button variant="outline" size="sm" className="mt-3">Ir a Configuración</Button>
               </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
