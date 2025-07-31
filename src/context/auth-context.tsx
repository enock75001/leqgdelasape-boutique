'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type User = {
  email: string;
  name?: string;
  avatarUrl?: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  loading: boolean;
  refreshAuth: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchUserData = useCallback(async (email: string) => {
    try {
        const userRef = doc(db, "users", email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const fullUser = {
                email,
                name: userData.name,
                avatarUrl: userData.avatarUrl,
            };
            setUser(fullUser);
            localStorage.setItem('user', JSON.stringify(fullUser));
        } else {
             // Basic user if not in Firestore
            const basicUser = { email };
            setUser(basicUser);
            localStorage.setItem('user', JSON.stringify(basicUser));
        }
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        // Fallback to basic user
        const basicUser = { email };
        setUser(basicUser);
        localStorage.setItem('user', JSON.stringify(basicUser));
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      const storedUser = JSON.parse(storedUserStr);
      await fetchUserData(storedUser.email);
    }
  }, [fetchUserData]);

  useEffect(() => {
    const initializeAuth = async () => {
        setLoading(true);
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                await fetchUserData(parsedUser.email);
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    };
    initializeAuth();
  }, [fetchUserData]);

  const login = async (email: string) => {
    setLoading(true);
    await fetchUserData(email);
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, loading, refreshAuth }}>
      {!loading && children}
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
