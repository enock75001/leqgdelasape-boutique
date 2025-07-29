'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

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
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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
  }, []);

  const markAllAsRead = useCallback((recipient: 'admin' | 'client', userEmail?: string) => {
    setNotifications(prev =>
      prev.map(n => {
        const isAdminMatch = n.recipient === 'admin' && recipient === 'admin';
        const isClientMatch = n.recipient === 'client' && recipient === 'client' && n.userEmail === userEmail;
        if ((isAdminMatch || isClientMatch) && !n.read) {
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

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllAsRead, getUnreadCount }}>
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
