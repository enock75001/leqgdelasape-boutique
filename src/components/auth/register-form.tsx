
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db, auth } from '@/lib/firebase';
import { serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from "firebase/auth";
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
    if (password.length < 6) {
        toast({
          variant: 'destructive',
          title: 'Mot de passe trop court',
          description: 'Le mot de passe doit contenir au moins 6 caractères.',
        });
        return;
    }
    setIsLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create user document in Firestore
      const userDoc = {
          name,
          email,
          phone,
          avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
          createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", user.uid), userDoc);

      // 3. Add contact to mailing list (optional)
      addContact({ email }).catch(brevoError => {
        console.warn("Échec de l'ajout du contact à Brevo, mais l'inscription a réussi :", brevoError);
      });

      // 4. Log the user in contextually
      await login(user.uid);

      toast({
        title: 'Inscription réussie',
        description: `Bienvenue, ${name} !`,
      });
      
      onRegisterSuccess();

    } catch (error: any) {
      console.error("Registration error:", error.code);
      let description = "Une erreur s'est produite. Veuillez réessayer.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Un compte avec cette adresse e-mail existe déjà.";
      } else if (error.code === 'auth/invalid-email') {
        description = "L'adresse e-mail n'est pas valide.";
      }
      toast({
        variant: 'destructive',
        title: 'Échec de l\'inscription',
        description: description,
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
        <Label htmlFor="password">Mot de passe (6 caractères minimum)</Label>
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
