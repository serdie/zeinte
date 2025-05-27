
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
import { doc, setDoc, serverTimestamp, type Firestore, getDoc, updateDoc, type DocumentData } from 'firebase/firestore'; // Added updateDoc & DocumentData
import { auth as firebaseAuthService, googleProvider as firebaseGoogleProvider, db as firestoreDbService, isFirebaseFullyConfigured, app as firebaseAppInstance } from '@/firebase/config';

const FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE = "Error de Configuración General de Firebase: La aplicación no pudo conectarse correctamente. Esto suele deberse a variables de entorno (NEXT_PUBLIC_FIREBASE_...) faltantes o incorrectas en '.env.local'. Por favor, revisa tu archivo '.env.local' y los logs de la consola del servidor. Después de corregir el archivo .env.local, DEBES REINICIAR el servidor de desarrollo. La autenticación y las funciones de base de datos no funcionarán hasta que esto se resuelva.";
export const ADMIN_EMAIL = "serdiegm@gmail.com";
// No longer using FREE_USER_EMAIL or PRO_USER_EMAIL constants here for specific assignment, handled by logic directly

export type UserTier = 'admin' | 'pro' | 'free' | null;

// Define a type for the user data we store in Firestore
// This helps keep consistency with what AdminPage expects
interface AppUserFirestoreData extends DocumentData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  providerData?: Array<{ providerId: string; uid: string }>;
  tier?: UserTier;
  createdAt?: any; // serverTimestamp or Timestamp
  lastLogin?: any; // serverTimestamp or Timestamp
  preferences?: string[];
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
    
    if (!auth || !firestoreDb) { 
        if (typeof window !== 'undefined' && !initialConfigWarningShown) {
            console.error("AuthContext: Critical error - Firebase auth or firestore service instance is undefined. Authentication will not work properly.");
            setInitialConfigWarningShown(true);
        }
        setLoading(false);
        setCurrentUser(null);
        setIsAdmin(false);
        setUserTier(null);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true); // Start loading when auth state changes
      if (user && firestoreDb) {
        const userDocRef = doc(firestoreDb, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let determinedTier: UserTier;
        let specialDisplayName: string | undefined = undefined;

        const userEmailLower = user.email?.toLowerCase();

        if (userEmailLower === ADMIN_EMAIL.toLowerCase()) {
            determinedTier = 'admin';
        } else if (userEmailLower === 'dginteligenciaartificial@gmail.com') {
            determinedTier = 'pro';
            specialDisplayName = 'dginteligenciaartificial'; // Ensure this display name
        } else {
            // For all other users:
            // If they exist in Firestore and have a tier, respect that.
            // Otherwise (new user, or existing user without a tier field), default to 'free'.
            if (userDocSnap.exists() && userDocSnap.data()?.tier) {
                determinedTier = userDocSnap.data()?.tier as UserTier;
            } else {
                determinedTier = 'free'; // Default for new users or users without a tier.
            }
        }
        
        await saveUserToFirestore(user, determinedTier, specialDisplayName); 

        setIsAdmin(determinedTier === 'admin');
        setUserTier(determinedTier);
        setCurrentUser(user); 
      } else {
        setIsAdmin(false);
        setUserTier(null);
        setCurrentUser(null); 
      }
      setLoading(false); // Finish loading
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
    if (!firebaseConfigStatus || !auth || !firestoreDb || error.code === 'auth/invalid-api-key' || error.code === 'auth/internal-error' ||  error.code === 'auth/missing-config' || error.code === 'auth/network-request-failed' || (error.message && (error.message.toLowerCase().includes("api key not valid") || error.message.toLowerCase().includes("network error")) )) {
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE;
    }
    // Specific error for configuration not found (e.g. Google provider not set up)
    if (error.code === 'auth/configuration-not-found') {
        return "Error de configuración del proveedor de autenticación (auth/configuration-not-found). Asegúrate de que el proveedor de inicio de sesión (ej. Google) esté correctamente habilitado y configurado en tu Firebase Console (Authentication -> Sign-in method -> Google -> Habilitar). Puede que necesites también configurar la pantalla de consentimiento OAuth en Google Cloud Console.";
    }
     if (error.code === 'auth/unauthorized-domain') {
        return `Error de dominio no autorizado (auth/unauthorized-domain). El dominio desde el que intentas autenticar no está en la lista de dominios autorizados en tu Firebase Console. Ve a Firebase Console -> Authentication -> Settings (o Sign-in method -> Authorized domains) y añade tu dominio (ej. 'localhost' para desarrollo).`;
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
      default:
        return `Ocurrió un error inesperado (${error.code}). Por favor, inténtalo de nuevo. Si el problema persiste, revisa la configuración de Firebase.`;
    }
  };

  const saveUserToFirestore = async (user: User, tierToSave: UserTier, forcedDisplayName?: string) => {
    if (!firestoreDb) {
        console.warn("AuthContext: Firestore DB instance is not available, cannot save user.");
        return;
    }
    const userRef = doc(firestoreDb, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let displayName = forcedDisplayName;
    if (user.email?.toLowerCase() === 'dginteligenciaartificial@gmail.com') {
        displayName = 'dginteligenciaartificial'; // Override if it's this specific user
    } else if (!displayName) {
      // If no forced display name (and not dginteligenciaartificial), use existing from auth, or from DB, or generate from email
      displayName = user.displayName || 
                    (userSnap.exists() && userSnap.data()?.displayName) || 
                    user.email?.split('@')[0] || 
                    'Usuario';
    }
    
    const userDataToSet: AppUserFirestoreData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: user.photoURL,
        providerData: user.providerData.map(p => ({ providerId: p.providerId, uid: p.uid })),
        tier: tierToSave,
        lastLogin: serverTimestamp(),
    };

    try {
      if (!userSnap.exists()) {
          // New user, set createdAt and lastLogin
          await setDoc(userRef, {
              ...userDataToSet,
              createdAt: serverTimestamp(),
              preferences: [], // Initialize preferences for new users
          });
      } else {
          // Existing user, update specified fields and lastLogin
          // Merge to avoid overwriting existing preferences if not explicitly changing them here
          await setDoc(userRef, userDataToSet, { merge: true }); 
      }
    } catch (error) {
        console.error("Error saving user to Firestore:", error);
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
      // Tier determination and saving to Firestore will happen in onAuthStateChanged
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
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle updating Firestore (lastLogin, tier check)
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
        return FIREBASE_GENERAL_CONFIG_ERROR_MESSAGE;
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle saving/updating user in Firestore
      return result.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false); 
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

// Define AppUserFirestoreData as a top-level export if needed elsewhere,
// or keep it local if only used within AuthContext.
// For clarity, I've kept it local but defined it for the userDataToSet object.
export type { AppUserFirestoreData };
