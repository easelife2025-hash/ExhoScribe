import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import fs from 'fs';

const firebaseConfig = {
  projectId: "meeting-mind-7f919",
  appId: "1:961617263578:web:e0f3c96d633ae9a4df1ee3",
  apiKey: "AIzaSyCv6VFxmUn2EdTKU6WFSERxcTUxiNokUU8",
  authDomain: "meeting-mind-7f919.firebaseapp.com",
  storageBucket: "meeting-mind-7f919.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

async function test() {
  try {
    const userCred = await signInAnonymously(auth);
    const uid = userCred.user.uid;
    console.log("Logged in as", uid);
    
    const fileBuf = fs.readFileSync('package.json');
    const storageRef = ref(storage, `uploads/${uid}/package.json`);

    const uploadTask = uploadBytesResumable(storageRef, new Uint8Array(fileBuf));
    uploadTask.on('state_changed', 
      (snap) => console.log('Progress', snap.bytesTransferred),
      (err) => console.error('Upload Error', err),
      () => console.log('Upload Done')
    );
  } catch (e) {
    console.error('Auth Error', e);
  }
}
test();
