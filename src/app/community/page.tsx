
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Users, MessageSquare, CornerDownRight, ThumbsUp, Eye, Search, Newspaper, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/contexts/I18nContext';
import AdSenseUnit from '@/components/ads/AdSenseUnit';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import NewTopicDialog from '@/components/community/NewTopicDialog';
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  where,
  Timestamp,
  addDoc,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Textarea } from '@/components/ui/textarea';
import type { AppUserFirestoreData } from '@/contexts/AuthContext';


interface ForumUser extends AppUserFirestoreData {
  // Potentially add more community-specific fields later
}

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

interface ForumPost {
  id: string;
  topicId: string;
  userId: string;
  user?: ForumUser; // Populated client-side
  content: string;
  timestamp: Timestamp | FirestoreTimestamp | Date;
  likes: number;
}

interface ForumTopic {
  id: string;
  title: string;
  description: string;
  authorId: string;
  author?: ForumUser; // Populated client-side
  createdAt: Timestamp | FirestoreTimestamp | Date;
  lastActivity: Timestamp | FirestoreTimestamp | Date;
  postCount: number;
  views: number;
  posts?: ForumPost[];
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


// Main Community Page Component
export default function CommunityPage() {
  const { t } = useI18n();
  const { currentUser, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, ForumUser>>({});
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false);
  
  const [replyingToTopicId, setReplyingToTopicId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  

  const fetchUserProfiles = useCallback(async (userIds: string[]) => {
    if (!isFirebaseConfigured || !db) return;
    const newIdsToFetch = userIds.filter(id => !userProfiles[id] && id);
    if (newIdsToFetch.length === 0) return;

    try {
      const uniqueIds = [...new Set(newIdsToFetch)];
      const fetchedProfiles: Record<string, ForumUser> = {};
      // Firestore 'in' query is limited to 30 items
      for (let i = 0; i < uniqueIds.length; i += 30) {
        const chunk = uniqueIds.slice(i, i + 30);
        const usersQuery = query(collection(db, 'users'), where('uid', 'in', chunk));
        const querySnapshot = await getDocs(usersQuery);
        querySnapshot.forEach(doc => {
          fetchedProfiles[doc.id] = doc.data() as ForumUser;
        });
      }
      setUserProfiles(prev => ({ ...prev, ...fetchedProfiles }));
    } catch (error) {
      console.error("Error fetching user profiles:", error);
    }
  }, [isFirebaseConfigured, userProfiles]);

  const fetchTopics = useCallback(async () => {
    if (!isFirebaseConfigured || !db) {
        setIsLoadingTopics(false);
        return;
    }
    setIsLoadingTopics(true);
    try {
        const topicsCollectionRef = collection(db, "forumTopics");
        const q = query(topicsCollectionRef, orderBy("lastActivity", "desc"));
        const querySnapshot = await getDocs(q);
        const topicsList: ForumTopic[] = querySnapshot.docs.map(docSnapshot => ({
            id: docSnapshot.id,
            ...docSnapshot.data()
        } as ForumTopic));

        const authorIds = topicsList.map(topic => topic.authorId);
        await fetchUserProfiles(authorIds);

        setTopics(topicsList);
    } catch (error) {
        console.error("Error fetching forum topics:", error);
        toast({ title: t('common.error'), description: "No se pudieron cargar los temas del foro desde Firestore.", variant: "destructive" });
    } finally {
        setIsLoadingTopics(false);
    }
  }, [isFirebaseConfigured, toast, t, fetchUserProfiles]);
  
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);
  
  const handleTopicCreated = () => {
    fetchTopics(); // Re-fetch all topics to show the new one
  };
  
  const handleOpenNewTopicDialog = () => {
    if (!currentUser) {
        toast({ title: "Acción requerida", description: "Debes iniciar sesión para crear un nuevo tema.", variant: "default" });
        return;
    }
    setIsNewTopicDialogOpen(true);
  };
  
  const fetchPostsForTopic = async (topicId: string) => {
    if (!db) return;
    setIsLoadingPosts(true);
    try {
      const postsCollectionRef = collection(db, "forumPosts");
      const q = query(postsCollectionRef, where("topicId", "==", topicId), orderBy("timestamp", "asc"));
      const querySnapshot = await getDocs(q);
      const postsList: ForumPost[] = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as ForumPost));
      
      const userIds = postsList.map(post => post.userId);
      await fetchUserProfiles(userIds);
      
      setTopics(prevTopics => prevTopics.map(topic => 
        topic.id === topicId ? { ...topic, posts: postsList } : topic
      ));

    } catch (error) {
      console.error("Error fetching posts for topic:", topicId, error);
      toast({ title: t('common.error'), description: "No se pudieron cargar los mensajes para este tema.", variant: "destructive" });
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleAccordionChange = (value: string | undefined) => {
    const newActiveTopicId = value || null;
    setActiveTopicId(newActiveTopicId);
    setReplyingToTopicId(null);
    setReplyContent('');
    if (newActiveTopicId && !topics.find(t => t.id === newActiveTopicId)?.posts) {
        fetchPostsForTopic(newActiveTopicId);
    }
  };
  
  const handleReplySubmit = async (topicId: string) => {
    if (!currentUser) {
      toast({ title: "Acción requerida", description: "Debes iniciar sesión para responder.", variant: "default" });
      return;
    }
    if (!replyContent.trim()) {
      toast({ title: "Error", description: "La respuesta no puede estar vacía.", variant: "destructive" });
      return;
    }
    
    setIsSubmittingReply(true);
    try {
      const postsCollectionRef = collection(db, "forumPosts");
      const newPost = {
        topicId,
        userId: currentUser.uid,
        content: replyContent,
        timestamp: serverTimestamp(),
        likes: 0,
      };
      await addDoc(postsCollectionRef, newPost);
      
      const topicRef = doc(db, "forumTopics", topicId);
      await updateDoc(topicRef, {
        postCount: increment(1),
        lastActivity: serverTimestamp(),
      });
      
      toast({ title: "Respuesta enviada", description: "Tu mensaje ha sido añadido al tema.", variant: "default" });
      setReplyContent("");
      setReplyingToTopicId(null);
      await fetchPostsForTopic(topicId); // Refresh posts for the topic
      // Also update lastActivity in the main topics list locally for immediate feedback
      setTopics(prev => prev.map(t => t.id === topicId ? {...t, lastActivity: new Date()} : t))

    } catch (error) {
       console.error("Error submitting reply:", error);
       toast({ title: t('common.error'), description: "No se pudo enviar tu respuesta.", variant: "destructive" });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PostItem = ({ post }: { post: ForumPost }) => {
    const user = userProfiles[post.userId];
    return (
      <div className="flex items-start space-x-3 py-3">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={user?.photoURL || `https://placehold.co/40x40.png`} alt={user?.displayName || 'Avatar'} data-ai-hint="person avatar" />
          <AvatarFallback>{user?.displayName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{user?.displayName || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground">{formatFirestoreTimestamp(post.timestamp)}</p>
          </div>
          <p className="text-sm text-foreground/90 mt-1 whitespace-pre-line">{post.content}</p>
          <div className="mt-2 flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
              <ThumbsUp className="h-3.5 w-3.5 mr-1" /> {post.likes} {t('communityPage.likes', { count: post.likes})}
            </Button>
            {/* Reply to specific post is a future enhancement */}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <>
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full shadow-xl bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl md:text-4xl flex items-center gap-3 text-primary">
            <Users className="h-8 w-8" />
            {t('communityPage.title')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('communityPage.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-2">
            <Input
              type="search"
              placeholder={t('communityPage.searchPlaceholder')}
              className="flex-grow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Search className="h-5 w-5 mr-2" /> {t('communityPage.searchButton')}
            </Button>
            <Button onClick={handleOpenNewTopicDialog} className="bg-primary hover:bg-primary/90">
              <MessageSquare className="h-5 w-5 mr-2" /> {t('communityPage.newTopicButton')}
            </Button>
          </div>
          
          <AdSenseUnit adSlot="YOUR_AD_SLOT_ID_FOR_COMMUNITY" className="mb-6" />

          {isLoadingTopics ? (
            <div className="text-center py-10 text-muted-foreground flex items-center justify-center">
                <Loader2 className="h-8 w-8 mr-2 animate-spin" />
                <p>Cargando temas de la comunidad...</p>
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">{searchTerm ? t('communityPage.noTopicsFoundFor', { searchTerm: searchTerm }) : "Aún no hay temas en la comunidad."}</p>
              <p>{searchTerm ? t('communityPage.tryOtherKeywords') : "¡Sé el primero en crear uno!"}</p>
            </div>
          ) : (
            <Accordion
              type="single"
              collapsible
              className="w-full space-y-3"
              value={activeTopicId ?? undefined}
              onValueChange={handleAccordionChange}
            >
              {filteredTopics.map((topic) => {
                 const author = userProfiles[topic.authorId];
                 return (
                    <AccordionItem value={topic.id} key={topic.id} className="border bg-background/50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <AccordionTrigger className="p-4 text-left hover:no-underline">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-primary group-hover:text-primary/80">{topic.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {topic.postCount} mensajes</span>
                            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {topic.views} vistas</span>
                            <span className="flex items-center gap-1"><Avatar className="h-4 w-4"><AvatarImage src={author?.photoURL || ''} /><AvatarFallback className="text-xs">{author?.displayName?.substring(0,1) || '?'}</AvatarFallback></Avatar> {author?.displayName || 'Anónimo'}</span>
                            <span>Última actividad: {formatFirestoreTimestamp(topic.lastActivity)}</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-0 border-t">
                        {isLoadingPosts && activeTopicId === topic.id ? (
                            <div className="flex items-center justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Cargando mensajes...</div>
                        ) : (
                          <>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                {topic.posts?.map((post) => <PostItem key={post.id} post={post} />)}
                            </div>
                            
                            {replyingToTopicId === topic.id ? (
                              <div className="mt-4 space-y-2">
                                <Textarea 
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder="Escribe tu respuesta aquí..."
                                  rows={4}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" onClick={() => setReplyingToTopicId(null)}>Cancelar</Button>
                                  <Button onClick={() => handleReplySubmit(topic.id)} disabled={isSubmittingReply}>
                                    {isSubmittingReply ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                                     <span className="ml-2">Enviar Respuesta</span>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button className="mt-4 w-full bg-primary hover:bg-primary/90" onClick={() => {
                                 if (!currentUser) {
                                     toast({ title: "Acción requerida", description: "Debes iniciar sesión para responder.", variant: "default" });
                                     return;
                                 }
                                 setReplyingToTopicId(topic.id)
                              }}>
                                 <CornerDownRight className="h-4 w-4 mr-2" /> {t('communityPage.replyInTopicButton')}
                              </Button>
                            )}
                          </>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                )})}
            </Accordion>
          )}
        </CardContent>
        <CardFooter className="pt-6">
            <p className="text-xs text-muted-foreground text-center w-full">
                {t('communityPage.footerDisclaimer')}
            </p>
        </CardFooter>
      </Card>
    </div>
    <NewTopicDialog 
        open={isNewTopicDialogOpen} 
        onOpenChange={setIsNewTopicDialogOpen}
        onTopicCreated={handleTopicCreated}
    />
    </>
  );
}

