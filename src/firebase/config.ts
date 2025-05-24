
// src/firebase/config.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'; // Added type Auth

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
  if (!requiredEnvVars[varName]) {
    console.error(
      `\n\n🛑 CRITICAL Firebase Configuration Error:\n` +
      `   Environment variable ${varName} is MISSING or EMPTY.\n` +
      `   Please ensure it is correctly set in your .env.local file (in the project root).\n` +
      `   After adding/correcting it, YOU MUST RESTART your Next.js development server.\n` +
      `   Firebase will NOT initialize correctly without it, leading to 'auth/invalid-api-key' or other errors.\n\n`
    );
    allVarsPresent = false;
  } else {
    // Mask sensitive parts of the key for logging, but confirm it's present
    if (varName === 'NEXT_PUBLIC_FIREBASE_API_KEY') {
      console.log(`✅ ${varName} is present (e.g., ${requiredEnvVars[varName]?.substring(0,5)}...${requiredEnvVars[varName]?.slice(-5)})`);
    } else {
      console.log(`✅ ${varName} is present: ${requiredEnvVars[varName]}`);
    }
  }
}
console.log("--- Finished Checking Firebase Environment Variables ---");


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
let auth: Auth | undefined = undefined; // Initialize as undefined
let googleProvider: GoogleAuthProvider | undefined = undefined; // Initialize as undefined

if (allVarsPresent) {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      console.log("✅ Firebase App initialized successfully.");
    } catch (error) {
      console.error("🔥 Firebase initialization error:", error);
      // If initializeApp itself fails (e.g. due to malformed but present keys), app might not be set
      // Set app to a dummy object to potentially prevent some downstream errors, though Firebase will be unusable.
      app = {} as FirebaseApp; 
      console.error("🔥 Firebase App could not be initialized. Firebase features will be disabled.");
    }
  } else {
    app = getApps()[0];
    // Ensure auth and googleProvider are also initialized if app already exists
    if (app && app.name) { // Check if it's a valid app
        try {
            auth = getAuth(app);
            googleProvider = new GoogleAuthProvider();
            console.log("✅ Firebase App re-used existing instance successfully.");
        } catch (error) {
            console.error("🔥 Error getting Auth on re-used Firebase App instance:", error);
        }
    }
  }
} else {
  console.error(
    "\n\n🛑 Firebase App initialization SKIPPED due to missing environment variables. " +
    "Firebase features (like Authentication) will NOT work. " +
    "Please check your .env.local file and RESTART your server.\n\n"
  );
  // Assign a dummy app object to prevent 'app is not defined' errors further down,
  // although Firebase services will not be functional.
  app = {} as FirebaseApp;
}

export { app, auth, googleProvider };
