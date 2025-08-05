'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { addContact } from '@/ai/flows/add-contact-flow';

interface RegisterFormProps {
  onRegisterSuccess: () => void;
}

export function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!name || !email || !password || !phone) {
        toast({
          variant: 'destructive',
          title: 'Échec de l\'inscription',
          description: 'Veuillez remplir tous les champs.',
        });
        return;
    }
    setIsLoading(true);

    try {
      // In a real app, you'd use Firebase Auth to create a user.
      // For now, we'll just add them to a 'users' collection in Firestore.
      const userDoc = {
          name,
          email,
          phone,
          avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}`, // Default avatar
          createdAt: serverTimestamp(),
      };
      
      // Use email as doc ID for simplicity in this mock setup
      await setDoc(doc(db, "users", email), userDoc);

      // Add contact to Brevo list
      try {
        await addContact({ email });
      } catch (brevoError) {
        // Do not block registration if Brevo fails, just log it.
        console.warn("Failed to add contact to Brevo, but registration succeeded:", brevoError);
      }

      toast({
        title: 'Inscription réussie',
        description: `Bienvenue, ${name} !`,
      });
      login(email, name, phone);
      onRegisterSuccess();
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: 'destructive',
        title: 'Échec de l\'inscription',
        description: "Une erreur s'est produite. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
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
        <Label htmlFor="phone">Numéro de téléphone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 234 567 890"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
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
        Créer un compte
      </Button>
    </form>
  );
}
