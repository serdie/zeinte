
// src/firebase/config.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const requiredEnvVars: Record<string, string | undefined> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let allVarsPresent = true;
let specificErrorMessages: string[] = [];

// This code runs on the server during build and on the client side.
// Console logs here might appear in both browser and server consoles depending on context.
if (typeof window === 'undefined') { // Log only on server during build/startup for clarity
    console.log("--- Firebase Environment Variable Check (Server Startup) ---");
}

for (const varName in requiredEnvVars) {
  const varValue = requiredEnvVars[varName];
  if (!varValue) {
    const errorMessage = `🛑 CRITICAL Firebase Configuration Error: Environment variable ${varName} is MISSING or EMPTY. Please ensure it is correctly set in your .env.local file (in the project root). After adding/correcting it, YOU MUST RESTART your Next.js development server. Firebase will NOT initialize correctly without it.`;
    specificErrorMessages.push(errorMessage);
    if (varName === 'NEXT_PUBLIC_FIREBASE_API_KEY') {
        specificErrorMessages.push("    🔥 Specific Issue: The API KEY (NEXT_PUBLIC_FIREBASE_API_KEY) is the most critical piece for Firebase to connect. It cannot be found or is empty. Ensure it's in .env.local AND you've RESTARTED your server.");
    }
    allVarsPresent = false;
  } else {
    if (typeof window === 'undefined') { // Server-side log
        if (varName === 'NEXT_PUBLIC_FIREBASE_API_KEY') {
          console.log(`✅ ${varName} is present (e.g., ${varValue.substring(0,5)}...${varValue.slice(-5)})`);
        } else {
          console.log(`✅ ${varName} is present.`);
        }
    }
  }
}

let firebaseAppInstance: FirebaseApp | undefined = undefined;
let firebaseAuthInstance: Auth | undefined = undefined;
let firebaseGoogleProviderInstance: GoogleAuthProvider | undefined = undefined;
let firestoreInstance: Firestore | undefined = undefined;

if (allVarsPresent) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  if (!getApps().length) {
    try {
      firebaseAppInstance = initializeApp(firebaseConfig);
      if (typeof window === 'undefined') console.log("✅ Firebase App initialized successfully.");
    } catch (error) {
      if (typeof window === 'undefined') console.error("🔥 Firebase initialization error during initializeApp:", error);
      specificErrorMessages.push(`🔥 Firebase initializeApp error: ${(error as Error).message}`);
      allVarsPresent = false;
    }
  } else {
    firebaseAppInstance = getApps()[0];
    if (firebaseAppInstance && firebaseAppInstance.name) {
        if (typeof window === 'undefined') console.log("✅ Firebase App re-used existing instance successfully.");
    } else {
        if (typeof window === 'undefined') console.error("🔥 Could not properly re-use existing Firebase App instance.");
        specificErrorMessages.push("🔥 Could not re-use existing Firebase App instance.");
        firebaseAppInstance = undefined;
        allVarsPresent = false;
    }
  }

  if (firebaseAppInstance && allVarsPresent) {
    try {
      firebaseAuthInstance = getAuth(firebaseAppInstance);
      firebaseGoogleProviderInstance = new GoogleAuthProvider();
      firestoreInstance = getFirestore(firebaseAppInstance);
      if (typeof window === 'undefined') console.log("✅ Firebase Auth, Google Provider, and Firestore initialized successfully.");
    } catch (error) {
      if (typeof window === 'undefined') console.error("🔥 Error initializing Firebase Auth, Google Provider or Firestore:", error);
      specificErrorMessages.push(`🔥 Firebase Auth/Provider/Firestore init error: ${(error as Error).message}`);
      firebaseAuthInstance = undefined;
      firebaseGoogleProviderInstance = undefined;
      firestoreInstance = undefined;
      allVarsPresent = false;
    }
  } else if (allVarsPresent && !firebaseAppInstance) {
    if (typeof window === 'undefined') console.error("🔥 Firebase App instance is undefined after attempted initialization.");
    specificErrorMessages.push("🔥 Firebase App instance became undefined unexpectedly.");
    allVarsPresent = false;
  }
}

if (!allVarsPresent && typeof window !== 'undefined') { // Only show this general error in the browser console if checks failed
    const detailedErrors = specificErrorMessages.join("\n");
    console.error(
        `\n\n--- 🚨 Firebase Environment Variable Check FAILED ---\n${detailedErrors}\nFirebase will NOT be initialized. Please check your .env.local file and RESTART your server. Check server console for more details if running locally.\n---`
    );
} else if (!allVarsPresent && typeof window === 'undefined') { // Server console detailed logs
    specificErrorMessages.forEach(msg => console.error(msg));
    console.error(
        "\n\n--- 🚨 Firebase Environment Variable Check FAILED. One or more required Firebase variables are missing or initialization failed. Firebase will NOT be initialized. Please check your .env.local file and RESTART your server. Review previous logs for specifics. ---"
    );
}


export {
  firebaseAppInstance as app,
  firebaseAuthInstance as auth,
  firebaseGoogleProviderInstance as googleProvider,
  firestoreInstance as db, // Export Firestore instance
  allVarsPresent as isFirebaseFullyConfigured
};
