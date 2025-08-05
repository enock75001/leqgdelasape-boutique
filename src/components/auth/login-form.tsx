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
     <body style="font-family: Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td align="center" style="background-color: #2563eb; padding: 20px; color: #ffffff;">
                                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">LE QG DE LA SAPE</h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 30px 25px;">
                                <h2 style="font-size: 20px; margin-top: 0; margin-bottom: 15px;">Notification de sécurité</h2>
                                <p>Bonjour,</p>
                                <p style="margin-bottom: 25px;">Nous vous informons qu'une connexion à votre compte a été détectée depuis l'adresse e-mail : <strong>${email}</strong>.</p>
                                <p style="font-size: 12px; color: #6c757d;">Si vous êtes à l'origine de cette connexion, vous pouvez ignorer cet e-mail. Sinon, nous vous recommandons de sécuriser votre compte immédiatement.</p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td align="center" style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px;">
                                <p style="margin: 0;">© ${new Date().getFullYear()} LE QG DE LA SAPE. Tous droits réservés.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
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
