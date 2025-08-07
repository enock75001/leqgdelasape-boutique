
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
        // Not authenticated, redirect to login
        router.push('/login');
      } else if (user.role !== 'admin') {
        // Authenticated but not an admin, redirect to their respective dashboard
        if (user.role === 'manager') {
            router.push('/manager');
        } else {
            router.push('/account');
        }
      }
      // If user is admin, do nothing and let the layout render
    }
  }, [user, loading, router]);
  
  // While checking auth, show a loader
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }
  
  // If user is authenticated as admin, show the admin layout
  if (user && user.role === 'admin') {
      return (
        <div className="flex min-h-screen bg-muted/40">
          <AdminSidebar />
          <div className="flex-grow p-8">
            {children}
          </div>
        </div>
      );
  }
  
  // Fallback, should be covered by loader or redirect
  return null;
}
