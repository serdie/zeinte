
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

// This check primarily helps during server startup/build.
// In the browser, process.env variables are baked in at build time.
if (typeof window === 'undefined') { // Log detailed checks on server startup
    console.log("\n--- Firebase Environment Variable Check (Server Startup) ---");
}

for (const varName in requiredEnvVars) {
  const varValue = requiredEnvVars[varName];
  if (!varValue) {
    const errorMessage = `🛑 CRITICAL Firebase Configuration Error: Environment variable ${varName} is MISSING or EMPTY. Please ensure it is correctly set in your .env.local file (in the project root). After adding/correcting it, YOU MUST RESTART your Next.js development server. Firebase will NOT initialize correctly without it.`;
    specificErrorMessages.push(errorMessage);
    if (typeof window === 'undefined') console.error(errorMessage); // Log each missing var on server
    
    if (varName === 'NEXT_PUBLIC_FIREBASE_API_KEY') {
        const specificApiKeyMessage = "    🔥 Specific Issue: The API KEY (NEXT_PUBLIC_FIREBASE_API_KEY) is the most critical piece for Firebase to connect. It cannot be found or is empty. Ensure it's in .env.local AND you've RESTARTED your server.";
        specificErrorMessages.push(specificApiKeyMessage);
        if (typeof window === 'undefined') console.error(specificApiKeyMessage);
    }
    allVarsPresent = false;
  } else {
    if (typeof window === 'undefined') { // Server-side log for present variables
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
      const initErrorMsg = `🔥 Firebase initializeApp error: ${(error as Error).message}. This can happen if config values are present but malformed.`;
      specificErrorMessages.push(initErrorMsg);
      if (typeof window === 'undefined') console.error(initErrorMsg);
      allVarsPresent = false; // Mark as not configured if init fails
    }
  } else {
    firebaseAppInstance = getApps()[0];
    if (firebaseAppInstance && firebaseAppInstance.name) {
        if (typeof window === 'undefined') console.log("✅ Firebase App re-used existing instance successfully.");
    } else {
        const reuseErrorMsg = "🔥 Could not properly re-use existing Firebase App instance. This is unexpected.";
        specificErrorMessages.push(reuseErrorMsg);
        if (typeof window === 'undefined') console.error(reuseErrorMsg);
        firebaseAppInstance = undefined;
        allVarsPresent = false;
    }
  }

  if (firebaseAppInstance && allVarsPresent) { // Check allVarsPresent again in case initializeApp failed
    try {
      firebaseAuthInstance = getAuth(firebaseAppInstance);
      firebaseGoogleProviderInstance = new GoogleAuthProvider();
      firestoreInstance = getFirestore(firebaseAppInstance);
      if (typeof window === 'undefined') console.log("✅ Firebase Auth, Google Provider, and Firestore initialized successfully.");
    } catch (error) {
      const servicesErrorMsg = `🔥 Error initializing Firebase Auth, Google Provider or Firestore: ${(error as Error).message}`;
      specificErrorMessages.push(servicesErrorMsg);
      if (typeof window === 'undefined') console.error(servicesErrorMsg);
      firebaseAuthInstance = undefined;
      firebaseGoogleProviderInstance = undefined;
      firestoreInstance = undefined;
      allVarsPresent = false; 
    }
  } else if (allVarsPresent && !firebaseAppInstance) {
    // This case means allVarsPresent was true initially, but app instance became undefined (e.g. initializeApp threw)
    const appInstanceErrorMsg = "🔥 Firebase App instance became undefined after attempted initialization, despite vars seeming present initially.";
    specificErrorMessages.push(appInstanceErrorMsg);
    if (typeof window === 'undefined') console.error(appInstanceErrorMsg);
    allVarsPresent = false;
  }
}

// This final summary error is more likely to be seen in the browser console if client-side checks also fail.
// Server-side logs above are more granular.
if (!allVarsPresent && typeof window !== 'undefined') { 
    const detailedErrors = specificErrorMessages.join("\n");
    console.error(
        `\n\n--- 🚨 Firebase Environment Variable Check FAILED ---\n${detailedErrors}\nFirebase will NOT be initialized. Please check your .env.local file and RESTART your server. Check server console for more details if running locally.\n---`
    );
} else if (!allVarsPresent && typeof window === 'undefined') { 
    // Already logged granular errors on server, but a final summary is good.
    console.error(
        "\n\n--- 🚨 Firebase Environment Variable Check FAILED. One or more required Firebase variables are missing or Firebase services failed to initialize. Firebase will NOT be initialized. Please check your .env.local file, ensure values are correct, and RESTART your server. Review previous logs for specifics. ---"
    );
}


export const isFirebaseFullyConfigured = allVarsPresent && !!firebaseAppInstance && !!firebaseAuthInstance && !!firestoreInstance;

export {
  firebaseAppInstance as app,
  firebaseAuthInstance as auth,
  firebaseGoogleProviderInstance as googleProvider,
  firestoreInstance as db,
};
