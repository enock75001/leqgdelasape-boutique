'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { sendEmail } from '@/ai/flows/send-email-flow';
import Link from 'next/link';

const getLoginNotificationEmailHtml = (email: string) => {
  return `
    <h1>Connexion réussie à votre compte</h1>
    <p>Bonjour,</p>
    <p>Nous vous informons qu'une connexion à votre compte LE QG DE LA SAPE a eu lieu avec l'adresse e-mail : <strong>${email}</strong>.</p>
    <p>Si vous n'êtes pas à l'origine de cette connexion, veuillez sécuriser votre compte immédiatement.</p>
    <p>L'équipe LE QG DE LA SAPE</p>
  `;
};

interface LoginFormProps {
  onLoginSuccess: (email: string) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let isAuthenticated = false;

    if (email.toLowerCase() === 'le.qg10delasape@gmail.com') {
      if (password === 'SKYPE2022') {
        isAuthenticated = true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Échec de la connexion',
          description: 'Mot de passe administrateur incorrect.',
        });
        setIsLoading(false);
        return;
      }
    } else if (email && password) {
      // For other users, any password works for this mock setup
      // In a real app this would call Firebase Auth's signInWithEmailAndPassword
      isAuthenticated = true;
    }


    if (isAuthenticated) {
      await login(email);

      toast({
        title: 'Connexion réussie',
        description: `Bon retour parmi nous !`,
      });
      
      // Send login notification email
      try {
        await sendEmail({
          to: email,
          subject: 'Notification de connexion à votre compte LE QG DE LA SAPE',
          htmlContent: getLoginNotificationEmailHtml(email),
        });
      } catch (error) {
          // Do not block user if email fails
          console.error("Échec de l'envoi de l'e-mail de connexion :", error);
      }
      
      onLoginSuccess(email);
    } else {
      toast({
        variant: 'destructive',
        title: 'Échec de la connexion',
        description: 'Veuillez vérifier vos identifiants.',
      });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
          <Button variant="link" asChild className="p-0 h-auto text-sm text-primary">
            <Link href="/forgot-password">
              Mot de passe oublié ?
            </Link>
          </Button>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Se connecter
      </Button>
    </form>
  );
}
