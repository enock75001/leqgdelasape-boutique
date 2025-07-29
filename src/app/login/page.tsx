'use client';

import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (email: string) => {
    if (email === 'admin@example.com') {
      router.push('/admin');
    } else {
      router.push('/account');
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Login</CardTitle>
          <CardDescription>Accédez à votre compte LE BLEU</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
