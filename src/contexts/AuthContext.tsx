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
  sendEmailVerification, // Importar sendEmailVerification
  type AuthError
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, type Firestore, getDoc, updateDoc, type DocumentData } from 'firebase/firestore';
import { auth as firebaseAuthService, googleProvider as firebaseGoogleProvider, db as firestoreDbService, isFirebaseFullyConfigured, app as firebaseAppInstance } from '@/firebase/config';
import { useI18n } from './I18nContext';

export const ADMIN_EMAIL = "serdiegm@gmail.com";
export const FREE_USER_EMAIL = "dginteligenciaartificial@gmail.com";
// export const PRO_USER_EMAIL = "prueba@prueba.com"; // Comentado según solicitud anterior

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
  emailVerified?: boolean; // Añadido para Firestore
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
  resendVerificationEmail: () => Promise<string | void>; // Nueva función
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userTier, setUserTier] = useState<UserTier>(null);
  const { t } = useI18n();

  const auth = useMemo(() => firebaseAuthService, []);
  const googleProvider = useMemo(() => firebaseGoogleProvider, []);
  const firestoreDb = useMemo(() => firestoreDbService, []);
  const firebaseConfigStatus = useMemo(() => isFirebaseFullyConfigured, []);
  const [initialConfigWarningShown, setInitialConfigWarningShown] = useState(false);

  useEffect(() => {
    if (!firebaseConfigStatus) {
      if (typeof window !== 'undefined' && !initialConfigWarningShown && process.env.NODE_ENV === 'development') {
        // El mensaje principal de error ya se muestra desde config.ts, esto es solo un refuerzo si es necesario.
        // console.warn(t("authContext.firebaseServicesUnavailable"));
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
            // console.error(t("authContext.firebaseAuthOrDbError"));
            setInitialConfigWarningShown(true);
        }
        setLoading(false);
        setCurrentUser(null);
        setIsAdmin(false);
        setUserTier(null);
        return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user && firestoreDb) {
        const userDocRef = doc(firestoreDb, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let determinedTier: UserTier = 'free'; // Por defecto para nuevos usuarios
        let specialDisplayName: string | undefined = undefined;
        const userEmailLower = user.email?.toLowerCase();

        if (userEmailLower === ADMIN_EMAIL.toLowerCase()) {
            determinedTier = 'admin';
        } else if (userEmailLower === FREE_USER_EMAIL.toLowerCase()) {
            determinedTier = 'pro'; // dginteligenciaartificial es PRO
            specialDisplayName = 'dginteligenciaartificial';
        } else {
            // Para otros usuarios, respetar el tier de Firestore si existe, sino 'free'
            if (userDocSnap.exists() && userDocSnap.data()?.tier) {
                determinedTier = userDocSnap.data()?.tier as UserTier;
            } else {
                determinedTier = 'free'; // Default para nuevos usuarios o sin tier definido
            }
        }

        // Guardar/actualizar en Firestore, incluyendo emailVerified
        await saveUserToFirestore(user, determinedTier, specialDisplayName, user.emailVerified);
        
        setIsAdmin(determinedTier === 'admin');
        setUserTier(determinedTier);
        setCurrentUser(user); // user object from onAuthStateChanged already has emailVerified
      } else {
        setIsAdmin(false);
        setUserTier(null);
        setCurrentUser(null);
      }
      setLoading(false);
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
      case 'auth/invalid-credential': // Tratar igual que user-not-found
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

  const saveUserToFirestore = async (user: User, tierToSave: UserTier, forcedDisplayName?: string, emailVerified?: boolean) => {
    if (!firestoreDb) {
        console.warn(t("authContext.firestoreUnavailableSaveUser"));
        return;
    }
    const userRef = doc(firestoreDb, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let displayName = forcedDisplayName;
    if (user.email?.toLowerCase() === FREE_USER_EMAIL.toLowerCase() && tierToSave === 'pro') {
        displayName = 'dginteligenciaartificial';
    } else if (!displayName) {
        displayName = user.displayName ||
                      (userSnap.exists() && userSnap.data()?.displayName) ||
                      user.email?.split('@')[0] ||
                      'Usuario';
    }
    
    const userDataToSet: Partial<AppUserFirestoreData> = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: user.photoURL,
        providerData: user.providerData.map(p => ({ providerId: p.providerId, uid: p.uid })),
        tier: tierToSave,
        lastLogin: serverTimestamp(),
        emailVerified: emailVerified === undefined ? (userSnap.exists() ? userSnap.data()?.emailVerified : false) : emailVerified, // Guardar emailVerified
    };

    try {
      if (!userSnap.exists()) {
          await setDoc(userRef, {
              ...userDataToSet,
              createdAt: serverTimestamp(),
              preferences: [], // Inicializar preferencias para nuevos usuarios
              emailVerified: emailVerified === undefined ? false : emailVerified, // Asegurar que se guarde para nuevos usuarios
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
      // Enviar correo de verificación
      await sendEmailVerification(userCredential.user);
      // Guardar en Firestore con emailVerified: false
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
      // No es necesario llamar a saveUserToFirestore aquí, onAuthStateChanged lo manejará
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
      // onAuthStateChanged se encargará de llamar a saveUserToFirestore con el tier correcto y emailVerified
      return result.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void | string> => {
    if (!firebaseConfigStatus) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.warn(t("authContext.logoutAttemptFailedConfig"));
        setCurrentUser(null);
        setIsAdmin(false);
        setUserTier(null);
        setLoading(false);
        return t("authContext.firebaseGeneralConfigError");
    }
    if (!auth) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.warn(t("authContext.logoutAttemptFailedAuth"));
        setCurrentUser(null);
        setIsAdmin(false);
        setUserTier(null);
        setLoading(false);
        return t("authContext.firebaseAuthServiceUnavailable");
    }

    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged se encargará de limpiar currentUser, isAdmin, userTier
    } catch (error) {
      console.error(t("authContext.logoutErrorFirebase"), error);
      setLoading(false); // Asegurarse de que loading se ponga a false
      return handleAuthError(error as AuthError);
    }
    // setLoading(false) se maneja por onAuthStateChanged
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
    try {
      await sendEmailVerification(currentUser);
      return t("authContext.resendVerificationSuccess");
    } catch (error) {
      return handleAuthError(error as AuthError);
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

