
'use client';

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated at all, redirect to login
        router.push('/login');
      } else if (user.role !== 'admin') {
        // Authenticated but not an admin, redirect away
        router.push('/login');
      }
      // If user is admin, do nothing and let the layout render
    }
  }, [user, loading, router]);
  
  // While checking auth, show a loader
  if (loading || !user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }
  
  // If user is authenticated as admin, show the admin layout
  if (user.role === 'admin') {
      return (
        <div className="flex min-h-screen bg-muted/40">
          <AdminSidebar />
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      );
  }
  
  // Fallback, should be covered by loader or redirect
  return null;
}
