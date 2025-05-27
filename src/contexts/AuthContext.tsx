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
  type Auth,
  type ActionCodeSettings,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, type Firestore, getDoc, updateDoc, type DocumentData, FieldValue, increment } from 'firebase/firestore';
import { auth as firebaseAuthService, googleProvider as firebaseGoogleProvider, db as firestoreDbService, isFirebaseFullyConfigured, app as firebaseAppInstance } from '@/firebase/config';
import { useI18n } from './I18nContext';

export const ADMIN_EMAIL = "serdiegm@gmail.com";
export const FREE_USER_EMAIL = "dginteligenciaartificial@gmail.com";

// Mensaje de error de configuración general de Firebase
const FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE_KEY = "authContext.firebaseGeneralConfigError";


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
  isFirebaseConfigured: boolean; // Renamed from firebaseConfigStatus
  isAdmin: boolean;
  userTier: UserTier;
  signUpWithEmail: (email: string, password: string) => Promise<User | string>;
  loginWithEmail: (email: string, password: string) => Promise<User | string>;
  signInWithGoogle: () => Promise<User | string>;
  logout: () => Promise<void | string>;
  resendVerificationEmail: () => Promise<string | void>;
  isResendingEmail: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseConfigStatus, setFirebaseConfigStatus] = useState(false); // Internal state for config
  const [isAdmin, setIsAdmin] = useState(false);
  const [userTier, setUserTier] = useState<UserTier>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  const { t } = useI18n();

  // Memoize Firebase services to prevent re-initialization on re-renders
  const auth: Auth | undefined = useMemo(() => firebaseAuthService, []);
  const googleProvider = useMemo(() => firebaseGoogleProvider, []);
  const firestoreDb: Firestore | undefined = useMemo(() => firestoreDbService, []);

  useEffect(() => {
    setFirebaseConfigStatus(isFirebaseFullyConfigured()); // Update state based on the imported check
    if (!isFirebaseFullyConfigured()) {
      console.warn(t(FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE_KEY));
      setLoading(false);
      return;
    }
    
    if (!auth || !firestoreDb) {
        console.error("AuthContext: Critical error - Firebase auth or firestore service instance is undefined. Authentication will not work properly.");
        setLoading(false);
        return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user && firestoreDb) {
        const userDocRef = doc(firestoreDb, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let determinedTier: UserTier;
        let specialDisplayName: string | undefined = undefined;
        const userEmailLower = user.email?.toLowerCase();

        if (userEmailLower === ADMIN_EMAIL.toLowerCase()) {
            determinedTier = 'admin';
        } else if (userEmailLower === FREE_USER_EMAIL.toLowerCase()) {
            determinedTier = 'pro'; // dginteligenciaartificial@gmail.com ahora es PRO
            specialDisplayName = 'dginteligenciaartificial';
        } else {
            if (userDocSnap.exists() && userDocSnap.data()?.tier) {
                determinedTier = userDocSnap.data()?.tier as UserTier;
            } else {
                determinedTier = 'free'; // Default for new users or users without a tier
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
      setLoading(false);
    }, (error) => {
      console.error(t("authContext.authContextErrorListener"), error);
      setLoading(false);
      setCurrentUser(null);
      setIsAdmin(false);
      setUserTier(null);
    });

    return () => unsubscribe();
  }, [auth, firestoreDb, t]);


  const handleAuthError = (error: AuthError): string => {
    console.error("Firebase Auth Error Code:", error.code, "Message:", error.message);
    if (!firebaseConfigStatus || !auth || !firestoreDb || error.code === 'auth/invalid-api-key' || error.code === 'auth/internal-error' ||  error.code === 'auth/missing-config' || error.code === 'auth/network-request-failed' || (error.message && (error.message.toLowerCase().includes("api key not valid") || error.message.toLowerCase().includes("network error")) )) {
        return t(FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE_KEY);
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
      case 'auth/wrong-password': // This might also be covered by invalid-credential
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
        console.warn("AuthContext: Firestore DB instance is not available, cannot save user.");
        return;
    }
    const userRef = doc(firestoreDb, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let displayName = forcedDisplayName;
    if (!displayName) { // Only try to determine default displayName if not forced
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
        providerData: user.providerData.map(p => ({ providerId: p.providerId, uid: p.uid })), // Store provider data
        tier: tierToSave,
        lastLogin: serverTimestamp(),
        emailVerified: effectiveEmailVerified,
    };

    try {
      if (!userSnap.exists()) {
          await setDoc(userRef, {
              ...userDataToSet,
              createdAt: serverTimestamp(),
              preferences: [], // Initialize preferences for new users
          });
      } else {
          // If user exists, merge new data, ensuring special display name is forced if applicable
          const updateData: Partial<AppUserFirestoreData> = { ...userDataToSet };
          if (user.email?.toLowerCase() === FREE_USER_EMAIL.toLowerCase() && tierToSave === 'pro' && forcedDisplayName === 'dginteligenciaartificial') {
             updateData.displayName = 'dginteligenciaartificial'; // Ensure this specific name is set for this user
          }
          await setDoc(userRef, updateData, { merge: true });
      }
    } catch (error) {
        console.error(t("authContext.errorSavingUserToFirestore"), error);
    }
  };

  const generateActionCodeSettings = (): ActionCodeSettings | undefined => {
    if (typeof window !== 'undefined') {
      return {
        url: `${window.location.origin}/dashboard`, // Redirect to dashboard after verification
        handleCodeInApp: false, // Firebase handles the code on its own page
      };
    }
    console.warn("AuthContext: ActionCodeSettings could not be generated because window is undefined (likely SSR). Verification email might use default Firebase redirect.");
    return undefined; 
  };


  const signUpWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth || !firestoreDb) {
        return t(FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE_KEY);
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const settings = generateActionCodeSettings();
      if (settings) {
        await sendEmailVerification(user, settings);
      } else {
        // Fallback if settings can't be generated (e.g. window undefined, though unlikely here if signup is client-side)
        await sendEmailVerification(user);
      }
      
      // Determine tier based on email
      let initialTier: UserTier = 'free'; // Default
      let forcedName: string | undefined = undefined;
      const emailLower = email.toLowerCase();

      if (emailLower === ADMIN_EMAIL.toLowerCase()) {
        initialTier = 'admin';
      } else if (emailLower === FREE_USER_EMAIL.toLowerCase()) {
        initialTier = 'pro'; 
        forcedName = 'dginteligenciaartificial';
      }
      
      await saveUserToFirestore(user, initialTier, forcedName, false); // emailVerified is false initially
      return user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth || !firestoreDb) {
        return t(FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE_KEY);
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle calling saveUserToFirestore to update lastLogin and ensure tier is correct
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth || !googleProvider || !firestoreDb) {
        return t(FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE_KEY);
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle calling saveUserToFirestore
      return result.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void | string> => {
    if (!firebaseConfigStatus || !auth) {
        // Even if Firebase isn't fully configured, try to clear local state if auth object exists
        if (auth) {
          try {
            await firebaseSignOut(auth);
          } catch (e) { /* ignore if auth itself is the problem */ }
        }
        setCurrentUser(null);
        setIsAdmin(false);
        setUserTier(null);
        setLoading(false); // Ensure loading is set to false
        return t(FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE_KEY); // Return the config error message
    }

    setLoading(true); // Set loading true before sign out attempt
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will clear currentUser, isAdmin, userTier, and set loading to false.
      // Explicitly setting them here might be redundant but ensures a clean state on explicit logout call.
      setCurrentUser(null);
      setIsAdmin(false);
      setUserTier(null);
    } catch (error) {
      console.error(t("authContext.logoutErrorFirebase"), error);
      // Don't set loading to false here if signout fails, onAuthStateChanged might still trigger
      return handleAuthError(error as AuthError);
    } finally {
      // setLoading(false) will be handled by onAuthStateChanged in most success cases,
      // but if signout fails before onAuthStateChanged triggers, we ensure it's false.
      // However, to avoid race conditions, it's often better to let onAuthStateChanged manage it.
      // For an explicit logout action, if it fails and doesn't trigger onAuthStateChanged, 
      // we might want to ensure loading is false.
      // A simple approach for now:
       if (auth.currentUser) { // If user is still somehow current after a failed signout
           setLoading(false); // Update loading state
       }
       // If signout was successful, onAuthStateChanged will set loading to false.
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
      const settings = generateActionCodeSettings();
      if (settings) {
        await sendEmailVerification(currentUser, settings);
      } else {
        await sendEmailVerification(currentUser);
      }
      return t("authContext.resendVerificationSuccess", {email: currentUser.email || t("verifyEmailPage.yourEmail")});
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/too-many-requests') {
        return t("authContext.tooManyRequestsResendEmailError");
      }
      return handleAuthError(authError);
    } finally {
      setIsResendingEmail(false);
    }
  };


  const value = {
    currentUser,
    loading,
    isFirebaseConfigured: firebaseConfigStatus, // Use the state variable
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
