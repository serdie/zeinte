
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
import { useI18n } from '@/contexts/I18nContext';

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

const formatFirestoreTimestamp = (timestamp: Timestamp | FirestoreTimestamp | Date | undefined, locale: string): string => {
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
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};


export default function AdminCommunityManagementPage() {
  const { currentUser, isAdmin, loading: authLoading, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();
  const { t, language } = useI18n();

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
      toast({ title: t('adminCommunityManagementPage.seedDataErrorConfig'), variant: "destructive" });
      return;
    }
    if (seedUserUids.admin.startsWith('REPLACE_') || seedUserUids.free.startsWith('REPLACE_') || seedUserUids.pro.startsWith('REPLACE_')) {
      toast({ title: "Error de Configuración de Siembra", description: "Debes reemplazar los UIDs placeholder en AdminCommunityManagementPage.tsx y en firestoreSeedData.ts antes de sembrar datos.", variant: "destructive", duration: 10000 });
      setSeedStatusMessage(t('adminCommunityManagementPage.seedDataErrorUIDPlaceholder'));
      return;
    }
    setIsSeeding(true);
    setSeedStatusMessage(t('adminCommunityManagementPage.seedDataStatusSeeding'));
    const result = await seedInitialForumData(db, seedUserUids);
    setSeedStatusMessage(result);
    toast({ title: t('adminCommunityManagementPage.seedDataToastTitle'), description: result, duration: 7000 });
    setIsSeeding(false);
    if (result.startsWith('Successfully') || result.startsWith('Datos iniciales')) {
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

      toast({ title: t('adminCommunityManagementPage.postUpdatedToastTitle'), description: t('adminCommunityManagementPage.postUpdatedToastDescription'), variant: "default" });
      setIsEditPostDialogOpen(false);
      setEditingPost(null);
    } catch (error) {
      console.error("Error updating post:", error);
      toast({ title: t('adminCommunityManagementPage.errorUpdatingPostToastTitle'), description: t('adminCommunityManagementPage.errorUpdatingPostToastDescription'), variant: "destructive" });
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

      toast({ title: t('adminCommunityManagementPage.postDeletedToastTitle'), description: t('adminCommunityManagementPage.postDeletedToastDescription'), variant: "destructive" });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: t('adminCommunityManagementPage.errorDeletingPostToastTitle'), description: t('adminCommunityManagementPage.errorDeletingPostToastDescription'), variant: "destructive" });
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
      
      toast({ title: t('adminCommunityManagementPage.topicDeletedToastTitle'), description: t('adminCommunityManagementPage.topicDeletedToastDescription'), variant: "destructive" });
      if (selectedTopic && selectedTopic.id === topicToDelete.id) {
          setIsPostsDialogOpen(false);
          setSelectedTopic(null);
      }
    } catch (error) {
      console.error("Error deleting topic and its posts:", error);
      toast({ title: t('adminCommunityManagementPage.errorDeletingTopicToastTitle'), description: t('adminCommunityManagementPage.errorDeletingTopicToastDescription'), variant: "destructive" });
    } finally {
      setTopicToDelete(null);
    }
  };

  if (authLoading || isLoadingTopics) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-3 text-lg">{t('adminCommunityManagementPage.loading')}</span></div>;
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="container mx-auto py-8 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">{t('adminCommunityManagementPage.accessDeniedTitle')}</h1>
        <p className="text-muted-foreground">{t('adminCommunityManagementPage.accessDeniedDescription')}</p>
        <Link href="/dashboard" passHref className="mt-6 inline-block">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t('adminCommunityManagementPage.backToDashboard')}</Button>
        </Link>
      </div>
    );
  }
  
  if (!isFirebaseConfigured || !db) {
      return (
        <div className="container mx-auto py-10 px-4">
            <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('adminCommunityManagementPage.firebaseConfigErrorTitle')}</AlertTitle>
                <AlertDescription>
                    {t('adminCommunityManagementPage.firebaseConfigErrorDescription')}
                </AlertDescription>
            </Alert>
             <div className="text-center">
                <Link href="/admin" passHref>
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t('adminCommunityManagementPage.backToAdminPanel')}</Button>
                </Link>
            </div>
        </div>
      )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <MessageSquare className="h-8 w-8" /> {t('adminCommunityManagementPage.title')}
        </h1>
        <Link href="/admin" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t('adminCommunityManagementPage.backToAdminPanel')}</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="text-lg">{t('adminCommunityManagementPage.seedDataCardTitle')}</CardTitle>
            <CardDescription>
                {t('adminCommunityManagementPage.seedDataCardDescription')}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleSeedData} disabled={isSeeding}>
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                {t('adminCommunityManagementPage.seedDataButton')}
            </Button>
            {seedStatusMessage && (
                <Alert className={`mt-4 ${seedStatusMessage.includes('Error') ? 'variant-destructive' : 'variant-default'}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{seedStatusMessage.includes('Error') ? t('adminCommunityManagementPage.seedDataErrorAlertTitle') : t('adminCommunityManagementPage.seedDataStatusAlertTitle')}</AlertTitle>
                    <AlertDescription>{seedStatusMessage}</AlertDescription>
                </Alert>
            )}
            <p className="text-xs text-muted-foreground mt-2">
                {t('adminCommunityManagementPage.seedDataNote')}
            </p>
        </CardContent>
      </Card>
      
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">{t('adminCommunityManagementPage.forumTopicsCardTitle')}</CardTitle>
          <CardDescription>
            {t('adminCommunityManagementPage.forumTopicsCardDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTopics ? (
             <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /> {t('adminCommunityManagementPage.loadingTopics')}
            </div>
          ) : topics.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t('adminCommunityManagementPage.noTopicsToShow')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('adminCommunityManagementPage.topicTitleHeader')}</TableHead>
                    <TableHead>{t('adminCommunityManagementPage.topicAuthorHeader')}</TableHead>
                    <TableHead className="text-center">{t('adminCommunityManagementPage.topicMessagesHeader')}</TableHead>
                    <TableHead className="text-center">{t('adminCommunityManagementPage.topicViewsHeader')}</TableHead>
                    <TableHead>{t('adminCommunityManagementPage.topicLastActivityHeader')}</TableHead>
                    <TableHead className="text-right">{t('adminCommunityManagementPage.topicActionsHeader')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell className="font-medium max-w-xs truncate" title={topic.title}>{topic.title}</TableCell>
                      <TableCell className="truncate max-w-[100px]" title={topic.authorId}>{topic.authorId}</TableCell>
                      <TableCell className="text-center">{topic.postCount}</TableCell>
                      <TableCell className="text-center">{topic.views}</TableCell>
                      <TableCell>{formatFirestoreTimestamp(topic.lastActivity, language)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleViewPosts(topic)} title={t('adminCommunityManagementPage.viewPostsButtonTooltip')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled title={t('adminCommunityManagementPage.editTopicButtonTooltip')}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setTopicToDelete(topic)} title={t('adminCommunityManagementPage.deleteTopicButtonTooltip')}>
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
              <DialogTitle className="text-2xl text-primary">{t('adminCommunityManagementPage.postsDialogTitle', {topicTitle: selectedTopic.title})}</DialogTitle>
              <DialogDescription>
                {t('adminCommunityManagementPage.postsDialogDescription')}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-2 my-4">
              {isLoadingPosts ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> {t('adminCommunityManagementPage.loadingPosts')}</div>
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
                            <p className="text-muted-foreground">{formatFirestoreTimestamp(post.timestamp, language)}</p>
                          </div>
                          <p className="text-sm text-foreground/90 mt-1 whitespace-pre-line">{post.content}</p>
                          <div className="mt-2 flex items-center space-x-2">
                             <Button variant="outline" size="xs" onClick={() => handleOpenEditPostDialog(post)} className="text-xs">
                               <Edit3 className="h-3 w-3 mr-1" />{t('adminCommunityManagementPage.editPostButton')}
                             </Button>
                             <Button variant="destructive" size="xs" onClick={() => setPostToDelete(post)} className="text-xs">
                               <Trash2 className="h-3 w-3 mr-1" />{t('adminCommunityManagementPage.deletePostButton')}
                             </Button>
                             <span className="text-xs text-muted-foreground ml-auto">{post.likes} {t('adminCommunityManagementPage.postLikes', {count: post.likes})}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center">{t('adminCommunityManagementPage.noPostsInTopic')}</p>
              )}
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">{t('common.close')}</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editingPost && (
        <Dialog open={isEditPostDialogOpen} onOpenChange={setIsEditPostDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('adminCommunityManagementPage.editPostDialogTitle')}</DialogTitle>
                    <DialogDescription>{t('adminCommunityManagementPage.editPostDialogDescription')}</DialogDescription>
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
                            <Button type="button" variant="outline">{t('common.cancel')}</Button>
                        </DialogClose>
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" /> {t('adminCommunityManagementPage.saveEditedPostButton')}
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
                    <AlertDialogTitle>{t('adminCommunityManagementPage.deletePostDialogTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('adminCommunityManagementPage.deletePostDialogDescription')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPostToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeletePost} className="bg-destructive hover:bg-destructive/90">
                        <Trash2 className="mr-2 h-4 w-4" /> {t('adminCommunityManagementPage.confirmDeletePostButton')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {topicToDelete && (
        <AlertDialog open={!!topicToDelete} onOpenChange={(open) => !open && setTopicToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('adminCommunityManagementPage.deleteTopicDialogTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('adminCommunityManagementPage.deleteTopicDialogDescription')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setTopicToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteTopic} className="bg-destructive hover:bg-destructive/90">
                        <Trash2 className="mr-2 h-4 w-4" /> {t('adminCommunityManagementPage.confirmDeleteTopicButton')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
