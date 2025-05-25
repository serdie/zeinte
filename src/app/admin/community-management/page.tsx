
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockForumTopics, type MockForumTopic, type MockPost } from '@/lib/mockCommunityData';
import { MessageSquare, Users, ArrowLeft, Loader2, ShieldAlert, Eye, Edit3, Trash2 } from 'lucide-react';

export default function AdminCommunityManagementPage() {
  const { currentUser, isAdmin, loading: authLoading } = useAuth();
  const [topics, setTopics] = useState<MockForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<MockForumTopic | null>(null);
  const [isPostsDialogOpen, setIsPostsDialogOpen] = useState(false);

  useEffect(() => {
    // In a real app, fetch topics from Firestore here
    setTopics(mockForumTopics);
  }, []);

  const handleViewPosts = (topic: MockForumTopic) => {
    setSelectedTopic(topic);
    setIsPostsDialogOpen(true);
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

      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Temas del Foro (Simulado)</CardTitle>
          <CardDescription>
            Visualiza y gestiona los temas de discusión de la comunidad. Actualmente se muestra data simulada.
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
                        <Button variant="outline" size="sm" onClick={() => handleViewPosts(topic)} title="Ver Mensajes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled title="Editar Tema (Próximamente)">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" disabled title="Eliminar Tema (Próximamente)">
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
        <Dialog open={isPostsDialogOpen} onOpenChange={setIsPostsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary">Mensajes en: {selectedTopic.title}</DialogTitle>
              <DialogDescription>
                Visualizando los mensajes del tema seleccionado. La edición y eliminación de mensajes se implementará en el futuro.
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
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">{post.likes} Me gusta</span>
                           <Button variant="ghost" size="xs" disabled className="text-xs text-muted-foreground">(Editar)</Button>
                           <Button variant="ghost" size="xs" disabled className="text-xs text-destructive/80">(Eliminar)</Button>
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
    </div>
  );
}

