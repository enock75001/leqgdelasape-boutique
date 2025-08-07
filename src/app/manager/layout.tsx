
'use client';

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ManagerSidebar } from "@/components/layout/manager-sidebar";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to login
        router.push('/login');
      } else if (user.role !== 'manager' && user.role !== 'admin') {
        // Authenticated but not a manager or admin, redirect to account
        router.push('/account');
      }
      // If user is manager or admin, do nothing and let the layout render
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }
  
  if (user.role === 'manager' || user.role === 'admin') {
    return (
      <div className="flex min-h-screen bg-muted/40">
        <ManagerSidebar />
        <div className="flex-grow p-8">
          {children}
        </div>
      </div>
    );
  }
  
  return null;
}
