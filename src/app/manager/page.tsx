
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Package, Users, ShoppingCart, Loader2 } from "lucide-react";
import { Order } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query, getCountFromServer, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Stats = {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
}

const statusTranslations: { [key: string]: string } = {
  Pending: 'En attente',
  Shipped: 'Expédiée',
  Delivered: 'Livrée',
  Cancelled: 'Annulée',
};

export default function ManagerDashboardPage() {
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch recent orders
                const ordersQuery = query(collection(db, "orders"), orderBy("date", "desc"), limit(5));
                const ordersSnapshot = await getDocs(ordersQuery);
                setRecentOrders(ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));

                // Fetch all orders for stats
                const allOrdersSnapshot = await getDocs(collection(db, "orders"));
                const totalOrders = allOrdersSnapshot.size;
                
                // Calculate revenue only from delivered orders
                const deliveredOrdersQuery = query(collection(db, "orders"), where("status", "==", "Delivered"));
                const deliveredOrdersSnapshot = await getDocs(deliveredOrdersQuery);
                const totalRevenue = deliveredOrdersSnapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);

                // Fetch products count
                const productsSnapshot = await getCountFromServer(collection(db, "products"));
                const totalProducts = productsSnapshot.data().count;

                setStats({
                    totalRevenue,
                    totalOrders,
                    totalProducts
                });

            } catch(error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

  return (
    <div className="relative">
      <h1 className="text-3xl font-bold mb-6">Tableau de Bord Manager</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenu Total (Livré)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <div className="text-2xl font-bold">{Math.round(stats?.totalRevenue || 0)} FCFA</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <div className="text-2xl font-bold">{stats?.totalProducts}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <div className="text-2xl font-bold">{stats?.totalOrders}</div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Commandes Récentes</CardTitle>
            <CardDescription>Un aperçu rapide des dernières commandes.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Total</TableHead>
                       <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">{order.id.slice(-6)}</div>
                        </TableCell>
                        <TableCell>{Math.round(order.total)} FCFA</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              order.status === 'Delivered' ? 'default' : 
                              order.status === 'Shipped' ? 'secondary' :
                              order.status === 'Cancelled' ? 'destructive' :
                              'outline'
                            }
                          >
                            {statusTranslations[order.status] || order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                 <div className="pt-4 text-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/manager/orders">Voir toutes les commandes</Link>
                    </Button>
                </div>
                </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
