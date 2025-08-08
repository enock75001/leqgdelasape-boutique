
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';

export type Notification = {
  id: string;
  recipient: 'admin' | 'client';
  userEmail?: string; // Only for client notifications
  message: string;
  read: boolean;
  timestamp: string;
};

type NotificationContextType = {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  markAllAsRead: (recipient: 'admin' | 'client', userEmail?: string) => void;
  getUnreadCount: (recipient: 'admin' | 'client', userEmail?: string) => number;
  clearNotifications: (recipient: 'admin' | 'client', userEmail?: string) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// A simple, short notification sound encoded in Base64 to avoid needing a separate file.
const NOTIFICATION_SOUND_DATA_URL = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAASAAADbWFweXJ1bm5pbmdjb2RlLmNvbQEAAAACAAAAAAAAAAAAAAAAAAAAAAD/8/GgAAAAANIAAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=";
let audio: HTMLAudioElement | null = null;
if (typeof window !== 'undefined') {
    audio = new Audio(NOTIFICATION_SOUND_DATA_URL);
    audio.volume = 1.0; // Set volume to maximum
}


export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    try {
        const storedNotifications = localStorage.getItem('notifications');
        if (storedNotifications) {
            setNotifications(JSON.parse(storedNotifications));
        }
    } catch(e) {
        console.error("Failed to parse notifications from localStorage", e);
        localStorage.removeItem('notifications');
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications, isLoaded]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: new Date().toISOString() + Math.random(),
      read: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);

    // Play sound and show browser notification for the admin
    if (notification.recipient === 'admin' && user?.role === 'admin') {
      audio?.play().catch(error => {
          console.warn("Notification sound was blocked by the browser:", error);
      });

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Nouvelle activité !", {
            body: newNotification.message,
            icon: "/icons/icon-192x192.png",
        });
      }
    }

  }, [user]);

  const markAllAsRead = useCallback((recipient: 'admin' | 'client', userEmail?: string) => {
    setNotifications(prev =>
      prev.map(n => {
        const isAdminMatch = n.recipient === 'admin' && recipient === 'admin';
        const isClientMatch = n.recipient === 'client' && recipient === 'client' && n.userEmail === userEmail;

        if ((isAdminMatch || isClientMatch)) {
          return { ...n, read: true };
        }
        return n;
      })
    );
  }, []);
  
  const getUnreadCount = useCallback((recipient: 'admin' | 'client', userEmail?: string) => {
      return notifications.filter(n => {
          const isAdminMatch = n.recipient === 'admin' && recipient === 'admin';
          const isClientMatch = n.recipient === 'client' && recipient === 'client' && n.userEmail === userEmail;
          return (isAdminMatch || isClientMatch) && !n.read
      }).length;
  }, [notifications]);

  const clearNotifications = useCallback((recipient: 'admin' | 'client', userEmail?: string) => {
    setNotifications(prev =>
      prev.filter(n => {
        const isAdminMatch = n.recipient === 'admin' && recipient === 'admin';
        const isClientMatch = n.recipient === 'client' && recipient === 'client' && n.userEmail === userEmail;
        return !(isAdminMatch || isClientMatch);
      })
    );
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllAsRead, getUnreadCount, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
