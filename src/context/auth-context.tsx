
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
  
  const fetchAppUserData = useCallback(async (firebaseUser: FirebaseUser): Promise<AppUser> => {
    // FirebaseUser has uid, email, etc.
    // We need to fetch the additional data from Firestore (name, phone, etc.)
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
        };
    } else {
        // This case might happen if Firestore doc creation fails after auth creation.
        // We still create a user object to keep the app working.
        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
        };
    }
  }, []);

  useEffect(() => {
    // This is the core of Firebase Auth integration.
    // It listens for changes in the user's authentication state.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in.
        setLoading(true);
        const appUser = await fetchAppUserData(firebaseUser);
        setUser(appUser);
        setLoading(false);
      } else {
        // User is signed out.
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [fetchAppUserData]);


  const login = async (uid: string) => {
    // This function is to ensure user data is fresh upon login,
    // as onAuthStateChanged might not have the latest Firestore data immediately.
    const firebaseUser = auth.currentUser;
    if (firebaseUser && firebaseUser.uid === uid) {
       const appUser = await fetchAppUserData(firebaseUser);
       setUser(appUser);
    }
  };

  const logout = () => {
    auth.signOut(); // This will trigger onAuthStateChanged, which will set user to null
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
