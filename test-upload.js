import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import fs from 'fs';

const firebaseConfig = {
  projectId: "meeting-mind-7f919",
  appId: "1:961617263578:web:e0f3c96d633ae9a4df1ee3",
  apiKey: "AIzaSyCv6VFxmUn2EdTKU6WFSERxcTUxiNokUU8",
  storageBucket: "meeting-mind-7f919.appspot.com",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const fileBuf = fs.readFileSync('package.json');
const storageRef = ref(storage, 'test-upload/package.json');

uploadBytes(storageRef, new Uint8Array(fileBuf)).then(() => {
  console.log('Upload success');
}).catch(e => {
  console.error('Upload failed', e);
});
