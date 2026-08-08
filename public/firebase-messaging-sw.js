importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAVyx4OX3AZMNnPnqrPl07fnqSwLbN3q_M",
  authDomain: "red-aura-ncf5x.firebaseapp.com",
  projectId: "red-aura-ncf5x",
  storageBucket: "red-aura-ncf5x.firebasestorage.app",
  messagingSenderId: "213623640947",
  appId: "1:213623640947:web:c9dc64e739ceb4831b6b06"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: "/icon.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
