
// src/firebase/config.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const requiredEnvVars: Record<string, string | undefined> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let allVarsPresent = true;
console.log("--- Checking Firebase Environment Variables ---");
for (const varName in requiredEnvVars) {
  const varValue = requiredEnvVars[varName];
  if (!varValue) {
    console.error(
      `\n\n🛑 CRITICAL Firebase Configuration Error:\n` +
      `   Environment variable ${varName} is MISSING or EMPTY.\n` +
      `   Please ensure it is correctly set in your .env.local file (in the project root).\n` +
      `   After adding/correcting it, YOU MUST RESTART your Next.js development server.\n` +
      `   Firebase will NOT initialize correctly without it, leading to 'auth/invalid-api-key' or other errors.\n\n`
    );
    if (varName === 'NEXT_PUBLIC_FIREBASE_API_KEY') {
        console.error("    🔥 Specific Issue: The API KEY (NEXT_PUBLIC_FIREBASE_API_KEY) is the most critical piece for Firebase to connect. It cannot be found or is empty. Ensure it's in .env.local AND you've RESTARTED your server.");
    }
    allVarsPresent = false;
  } else {
    // Obfuscate sensitive values in logs for general variables, show part of API_KEY for confirmation
    if (varName === 'NEXT_PUBLIC_FIREBASE_API_KEY') {
      console.log(`✅ ${varName} is present (e.g., ${varValue.substring(0,5)}...${varValue.slice(-5)})`);
    } else {
      console.log(`✅ ${varName} is present: ${varValue}`);
    }
  }
}

let firebaseAppInstance: FirebaseApp | undefined = undefined;
let firebaseAuthInstance: Auth | undefined = undefined;
let firebaseGoogleProviderInstance: GoogleAuthProvider | undefined = undefined;

if (allVarsPresent) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!getApps().length) {
    try {
      firebaseAppInstance = initializeApp(firebaseConfig);
      firebaseAuthInstance = getAuth(firebaseAppInstance);
      firebaseGoogleProviderInstance = new GoogleAuthProvider();
      console.log("✅ Firebase App initialized successfully.");
    } catch (error) {
      console.error("🔥 Firebase initialization error (initializeApp or getAuth failed):", error);
      firebaseAppInstance = undefined;
      firebaseAuthInstance = undefined;
      firebaseGoogleProviderInstance = undefined;
      console.error("🔥 Firebase App could not be initialized. Firebase features will be disabled.");
    }
  } else {
    firebaseAppInstance = getApps()[0];
    if (firebaseAppInstance && firebaseAppInstance.name) {
        try {
            firebaseAuthInstance = getAuth(firebaseAppInstance);
            firebaseGoogleProviderInstance = new GoogleAuthProvider();
            console.log("✅ Firebase App re-used existing instance successfully.");
        } catch (error) {
            console.error("🔥 Error getting Auth on re-used Firebase App instance:", error);
            firebaseAuthInstance = undefined;
            firebaseGoogleProviderInstance = undefined;
        }
    } else {
        firebaseAppInstance = undefined;
        firebaseAuthInstance = undefined;
        firebaseGoogleProviderInstance = undefined;
        console.error("🔥 Could not re-use existing Firebase App instance properly.");
    }
  }
} else {
  console.error(
    "\n\n--- 🚨 Firebase Environment Variable Check FAILED. One or more required Firebase variables are missing. Firebase will NOT be initialized. Please check your .env.local file and RESTART your server. ---"
  );
  // firebaseAppInstance, firebaseAuthInstance, firebaseGoogleProviderInstance remain undefined as initialized
}

export { 
  firebaseAppInstance as app, 
  firebaseAuthInstance as auth, 
  firebaseGoogleProviderInstance as googleProvider 
};
