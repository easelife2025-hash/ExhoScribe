import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, initializeAuth, browserLocalPersistence, inMemoryPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";
import firebaseConfigJson from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseConfigJson.appId
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth: Auth;
if (getApps().length === 1) {
  try {
    auth = initializeAuth(app, {
      persistence: [browserLocalPersistence, inMemoryPersistence]
    });
  } catch (e) {
    auth = getAuth(app);
  }
} else {
  auth = getAuth(app);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');

// Initialize Firestore with offline persistence
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch (e) {
  db = getFirestore(app);
}

const storage = getStorage(app);
storage.maxUploadRetryTime = 10000; // 10 seconds (fail fast if bucket not found/enabled)
const functions = getFunctions(app);

let analytics = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export const getMessagingInstance = async () => {
  if (typeof window === 'undefined') return null;
  const supported = await isMessagingSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};

export { app, auth, googleProvider, db, storage, functions, analytics };
