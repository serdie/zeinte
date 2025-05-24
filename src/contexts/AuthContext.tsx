
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
// Import the flag as well
import { auth, googleProvider, isFirebaseFullyConfigured } from '@/firebase/config'; 
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isFirebaseConfigured: boolean; // Renamed for clarity from isFirebaseFullyConfigured
  signUpWithEmail: (email: string, password: string) => Promise<User | string>;
  loginWithEmail: (email: string, password: string) => Promise<User | string>;
  signInWithGoogle: () => Promise<User | string>;
  logout: () => Promise<void | string>;
}

const FIREBASE_CONFIG_ERROR_MESSAGE = "Error de Configuración de Firebase: Faltan una o más variables de entorno de Firebase (NEXT_PUBLIC_FIREBASE_...) en tu archivo .env.local, son incorrectas, o la inicialización de Firebase falló. Por favor, revisa la configuración de tu proyecto (y los logs del servidor/consola) y REINICIA el servidor de desarrollo. La autenticación no funcionará hasta que esto se resuelva.";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Use the imported flag from firebase/config.ts
  const isConfigured = isFirebaseFullyConfigured; 
  const router = useRouter();

  useEffect(() => {
    if (!isConfigured || !auth) { 
      console.warn("AuthContext: Firebase auth is not configured, not initialized correctly, or required environment variables are missing. Skipping onAuthStateChanged listener.");
      setLoading(false);
      return;
    }
    // `auth` object is checked above
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isConfigured]);

  const handleAuthError = (error: AuthError): string => {
    console.error("Firebase Auth Error:", error.code, error.message);
    if (error.code === 'auth/invalid-api-key' || (error.code === 'auth/internal-error' && error.message.includes("apiKey")) || error.code === 'auth/configuration-not-found') {
        return FIREBASE_CONFIG_ERROR_MESSAGE;
    }
    // ... (other error codes remain the same)
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
        return 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!isConfigured || !auth) return FIREBASE_CONFIG_ERROR_MESSAGE;
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
    if (!isConfigured || !auth || !googleProvider) return FIREBASE_CONFIG_ERROR_MESSAGE;
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

  const logout = async (): Promise<void | string> => {
    // Clear client state and redirect even if Firebase isn't fully configured,
    // but prioritize the config error message if applicable.
    if (!isConfigured || !auth) {
      setCurrentUser(null);
      if (router) router.push('/login'); 
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
    isFirebaseConfigured: isConfigured, // Use the renamed variable
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
