import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Use environment variables if available, otherwise fallback to the JSON config
const config = firebaseConfigJson as any;
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || config.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || config.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || config.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || config.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || config.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || config.measurementId,
};

console.log("Initializing Firebase with Project ID:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Determine the database ID.
const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId;

// Use initializeFirestore instead of getFirestore to enable experimentalForceLongPolling
// This can help in environments with restrictive proxies or network issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, dbId === '(default)' ? undefined : dbId);

// Connection test as per critical instructions
async function testConnection() {
  try {
    // Try to fetch a non-existent doc to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firestore connection successful.");
  } catch (error: any) {
    console.error("Firestore Connection Error Details:", error);
    if (error.message?.includes('offline') || error.code === 'unavailable') {
      console.error("CRITICAL: Firestore cannot be reached. Possible causes:\n1. Firestore is NOT enabled in Firebase Console.\n2. Project ID '" + firebaseConfig.projectId + "' is incorrect.\n3. Network/Proxy is blocking Firestore traffic.");
    }
  }
}
testConnection();

export { signInAnonymously, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup };
export { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs };
export type { User };
