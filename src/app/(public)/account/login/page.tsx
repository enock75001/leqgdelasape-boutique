
'use client';

import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        router.push('/admin');
      } else if (user?.role === 'manager') {
        router.push('/manager');
      }
       else {
        router.push('/account');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleLoginSuccess = (role: 'admin' | 'manager' | 'client') => {
    if (role === 'admin') {
      router.push('/admin');
    } else if (role === 'manager') {
      router.push('/manager');
    } else {
      router.push('/account');
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Connexion</CardTitle>
          <CardDescription>Accédez à votre compte LE QG DE LA SAPE</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onLoginSuccess={handleLoginSuccess} />
          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground mb-2">
              Ou continuez en tant qu'invité pour passer votre commande en un clic, sans inscription nécessaire.
            </p>
            Vous n'avez pas de compte ?{' '}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/register">
                S'inscrire
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
