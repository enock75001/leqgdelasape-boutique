'use client';

import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();

  const handleRegisterSuccess = () => {
    router.push('/account');
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Créer un compte</CardTitle>
          <CardDescription>Rejoignez la communauté LE QG DE LA SAPE</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
          <div className="mt-4 text-center text-sm">
            Vous avez déjà un compte ?{' '}
            <Button variant="link" asChild className="p-0 h-auto text-primary">
                <Link href="/login">
                    Login
                </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
