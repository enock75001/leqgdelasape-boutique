
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Package, Users, ShoppingCart, Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Order, revenueData } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query,getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
};

type Stats = {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
}

export default function AdminDashboardPage() {
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
                const totalRevenue = allOrdersSnapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);
                const totalOrders = allOrdersSnapshot.size;
                
                // Fetch users count
                const usersSnapshot = await getCountFromServer(collection(db, "users"));
                const totalUsers = usersSnapshot.data().count;

                // Fetch products count
                const productsSnapshot = await getCountFromServer(collection(db, "products"));
                const totalProducts = productsSnapshot.data().count;

                setStats({
                    totalRevenue,
                    totalOrders,
                    totalUsers,
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
    <div>
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenu Total
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
            <CardTitle className="text-sm font-medium">
              Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <div className="text-2xl font-bold">{stats?.totalUsers}</div>
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
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Aperçu des Revenus</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer>
                <BarChart data={revenueData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                   <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="revenue" fill="var(--color-primary)" radius={8} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
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
                              order.status === 'Shipped' ? 'secondary' : 'destructive'
                            }
                            className={
                                order.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                                order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                 <div className="pt-4 text-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/admin/orders">Voir toutes les commandes</Link>
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
