
'use client';

import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ShoppingBag, Settings, CreditCard, Home, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import { Order } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
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
        // This specific query requires a composite index.
        // If the index is not set up in Firestore, it will fail.
        // As a fallback, we fetch all orders and sort/limit on the client.
        // This is less efficient for users with many orders but avoids app crashes.
        console.warn("Composite index for orders might be missing. Falling back to client-side sorting.", error);
        try {
            const fallbackQuery = query(
              collection(db, "orders"),
              where("customerEmail", "==", user.email)
            );
            const fallbackSnapshot = await getDocs(fallbackQuery);
            if (!fallbackSnapshot.empty) {
                const userOrders = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setLatestOrder(userOrders[0]);
            }
        } catch (finalError) {
            console.error("Error fetching latest order with fallback:", finalError);
        }
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
      <div>
        <h1 className="text-4xl font-headline font-bold">Mon Compte</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Bienvenue, {user?.name || user?.email || 'client estimé'} !
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Latest Order Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <CardTitle className="font-body text-xl">Dernière Commande</CardTitle>
            </div>
            <CardDescription>Aperçu rapide de votre achat le plus récent.</CardDescription>
          </CardHeader>
          <CardContent>
            {isOrderLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : latestOrder ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">N° Commande</p>
                  <p className="font-semibold font-mono">#{latestOrder.id.slice(-6)}</p>
                </div>
                 <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-semibold">{new Date(latestOrder.date).toLocaleDateString()}</p>
                </div>
                 <div>
                  <p className="text-muted-foreground">Statut</p>
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
                 <div className="font-bold text-base text-right">
                   <p className="text-muted-foreground font-normal">Total</p>
                  <p>{Math.round(latestOrder.total)} FCFA</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground h-24 flex items-center justify-center">Vous n'avez pas encore passé de commande.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full md:w-auto">
              <Link href="/account/orders">Voir toutes mes commandes</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-6">
            <Link href="/account/profile">
                <Card className="h-full hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                        <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="font-body text-xl">Profil</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Modifiez vos informations personnelles et votre mot de passe.</p>
                    </CardContent>
                </Card>
            </Link>
             <Link href="/account/orders">
                <Card className="h-full hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                         <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                            <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="font-body text-xl">Commandes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Consultez votre historique de commandes et les statuts.</p>
                    </CardContent>
                </Card>
            </Link>
             <Link href="/account/settings">
                <Card className="h-full hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                        <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                           <Home className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="font-body text-xl">Adresses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Gérez vos adresses de livraison pour un achat plus rapide.</p>
                    </CardContent>
                </Card>
            </Link>
        </div>
      </div>
    </div>
  );
}
