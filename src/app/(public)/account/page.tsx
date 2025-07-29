'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ShoppingBag, Settings, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">Mon Tableau de Bord</h1>
        <p className="text-xl text-muted-foreground mt-1">Bienvenue, {user?.email || 'client estimé'} !</p>
      </div>
      
      <div className="grid md:grid-cols-1 gap-6">
        <Link href="/account/profile" className="group">
          <Card className="hover:border-primary/50 transition-colors">
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
              <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardHeader>
          </Card>
        </Link>

        <Link href="/account/orders" className="group">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-body text-xl">Mes Commandes</CardTitle>
                  <CardDescription>Suivez vos commandes récentes et consultez votre historique.</CardDescription>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardHeader>
          </Card>
        </Link>

        <Link href="/account/settings" className="group">
          <Card className="hover:border-primary/50 transition-colors">
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
              <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div className="mt-12">
          <Button variant="outline" onClick={handleLogout}>Déconnecter</Button>
      </div>
    </div>
  );
}
