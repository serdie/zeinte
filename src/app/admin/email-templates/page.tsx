
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, ShieldAlert, ArrowLeft, Mail, Edit3, Trash2, Save, PlusCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { db } from '@/firebase/config';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  deleteDoc, 
  query, 
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { useI18n } from '@/contexts/I18nContext';

interface EmailTemplate {
  id: string; // The document ID, e.g., "welcome_email"
  subject: string;
  body: string;
  description: string;
  lastUpdated?: Timestamp;
}

export default function AdminEmailTemplatesPage() {
  const { currentUser, isAdmin, loading: authLoading, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [description, setDescription] = useState('');


  const fetchTemplates = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const templatesCollectionRef = collection(db, "emailTemplates");
      const q = query(templatesCollectionRef, orderBy("id"));
      const querySnapshot = await getDocs(q);
      const templatesList = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as EmailTemplate));
      setTemplates(templatesList);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      toast({ title: t('common.error'), description: t('adminEmailTemplatesPage.errorLoadingTemplates'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured && isAdmin && db) {
      fetchTemplates();
    }
  }, [isFirebaseConfigured, isAdmin]);


  const handleOpenDialog = (template: Partial<EmailTemplate> | null = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateId(template.id || '');
      setSubject(template.subject || '');
      setBody(template.body || '');
      setDescription(template.description || '');
    } else {
      setEditingTemplate(null);
      setTemplateId('');
      setSubject('');
      setBody('');
      setDescription('');
    }
    setIsDialogOpen(true);
  };
  
  const handleSaveTemplate = async (event: FormEvent) => {
    event.preventDefault();
    if (!db) return;

    if (!templateId.trim() || !subject.trim() || !body.trim() || !description.trim()) {
      toast({ title: t('common.error'), description: t('adminEmailTemplatesPage.allFieldsRequired'), variant: "destructive" });
      return;
    }
    
    // Basic validation for template ID
    if (!/^[a-z0-9_]+$/.test(templateId)) {
        toast({ title: t('common.error'), description: t('adminEmailTemplatesPage.invalidTemplateId'), variant: "destructive" });
        return;
    }

    setIsSaving(true);
    try {
      const templateRef = doc(db, "emailTemplates", templateId);
      const dataToSave = {
        id: templateId,
        subject,
        body,
        description,
        lastUpdated: serverTimestamp()
      };
      await setDoc(templateRef, dataToSave, { merge: true });
      
      toast({ title: t('common.success'), description: t('adminEmailTemplatesPage.templateSavedSuccess'), variant: "default" });
      setIsDialogOpen(false);
      fetchTemplates(); // Refresh the list
    } catch (error) {
      console.error("Error saving template:", error);
      toast({ title: t('common.error'), description: t('adminEmailTemplatesPage.errorSavingTemplate'), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete || !db) return;
    
    try {
        const templateRef = doc(db, "emailTemplates", templateToDelete.id);
        await deleteDoc(templateRef);
        toast({ title: t('common.success'), description: t('adminEmailTemplatesPage.templateDeletedSuccess'), variant: "destructive" });
        fetchTemplates();
    } catch (error) {
        console.error("Error deleting template:", error);
        toast({ title: t('common.error'), description: t('adminEmailTemplatesPage.errorDeletingTemplate'), variant: "destructive" });
    } finally {
        setTemplateToDelete(null);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-3 text-lg">{t('common.loading')}</span></div>;
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="container mx-auto py-8 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">{t('adminPage.accessDeniedTitle')}</h1>
        <p className="text-muted-foreground">{t('adminPage.accessDeniedDescription')}</p>
        <Link href="/dashboard" passHref className="mt-6 inline-block">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t('adminPage.backToDashboard')}</Button>
        </Link>
      </div>
    );
  }

  if (!isFirebaseConfigured || !db) {
    return (
        <div className="container mx-auto py-10 px-4">
            <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('adminPage.firebaseConfigErrorTitle')}</AlertTitle>
                <AlertDescription>
                    {t('adminPage.firebaseConfigErrorDescription')}
                </AlertDescription>
            </Alert>
             <div className="text-center">
                <Link href="/admin" passHref>
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t('adminPage.backToAdminPanel')}</Button>
                </Link>
            </div>
        </div>
      )
  }

  return (
    <>
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Mail className="h-8 w-8" /> {t('adminEmailTemplatesPage.title')}
        </h1>
        <Link href="/admin" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t('adminPage.backToAdminPanel')}</Button>
        </Link>
      </div>
      
      <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">{t('adminEmailTemplatesPage.templatesListTitle')}</CardTitle>
              <CardDescription>
                {t('adminEmailTemplatesPage.templatesListDescription')}
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('adminEmailTemplatesPage.newTemplateButton')}
            </Button>
        </CardHeader>
        <CardContent>
             <Alert variant="default" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('adminEmailTemplatesPage.importantNoteTitle')}</AlertTitle>
                <AlertDescription>
                 {t('adminEmailTemplatesPage.importantNoteDescription')}
                </AlertDescription>
            </Alert>
          {isLoading ? (
             <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /> {t('adminEmailTemplatesPage.loadingTemplates')}
            </div>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t('adminEmailTemplatesPage.noTemplatesFound')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('adminEmailTemplatesPage.tableHeaderId')}</TableHead>
                    <TableHead>{t('adminEmailTemplatesPage.tableHeaderSubject')}</TableHead>
                    <TableHead>{t('adminEmailTemplatesPage.tableHeaderDescription')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-mono text-xs">{template.id}</TableCell>
                      <TableCell className="font-medium max-w-xs truncate" title={template.subject}>{template.subject}</TableCell>
                      <TableCell className="text-muted-foreground max-w-sm truncate" title={template.description}>{template.description}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(template)} title={t('common.edit')}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setTemplateToDelete(template)} title={t('common.delete')}>
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
         <CardFooter>
            <p className="text-xs text-muted-foreground">
                {t('adminEmailTemplatesPage.placeholdersInfo')}
            </p>
        </CardFooter>
      </Card>
    </div>
    
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>{editingTemplate ? t('adminEmailTemplatesPage.editTemplateTitle') : t('adminEmailTemplatesPage.createTemplateTitle')}</DialogTitle>
                <DialogDescription>
                    {t('adminEmailTemplatesPage.dialogDescription')}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveTemplate} className="space-y-4 py-4">
                <div className="space-y-1">
                    <Label htmlFor="templateId">{t('adminEmailTemplatesPage.templateIdLabel')}</Label>
                    <Input id="templateId" value={templateId} onChange={(e) => setTemplateId(e.target.value)} placeholder="e.g. welcome_email" required disabled={!!editingTemplate} />
                    <p className="text-xs text-muted-foreground">{t('adminEmailTemplatesPage.templateIdDescription')}</p>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="description">{t('common.description')}</Label>
                    <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('adminEmailTemplatesPage.descriptionPlaceholder')} required />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="subject">{t('adminEmailTemplatesPage.subjectLabel')}</Label>
                    <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('adminEmailTemplatesPage.subjectPlaceholder')} required />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="body">{t('adminEmailTemplatesPage.bodyLabel')}</Label>
                    <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('adminEmailTemplatesPage.bodyPlaceholder')} required rows={10} />
                     <p className="text-xs text-muted-foreground">{t('adminEmailTemplatesPage.placeholdersInfo')}</p>
                </div>
                <DialogFooter className="pt-4">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">{t('common.cancel')}</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {t('common.save')}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>

    <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('adminEmailTemplatesPage.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                     {t('adminEmailTemplatesPage.deleteConfirmDescription', { templateId: templateToDelete?.id || '' })}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteTemplate} className="bg-destructive hover:bg-destructive/90">
                    <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
