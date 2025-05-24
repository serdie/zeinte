
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
import { auth, googleProvider } from '@/firebase/config'; // auth and googleProvider can be undefined if env vars are missing
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<User | string>;
  loginWithEmail: (email: string, password: string) => Promise<User | string>;
  signInWithGoogle: () => Promise<User | string>;
  logout: () => Promise<void | string>; // Updated return type for logout
}

const FIREBASE_CONFIG_ERROR_MESSAGE = "Firebase no está configurado correctamente. Revisa las variables de entorno.";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      console.error("AuthContext: Firebase auth is not initialized. Skipping onAuthStateChanged listener.");
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthError = (error: AuthError): string => {
    console.error("Firebase Auth Error:", error.code, error.message);
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
      case 'auth/invalid-api-key':
        return FIREBASE_CONFIG_ERROR_MESSAGE;
      default:
        return 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!auth) return FIREBASE_CONFIG_ERROR_MESSAGE;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!auth) return FIREBASE_CONFIG_ERROR_MESSAGE;
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
    if (!auth || !googleProvider) return FIREBASE_CONFIG_ERROR_MESSAGE;
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setCurrentUser(result.user);
      return result.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void | string> => { // Updated return type
    if (!auth) {
      // If auth is not available, we can't sign out from Firebase,
      // but we can clear local state and redirect.
      setCurrentUser(null);
      router.push('/login');
      return FIREBASE_CONFIG_ERROR_MESSAGE;
    }
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      router.push('/login'); 
    } catch (error) {
      console.error("Error signing out: ", error);
       return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
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
