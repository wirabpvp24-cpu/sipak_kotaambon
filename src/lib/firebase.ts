import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Use the JSON config directly
const config = firebaseConfigJson as any;
const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
  measurementId: config.measurementId,
};

console.log("Initializing Firebase for Project:", firebaseConfig.projectId);

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Determine the database ID.
const dbId = config.firestoreDatabaseId;
console.log("Using Firestore Database ID:", dbId || "(default)");

// Use standard getFirestore first, then fallback to initializeFirestore if needed
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, dbId && dbId !== '(default)' ? dbId : undefined);

// Connection test as per critical instructions
async function testConnection() {
  try {
    console.log("Testing Firestore connection...");
    // Try to fetch from a test collection
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("✅ Firestore connection successful!");
  } catch (error: any) {
    console.error("❌ Firestore Connection Error:", error.code, error.message);
    
    if (error.message?.includes('offline') || error.code === 'unavailable') {
      console.error("CRITICAL: Firestore is unreachable. This usually means the Database ID is incorrect or the database hasn't been created yet.");
      console.error("Current Database ID being used:", dbId);
    }
  }
}
testConnection();

export { signInAnonymously, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup };
export { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs };
export type { User };
