import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, initializeAuth, browserLocalPersistence, inMemoryPersistence, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDDdPI1zm5H4WW9xhQVlK0s6AqdWn33OaQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "omniops-33512.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "omniops-33512",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "omniops-33512.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1047228246378",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1047228246378:web:9ca606d04c9a9a45861d13"
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
const db = getFirestore(app);

const storage = getStorage(app);
export { app, auth, googleProvider, db, storage };
