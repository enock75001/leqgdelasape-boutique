
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LoginFormProps {
  onLoginSuccess: (role: 'admin' | 'manager' | 'client') => void;
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

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        let userRole: 'admin' | 'manager' | 'client' = 'client';
        
        // Specific override for the main admin email
        if (email === 'le.qg10delasape@gmail.com') {
            userRole = 'admin';
            // Ensure the admin document exists with the correct role
            if (!userDoc.exists()) {
                await setDoc(userDocRef, { role: 'admin', email: user.email, name: 'Admin Principal' }, { merge: true });
            }
        } else if (userDoc.exists()) {
            const userData = userDoc.data();
            userRole = userData.role || 'client';
        }

        await login(user.uid);

        toast({
          title: 'Connexion réussie',
          description: `Bon retour parmi nous !`,
        });
        onLoginSuccess(userRole);
      } else {
        throw new Error("Impossible de récupérer les informations utilisateur après la connexion.");
      }
    } catch (error: any) {
       console.error("Login error", error.code, error.message);
       let description = 'Une erreur inconnue est survenue. Veuillez réessayer.';
       if (error.code === 'auth/user-not-found' || error.message.includes("not found in Firestore")) {
          description = 'Aucun compte trouvé avec cette adresse e-mail.';
       } else if (error.code === 'auth/wrong-password') {
          description = 'Le mot de passe est incorrect. Veuillez réessayer.';
       } else if (error.code === 'auth/invalid-credential') {
          description = "L'adresse e-mail ou le mot de passe est incorrect.";
       } else if (error.code === 'auth/invalid-email') {
          description = "L'adresse e-mail n'est pas valide.";
       } else if (error.code === 'auth/operation-not-allowed') {
          description = "La connexion par e-mail/mot de passe n'est pas activée dans la console Firebase.";
       } else if (error.code === 'auth/network-request-failed') {
          description = 'Erreur de réseau. Veuillez vérifier votre connexion Internet et réessayer.';
       }
        toast({
            variant: 'destructive',
            title: 'Échec de la connexion',
            description: description,
        });
    } finally {
        setIsLoading(false);
    }
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
