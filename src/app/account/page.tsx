import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ShoppingBag, Settings } from "lucide-react";
import Link from "next/link";

export default function AccountPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
       <div className="text-center mb-12">
        <h1 className="text-5xl font-headline font-bold text-primary">Mon tableau de bord</h1>
        <p className="text-xl text-muted-foreground mt-2">Bienvenue, client estimé !</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <User className="h-8 w-8 text-muted-foreground" />
              <div>
                  <CardTitle>Profil</CardTitle>
                  <CardDescription>customer@example.com</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Affichez et mettez à jour les informations de votre compte.</p>
            <Button variant="outline" className="w-full">Modifier le profil</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              <div>
                  <CardTitle>Mes commandes</CardTitle>
                  <CardDescription>Voir votre historique</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground mb-4">Suivez vos commandes récentes et passées.</p>
             <Button variant="outline" className="w-full">Voir les commandes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
               <Settings className="h-8 w-8 text-muted-foreground" />
               <div>
                  <CardTitle>Paramètres</CardTitle>
                  <CardDescription>Gérez votre compte</CardDescription>
               </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Gérez vos adresses et vos préférences de paiement.</p>
            <Button variant="outline" className="w-full">Gérer les paramètres</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
