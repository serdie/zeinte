
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
// Import the flag and instances from firebase/config
import { auth, googleProvider, isFirebaseFullyConfigured } from '@/firebase/config';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isFirebaseConfigured: boolean; // Expose this for components to check
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
  // isFirebaseConfigured now directly comes from the imported flag in firebase/config.ts
  const isConfigured = isFirebaseFullyConfigured; 
  const router = useRouter();

  useEffect(() => {
    // Crucially, check if 'auth' itself is defined (it won't be if config.ts failed to initialize it)
    // and if Firebase is reported as fully configured by our flag.
    if (!isConfigured || !auth) {
      console.warn("AuthContext: Firebase auth is not configured, auth object is undefined, or required environment variables are missing. Skipping onAuthStateChanged listener. isFirebaseFullyConfigured:", isConfigured, "auth object exists:", !!auth);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isConfigured]); // isConfigured comes from firebase/config and reflects the env var check status

  const handleAuthError = (error: AuthError): string => {
    console.error("Firebase Auth Error:", error.code, error.message);
    // If Firebase isn't configured or the error is related to invalid API key, return the specific config message.
    if (!isConfigured || error.code === 'auth/invalid-api-key' || (error.code === 'auth/internal-error' && error.message.includes("apiKey")) || error.code === 'auth/configuration-not-found') {
        return FIREBASE_CONFIG_ERROR_MESSAGE;
    }
    // Standard error messages
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
    setLoading(true);
    try {
      // Only attempt Firebase sign out if it was configured and auth object exists
      if (isConfigured && auth) { 
        await firebaseSignOut(auth);
      }
    } catch (error) {
      // Log the error but don't block client-side state clearing
      console.error("Error signing out from Firebase: ", error);
    } finally {
      setCurrentUser(null); // Always clear client-side user state
      if (router) router.push('/login'); // Always redirect
      setLoading(false);
      // If Firebase wasn't configured, return the config error message after attempting local logout actions.
      // This makes sure the user is informed even on logout if the config was bad.
      if (!isConfigured) {
        return FIREBASE_CONFIG_ERROR_MESSAGE;
      }
    }
  };

  const value = {
    currentUser,
    loading,
    isFirebaseConfigured: isConfigured, // Use the flag from firebase/config
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
