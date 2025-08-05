'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { serverTimestamp, setDoc, doc, getDoc } from 'firebase/firestore';
import { addContact } from '@/ai/flows/add-contact-flow';
import Link from 'next/link';

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
      // Vérifier si un utilisateur avec cet e-mail existe déjà
      const userRef = doc(db, "users", email);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        toast({
          variant: 'destructive',
          title: 'Cet e-mail est déjà utilisé',
          description: (
            <span>
              Un compte avec cette adresse e-mail existe déjà. Veuillez{' '}
              <Link href="/login" className="underline font-bold">
                vous connecter
              </Link>
              .
            </span>
          ),
        });
        setIsLoading(false);
        return;
      }

      // Si l'utilisateur n'existe pas, créer le nouveau compte
      const userDoc = {
          name,
          email,
          phone,
          avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}`, // Default avatar
          createdAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, "users", email), userDoc);

      // Add contact to Brevo list
      addContact({ email }).catch(brevoError => {
        console.warn("Échec de l'ajout du contact à Brevo, mais l'inscription a réussi :", brevoError);
      });

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
