
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
      setCurrentUser(userCredential.user);
      // Ejemplo: Guardar información del usuario en Firestore
      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        createdAt: serverTimestamp(),
        displayName: userCredential.user.displayName || email.split('@')[0], // usa el nombre de usuario del email si no hay displayName
        provider: 'email/password',
      });
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!isConfigured || !auth) return FIREBASE_CONFIG_ERROR_MESSAGE;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<User | string> => {
    if (!isConfigured || !auth || !googleProvider || !db) return FIREBASE_CONFIG_ERROR_MESSAGE;
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setCurrentUser(result.user);
      // Ejemplo: Guardar/Actualizar información del usuario en Firestore
      const userRef = doc(db, "users", result.user.uid);
      await setDoc(userRef, {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        lastLogin: serverTimestamp(),
        provider: 'google.com',
      }, { merge: true }); // merge:true para actualizar si ya existe
      return result.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void | string> => {
    setLoading(true);
    try {
      if (isConfigured && auth) { 
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error("Error signing out from Firebase: ", error);
    } finally {
      setCurrentUser(null); 
      if (router) router.push('/login'); 
      setLoading(false);
      if (!isConfigured) { 
        return FIREBASE_CONFIG_ERROR_MESSAGE;
      }
    }
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
