
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
      console.log(`✅ ${varName} is present.`);
    }
  }
}

let firebaseAppInstance: FirebaseApp | undefined = undefined;
let firebaseAuthInstance: Auth | undefined = undefined;
let firebaseGoogleProviderInstance: GoogleAuthProvider | undefined = undefined;

if (allVarsPresent) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!, // Non-null assertion due to allVarsPresent check
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  if (!getApps().length) {
    try {
      firebaseAppInstance = initializeApp(firebaseConfig);
      console.log("✅ Firebase App initialized successfully.");
    } catch (error) {
      console.error("🔥 Firebase initialization error (initializeApp failed):", error);
      // firebaseAppInstance remains undefined
      allVarsPresent = false; // Mark as not fully configured if initializeApp fails
    }
  } else {
    firebaseAppInstance = getApps()[0];
    if (firebaseAppInstance && firebaseAppInstance.name) {
        console.log("✅ Firebase App re-used existing instance successfully.");
    } else {
        // This case should ideally not happen if getApps().length > 0
        console.error("🔥 Could not properly re-use existing Firebase App instance despite getApps() reporting an instance.");
        firebaseAppInstance = undefined; 
        allVarsPresent = false;
    }
  }

  if (firebaseAppInstance) {
    try {
        firebaseAuthInstance = getAuth(firebaseAppInstance);
        firebaseGoogleProviderInstance = new GoogleAuthProvider();
        console.log("✅ Firebase Auth and Google Provider initialized successfully.");
    } catch (error) {
        console.error("🔥 Error initializing Firebase Auth or Google Provider:", error);
        // If getAuth fails (e.g., due to a truly invalid API key despite presence checks),
        // these will remain undefined.
        firebaseAuthInstance = undefined;
        firebaseGoogleProviderInstance = undefined;
        allVarsPresent = false; // Mark as not fully configured if auth setup fails
    }
  } else {
      // If firebaseAppInstance itself is undefined after attempt
      allVarsPresent = false;
  }

}

if (!allVarsPresent) {
  // This final check ensures the message is displayed if any step failed or if initial vars were missing
  console.error(
    "\n\n--- 🚨 Firebase Environment Variable Check OR Initialization FAILED. One or more required Firebase variables might be missing or initialization failed. Firebase will NOT be fully functional. Please check your .env.local file and RESTART your server. Review console logs for specific missing variables or errors. ---"
  );
  // Ensure instances are undefined if config is incomplete
  firebaseAppInstance = undefined;
  firebaseAuthInstance = undefined;
  firebaseGoogleProviderInstance = undefined;
}

export { 
  firebaseAppInstance as app, 
  firebaseAuthInstance as auth, 
  firebaseGoogleProviderInstance as googleProvider,
  allVarsPresent as isFirebaseFullyConfigured // Export a flag indicating full configuration status
};
