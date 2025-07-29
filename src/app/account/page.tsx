'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ShoppingBag, Settings, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <div className="bg-muted/40 min-h-[calc(100vh-12rem)] py-16">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-12">
          <h1 className="text-4xl font-headline font-bold text-primary">Mon tableau de bord</h1>
          <p className="text-xl text-muted-foreground mt-1">Bienvenue, {user?.email || 'client estimé'} !</p>
        </div>
        
        <div className="grid md:grid-cols-1 gap-8">
          <Card className="hover:border-primary/50 transition-colors">
            <Link href="#">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-body text-xl">Profil</CardTitle>
                    <CardDescription>Affichez et mettez à jour les informations de votre compte.</CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <Link href="#">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-4">
                   <div className="p-3 bg-primary/10 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-body text-xl">Mes commandes</CardTitle>
                    <CardDescription>Suivez vos commandes récentes et consultez votre historique.</CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <Link href="#">
               <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-body text-xl">Paramètres</CardTitle>
                    <CardDescription>Gérez vos adresses et vos préférences de paiement.</CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
            </Link>
          </Card>
        </div>

        <div className="mt-12 text-center">
            <Button variant="outline">Déconnecter</Button>
        </div>
      </div>
    </div>
  );
}
