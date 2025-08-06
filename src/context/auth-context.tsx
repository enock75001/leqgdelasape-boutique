
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

type AppUser = {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  role: 'admin' | 'manager' | 'client';
  shippingAddress?: any;
  billingAddress?: any;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: AppUser | null;
  login: (uid: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshAuth: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchAppUserData = useCallback(async (firebaseUser: FirebaseUser): Promise<AppUser | null> => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const firestoreData = userSnap.data();
        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            name: firestoreData.name,
            phone: firestoreData.phone,
            avatarUrl: firestoreData.avatarUrl,
            role: firestoreData.role || 'client', // Default to client if role is not set
            shippingAddress: firestoreData.shippingAddress,
            billingAddress: firestoreData.billingAddress,
        };
    } else {
        // This might happen if a user exists in Auth but not in Firestore.
        // Log them out to force a clean state.
        console.warn(`User with UID ${firebaseUser.uid} found in Auth but not in Firestore. Logging out.`);
        auth.signOut();
        return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        const appUser = await fetchAppUserData(firebaseUser);
        setUser(appUser);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchAppUserData]);

  const login = async (uid: string) => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser && firebaseUser.uid === uid) {
       const appUser = await fetchAppUserData(firebaseUser);
       setUser(appUser);
    }
  };

  const logout = () => {
    auth.signOut();
  };

  const refreshAuth = useCallback(async () => {
      const firebaseUser = auth.currentUser;
      if(firebaseUser) {
          setLoading(true);
          const appUser = await fetchAppUserData(firebaseUser);
          setUser(appUser);
          setLoading(false);
      }
  }, [fetchAppUserData]);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, loading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
