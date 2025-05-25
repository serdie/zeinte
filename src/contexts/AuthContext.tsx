
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
  type AuthError
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getFirestore, type Firestore, getDoc } from 'firebase/firestore';
import { auth as firebaseAuthService, googleProvider as firebaseGoogleProvider, db as firestoreDbService, isFirebaseFullyConfigured, app as firebaseAppInstance } from '@/firebase/config';

const FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE = "Error de Configuración General de Firebase: La aplicación no pudo conectarse correctamente. Esto suele deberse a variables de entorno (NEXT_PUBLIC_FIREBASE_...) faltantes o incorrectas en '.env.local'. Por favor, revisa tu archivo '.env.local' y los logs de la consola del servidor. Después de corregir el archivo .env.local, DEBES REINICIAR el servidor de desarrollo. La autenticación y las funciones de base de datos no funcionarán hasta que esto se resuelva.";
const ADMIN_EMAIL = "serdiegm@gmail.com";
const FREE_USER_EMAIL = "dginteligenciaartificial@gmail.com";

export type UserTier = 'admin' | 'pro' | 'free' | null;

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userTier, setUserTier] = useState<UserTier>(null);

  const auth = useMemo(() => firebaseAuthService, []);
  const googleProvider = useMemo(() => firebaseGoogleProvider, []);
  const firestoreDb = useMemo(() => firestoreDbService, []);
  const firebaseConfigStatus = useMemo(() => isFirebaseFullyConfigured, []);
  const [initialConfigWarningShown, setInitialConfigWarningShown] = useState(false);

  useEffect(() => {
    if (!firebaseConfigStatus) {
      if (typeof window !== 'undefined' && !initialConfigWarningShown) {
        console.warn("AuthContext: Firebase services are not configured or available. Authentication features will be disabled.");
        setInitialConfigWarningShown(true);
      }
      setLoading(false);
      setCurrentUser(null);
      setIsAdmin(false);
      setUserTier(null);
      return;
    }
    
    if (!auth) {
        if (typeof window !== 'undefined' && !initialConfigWarningShown) {
            console.error("AuthContext: Critical error - Firebase auth service instance is undefined. Authentication will not work.");
            setInitialConfigWarningShown(true);
        }
        setLoading(false);
        setCurrentUser(null);
        setIsAdmin(false);
        setUserTier(null);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const adminStatus = user.email === ADMIN_EMAIL;
        setIsAdmin(adminStatus);
        if (adminStatus) {
          setUserTier('admin');
        } else if (user.email === FREE_USER_EMAIL) {
          setUserTier('free');
        } else {
          // For now, other authenticated users default to 'pro'
          // In a real app, this would come from their subscription status in Firestore
          setUserTier('pro'); 
        }
      } else {
        setIsAdmin(false);
        setUserTier(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("AuthContext: Error in onAuthStateChanged listener:", error);
      setLoading(false);
      setCurrentUser(null);
      setIsAdmin(false);
      setUserTier(null);
    });

    return () => unsubscribe();
  }, [firebaseConfigStatus, auth, firestoreDb, initialConfigWarningShown]);

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

  const saveUserToFirestore = async (user: User) => {
    if (!firestoreDb) {
        console.warn("Firestore DB instance is not available, cannot save user.");
        return;
    }
    const userRef = doc(firestoreDb, "users", user.uid);
    const userSnap = await getDoc(userRef);

    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        photoURL: user.photoURL,
        providerData: user.providerData.map(p => ({ providerId: p.providerId, uid: p.uid })),
        // Initialize tier; a real app would update this based on subscriptions
        tier: user.email === ADMIN_EMAIL ? 'admin' : (user.email === FREE_USER_EMAIL ? 'free' : 'pro'),
    };

    if (!userSnap.exists()) {
        // New user, set createdAt
        await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
        });
    } else {
        // Existing user, update lastLogin and merge other data
        await setDoc(userRef, {
            ...userData, // ensure latest displayName, photoURL etc. are updated
            lastLogin: serverTimestamp(),
        }, { merge: true });
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth || !firestoreDb) {
        console.error("signUpWithEmail: Firebase is not configured or services are not available.");
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(userCredential.user);
      return userCredential.user;
    } catch (error) {
      setLoading(false);
      return handleAuthError(error as AuthError);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth || !firestoreDb) {
        console.error("loginWithEmail: Firebase is not configured or services not available.");
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(userCredential.user); // Update last login and potentially tier
      return userCredential.user;
    } catch (error) {
      setLoading(false);
      return handleAuthError(error as AuthError);
    }
  };

  const signInWithGoogle = async (): Promise<User | string> => {
    if (!firebaseConfigStatus || !auth || !googleProvider || !firestoreDb) {
        console.error("signInWithGoogle: Firebase is not configured or necessary services are not available.");
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE;
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserToFirestore(result.user);
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
        setIsAdmin(false);
        setUserTier(null);
        setLoading(false);
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE; 
    }
    if (!auth) {
        if (typeof window !== 'undefined') console.warn("Logout attempt failed: Firebase Auth service is not available.");
        setCurrentUser(null);
        setIsAdmin(false);
        setUserTier(null);
        setLoading(false);
        return "Servicio de autenticación de Firebase no disponible. Revisa la configuración.";
    }

    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setting currentUser, isAdmin, userTier to null and loading to false
    } catch (error) {
      console.error("Error signing out from Firebase: ", error);
      setLoading(false); 
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

