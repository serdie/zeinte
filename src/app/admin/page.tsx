
"use client";

import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Loader2, Users, AlertTriangle, ArrowLeft, Settings, MessageSquare, Edit3, Trash2, Save, ArrowDownUp, ArrowDown, ArrowUp, Search, Mail, LineChart, Ticket, BarChartHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/firebase/config';
import { collection, getDocs, Timestamp, type DocumentData, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { UserTier, AppUserFirestoreData as AuthAppUser } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useAppMetrics } from '@/hooks/useAppMetrics';
import StatCard from '@/components/admin/StatCard';


// Update AppUser to correctly include fields from AuthAppUser
interface AppUser extends AuthAppUser {
  id: string; // document ID from Firestore snapshot
}

const formatFirebaseTimestamp = (timestamp: Timestamp | { seconds: number, nanoseconds: number } | undefined | null): string => {
  if (!timestamp) return 'N/A';
  
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp && typeof (timestamp as {seconds: number}).seconds === 'number') {
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
  const { t } = useI18n();
  const { metrics, loading: metricsLoading } = useAppMetrics();
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
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(20);

  const fetchUsers = async () => {
    if (!isAdmin || !isFirebaseConfigured || !db) {
      setIsLoadingUsers(false);
      if (isAdmin && (!isFirebaseConfigured || !db)) {
        setFetchError(t("adminPage.firebaseConfigErrorDescription"));
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
        ...docSnapshot.data()
      } as AppUser));
      setUsers(usersList);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission-denied'))) {
        setFetchError(t("adminPage.errorLoadingUsersPermissionDenied"));
      } else {
        setFetchError(t("adminPage.errorLoadingUsersDescription", {error: error.message}));
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin && isFirebaseConfigured && db) {
      fetchUsers();
    }
  }, [isAdmin, isFirebaseConfigured]);

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
          ? (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : ((a.createdAt as {seconds: number, nanoseconds: number}).seconds * 1000 + Math.floor(((a.createdAt as {seconds: number, nanoseconds: number}).nanoseconds || 0) / 1000000)))
          : 0;
        const timeB = b.createdAt
          ? (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : ((b.createdAt as {seconds: number, nanoseconds: number}).seconds * 1000 + Math.floor(((b.createdAt as {seconds: number, nanoseconds: number}).nanoseconds || 0) / 1000000)))
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
  
  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);
  
  useEffect(() => {
    // Reset to page 1 if filters change and current page becomes invalid
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredAndSortedUsers.length, totalPages, currentPage]);

  const paginatedUsers = useMemo(() => {
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    return filteredAndSortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  }, [filteredAndSortedUsers, currentPage, usersPerPage]);


  const toggleSortOrder = () => {
    setSortOrder(prevOrder => {
      if (prevOrder === 'desc') return 'asc';
      if (prevOrder === 'asc') return 'none';
      return 'desc';
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
      toast({ title: t("adminPage.userUpdatedToastTitle"), description: t("adminPage.userUpdatedToastDescription", { email: editingUser.email || 'N/A' }), variant: "default" });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers(); 
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({ title: t("adminPage.errorUpdatingUserToastTitle"), description: t("adminPage.errorUpdatingUserToastDescription", {error: error.message}), variant: "destructive" });
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
      toast({ title: t("adminPage.userDeletedToastTitle"), description: t("adminPage.userDeletedToastDescription", {email: userToDelete.email || 'N/A'}), variant: "default" });
      setUserToDelete(null); 
      fetchUsers(); 
    } catch (error: any) {
      console.error("Error deleting user from Firestore:", error);
      toast({ title: t("adminPage.errorDeletingUserToastTitle"), description: t("adminPage.errorDeletingUserToastDescription", {error: error.message}), variant: "destructive" });
    } finally {
      setIsDeletingUser(false);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-3 text-lg">{t("adminPage.loadingAdminPanel")}</span></div>;
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="container mx-auto py-8 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">{t("adminPage.accessDeniedTitle")}</h1>
        <p className="text-muted-foreground">{t("adminPage.accessDeniedDescription")}</p>
        <Link href="/dashboard" passHref className="mt-6 inline-block">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t("adminPage.backToDashboard")}</Button>
        </Link>
      </div>
    );
  }
  
  if (!isFirebaseConfigured || !db) {
      return (
        <div className="container mx-auto py-10 px-4">
            <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t("adminPage.firebaseConfigErrorTitle")}</AlertTitle>
                <AlertDescription>
                    {t("adminPage.firebaseConfigErrorDescription")}
                </AlertDescription>
            </Alert>
             <div className="text-center">
                <Link href="/dashboard" passHref>
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t("adminPage.backToDashboard")}</Button>
                </Link>
            </div>
        </div>
      )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <ShieldAlert className="h-8 w-8" /> {t("adminPage.adminPanelTitle")}
        </h1>
        <Link href="/dashboard" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t("adminPage.backToDashboard")}</Button>
        </Link>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
              title={t('adminPage.keyMetricsTotalUsers')} 
              value={metrics.totalUsers.toString()} 
              icon={Users}
              isLoading={metricsLoading}
              description={t('adminPage.keyMetricsTotalUsersDesc')}
          />
          <StatCard 
              title={t('adminPage.keyMetricsActive24h')} 
              value={"N/D"} // Placeholder
              icon={LineChart}
              isLoading={metricsLoading}
              description={t('adminPage.keyMetricsActive24hDesc')}
          />
          <StatCard 
              title={t('adminPage.keyMetricsProUsers')} 
              value={"N/D"} // Placeholder
              icon={Users}
              isLoading={metricsLoading}
              description={t('adminPage.keyMetricsProUsersDesc')}
          />
           <StatCard 
              title={t('adminPage.keyMetricsTotalAnalyses')} 
              value={"N/D"} // Placeholder
              icon={BarChartHorizontal}
              isLoading={metricsLoading}
              description={t('adminPage.keyMetricsTotalAnalysesDesc')}
          />
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="user-management">
          <Card className="w-full shadow-xl bg-card border-none">
             <AccordionTrigger className="w-full hover:no-underline">
                <CardHeader className="flex-1 p-4">
                    <CardTitle className="text-2xl flex items-center justify-between">
                        <div className="flex items-center">
                            <Users className="h-6 w-6 mr-2" />
                            {t("adminPage.userManagementTitle")}
                        </div>
                        <span className="text-sm font-normal text-muted-foreground mr-4">{t("adminPage.totalUsers", { count: users.length.toString() })}</span>
                    </CardTitle>
                    <CardDescription className="text-left">
                        {t("adminPage.welcomeMessage", { email: currentUser.email || 'Admin' })}
                    </CardDescription>
                </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-0 p-4">
                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative flex-grow w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={t("adminPage.searchUserPlaceholder")}
                      value={searchTerm}
                      onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                      className="pl-10 w-full text-sm"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={toggleSortOrder} variant="outline" className="flex-1 sm:flex-none">
                      {getSortIcon()}
                      <span className="ml-2">
                        {t("adminPage.sortDateLabel", { order: sortOrder === 'desc' ? t("adminPage.sortDateNewest") : sortOrder === 'asc' ? t("adminPage.sortDateOldest") : t("adminPage.sortDateNone") })}
                      </span>
                    </Button>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="users-per-page" className="text-sm shrink-0">{t('adminPage.usersPerPageLabel')}</Label>
                      <Select value={usersPerPage.toString()} onValueChange={(value) => {setUsersPerPage(Number(value)); setCurrentPage(1);}}>
                        <SelectTrigger id="users-per-page" className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /> {t("adminPage.loadingUsers")}
                  </div>
                ) : fetchError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t("adminPage.errorLoadingUsersTitle")}</AlertTitle>
                    <AlertDescription>{fetchError}</AlertDescription>
                  </Alert>
                ) : paginatedUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    {users.length === 0 ? t("adminPage.noUsersRegistered") : t("adminPage.noUsersMatchSearch")}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>UID</TableHead>
                          <TableHead>{t("adminPage.userTableEmailHeader")}</TableHead>
                          <TableHead>{t("adminPage.userTableDisplayNameHeader")}</TableHead>
                          <TableHead>{t("adminPage.userTableProviderHeader")}</TableHead>
                          <TableHead>{t("adminPage.userTableTierHeader")}</TableHead>
                          <TableHead>{t("adminPage.userTableCreationDateHeader")}</TableHead>
                          <TableHead>{t("adminPage.userTablePrimaryInterestHeader")}</TableHead>
                          <TableHead>{t("adminPage.userTableSecondaryInterestsHeader")}</TableHead>
                          <TableHead className="text-right">{t("adminPage.userTableActionsHeader")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedUsers.map((user) => (
                          <TableRow key={user.uid}>
                            <TableCell className="font-mono text-xs truncate max-w-[100px]" title={user.uid}>{user.uid}</TableCell>
                            <TableCell className="font-medium">{user.email || t("adminPage.notAvailable")}</TableCell>
                            <TableCell>{user.displayName || t("adminPage.notAvailable")}</TableCell>
                            <TableCell>{user.providerData && user.providerData.length > 0 ? user.providerData[0].providerId : user.provider || t("adminPage.notAvailable")}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                user.tier === 'admin' ? 'bg-red-500 text-white' :
                                user.tier === 'pro' ? 'bg-green-500 text-white' :
                                user.tier === 'free' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
                              }`}>
                                {user.tier || t("adminPage.notAvailable")}
                              </span>
                            </TableCell>
                            <TableCell>{formatFirebaseTimestamp(user.createdAt)}</TableCell>
                            <TableCell>{user.primaryInterest || t("adminPage.notSet")}</TableCell>
                            <TableCell>
                              {user.secondaryInterests && user.secondaryInterests.length > 0
                                ? user.secondaryInterests.join(', ')
                                : t("adminPage.noneSet")}
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(user)} title={t("adminPage.editUserButtonTooltip")}>
                                  <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => setUserToDelete(user)} title={t("adminPage.deleteUserButtonTooltip")}>
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
              <CardFooter className="flex items-center justify-between pt-4 p-4">
                   <Alert variant="destructive" className="flex-1 text-xs mr-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {t("adminPage.deleteUserDisclaimerDescription")}
                      </AlertDescription>
                    </Alert>
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                          {t('adminPage.prevButton')}
                      </Button>
                      <Button variant="outline" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>
                          {t('adminPage.nextButton')}
                      </Button>
                  </div>
              </CardFooter>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>

      {editingUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">{t("adminPage.editUserDialogTitle", {email: editingUser.email || 'N/A'})}</DialogTitle>
              <DialogDescription>
                {t("adminPage.editUserDialogDescription")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveUserChanges} className="space-y-4 py-4">
              <div>
                <Label htmlFor="displayName">{t("adminPage.displayNameLabel")}</Label>
                <Input 
                  id="displayName" 
                  value={editedDisplayName} 
                  onChange={(e) => setEditedDisplayName(e.target.value)} 
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="tier">{t("adminPage.tierLabel")}</Label>
                <Select value={editedTier} onValueChange={(value) => setEditedTier(value as UserTier)}>
                  <SelectTrigger id="tier" className="mt-1">
                    <SelectValue placeholder={t("adminPage.selectTierPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">{t("adminPage.tierFree")}</SelectItem>
                    <SelectItem value="pro">{t("adminPage.tierPro")}</SelectItem>
                    <SelectItem value="admin">{t("adminPage.tierAdmin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button type="button" variant="outline">{t("common.cancel")}</Button>
                </DialogClose>
                <Button type="submit" disabled={isSavingUser}>
                  {isSavingUser ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  {t("adminPage.saveUserChangesButton")}
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
                <AlertDialogTitle>{t("adminPage.deleteUserDialogTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  <span dangerouslySetInnerHTML={{ __html: t("adminPage.deleteUserDialogDescription", {email: userToDelete.email || 'N/A'}) }} />
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isDeletingUser}>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} disabled={isDeletingUser} className="bg-destructive hover:bg-destructive/90">
                    {isDeletingUser ? <Loader2 className="animate-spin mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    {t("adminPage.confirmDeleteUserButton")}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="mt-10 space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b pb-2">{t("adminPage.otherCMSTitle")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                {t("adminPage.appGeneralConfigTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("adminPage.appGeneralConfigDescription")}</p>
               <Link href="/admin/app-settings" passHref>
                 <Button variant="outline" size="sm" className="mt-3">{t("adminPage.goToConfigButton")}</Button>
               </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                {t("adminPage.communityContentManagementTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("adminPage.communityContentManagementDescription")}</p>
              <Link href="/admin/community-management" passHref>
                 <Button variant="outline" size="sm" className="mt-3">{t("adminPage.goToCommunityManagementButton")}</Button>
              </Link>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                {t("adminPage.emailTemplatesTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("adminPage.emailTemplatesDescription")}</p>
              <Link href="/admin/email-templates" passHref>
                 <Button variant="outline" size="sm" className="mt-3">{t("adminPage.goToEmailTemplatesButton")}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      
       <div className="mt-10 space-y-6">
          <h2 className="text-2xl font-semibold text-foreground border-b pb-2">{t("adminPage.additionalModulesTitle")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                      <LineChart className="h-5 w-5 mr-2 text-primary" />
                      {t('adminPage.analyticsModuleTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{t('adminPage.analyticsModuleDescription')}</p>
                    <Button variant="outline" size="sm" className="mt-3" disabled>
                        {t('common.soon')}
                    </Button>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">{t('adminPage.analyticsModuleFooter')}</p>
                </CardFooter>
            </Card>
             <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                      <Ticket className="h-5 w-5 mr-2 text-primary" />
                      {t('adminPage.discountsModuleTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{t('adminPage.discountsModuleDescription')}</p>
                    <Button variant="outline" size="sm" className="mt-3" disabled>
                       {t('adminPage.generateDiscountButton')}
                    </Button>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">{t('adminPage.discountsModuleFooter')}</p>
                </CardFooter>
            </Card>
          </div>
       </div>

    </div>
  );
}
