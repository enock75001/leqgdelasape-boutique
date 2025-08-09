
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type PwaContextType = {
  isInstallable: boolean;
  promptInstall: (() => void) | null;
  isApple: boolean; // To detect iOS/iPadOS
};

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isApple, setIsApple] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    
    // Detect if the user is on an Apple mobile device
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent;
      setIsApple(/iPhone|iPad|iPod/.test(userAgent) && !window.MSStream);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    }
  };

  return (
    <PwaContext.Provider value={{ isInstallable: !!deferredPrompt, promptInstall: deferredPrompt ? promptInstall : null, isApple }}>
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (context === undefined) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
}
