
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Users, ArrowLeft, Loader2, ShieldAlert, Eye, Edit3, Trash2, Save, AlertTriangle, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { db } from '@/firebase/config';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch,
  increment,
  FieldValue
} from 'firebase/firestore';
import { seedInitialForumData } from '@/lib/firestoreSeedData'; // Import the seeding function

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

interface ForumTopic {
  id: string;
  title: string;
  description: string;
  authorId: string;
  createdAt: Timestamp | FirestoreTimestamp | Date;
  lastActivity: Timestamp | FirestoreTimestamp | Date;
  postCount: number;
  views: number;
  posts?: ForumPost[]; 
}

interface ForumPost {
  id: string;
  topicId: string;
  userId: string;
  content: string;
  timestamp: Timestamp | FirestoreTimestamp | Date;
  likes: number;
}

const formatFirestoreTimestamp = (timestamp: Timestamp | FirestoreTimestamp | Date | undefined): string => {
  if (!timestamp) return 'N/A';
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp && typeof (timestamp as FirestoreTimestamp).seconds === 'number') {
    date = new Date((timestamp as FirestoreTimestamp).seconds * 1000);
  } else {
    return 'Fecha inválida';
  }
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};


export default function AdminCommunityManagementPage() {
  const { currentUser, isAdmin, loading: authLoading, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();

  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  
  const [isPostsDialogOpen, setIsPostsDialogOpen] = useState(false);
  
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editedPostContent, setEditedPostContent] = useState("");
  const [isEditPostDialogOpen, setIsEditPostDialogOpen] = useState(false);

  const [postToDelete, setPostToDelete] = useState<ForumPost | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<ForumTopic | null>(null);

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatusMessage, setSeedStatusMessage] = useState<string | null>(null);

  // --- IMPORTANT: REPLACE THESE WITH ACTUAL UIDs OF YOUR TEST USERS ---
  // These should match the UIDs of users created in your Firebase Authentication
  const seedUserUids = {
    admin: 'NidzDymkvMS1OGJIvLVnCkCUAPA3', // UID for serdiegm@gmail.com
    free: 'nBLucmABJ3RpUsdROuiASLowkXF2',   // UID for dginteligenciaartificial@gmail.com
    pro: 'vNZkFqc4TqU7bqhz7q57RMtNLcx1'     // UID for prueba@prueba.com
  };
  // --- END OF UID REPLACEMENT ---

  const handleSeedData = async () => {
    if (!db || !isAdmin) {
      toast({ title: "Error", description: "No autorizado o DB no configurada.", variant: "destructive" });
      return;
    }
    if (seedUserUids.admin.startsWith('REPLACE_') || seedUserUids.free.startsWith('REPLACE_') || seedUserUids.pro.startsWith('REPLACE_')) {
      toast({ title: "Error de Configuración de Siembra", description: "Debes reemplazar los UIDs placeholder en AdminCommunityManagementPage.tsx y en firestoreSeedData.ts antes de sembrar datos.", variant: "destructive", duration: 10000 });
      setSeedStatusMessage("Error: UIDs placeholder no reemplazados.");
      return;
    }
    setIsSeeding(true);
    setSeedStatusMessage("Sembrando datos iniciales...");
    const result = await seedInitialForumData(db, seedUserUids);
    setSeedStatusMessage(result);
    toast({ title: "Resultado de Siembra de Datos", description: result, duration: 7000 });
    setIsSeeding(false);
    if (result.startsWith('Successfully')) {
      fetchTopics(); // Refresh topics list
    }
  };


  const fetchTopics = async () => {
    if (!db || !isAdmin) {
      setIsLoadingTopics(false);
      return;
    }
    setIsLoadingTopics(true);
    try {
      const topicsCollectionRef = collection(db, "forumTopics");
      const q = query(topicsCollectionRef, orderBy("lastActivity", "desc"));
      const querySnapshot = await getDocs(q);
      const topicsList = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as ForumTopic));
      setTopics(topicsList);
    } catch (error) {
      console.error("Error fetching forum topics:", error);
      toast({ title: "Error al Cargar Temas", description: "No se pudieron cargar los temas del foro desde Firestore.", variant: "destructive" });
    } finally {
      setIsLoadingTopics(false);
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured && isAdmin && db) {
      fetchTopics();
    }
  }, [isFirebaseConfigured, isAdmin, db]);

  const fetchPostsForTopic = async (topicId: string) => {
    if (!db) return [];
    setIsLoadingPosts(true);
    try {
      const postsCollectionRef = collection(db, "forumPosts");
      const q = query(postsCollectionRef, where("topicId", "==", topicId), orderBy("timestamp", "asc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as ForumPost));
    } catch (error) {
      console.error("Error fetching posts for topic:", topicId, error);
      toast({ title: "Error al Cargar Mensajes", description: "No se pudieron cargar los mensajes para este tema.", variant: "destructive" });
      return [];
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleViewPosts = async (topic: ForumTopic) => {
    const posts = await fetchPostsForTopic(topic.id);
    setSelectedTopic({ ...topic, posts });
    setIsPostsDialogOpen(true);
  };

  const handleOpenEditPostDialog = (post: ForumPost) => {
    setEditingPost(post);
    setEditedPostContent(post.content);
    setIsEditPostDialogOpen(true);
  };

  const handleSaveEditedPost = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingPost || !selectedTopic || !db) return;

    const postRef = doc(db, "forumPosts", editingPost.id);
    try {
      await updateDoc(postRef, { content: editedPostContent });
      
      const updatedPosts = selectedTopic.posts?.map(p =>
        p.id === editingPost.id ? { ...p, content: editedPostContent } : p
      ) || [];
      setSelectedTopic(prev => prev ? { ...prev, posts: updatedPosts } : null);

      toast({ title: "Mensaje Actualizado", description: "El contenido del mensaje ha sido modificado en Firestore.", variant: "default" });
      setIsEditPostDialogOpen(false);
      setEditingPost(null);
    } catch (error) {
      console.error("Error updating post:", error);
      toast({ title: "Error al Actualizar", description: "No se pudo actualizar el mensaje.", variant: "destructive" });
    }
  };
  
  const confirmDeletePost = async () => {
    if (!postToDelete || !selectedTopic || !db) return;
    
    const postRef = doc(db, "forumPosts", postToDelete.id);
    const topicRef = doc(db, "forumTopics", selectedTopic.id);
    const batch = writeBatch(db);

    batch.delete(postRef);
    batch.update(topicRef, { postCount: increment(-1) }); 

    try {
      await batch.commit();
      const updatedPosts = selectedTopic.posts?.filter(p => p.id !== postToDelete.id) || [];
      setSelectedTopic(prev => prev ? { ...prev, posts: updatedPosts, postCount: prev.postCount -1 } : null);
      setTopics(prevTopics => prevTopics.map(t => t.id === selectedTopic.id ? {...t, postCount: t.postCount -1} : t));

      toast({ title: "Mensaje Eliminado", description: "El mensaje ha sido eliminado de Firestore.", variant: "destructive" });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Error al Eliminar", description: "No se pudo eliminar el mensaje.", variant: "destructive" });
    } finally {
      setPostToDelete(null);
    }
  };

  const confirmDeleteTopic = async () => {
    if (!topicToDelete || !db) return;
    
    const topicRef = doc(db, "forumTopics", topicToDelete.id);
    const postsQuery = query(collection(db, "forumPosts"), where("topicId", "==", topicToDelete.id));

    try {
      const batch = writeBatch(db);
      batch.delete(topicRef);
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      setTopics(prevTopics => prevTopics.filter(topic => topic.id !== topicToDelete.id));
      
      toast({ title: "Tema Eliminado", description: "El tema y sus mensajes han sido eliminados de Firestore.", variant: "destructive" });
      if (selectedTopic && selectedTopic.id === topicToDelete.id) {
          setIsPostsDialogOpen(false);
          setSelectedTopic(null);
      }
    } catch (error) {
      console.error("Error deleting topic and its posts:", error);
      toast({ title: "Error al Eliminar Tema", description: "No se pudo eliminar el tema y sus mensajes.", variant: "destructive" });
    } finally {
      setTopicToDelete(null);
    }
  };

  if (authLoading || isLoadingTopics) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-3 text-lg">Cargando...</span></div>;
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
                    Firebase Firestore no está configurado o disponible. El panel de gestión de comunidad no puede funcionar.
                </AlertDescription>
            </Alert>
             <div className="text-center">
                <Link href="/admin" passHref>
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Volver al Panel de Administración</Button>
                </Link>
            </div>
        </div>
      )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <MessageSquare className="h-8 w-8" /> Gestión de Contenido de la Comunidad (Firestore)
        </h1>
        <Link href="/admin" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Volver al Panel de Administración</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="text-lg">Siembra de Datos Iniciales</CardTitle>
            <CardDescription>
                Usa este botón para poblar Firestore con datos de ejemplo para el foro. 
                Reemplaza los UIDs placeholder en el código antes de usar.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleSeedData} disabled={isSeeding}>
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                Sembrar Datos Iniciales del Foro
            </Button>
            {seedStatusMessage && (
                <Alert className={`mt-4 ${seedStatusMessage.includes('Error') ? 'variant-destructive' : 'variant-default'}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{seedStatusMessage.includes('Error') ? 'Error de Siembra' : 'Estado de Siembra'}</AlertTitle>
                    <AlertDescription>{seedStatusMessage}</AlertDescription>
                </Alert>
            )}
            <p className="text-xs text-muted-foreground mt-2">
                Nota: Esta acción intentará no duplicar datos si ya existen temas.
                Asegúrate de haber reemplazado los UIDs placeholder en el código de <code>AdminCommunityManagementPage.tsx</code> y <code>firestoreSeedData.ts</code>.
            </p>
        </CardContent>
      </Card>
      
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Temas del Foro (desde Firestore)</CardTitle>
          <CardDescription>
            Visualiza, edita y elimina temas y mensajes de la comunidad. Los cambios son persistentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTopics ? (
             <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /> Cargando temas del foro...
            </div>
          ) : topics.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay temas en el foro para mostrar en Firestore.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título del Tema</TableHead>
                    <TableHead>Autor (ID)</TableHead>
                    <TableHead className="text-center">Mensajes</TableHead>
                    <TableHead className="text-center">Vistas</TableHead>
                    <TableHead>Última Actividad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell className="font-medium max-w-xs truncate" title={topic.title}>{topic.title}</TableCell>
                      <TableCell className="truncate max-w-[100px]" title={topic.authorId}>{topic.authorId}</TableCell>
                      <TableCell className="text-center">{topic.postCount}</TableCell>
                      <TableCell className="text-center">{topic.views}</TableCell>
                      <TableCell>{formatFirestoreTimestamp(topic.lastActivity)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleViewPosts(topic)} title="Ver/Gestionar Mensajes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled title="Editar Tema (Funcionalidad futura)">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setTopicToDelete(topic)} title="Eliminar Tema">
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

      {selectedTopic && (
        <Dialog open={isPostsDialogOpen} onOpenChange={(open) => { if(!open) setSelectedTopic(null); setIsPostsDialogOpen(open);}}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary">Mensajes en: {selectedTopic.title}</DialogTitle>
              <DialogDescription>
                Visualiza, edita o elimina mensajes del tema. Los cambios son persistentes en Firestore.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-2 my-4">
              {isLoadingPosts ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Cargando mensajes...</div>
              ) : selectedTopic.posts && selectedTopic.posts.length > 0 ? (
                <div className="space-y-4">
                  {selectedTopic.posts.map((post: ForumPost) => (
                    <Card key={post.id} className="p-3 shadow-sm">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8 border">
                           {/* Idealmente, aquí se buscaría la photoURL del usuario con post.userId */}
                          <AvatarImage src={`https://placehold.co/40x40.png?text=${post.userId.substring(0,2).toUpperCase()}`} alt={post.userId} data-ai-hint="user avatar" />
                          <AvatarFallback>{post.userId.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <p className="font-semibold text-foreground truncate max-w-[150px]" title={post.userId}>{post.userId}</p>
                            <p className="text-muted-foreground">{formatFirestoreTimestamp(post.timestamp)}</p>
                          </div>
                          <p className="text-sm text-foreground/90 mt-1 whitespace-pre-line">{post.content}</p>
                          <div className="mt-2 flex items-center space-x-2">
                             <Button variant="outline" size="xs" onClick={() => handleOpenEditPostDialog(post)} className="text-xs">
                               <Edit3 className="h-3 w-3 mr-1" />Editar
                             </Button>
                             <Button variant="destructive" size="xs" onClick={() => setPostToDelete(post)} className="text-xs">
                               <Trash2 className="h-3 w-3 mr-1" />Eliminar
                             </Button>
                             <span className="text-xs text-muted-foreground ml-auto">{post.likes} Me gusta</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center">No hay mensajes en este tema.</p>
              )}
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editingPost && (
        <Dialog open={isEditPostDialogOpen} onOpenChange={setIsEditPostDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Mensaje</DialogTitle>
                    <DialogDescription>Modifica el contenido del mensaje. Los cambios se guardarán en Firestore.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveEditedPost} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="editedPostContent" className="sr-only">Contenido del Mensaje</Label>
                        <Textarea 
                            id="editedPostContent" 
                            value={editedPostContent} 
                            onChange={(e) => setEditedPostContent(e.target.value)} 
                            className="mt-1 min-h-[150px]"
                            rows={6}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      )}

      {postToDelete && (
        <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar Mensaje?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Estás a punto de eliminar este mensaje de Firestore. Esta acción no se puede deshacer. ¿Estás seguro?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeletePost} className="bg-destructive hover:bg-destructive/90">
                        <Trash2 className="mr-2 h-4 w-4" /> Sí, Eliminar Mensaje
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {topicToDelete && (
        <AlertDialog open={!!topicToDelete} onOpenChange={(open) => !open && setTopicToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar Tema del Foro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Estás a punto de eliminar este tema y todos sus mensajes asociados de Firestore. Esta acción no se puede deshacer. ¿Estás seguro?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setTopicToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteTopic} className="bg-destructive hover:bg-destructive/90">
                        <Trash2 className="mr-2 h-4 w-4" /> Sí, Eliminar Tema
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
