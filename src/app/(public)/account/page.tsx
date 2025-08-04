'use client';

import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ShoppingBag, Settings, CreditCard, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import { Order } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AccountPage() {
  const { user, loading } = useAuth();
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [isOrderLoading, setIsOrderLoading] = useState(true);

  useEffect(() => {
    const fetchLatestOrder = async () => {
      if (!user?.email) {
        setIsOrderLoading(false);
        return;
      }
      setIsOrderLoading(true);
      try {
        const q = query(
          collection(db, "orders"),
          where("customerEmail", "==", user.email),
          orderBy("date", "desc"),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setLatestOrder({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Order);
        }
      } catch (error) {
        console.error("Error fetching latest order:", error);
      } finally {
        setIsOrderLoading(false);
      }
    };

    if (user) {
      fetchLatestOrder();
    } else {
       setIsOrderLoading(false);
    }
  }, [user]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-headline font-bold">Mon Compte</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Bienvenue, {user?.name || user?.email || 'client estimé'} ! Gérez vos informations et commandes ici.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Latest Order Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <CardTitle className="font-body text-xl">Dernière Commande</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isOrderLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : latestOrder ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Commande</span>
                  <span className="font-mono font-semibold">#{latestOrder.id.slice(-6)}</span>
                </div>
                 <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-semibold">{new Date(latestOrder.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Statut</span>
                  <Badge
                    variant={
                        latestOrder.status === 'Delivered' ? 'default' :
                        latestOrder.status === 'Shipped' ? 'secondary' : 'destructive'
                    }
                     className={
                        latestOrder.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                        latestOrder.status === 'Shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        latestOrder.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''
                    }
                  >
                    {latestOrder.status}
                  </Badge>
                </div>
                <Separator className="my-3"/>
                 <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>{latestOrder.total.toFixed(2)} FCFA</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground h-24 flex items-center justify-center">Vous n'avez pas encore passé de commande.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/account/orders">Voir toutes mes commandes</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Account Info Card */}
        <Card className="flex flex-col">
          <CardHeader>
             <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <CardTitle className="font-body text-xl">Mes Informations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 flex-grow">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
          </CardContent>
          <CardFooter>
             <Button variant="outline" asChild className="w-full">
              <Link href="/account/profile">Modifier mon profil</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Settings Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
             <div className="flex items-center gap-3">
               <Settings className="h-6 w-6 text-primary" />
              <CardTitle className="font-body text-xl">Adresses & Paiements</CardTitle>
            </div>
             <CardDescription>Gérez vos adresses de livraison et vos informations de paiement pour un passage en caisse plus rapide.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/account/settings">
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                  <Home className="h-5 w-5 mb-2 text-muted-foreground" />
                  <h4 className="font-semibold">Adresse de livraison</h4>
                  <p className="text-sm text-muted-foreground">Ajouter ou modifier</p>
                </div>
              </Link>
              <Link href="/account/settings">
                 <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                   <CreditCard className="h-5 w-5 mb-2 text-muted-foreground" />
                  <h4 className="font-semibold">Moyen de paiement</h4>
                  <p className="text-sm text-muted-foreground">Ajouter ou modifier</p>
                </div>
              </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
