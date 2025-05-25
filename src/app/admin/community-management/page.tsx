
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
import { mockForumTopics as initialMockForumTopics, type MockForumTopic, type MockPost } from '@/lib/mockCommunityData';
import { MessageSquare, Users, ArrowLeft, Loader2, ShieldAlert, Eye, Edit3, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added import

export default function AdminCommunityManagementPage() {
  const { currentUser, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [topics, setTopics] = useState<MockForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<MockForumTopic | null>(null);
  const [isPostsDialogOpen, setIsPostsDialogOpen] = useState(false);
  
  const [editingPost, setEditingPost] = useState<MockPost | null>(null);
  const [editedPostContent, setEditedPostContent] = useState("");
  const [isEditPostDialogOpen, setIsEditPostDialogOpen] = useState(false);

  const [postToDelete, setPostToDelete] = useState<{topicId: string, postId: string} | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null); // topicId

  useEffect(() => {
    // Simulate fetching topics. In a real app, this would be from Firestore.
    // Deep copy to allow in-memory modifications without affecting the original mock
    setTopics(JSON.parse(JSON.stringify(initialMockForumTopics))); 
  }, []);

  const handleViewPosts = (topic: MockForumTopic) => {
    setSelectedTopic(topic);
    setIsPostsDialogOpen(true);
  };

  const handleOpenEditPostDialog = (post: MockPost) => {
    setEditingPost(post);
    setEditedPostContent(post.content);
    setIsEditPostDialogOpen(true);
  };

  const handleSaveEditedPost = (event: FormEvent) => {
    event.preventDefault();
    if (!editingPost || !selectedTopic) return;

    setTopics(prevTopics =>
      prevTopics.map(topic =>
        topic.id === selectedTopic.id
          ? {
              ...topic,
              posts: topic.posts.map(p =>
                p.id === editingPost.id ? { ...p, content: editedPostContent } : p
              ),
            }
          : topic
      )
    );
    // Update selectedTopic as well so the modal reflects changes immediately
    setSelectedTopic(prevSelected => prevSelected ? {
        ...prevSelected,
        posts: prevSelected.posts.map(p => 
            p.id === editingPost.id ? { ...p, content: editedPostContent } : p
        )
    } : null);

    toast({ title: "Post Actualizado", description: "El contenido del mensaje ha sido modificado (en memoria).", variant: "default" });
    setIsEditPostDialogOpen(false);
    setEditingPost(null);
  };
  
  const confirmDeletePost = () => {
    if (!postToDelete || !selectedTopic) return;
    
    setTopics(prevTopics => 
        prevTopics.map(topic => 
            topic.id === postToDelete.topicId 
            ? { ...topic, posts: topic.posts.filter(p => p.id !== postToDelete.postId), postCount: topic.postCount -1 }
            : topic
        )
    );
    setSelectedTopic(prevSelected => prevSelected ? {
        ...prevSelected,
        posts: prevSelected.posts.filter(p => p.id !== postToDelete.postId),
        postCount: prevSelected.postCount -1
    } : null);

    toast({ title: "Post Eliminado", description: "El mensaje ha sido eliminado (en memoria).", variant: "destructive" });
    setPostToDelete(null);
  };

  const confirmDeleteTopic = () => {
    if (!topicToDelete) return;
    setTopics(prevTopics => prevTopics.filter(topic => topic.id !== topicToDelete));
    toast({ title: "Tema Eliminado", description: "El tema y sus mensajes han sido eliminados (en memoria).", variant: "destructive" });
    setTopicToDelete(null);
    if (selectedTopic && selectedTopic.id === topicToDelete) {
        setIsPostsDialogOpen(false);
        setSelectedTopic(null);
    }
  };


  if (authLoading) {
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <MessageSquare className="h-8 w-8" /> Gestión de Contenido de la Comunidad
        </h1>
        <Link href="/admin" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Volver al Panel de Administración</Button>
        </Link>
      </div>
      
      <Alert variant="default" className="bg-primary/10 border-primary/50">
        <ShieldAlert className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">Modo de Demostración</AlertTitle>
        <AlertDescription className="text-primary/80">
          Actualmente, esta sección opera con datos simulados en memoria. Cualquier edición o eliminación no será persistente y se reiniciará al recargar la página. La integración completa con Firestore para la gestión de datos reales de la comunidad es una funcionalidad futura.
        </AlertDescription>
      </Alert>

      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Temas del Foro (Gestión en Memoria)</CardTitle>
          <CardDescription>
            Visualiza, edita y elimina temas y mensajes de la comunidad. Los cambios son temporales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay temas en el foro para mostrar.</p>
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
                      <TableCell>{topic.authorId}</TableCell>
                      <TableCell className="text-center">{topic.postCount}</TableCell>
                      <TableCell className="text-center">{topic.views}</TableCell>
                      <TableCell>{topic.lastActivity}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleViewPosts(topic)} title="Ver/Gestionar Mensajes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled title="Editar Tema (Próximamente en Firestore)">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setTopicToDelete(topic.id)} title="Eliminar Tema">
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

      {/* View Posts Dialog */}
      {selectedTopic && (
        <Dialog open={isPostsDialogOpen} onOpenChange={setIsPostsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary">Mensajes en: {selectedTopic.title}</DialogTitle>
              <DialogDescription>
                Visualiza, edita o elimina mensajes del tema. Los cambios son temporales.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-2 my-4">
              <div className="space-y-4">
                {selectedTopic.posts.map((post: MockPost) => (
                  <Card key={post.id} className="p-3 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${post.userId.substring(0,2).toUpperCase()}`} alt={post.userId} data-ai-hint="user avatar" />
                        <AvatarFallback>{post.userId.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <p className="font-semibold text-foreground">{post.userId}</p>
                          <p className="text-muted-foreground">{post.timestamp}</p>
                        </div>
                        <p className="text-sm text-foreground/90 mt-1 whitespace-pre-line">{post.content}</p>
                        <div className="mt-2 flex items-center space-x-2">
                           <Button variant="outline" size="xs" onClick={() => handleOpenEditPostDialog(post)} className="text-xs">
                             <Edit3 className="h-3 w-3 mr-1" />Editar
                           </Button>
                           <Button variant="destructive" size="xs" onClick={() => setPostToDelete({ topicId: selectedTopic.id, postId: post.id})} className="text-xs">
                             <Trash2 className="h-3 w-3 mr-1" />Eliminar
                           </Button>
                           <span className="text-xs text-muted-foreground ml-auto">{post.likes} Me gusta</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {selectedTopic.posts.length === 0 && <p className="text-muted-foreground text-center">No hay mensajes en este tema.</p>}
              </div>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Post Dialog */}
      {editingPost && (
        <Dialog open={isEditPostDialogOpen} onOpenChange={setIsEditPostDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Mensaje</DialogTitle>
                    <DialogDescription>Modifica el contenido del mensaje. Los cambios son temporales.</DialogDescription>
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

      {/* Confirm Delete Post Dialog */}
      {postToDelete && (
        <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar Mensaje?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Estás a punto de eliminar este mensaje. Esta acción es temporal y se reiniciará al recargar la página. ¿Estás seguro?
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

      {/* Confirm Delete Topic Dialog */}
      {topicToDelete && (
        <AlertDialog open={!!topicToDelete} onOpenChange={(open) => !open && setTopicToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar Tema del Foro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Estás a punto de eliminar este tema y todos sus mensajes asociados. Esta acción es temporal y se reiniciará al recargar la página. ¿Estás seguro?
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

