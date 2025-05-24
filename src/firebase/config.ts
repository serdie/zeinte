
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
        console.error("    Specific Issue: The API KEY is the most critical piece for Firebase to connect.");
    }
    allVarsPresent = false;
  } else {
    if (varName === 'NEXT_PUBLIC_FIREBASE_API_KEY') {
      console.log(`✅ ${varName} is present (e.g., ${varValue.substring(0,5)}...${varValue.slice(-5)})`);
    } else {
      console.log(`✅ ${varName} is present: ${varValue}`);
    }
  }
}

if (!allVarsPresent) {
    console.error("\n--- Firebase Environment Variable Check FAILED. Some variables are missing. ---");
} else {
    console.log("--- Firebase Environment Variable Check PASSED. All required variables are present. ---");
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth | undefined = undefined; 
let googleProvider: GoogleAuthProvider | undefined = undefined;

if (allVarsPresent) {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      console.log("✅ Firebase App initialized successfully.");
    } catch (error) {
      console.error("🔥 Firebase initialization error (initializeApp or getAuth failed):", error);
      app = {} as FirebaseApp; // Assign a dummy app object
      auth = undefined;
      googleProvider = undefined;
      console.error("🔥 Firebase App could not be initialized. Firebase features will be disabled.");
    }
  } else {
    app = getApps()[0];
    if (app && app.name) { 
        try {
            auth = getAuth(app);
            googleProvider = new GoogleAuthProvider();
            console.log("✅ Firebase App re-used existing instance successfully.");
        } catch (error) {
            console.error("🔥 Error getting Auth on re-used Firebase App instance:", error);
            auth = undefined;
            googleProvider = undefined;
        }
    } else {
        // This case should ideally not be reached if getApps().length > 0
        app = {} as FirebaseApp;
        auth = undefined;
        googleProvider = undefined;
        console.error("🔥 Could not re-use existing Firebase App instance properly.");
    }
  }
} else {
  console.error(
    "\n\n🛑 Firebase App initialization SKIPPED due to missing environment variables. " +
    "Firebase features (like Authentication) will NOT work. " +
    "Please check your .env.local file and RESTART your server.\n\n"
  );
  app = {} as FirebaseApp; // Assign a dummy app object
  auth = undefined;
  googleProvider = undefined;
}

export { app, auth, googleProvider };
