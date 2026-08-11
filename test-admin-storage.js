import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : null;
if (!serviceAccount) {
  console.log("No service account key");
  process.exit(0);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "meeting-mind-7f919.appspot.com"
});

const bucket = admin.storage().bucket();
bucket.upload('package.json', { destination: 'test/package.json' })
  .then((res) => console.log('Admin upload success:', res[0].name))
  .catch(e => console.error('Admin upload failed:', e.message));
