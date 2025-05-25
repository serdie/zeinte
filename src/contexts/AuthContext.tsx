
// src/contexts/AuthContext.tsx
"use client";

import type React from 'react';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type AuthError
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getFirestore, type Firestore } from 'firebase/firestore';
import { auth as firebaseAuthService, googleProvider as firebaseGoogleProvider, db as firestoreDbService, isFirebaseFullyConfigured, app as firebaseAppInstance } from '@/firebase/config';

const FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE = "Error de Configuración General de Firebase: La aplicación no pudo conectarse correctamente. Esto suele deberse a variables de entorno (NEXT_PUBLIC_FIREBASE_...) faltantes o incorrectas en '.env.local'. Por favor, revisa tu archivo '.env.local' y los logs de la consola del servidor. Después de corregir el archivo .env.local, DEBES REINICIAR el servidor de desarrollo. La autenticación y las funciones de base de datos no funcionarán hasta que esto se resuelva.";
const ADMIN_EMAIL = "serdiegm@gmail.com";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  isAdmin: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<User | string>;
  loginWithEmail: (email: string, password: string) => Promise<User | string>;
  signInWithGoogle: () => Promise<User | string>;
  logout: () => Promise<void | string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Memoize Firebase services to prevent re-initialization on re-renders if they were props
  const auth = useMemo(() => firebaseAuthService, []);
  const googleProvider = useMemo(() => firebaseGoogleProvider, []);
  const firestoreDb = useMemo(() => firestoreDbService, []); // Corrected: useMemo for firestoreDb
  const firebaseConfigStatus = useMemo(() => isFirebaseFullyConfigured, []);
  const [initialConfigWarningShown, setInitialConfigWarningShown] = useState(false);


  useEffect(() => {
    if (!firebaseConfigStatus) {
      if (typeof window !== 'undefined' && !initialConfigWarningShown) {
        // This console warning is crucial for developers
        console.warn("AuthContext: Firebase services are not configured or available (isFirebaseFullyConfigured:", firebaseConfigStatus,"). isFirebaseFullyConfigured flag is derived from src/firebase/config.ts. This usually means required environment variables (NEXT_PUBLIC_FIREBASE_...) are missing from .env.local or incorrect. Please check your .env.local file AND your server console logs, then RESTART your development server. Authentication features will be disabled.");
        setInitialConfigWarningShown(true);
      }
      setLoading(false);
      setCurrentUser(null);
      setIsAdmin(false);
      return;
    }
    
    // If firebaseConfigStatus is true, auth should be defined.
    // If auth is somehow still undefined here despite firebaseConfigStatus being true,
    // it indicates a deeper issue with src/firebase/config.ts logic not correctly setting up auth.
    if (!auth) {
        if (typeof window !== 'undefined' && !initialConfigWarningShown) {
            console.error("AuthContext: Critical error - Firebase is reported as configured (isFirebaseFullyConfigured is true), but the 'auth' service instance is undefined. This indicates an issue in src/firebase/config.ts. Authentication will not work.");
            setInitialConfigWarningShown(true);
        }
        setLoading(false);
        setCurrentUser(null);
        setIsAdmin(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAdmin(user?.email === ADMIN_EMAIL);
      setLoading(false);
    }, (error) => {
      console.error("AuthContext: Error in onAuthStateChanged listener:", error);
      setLoading(false);
      setCurrentUser(null);
      setIsAdmin(false);
    });

    return () => unsubscribe();
  }, [firebaseConfigStatus, auth, firestoreDb, initialConfigWarningShown]); // firestoreDb added as dependency for completeness

  const handleAuthError = (error: AuthError): string => {
    console.error("Firebase Auth Error Code:", error.code, "Message:", error.message);
    if (!firebaseConfigStatus || !auth || !firestoreDb || error.code === 'auth/invalid-api-key' || error.code === 'auth/internal-error' || error.code === 'auth/missing-config' || error.code === 'auth/network-request-failed' || (error.message && (error.message.toLowerCase().includes("api key not valid") || error.message.toLowerCase().includes("network error")) )) {
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE;
    }
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'Este correo electrónico ya está en uso.';
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido.';
      case 'auth/operation-not-allowed':
        return 'Operación no permitida. Asegúrate de que el método de inicio de sesión (ej. Email/Contraseña o Google) esté habilitado en tu Firebase Console (Authentication -> Sign-in method).';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
      case 'auth/user-disabled':
        return 'Este usuario ha sido deshabilitado.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential': // Common for wrong email/password combination
        return 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      case 'auth/wrong-password':
        return 'La contraseña es incorrecta.';
      case 'auth/popup-closed-by-user':
        return 'Proceso de inicio de sesión con Google cancelado.';
      case 'auth/cancelled-popup-request':
      case 'auth/popup-blocked':
        return 'La ventana emergente de Google fue bloqueada o cancelada. Por favor, habilita las ventanas emergentes para este sitio e inténtalo de nuevo.';
      case 'auth/account-exists-with-different-credential':
        return 'Ya existe una cuenta con este correo electrónico pero con un método de inicio de sesión diferente (por ejemplo, Google o contraseña). Intenta iniciar sesión con el método original.';
      case 'auth/configuration-not-found':
        return 'Error de configuración del proveedor de autenticación (auth/configuration-not-found). Asegúrate de que el proveedor de inicio de sesión (ej. Google) esté correctamente habilitado y configurado en tu Firebase Console (Authentication -> Sign-in method).';
      case 'auth/unauthorized-domain':
        return `Error de dominio no autorizado (auth/unauthorized-domain). El dominio desde el que intentas autenticar no está en la lista de dominios autorizados en tu Firebase Console. Ve a Firebase Console -> Authentication -> Settings (o Sign-in method -> Authorized domains) y añade tu dominio (ej. 'localhost' para desarrollo).`;
      default:
        return `Ocurrió un error inesperado (${error.code}). Por favor, inténtalo de nuevo. Si el problema persiste, revisa la configuración de Firebase.`;
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth || !firestoreDb) {
        console.error("signUpWithEmail: Firebase is not configured or services are not available. Check .env.local and server logs.");
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(firestoreDb, "users", userCredential.user.uid);
      await setDoc(userRef, {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        createdAt: serverTimestamp(),
        displayName: userCredential.user.displayName || email.split('@')[0],
        provider: 'password', // Standard providerId for email/password
      });
      return userCredential.user;
    } catch (error) {
      setLoading(false);
      return handleAuthError(error as AuthError);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth) {
        console.error("loginWithEmail: Firebase is not configured or auth service is not available. Check .env.local and server logs.");
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Optionally, update last login timestamp in Firestore here if desired
      // const userRef = doc(firestoreDb, "users", userCredential.user.uid);
      // await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      return userCredential.user;
    } catch (error) {
      setLoading(false);
      return handleAuthError(error as AuthError);
    }
  };

  const signInWithGoogle = async (): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth || !googleProvider || !firestoreDb) {
        console.error("signInWithGoogle: Firebase is not configured or necessary services/providers are not available. Check .env.local and server logs.");
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE;
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userRef = doc(firestoreDb, "users", result.user.uid);
      await setDoc(userRef, {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: serverTimestamp(), // Add createdAt on first Google sign-in if not merging
        lastLogin: serverTimestamp(),
        provider: result.user.providerData?.[0]?.providerId || 'google.com',
      }, { merge: true }); // Merge true to avoid overwriting createdAt if user signed up with email first
      return result.user;
    } catch (error) {
      setLoading(false);
      return handleAuthError(error as AuthError);
    }
  };

  const logout = async (): Promise<void | string> => {
    // Check firebaseConfigStatus first for a more graceful failure message source.
    if (!firebaseConfigStatus) {
        if (typeof window !== 'undefined') console.warn("Logout attempt failed: Firebase is not configured. Check .env.local and restart server.");
        // Update local state even if Firebase isn't configured, to clear UI
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false);
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE; // Provide consistent error message
    }
    // If configured, but auth service is missing, it's an internal setup error in config.ts
    if (!auth) {
        if (typeof window !== 'undefined') console.warn("Logout attempt failed: Firebase Auth service is not available, though Firebase reported as configured. Check src/firebase/config.ts.");
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false);
        return "Servicio de autenticación de Firebase no disponible. Revisa la configuración.";
    }

    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will set currentUser to null and loading to false
    } catch (error) {
      console.error("Error signing out from Firebase: ", error);
      // setLoading will be handled by onAuthStateChanged or here if error is immediate
      setLoading(false); 
      return handleAuthError(error as AuthError);
    } 
    // No finally setLoading(false) here, onAuthStateChanged should handle it for success.
    // If signOut fails, it's handled above.
  };

  const value = {
    currentUser,
    loading,
    isFirebaseConfigured: firebaseConfigStatus,
    isAdmin,
    signUpWithEmail,
    loginWithEmail,
    signInWithGoogle,
    logout,
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

