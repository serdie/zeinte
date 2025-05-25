
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
import { auth as firebaseAuthService, googleProvider as firebaseGoogleProvider, db as firestoreDbService, isFirebaseFullyConfigured, app as firebaseAppInstance } from '@/firebase/config'; // Renamed to avoid conflict
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<User | string>;
  loginWithEmail: (email: string, password: string) => Promise<User | string>;
  signInWithGoogle: () => Promise<User | string>;
  logout: () => Promise<void | string>;
}

const FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE = "Error de Configuración de Firebase: La aplicación no pudo conectarse correctamente a Firebase. Esto puede deberse a que faltan variables de configuración esenciales (como NEXT_PUBLIC_FIREBASE_API_KEY) en el archivo .env.local, o los valores son incorrectos. Por favor, revisa la configuración de tu proyecto, el archivo .env.local y los logs de la consola del servidor (donde ejecutas 'npm run dev') para ver qué variables específicas faltan. Después de corregir el archivo .env.local, DEBES REINICIAR el servidor de desarrollo. La autenticación y las funciones de base de datos no funcionarán hasta que esto se resuelva.";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Memoize these to ensure they are stable across re-renders if config itself doesn't change
  const auth = useMemo(() => firebaseAuthService, []);
  const googleProvider = useMemo(() => firebaseGoogleProvider, []);
  const firestoreDb = useMemo(() => firestoreDbService, []);
  const firebaseConfigStatus = useMemo(() => isFirebaseFullyConfigured, []);
  const [initialConfigWarningShown, setInitialConfigWarningShown] = useState(false);


  useEffect(() => {
    if (!firebaseConfigStatus || !auth) {
      if (typeof window !== 'undefined' && !initialConfigWarningShown) {
        // This console warning is for client-side, server-side logs are in firebase/config.ts
        console.warn("AuthContext: Firebase auth service is not configured or not available. isFirebaseFullyConfigured:", firebaseConfigStatus, "auth object exists:", !!auth, ". This usually means required environment variables (NEXT_PUBLIC_FIREBASE_...) are missing from .env.local or incorrect. Please check your .env.local file AND your server console logs, then RESTART your development server. Authentication features will be disabled.");
        setInitialConfigWarningShown(true);
      }
      setLoading(false);
      setCurrentUser(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      console.error("AuthContext: Error in onAuthStateChanged listener:", error);
      setLoading(false);
      setCurrentUser(null);
    });

    return () => unsubscribe();
  }, [firebaseConfigStatus, auth, initialConfigWarningShown]);

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
        return 'La operación no está permitida. Contacta al administrador.';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
      case 'auth/user-disabled':
        return 'Este usuario ha sido deshabilitado.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
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
        console.error("signUpWithEmail: Firebase is not configured. Check .env.local and server logs.");
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
        provider: 'email/password',
      });
      return userCredential.user;
    } catch (error) {
      setLoading(false);
      return handleAuthError(error as AuthError);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth) {
        console.error("loginWithEmail: Firebase is not configured. Check .env.local and server logs.");
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      setLoading(false);
      return handleAuthError(error as AuthError);
    }
  };

  const signInWithGoogle = async (): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth || !googleProvider || !firestoreDb) {
        console.error("signInWithGoogle: Firebase is not configured. Check .env.local and server logs.");
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
        lastLogin: serverTimestamp(),
        provider: 'google.com',
      }, { merge: true });
      return result.user;
    } catch (error) {
      setLoading(false);
      return handleAuthError(error as AuthError);
    }
  };

  const logout = async (): Promise<void | string> => {
    if (!firebaseConfigStatus) {
        if (typeof window !== 'undefined') console.warn("Logout attempt failed: Firebase is not configured.");
        setCurrentUser(null);
        setLoading(false);
        if (router) router.push('/login'); // Redirect to login if Firebase is not configured
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE;
    }
    if (!auth) {
        // This case should ideally be caught by !firebaseConfigStatus, but as a fallback
        if (typeof window !== 'undefined') console.warn("Logout attempt failed: Firebase Auth service is not available.");
        setCurrentUser(null);
        setLoading(false);
        if (router) router.push('/login');
        return "Firebase Auth no está disponible.";
    }

    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null); // Ensure local state is updated
      if (router) router.push('/login'); // Redirect after successful logout
    } catch (error) {
      console.error("Error signing out from Firebase: ", error);
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    isFirebaseConfigured: firebaseConfigStatus,
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
