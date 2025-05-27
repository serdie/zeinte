
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { mockForumTopics, type MockForumTopic, type MockPost, type MockUser } from '@/lib/mockCommunityData';
import { Users, MessageSquare, CornerDownRight, ThumbsUp, Eye, Search, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/contexts/I18nContext';

// Helper to get a user (can be expanded if users are stored separately)
const getMockUser = (userId: string): MockUser => {
  // For simplicity, embedding some users here or assuming they come with posts
  const users: Record<string, MockUser> = {
    "user1": { id: "user1", name: "Estudiante_Opositor", avatarUrl: "https://placehold.co/40x40.png" },
    "user2": { id: "user2", name: "Profe_Ayuda", avatarUrl: "https://placehold.co/40x40.png" },
    "user3": { id: "user3", name: "Ana_Selectividad", avatarUrl: "https://placehold.co/40x40.png" },
    "user4": { id: "user4", name: "Carlos_Forestal", avatarUrl: "https://placehold.co/40x40.png" },
    "user5": { id: "user5", name: "Laura_TestMaster", avatarUrl: "https://placehold.co/40x40.png" },
    "user6": { id: "user6", name: "David_Quimica", avatarUrl: "https://placehold.co/40x40.png" },
  };
  return users[userId] || { id: userId, name: "Usuario Anónimo" };
};

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const { t } = useI18n();

  const filteredTopics = mockForumTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PostItem = ({ post, user }: { post: MockPost; user: MockUser }) => (
    <div className="flex items-start space-x-3 py-3">
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person avatar" />
        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{post.timestamp}</p>
        </div>
        <p className="text-sm text-foreground/90 mt-1 whitespace-pre-line">{post.content}</p>
        <div className="mt-2 flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
            <ThumbsUp className="h-3.5 w-3.5 mr-1" /> {post.likes} {t('communityPage.likes', { count: post.likes})}
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
            <CornerDownRight className="h-3.5 w-3.5 mr-1" /> {t('communityPage.reply')}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full shadow-xl bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl flex items-center gap-3 text-primary">
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
            <Button className="bg-primary hover:bg-primary/90">
              <MessageSquare className="h-5 w-5 mr-2" /> {t('communityPage.newTopicButton')}
            </Button>
          </div>

          {/* AdSense Ad Unit Placeholder - Replace with your ad unit code */}
          <div style={{ width: '100%', minHeight: '90px', backgroundColor: '#f0f0f0', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0', padding: '10px', textAlign: 'center' }}>
            <span style={{ color: '#999', fontSize: '0.9rem' }}>{t("adsense.placeholderCommunity")}</span>
          </div>


          {filteredTopics.length === 0 && searchTerm && (
            <div className="text-center py-10 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">{t('communityPage.noTopicsFoundFor', { searchTerm: searchTerm })}</p>
              <p>{t('communityPage.tryOtherKeywords')}</p>
            </div>
          )}

          <Accordion
            type="single"
            collapsible
            className="w-full space-y-3"
            value={activeTopicId}
            onValueChange={setActiveTopicId}
          >
            {filteredTopics.map((topic) => (
              <AccordionItem value={topic.id} key={topic.id} className="border bg-background/50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <AccordionTrigger className="p-4 text-left hover:no-underline">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary group-hover:text-primary/80">{topic.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {topic.postCount} mensajes</span>
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {topic.views} vistas</span>
                      <span>Última actividad: {topic.lastActivity}</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 border-t">
                  <h4 className="text-md font-semibold mb-2 text-foreground">{t('communityPage.messagesInTopicTitle')}</h4>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {topic.posts.map((post) => {
                      const user = getMockUser(post.userId);
                      return <PostItem key={post.id} post={post} user={user} />;
                    })}
                  </div>
                  <Button className="mt-4 w-full bg-primary hover:bg-primary/90">
                     <CornerDownRight className="h-4 w-4 mr-2" /> {t('communityPage.replyInTopicButton')}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
        <CardFooter className="pt-6">
            <p className="text-xs text-muted-foreground text-center w-full">
                {t('communityPage.footerDisclaimer')}
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
