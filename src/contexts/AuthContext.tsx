// src/contexts/AuthContext.tsx
"use client";

import type React from 'react';
import { createContext, useContext, useEffect, useState, useMemo }
from 'react';
import {
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendEmailVerification,
  type AuthError,
  type Auth
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, type Firestore, getDoc, updateDoc, type DocumentData, FieldValue } from 'firebase/firestore';
import { auth as firebaseAuthService, googleProvider as firebaseGoogleProvider, db as firestoreDbService, isFirebaseFullyConfigured, app as firebaseAppInstance } from '@/firebase/config';
import { useI18n } from './I18nContext';

export const ADMIN_EMAIL = "serdiegm@gmail.com";
export const FREE_USER_EMAIL = "dginteligenciaartificial@gmail.com";

export type UserTier = 'admin' | 'pro' | 'free' | null;

interface AppUserFirestoreData extends DocumentData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  providerData?: Array<{ providerId: string; uid: string }>;
  tier?: UserTier;
  createdAt?: any;
  lastLogin?: any;
  preferences?: string[];
  emailVerified?: boolean;
}


interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  isAdmin: boolean;
  userTier: UserTier;
  signUpWithEmail: (email: string, password: string) => Promise<User | string>;
  loginWithEmail: (email: string, password: string) => Promise<User | string>;
  signInWithGoogle: () => Promise<User | string>;
  logout: () => Promise<void | string>;
  resendVerificationEmail: () => Promise<string | void>;
  isResendingEmail: boolean; // Estado para el botón de reenvío
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userTier, setUserTier] = useState<UserTier>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false); // Estado para el botón de reenvío

  const { t } = useI18n();

  const auth: Auth | undefined = useMemo(() => firebaseAuthService, []);
  const googleProvider = useMemo(() => firebaseGoogleProvider, []);
  const firestoreDb: Firestore | undefined = useMemo(() => firestoreDbService, []);
  const firebaseConfigStatus: boolean = useMemo(() => isFirebaseFullyConfigured, []);
  const [initialConfigWarningShown, setInitialConfigWarningShown] = useState(false);


  useEffect(() => {
    if (!firebaseConfigStatus) {
      if (typeof window !== 'undefined' && !initialConfigWarningShown && process.env.NODE_ENV === 'development') {
        setInitialConfigWarningShown(true);
      }
      setLoading(false);
      setCurrentUser(null);
      setIsAdmin(false);
      setUserTier(null);
      return;
    }

    if (!auth || !firestoreDb) {
        if (typeof window !== 'undefined' && !initialConfigWarningShown && process.env.NODE_ENV === 'development') {
            setInitialConfigWarningShown(true);
        }
        setLoading(false);
        setCurrentUser(null);
        setIsAdmin(false);
        setUserTier(null);
        return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true); // Iniciar carga al cambiar estado de auth
      if (user && firestoreDb) {
        const userDocRef = doc(firestoreDb, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let determinedTier: UserTier = 'free';
        let specialDisplayName: string | undefined = undefined;
        const userEmailLower = user.email?.toLowerCase();

        if (userEmailLower === ADMIN_EMAIL.toLowerCase()) {
            determinedTier = 'admin';
        } else if (userEmailLower === FREE_USER_EMAIL.toLowerCase()) {
            determinedTier = 'pro'; // dginteligenciaartificial es PRO
            specialDisplayName = 'dginteligenciaartificial';
        } else {
            if (userDocSnap.exists() && userDocSnap.data()?.tier) {
                determinedTier = userDocSnap.data()?.tier as UserTier;
            } else {
                determinedTier = 'free'; // Default para nuevos usuarios o sin tier definido
            }
        }
        
        await saveUserToFirestore(user, determinedTier, specialDisplayName, user.emailVerified);
        
        setIsAdmin(determinedTier === 'admin');
        setUserTier(determinedTier);
        setCurrentUser(user);
      } else {
        setIsAdmin(false);
        setUserTier(null);
        setCurrentUser(null);
      }
      setLoading(false); // Finalizar carga
    }, (error) => {
      console.error(t("authContext.authContextErrorListener"), error);
      setLoading(false);
      setCurrentUser(null);
      setIsAdmin(false);
      setUserTier(null);
    });

    return () => unsubscribe();
  }, [firebaseConfigStatus, auth, firestoreDb, t]);


  const handleAuthError = (error: AuthError): string => {
    console.error("Firebase Auth Error Code:", error.code, "Message:", error.message);
    if (!firebaseConfigStatus || !auth || !firestoreDb || error.code === 'auth/invalid-api-key' || error.code === 'auth/internal-error' ||  error.code === 'auth/missing-config' || error.code === 'auth/network-request-failed' || (error.message && (error.message.toLowerCase().includes("api key not valid") || error.message.toLowerCase().includes("network error")) )) {
        return t("authContext.firebaseGeneralConfigError");
    }
    switch (error.code) {
      case 'auth/configuration-not-found':
        return t("authContext.authConfigNotFoundGoogle");
      case 'auth/unauthorized-domain':
        return t("authContext.unauthorizedDomainError");
      case 'auth/operation-not-allowed':
        return t("authContext.operationNotAllowedError");
      case 'auth/email-already-in-use':
        return t("authContext.emailInUseError");
      case 'auth/invalid-email':
        return t("authContext.invalidEmailError");
      case 'auth/weak-password':
        return t("authContext.weakPasswordError");
      case 'auth/user-disabled':
        return t("authContext.userDisabledError");
      case 'auth/user-not-found':
      case 'auth/invalid-credential': 
        return t("authContext.userNotFoundError");
      case 'auth/wrong-password':
        return t("authContext.wrongPasswordError");
      case 'auth/popup-closed-by-user':
        return t("authContext.popupClosedByUserError");
      case 'auth/cancelled-popup-request':
      case 'auth/popup-blocked':
        return t("authContext.popupBlockedError");
      case 'auth/account-exists-with-different-credential':
        return t("authContext.accountExistsWithDifferentCredentialError");
      case 'auth/too-many-requests':
        return t("authContext.tooManyRequestsError");
      default:
        return t("authContext.unexpectedError", { errorCode: error.code });
    }
  };

  const saveUserToFirestore = async (user: User, tierToSave: UserTier, forcedDisplayName?: string, emailVerifiedParam?: boolean) => {
    if (!firestoreDb) {
        console.warn(t("authContext.firestoreUnavailableSaveUser"));
        return;
    }
    const userRef = doc(firestoreDb, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let displayName = forcedDisplayName;
    if (user.email?.toLowerCase() === FREE_USER_EMAIL.toLowerCase() && tierToSave === 'pro') {
        displayName = 'dginteligenciaartificial';
    } else if (!displayName) { // Solo asignar displayName de Firebase si no hay uno forzado o específico del email
        displayName = user.displayName ||
                      (userSnap.exists() && userSnap.data()?.displayName) ||
                      user.email?.split('@')[0] ||
                      'Usuario';
    }
    
    const effectiveEmailVerified = emailVerifiedParam === undefined ? user.emailVerified : emailVerifiedParam;

    const userDataToSet: Partial<AppUserFirestoreData> = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: user.photoURL,
        providerData: user.providerData.map(p => ({ providerId: p.providerId, uid: p.uid })),
        tier: tierToSave,
        lastLogin: serverTimestamp(),
        emailVerified: effectiveEmailVerified,
    };

    try {
      if (!userSnap.exists()) {
          await setDoc(userRef, {
              ...userDataToSet,
              createdAt: serverTimestamp(),
              preferences: [],
              emailVerified: effectiveEmailVerified, // Asegurar para nuevos usuarios
          });
      } else {
          await setDoc(userRef, userDataToSet, { merge: true });
      }
    } catch (error) {
        console.error(t("authContext.errorSavingUserToFirestore"), error);
    }
  };


  const signUpWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth || !firestoreDb) {
        console.error("signUpWithEmail: Firebase is not configured or services are not available.");
        return t("authContext.firebaseGeneralConfigError");
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        try {
          await sendEmailVerification(userCredential.user);
        } catch (verificationError: any) {
          console.error("Error attempting to send verification email immediately after signup:", verificationError);
          // No bloquear el flujo principal, pero es una advertencia.
        }
      }
      await saveUserToFirestore(userCredential.user, 'free', undefined, false);
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth || !firestoreDb) {
        console.error("loginWithEmail: Firebase is not configured or services not available.");
        return t("authContext.firebaseGeneralConfigError");
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth || !googleProvider || !firestoreDb) {
        console.error("signInWithGoogle: Firebase is not configured or necessary services are not available.");
        return t("authContext.firebaseGeneralConfigError");
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void | string> => {
    if (!firebaseConfigStatus || !auth) {
        const errorMsg = t("authContext.logoutAttemptFailedConfigOrAuth");
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.warn(errorMsg);
        setCurrentUser(null);
        setIsAdmin(false);
        setUserTier(null);
        setLoading(false);
        return t("authContext.firebaseGeneralConfigError");
    }

    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged se encargará de limpiar currentUser, isAdmin, userTier y setLoading a false
    } catch (error) {
      console.error(t("authContext.logoutErrorFirebase"), error);
      setLoading(false);
      return handleAuthError(error as AuthError);
    }
  };
  
  const resendVerificationEmail = async (): Promise<string | void> => {
    if (!currentUser) {
      return t("authContext.resendVerificationNotLoggedIn");
    }
    if (currentUser.emailVerified) {
      return t("authContext.resendVerificationAlreadyVerified");
    }
    if (currentUser.providerData.some(p => p.providerId === 'google.com')) {
      return t("authContext.resendVerificationGoogleUser");
    }
    setIsResendingEmail(true);
    try {
      await sendEmailVerification(currentUser);
      return t("authContext.resendVerificationSuccess", {email: currentUser.email || t("verifyEmailPage.yourEmail")});
    } catch (error) {
      if ((error as AuthError).code === 'auth/too-many-requests') {
        return t("authContext.tooManyRequestsResendEmailError");
      }
      return handleAuthError(error as AuthError);
    } finally {
      setIsResendingEmail(false);
    }
  };


  const value = {
    currentUser,
    loading,
    isFirebaseConfigured: firebaseConfigStatus,
    isAdmin,
    userTier,
    signUpWithEmail,
    loginWithEmail,
    signInWithGoogle,
    logout,
    resendVerificationEmail,
    isResendingEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { AppUserFirestoreData };
