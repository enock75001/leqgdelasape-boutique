'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { sendPasswordResetEmail } from '@/ai/flows/send-password-reset-email-flow';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSubmitted(false);
    
    // In a real app, you would generate a unique, secure reset token,
    // save its hash in the database with an expiry date,
    // and create a link to a /reset-password/[token] page.
    // For this demo, we'll just link back to the login page.
    const mockResetLink = `${window.location.origin}/login`;

    try {
      const result = await sendPasswordResetEmail({ email, resetLink: mockResetLink });

      if (result.success) {
        setIsSubmitted(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Échec de l\'envoi',
          description: result.message || 'Une erreur inconnue est survenue.',
        });
      }
    } catch (error) {
      console.error('Password reset email error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'envoyer l\'e-mail de réinitialisation. Veuillez réessayer.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Mot de passe oublié</CardTitle>
          <CardDescription>
            {isSubmitted 
              ? "Vérifiez votre boîte de réception."
              : "Entrez votre e-mail pour recevoir un lien de réinitialisation."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <p>
                Si un compte associé à <strong>{email}</strong> existe, un e-mail a été envoyé avec les instructions pour réinitialiser votre mot de passe.
              </p>
              <Button asChild>
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Link>
              </Button>
            </div>
          ) : (
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer le lien de réinitialisation
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
