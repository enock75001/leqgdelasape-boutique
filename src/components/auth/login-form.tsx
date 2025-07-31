'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface LoginFormProps {
  onLoginSuccess: (email: string) => void;
}

async function sendLoginNotificationEmail(email: string) {
    // TODO: Implement email sending logic here.
    // This requires a backend service (e.g., Firebase Functions) and an email provider (e.g., SendGrid).
    // For now, this is a placeholder.
    console.log("Sending successful login notification email to:", email);
    // Example:
    // await fetch('/api/send-login-email', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email }),
    // });
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

    // Mock authentication
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email && password) {
      toast({
        title: 'Login Successful',
        description: `Welcome back!`,
      });
      login(email);
      await sendLoginNotificationEmail(email); // Placeholder for sending email
      onLoginSuccess(email);
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please check your credentials.',
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
        <Label htmlFor="password">Password</Label>
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
        Login
      </Button>
      <p className="text-xs text-center text-muted-foreground pt-4">
        Utilisez `admin@example.com` pour le compte admin.
        <br />
        Utilisez n'importe quel autre email pour un compte client.
      </p>
    </form>
  );
}
