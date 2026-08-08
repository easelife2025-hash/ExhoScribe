'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, getMessagingInstance } from './firebase';
import { getToken } from 'firebase/messaging';
import { saveFCMToken } from './db';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        try {
          const messaging = await getMessagingInstance();
          if (messaging) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              const currentToken = await getToken(messaging);
              if (currentToken) {
                await saveFCMToken(currentUser.uid, currentToken);
              }
            }
          }
        } catch (error) {
          console.error("Failed to get FCM token", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
