
// src/contexts/AuthContext.tsx
"use client";

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
// Import the flag and instances from firebase/config
import { auth, googleProvider, db, isFirebaseFullyConfigured } from '@/firebase/config'; 
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

const FIREBASE_CONFIG_ERROR_MESSAGE = "Error de Configuración de Firebase: La configuración de Firebase es incorrecta o está incompleta (faltan variables como NEXT_PUBLIC_FIREBASE_API_KEY en .env.local, o los valores son incorrectos). Por favor, revisa la configuración de tu proyecto y los logs de la consola del servidor, luego REINICIA el servidor de desarrollo. La autenticación y las funciones de base de datos no funcionarán hasta que esto se resuelva.";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isFirebaseFullyConfigured; 
  const router = useRouter();

  useEffect(() => {
    if (!isConfigured || !auth) { 
      if (typeof window !== 'undefined') { // Only log in browser
        console.warn("AuthContext: Firebase auth is not configured, auth object is undefined, or required environment variables are missing/incorrect. Skipping onAuthStateChanged listener. isFirebaseFullyConfigured:", isConfigured, "auth object exists:", !!auth);
      }
      setLoading(false);
      setCurrentUser(null); // Ensure currentUser is null if not configured
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isConfigured]); 

  const handleAuthError = (error: AuthError): string => {
    console.error("Firebase Auth Error:", error.code, error.message);
    // If Firebase is not configured, always return the specific config error message
    if (!isConfigured || error.code === 'auth/invalid-api-key' || error.code === 'auth/internal-error' || error.code === 'auth/configuration-not-found' || error.code === 'auth/missing-config' || error.code === 'auth/network-request-failed') {
        return FIREBASE_CONFIG_ERROR_MESSAGE;
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
        return 'No se encontró ningún usuario con este correo electrónico.';
      case 'auth/wrong-password':
        return 'La contraseña es incorrecta.';
      case 'auth/popup-closed-by-user':
        return 'Proceso de inicio de sesión con Google cancelado.';
      case 'auth/cancelled-popup-request':
        return 'Se canceló la solicitud emergente. Inténtalo de nuevo.';
      default:
        return `Ocurrió un error inesperado (${error.code}). Por favor, inténtalo de nuevo.`;
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!isConfigured || !auth || !db) return FIREBASE_CONFIG_ERROR_MESSAGE;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // userCredential.user will be set by onAuthStateChanged
      // setCurrentUser(userCredential.user); // Not strictly necessary here due to onAuthStateChanged
      
      // Save user info to Firestore
      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        createdAt: serverTimestamp(),
        displayName: userCredential.user.displayName || email.split('@')[0],
        provider: 'email/password',
      });
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      // setLoading(false); // onAuthStateChanged will handle this
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!isConfigured || !auth) return FIREBASE_CONFIG_ERROR_MESSAGE;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // setCurrentUser(userCredential.user); // Handled by onAuthStateChanged
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      // setLoading(false); // onAuthStateChanged will handle this
    }
  };

  const signInWithGoogle = async (): Promise<User | string> => {
    if (!isConfigured || !auth || !googleProvider || !db) return FIREBASE_CONFIG_ERROR_MESSAGE;
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // setCurrentUser(result.user); // Handled by onAuthStateChanged
      
      // Save/Update user info in Firestore
      const userRef = doc(db, "users", result.user.uid);
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
      return handleAuthError(error as AuthError);
    } finally {
      // setLoading(false); // onAuthStateChanged will handle this
    }
  };

  const logout = async (): Promise<void | string> => {
    if (!isConfigured) { // If not configured, don't even try to sign out from Firebase
        setCurrentUser(null);
        setLoading(false);
        if (router) router.push('/login');
        return FIREBASE_CONFIG_ERROR_MESSAGE;
    }
    if (!auth) { // Should be covered by !isConfigured, but as a safeguard
        setCurrentUser(null);
        setLoading(false);
        if (router) router.push('/login');
        return "Firebase Auth no está disponible.";
    }

    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // setCurrentUser(null); // Handled by onAuthStateChanged
      if (router) router.push('/login'); 
    } catch (error) {
      console.error("Error signing out from Firebase: ", error);
      // setLoading(false); // onAuthStateChanged will handle this
      return handleAuthError(error as AuthError);
    } 
    // setLoading(false) will be called by onAuthStateChanged when user becomes null
  };

  const value = {
    currentUser,
    loading,
    isFirebaseConfigured: isConfigured, 
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
