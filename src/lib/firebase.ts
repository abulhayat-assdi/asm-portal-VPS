import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ============================================================
// 🔐 Environment Variable Validation
// Throws a clear, developer-friendly error at startup if any
// required Firebase key is missing — prevents silent runtime
// failures from cryptic "invalid API key" or "permission denied"
// messages deep in the app.

function validateFirebaseConfig(): void {
    const missing: string[] = [];

    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
    if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
    if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");

    if (missing.length > 0) {
        throw new Error(
            `[Firebase] Missing required environment variables:\n` +
            missing.map((k) => `  • ${k}`).join("\n") +
            `\n\nPlease add these to your .env.local file and restart the dev server.`
        );
    }
}

// Run validation immediately — fails fast on module load
validateFirebaseConfig();

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase (avoid multiple initializations in Next.js hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable auth persistence (Remember Me by default)
// This keeps users logged in even after closing the browser
if (typeof window !== "undefined") {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error("Error setting auth persistence:", error);
    });
}

export default app;
